// ============================================================
// PHONE NUMBER VALIDATION ENGINE - ManyMangoes
// Version: 3.0
// ============================================================
// CHANGELOG:
// v3.0 - Replaced Vapi calling layer with ElevenLabs Batch Calling API.
//        Key changes:
//        - fireBatch: collects all eligible numbers and submits ONE batch
//          call to ElevenLabs instead of looping one call at a time.
//        - pollResults: polls the ElevenLabs batch status endpoint using
//          the stored batch_id, then classifies each recipient outcome.
//        - classifyCall: updated to handle ElevenLabs conversation response
//          schema (transcript, call_successful, termination_reason).
//        - Config: B4 = ElevenLabs API Key, B5 = Agent ID, B12 = Phone Number ID.
//          Vapi-specific fields (assistantId, callerIds) no longer used.
//        - No more per-call concurrency issues — ElevenLabs self-manages
//          concurrency at 50% of workspace limit automatically.
//
// v2.2 - FIX 1: Removed lastCalledAt stamp on failed call attempts.
//        FIX 2: Replaced optional chaining (?.) with (obj && obj.prop).
// v2.1 - forceSlot fix: trigger event object no longer treated as valid slot.
// v2.0 - callsAttempted counter: spacing based on all attempts not just fires.
// ============================================================
// SETUP:
// 1. Paste into Extensions > Apps Script in your Google Sheet.
// 2. In Config sheet set:
//    B4  = ElevenLabs API Key (sk_...)
//    B5  = ElevenLabs Agent ID (agent_...)
//    B12 = ElevenLabs Phone Number ID (phnum_...)
// 3. "Validation Engine" menu auto-appears on sheet open.
// ============================================================

// --- TIME SLOTS (Eastern Time) ---
var TIME_SLOTS = [
  { name: "8am-10am",  startHour: 8,  endHour: 10, col: 4 },  // Column D
  { name: "10am-12pm", startHour: 10, endHour: 12, col: 5 },  // Column E
  { name: "12pm-2pm",  startHour: 12, endHour: 14, col: 6 },  // Column F
  { name: "2pm-4pm",   startHour: 14, endHour: 16, col: 7 },  // Column G
  { name: "4pm-6pm",   startHour: 16, endHour: 18, col: 8 },  // Column H
];

// --- CONFIG ---
function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName("Config");
  return {
    apiKey:        cfg.getRange("B4").getValue(),   // ElevenLabs API Key
    agentId:       cfg.getRange("B5").getValue(),   // ElevenLabs Agent ID
    batchSize:     parseInt(cfg.getRange("B6").getValue())  || 50,
    maxDuration:   parseInt(cfg.getRange("B7").getValue())  || 10,
    concurrent:    parseInt(cfg.getRange("B8").getValue())  || 3,
    pollInterval:  parseInt(cfg.getRange("B9").getValue())  || 5,
    maxAttempts:   parseInt(cfg.getRange("B10").getValue()) || 10,
    maxPerSlot:    parseInt(cfg.getRange("B11").getValue()) || 2,
    phoneNumberId: cfg.getRange("B12").getValue(),  // ElevenLabs Phone Number ID
  };
}

// Get current time slot based on Eastern Time
function getCurrentSlot() {
  var now = new Date();
  var et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  var hour = et.getHours();
  for (var i = 0; i < TIME_SLOTS.length; i++) {
    if (hour >= TIME_SLOTS[i].startHour && hour < TIME_SLOTS[i].endHour) {
      return TIME_SLOTS[i];
    }
  }
  return null; // Outside calling hours
}

// ============================================================
// NUMBERS SHEET COLUMNS:
// A=Phone Number, B=Status, C=Answered In Slot,
// D=8-10 attempts, E=10-12, F=12-2, G=2-4, H=4-6,
// I=Total Attempts, J=Last Batch ID, K=Last Duration,
// L=Last Transcript, M=Last Classification, N=Last Called At,
// O=Recording URL, P=Answered At (exact timestamp)
// ============================================================

// Helper: show alert if UI available, otherwise log
function safeAlert(msg) {
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log(msg);
  }
}

// ============================================================
// FIRE BATCH - Submits all eligible numbers to ElevenLabs in ONE API call
// ============================================================
function fireBatch(forceSlot) {
  var config = getConfig();
  if (!config.apiKey) {
    safeAlert("Set your ElevenLabs API Key in Config B4 first.");
    return;
  }
  if (!config.agentId) {
    safeAlert("Set your ElevenLabs Agent ID in Config B5 first.");
    return;
  }
  if (!config.phoneNumberId) {
    safeAlert("Set your ElevenLabs Phone Number ID in Config B12 first.");
    return;
  }

  // Only treat forceSlot as valid if it's actually a TIME_SLOTS object (has .col).
  // Time-based triggers pass an event object as arg — truthy but not a valid slot.
  var isValidSlot = forceSlot && typeof forceSlot === "object" && forceSlot.col;
  var currentSlot = isValidSlot ? forceSlot : getCurrentSlot();

  if (!currentSlot) {
    var etHour = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
    Logger.log("Outside calling hours. ET hour: " + etHour);
    return;
  }

  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var nums = ss.getSheetByName("Numbers");
  var log  = ss.getSheetByName("Call Log");

  var lastRow = nums.getLastRow();
  if (lastRow < 2) {
    safeAlert("No phone numbers in the Numbers sheet.");
    return;
  }

  var data = nums.getRange(2, 1, lastRow - 1, 16).getValues();

  // Get today's date in ET for daily limit check
  var todayET     = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  var todayDateStr = todayET.getFullYear() + "-" +
    String(todayET.getMonth() + 1).padStart(2, "0") + "-" +
    String(todayET.getDate()).padStart(2, "0");

  // Collect eligible numbers
  var recipients           = [];  // ElevenLabs recipients array
  var eligibleRows         = [];  // track which sheet rows map to recipients
  var skippedMaxAttempts   = 0;
  var skippedSlotFull      = 0;
  var skippedAlreadyDone   = 0;
  var skippedCalledToday   = 0;
  var skippedStuckReset    = 0;

  for (var i = 0; i < data.length && recipients.length < config.batchSize; i++) {
    var phoneNumber   = data[i][0];                          // A
    var status        = data[i][1];                          // B
    var slotAttempts  = data[i][currentSlot.col - 1] || 0;  // D-H
    var totalAttempts = data[i][8]  || 0;                    // I
    var lastCalledAt  = data[i][13] || "";                   // N

    if (!phoneNumber) continue;

    // Already finished
    if (status === "Human Answered" || status === "Dead" || status === "Needs Review") {
      skippedAlreadyDone++;
      continue;
    }

    // Unstick numbers stuck In Progress for over 30 minutes
    if (status === "In Progress") {
      if (lastCalledAt) {
        var calledTime  = new Date(lastCalledAt);
        var minutesAgo  = (new Date() - calledTime) / 60000;
        if (minutesAgo > 30) {
          nums.getRange(i + 2, 2).setValue("Retry");
          skippedStuckReset++;
        }
      }
      continue;
    }

    // Daily limit: one call per number per ET day
    if (lastCalledAt) {
      var lastCalledDate = new Date(lastCalledAt);
      var lastCalledET   = new Date(lastCalledDate.toLocaleString("en-US", { timeZone: "America/New_York" }));
      var lastDateStr    = lastCalledET.getFullYear() + "-" +
        String(lastCalledET.getMonth() + 1).padStart(2, "0") + "-" +
        String(lastCalledET.getDate()).padStart(2, "0");
      if (lastDateStr === todayDateStr) {
        skippedCalledToday++;
        continue;
      }
    }

    // Max total attempts
    if (totalAttempts >= config.maxAttempts) {
      if (status !== "Dead") nums.getRange(i + 2, 2).setValue("Dead");
      skippedMaxAttempts++;
      continue;
    }

    // Max attempts per slot
    if (slotAttempts >= config.maxPerSlot) {
      skippedSlotFull++;
      continue;
    }

    // Only fire Pending, Retry, or new (blank)
    if (status !== "Pending" && status !== "Retry" && status !== "") continue;

    // Add to batch
    recipients.push({ phone_number: String(phoneNumber) });
    eligibleRows.push({
      rowIndex:      i + 2,
      slotAttempts:  slotAttempts,
      totalAttempts: totalAttempts,
    });
  }

  if (recipients.length === 0) {
    safeAlert(
      "No eligible numbers to call in slot: " + currentSlot.name + "\n\n" +
      "Skipped (already done): "        + skippedAlreadyDone  + "\n" +
      "Skipped (called today): "        + skippedCalledToday  + "\n" +
      "Skipped (max attempts): "        + skippedMaxAttempts  + "\n" +
      "Skipped (slot full): "           + skippedSlotFull     + "\n" +
      (skippedStuckReset > 0 ? "Reset (stuck >30min): " + skippedStuckReset + "\n" : "")
    );
    return;
  }

  // Submit ONE batch to ElevenLabs
  var batchResult = submitElevenLabsBatch(config, recipients, currentSlot.name);

  if (!batchResult.success) {
    safeAlert("ElevenLabs batch submission failed:\n\n" + batchResult.error);
    return;
  }

  var batchId  = batchResult.batchId;
  var now      = new Date().toISOString();

  // Update Numbers sheet and Call Log for all submitted numbers
  for (var j = 0; j < eligibleRows.length; j++) {
    var r = eligibleRows[j];
    nums.getRange(r.rowIndex, 2).setValue("In Progress");
    nums.getRange(r.rowIndex, currentSlot.col).setValue(r.slotAttempts + 1);
    nums.getRange(r.rowIndex, 9).setValue(r.totalAttempts + 1);
    nums.getRange(r.rowIndex, 10).setValue(batchId);   // J: store batch ID (not individual call ID)
    nums.getRange(r.rowIndex, 14).setValue(now);        // N: Last Called At

    // Log entry
    var logRow = log.getLastRow() + 1;
    log.getRange(logRow, 1).setValue(batchId);
    log.getRange(logRow, 2).setValue(config.phoneNumberId);
    log.getRange(logRow, 3).setValue(recipients[j].phone_number);
    log.getRange(logRow, 4).setValue("In Progress");
    log.getRange(logRow, 9).setValue(currentSlot.name);
    log.getRange(logRow, 10).setValue(r.totalAttempts + 1);
    log.getRange(logRow, 11).setValue(now);
  }

  safeAlert(
    "Batch submitted to ElevenLabs!\n\n" +
    "Slot: "          + currentSlot.name  + "\n" +
    "Numbers sent: "  + recipients.length + "\n" +
    "Batch ID: "      + batchId           + "\n\n" +
    "Skipped (already done): "   + skippedAlreadyDone  + "\n" +
    "Skipped (called today): "   + skippedCalledToday  + "\n" +
    "Skipped (max attempts): "   + skippedMaxAttempts  + "\n" +
    "Skipped (slot full): "      + skippedSlotFull     + "\n" +
    (skippedStuckReset > 0 ? "Reset (stuck >30min): " + skippedStuckReset + "\n" : "") +
    "\nPollResults will auto-update statuses every 5 minutes."
  );
}

// TEST: Fire batch bypassing time check (uses 8am-10am slot)
function testFireBatch() {
  fireBatch(TIME_SLOTS[0]);
}

// ============================================================
// ELEVENLABS API - Submit Batch
// ============================================================
function submitElevenLabsBatch(config, recipients, slotName) {
  try {
    var payload = {
      call_name:           "ManyMangoes-Validation-" + slotName + "-" + new Date().toISOString(),
      agent_id:            config.agentId,
      agent_phone_number_id: config.phoneNumberId,
      recipients:          recipients
    };

    var options = {
      method:         "post",
      contentType:    "application/json",
      headers:        { "xi-api-key": config.apiKey },
      payload:        JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch("https://api.elevenlabs.io/v1/convai/batch-calling/submit", options);
    var code     = response.getResponseCode();
    var body     = JSON.parse(response.getContentText());

    if ((code === 200 || code === 201) && body && body.id) {
      Logger.log("ElevenLabs batch submitted: " + body.id + " (" + recipients.length + " recipients)");
      return { success: true, batchId: body.id };
    } else {
      Logger.log("ElevenLabs batch failed (" + code + "): " + response.getContentText());
      return { success: false, error: (body && body.detail) || ("HTTP " + code) };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
// ELEVENLABS API - Get Batch Status
// ============================================================
function getElevenLabsBatchStatus(config, batchId) {
  try {
    var options = {
      method:  "get",
      headers: { "xi-api-key": config.apiKey },
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(
      "https://api.elevenlabs.io/v1/convai/batch-calling/" + batchId,
      options
    );
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
    Logger.log("ElevenLabs batch status fetch failed: " + response.getContentText());
    return null;
  } catch (e) {
    Logger.log("Error fetching batch status " + batchId + ": " + e.message);
    return null;
  }
}

// ============================================================
// ELEVENLABS API - Get Individual Conversation
// ============================================================
function getElevenLabsConversation(config, conversationId) {
  try {
    var options = {
      method:  "get",
      headers: { "xi-api-key": config.apiKey },
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(
      "https://api.elevenlabs.io/v1/convai/conversations/" + conversationId,
      options
    );
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
    return null;
  } catch (e) {
    Logger.log("Error fetching conversation " + conversationId + ": " + e.message);
    return null;
  }
}

// ============================================================
// POLL RESULTS - checks ElevenLabs batch status and updates sheet
// ============================================================
function pollResults() {
  var config  = getConfig();
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var nums    = ss.getSheetByName("Numbers");
  var log     = ss.getSheetByName("Call Log");

  var lastRow = nums.getLastRow();
  if (lastRow < 2) return;

  var data    = nums.getRange(2, 1, lastRow - 1, 16).getValues();
  var updated = 0;

  // Collect unique batch IDs still In Progress
  var batchIds = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === "In Progress" && data[i][9]) {
      batchIds[data[i][9]] = true;
    }
  }

  if (Object.keys(batchIds).length === 0) {
    Logger.log("No In Progress batches to poll.");
    return;
  }

  // Fetch each batch and build phone -> recipient lookup
  var batchMaps = {};
  for (var batchId in batchIds) {
    var resp = UrlFetchApp.fetch(
      "https://api.elevenlabs.io/v1/convai/batch-calling/" + batchId,
      { method: "get", headers: { "xi-api-key": config.apiKey }, muteHttpExceptions: true }
    );
    if (resp.getResponseCode() !== 200) {
      Logger.log("Failed to fetch batch " + batchId);
      continue;
    }
    var batchData = JSON.parse(resp.getContentText());

    // ElevenLabs batch status is "completed" when done
    if (batchData.status !== "completed") {
      Logger.log("Batch " + batchId + " not done yet: " + batchData.status);
      continue;
    }

    var map = {};
    var recipients = batchData.recipients || [];
    for (var r = 0; r < recipients.length; r++) {
      map[recipients[r].phone_number] = recipients[r];
    }
    batchMaps[batchId] = map;
    Logger.log("Batch " + batchId + " loaded: " + recipients.length + " recipients.");
  }

  // Update each In Progress row
  for (var i = 0; i < data.length; i++) {
    if (data[i][1] !== "In Progress") continue;

    var phoneNumber   = String(data[i][0]);
    var batchId       = data[i][9];
    var totalAttempts = data[i][8] || 0;
    var row           = i + 2;

    if (!batchId || !batchMaps[batchId]) continue;

    var recipient = batchMaps[batchId][phoneNumber];
    if (!recipient) {
      Logger.log("No recipient match for " + phoneNumber);
      continue;
    }

    if (recipient.status !== "completed") {
      Logger.log(phoneNumber + " recipient not completed: " + recipient.status);
      continue;
    }

    // Fetch conversation
    var convData     = null;
    var transcript   = "";
    var duration     = 0;
    var recordingUrl = "";

    if (recipient.conversation_id) {
      var convResp = UrlFetchApp.fetch(
        "https://api.elevenlabs.io/v1/convai/conversations/" + recipient.conversation_id,
        { method: "get", headers: { "xi-api-key": config.apiKey }, muteHttpExceptions: true }
      );
      if (convResp.getResponseCode() === 200) {
        convData     = JSON.parse(convResp.getContentText());
        duration     = (convData.metadata && convData.metadata.call_duration_secs) || 0;
        recordingUrl = (convData.metadata && convData.metadata.recording_url) || "";
        transcript   = buildTranscript(convData);
      }
    }

    var classification = classifyElevenLabsCall(recipient, convData, transcript);

    var finalStatus;
    if (classification === "Human Answered") {
      finalStatus = "Human Answered";
    } else if (classification === "Needs Review") {
      finalStatus = "Needs Review";
    } else if (totalAttempts >= config.maxAttempts) {
      finalStatus = "Dead";
    } else {
      finalStatus = "Retry";
    }

    // Write to Numbers sheet
    nums.getRange(row, 2).setValue(finalStatus);
    nums.getRange(row, 11).setValue(duration);
    nums.getRange(row, 12).setValue(transcript);
    nums.getRange(row, 13).setValue(classification);
    nums.getRange(row, 15).setValue(recordingUrl);

    if (classification === "Human Answered") {
      var entry = findLogEntry(log, batchId, phoneNumber);
      nums.getRange(row, 3).setValue(entry ? entry.slot : "Unknown");
      nums.getRange(row, 16).setValue(new Date().toISOString());
    }

    // Update Call Log
    var logEntry = findLogEntry(log, batchId, phoneNumber);
    if (logEntry) {
      log.getRange(logEntry.row, 4).setValue(finalStatus);
      log.getRange(logEntry.row, 5).setValue(duration);
      log.getRange(logEntry.row, 6).setValue(
        (convData && convData.metadata && convData.metadata.termination_reason) || recipient.status
      );
      log.getRange(logEntry.row, 7).setValue(transcript);
      log.getRange(logEntry.row, 8).setValue(classification);
      log.getRange(logEntry.row, 11).setValue(new Date().toISOString());
      log.getRange(logEntry.row, 12).setValue(recordingUrl);
    }

    Logger.log("Updated " + phoneNumber + " -> " + finalStatus + " (" + classification + ")");
    updated++;
    Utilities.sleep(300);
  }

  Logger.log("Poll complete. Updated: " + updated);
}

function buildTranscript(convData) {
  if (!convData) return "";
  // ElevenLabs: transcript is an array of {role, message} objects
  var turns = convData.transcript;
  if (Array.isArray(turns) && turns.length > 0) {
    return turns
      .map(function(t) {
        var label = (t.role === "agent") ? "MANGO" : "Caller";
        return label + ": " + (t.message || "");
      })
      .join(" | ")
      .substring(0, 300);
  }
  return "";
}

// Helper: find a log row by batchId + phone number
function findLogEntry(log, batchId, phoneNumber) {
  var lastRow = log.getLastRow();
  if (lastRow < 2) return null;
  var logData = log.getRange(2, 1, lastRow - 1, 9).getValues();
  for (var r = 0; r < logData.length; r++) {
    if (logData[r][0] === batchId && String(logData[r][2]) === phoneNumber) {
      return { row: r + 2, slot: logData[r][8] || null };
    }
  }
  return null;
}

// ============================================================
// CLASSIFY CALL - ElevenLabs response schema
// ============================================================
function classifyElevenLabsCall(recipientData, convData) {
  var terminationReason = (recipientData && recipientData.termination_reason) || "";
  var callSuccessful    = convData && convData.analysis && convData.analysis.call_successful;
  var transcript        = "";
  var duration          = 0;

  if (convData) {
    transcript = getElevenLabsTranscript(recipientData, convData).toLowerCase();
    duration   = (convData.metadata && convData.metadata.call_duration_secs) || 0;
  }

  // --- LAYER 1: Termination reason signals ---
  if (terminationReason === "no_answer" || terminationReason === "busy" ||
      terminationReason === "failed" || terminationReason === "canceled") {
    return "No Answer";
  }
  if (terminationReason === "voicemail") {
    return "Voicemail";
  }

  // --- LAYER 2: No transcript = no one spoke ---
  if (!transcript || transcript.trim().length === 0) {
    if (duration < 3) return "No Answer";
    return "Voicemail";
  }

  // --- LAYER 3: Non-human pattern matching (same robust logic as Vapi version) ---

  var voicemailPatterns = [
    "leave a message", "leave me a message", "after the tone", "after the beep",
    "is not available", "not available right now", "can't come to the phone",
    "can't take your call", "please leave", "voicemail", "voice mail",
    "mailbox is full", "you've reached the voicemail", "you have reached the voicemail",
    "currently unavailable", "record your message", "personal greeting",
    "i'll call you back", "i will call you back", "get back to you",
    "messagebank", "message bank", "optus messaging", "telstra messaging"
  ];

  var screeningPatterns = [
    "name and reason for calling", "reason for your call",
    "state your name", "who's calling", "who is calling please",
    "screening your call", "screening this call", "call screen",
    "go ahead and say", "say your name", "announce yourself",
    "if this person is available", "see if this person"
  ];

  var carrierPatterns = [
    "the number you have dialled", "the number you have called",
    "not in service", "has been disconnected", "is no longer in service",
    "cannot be completed", "the subscriber you have dialled",
    "temporarily unavailable", "is switched off", "not a working number",
    "please check the number"
  ];

  var ivrPatterns = [
    "press 1", "press 2", "press 3", "press 0", "press star", "press pound",
    "for sales", "for support", "for billing", "for customer service",
    "dial the extension", "if you know your party", "main menu",
    "your call is important", "your call may be recorded",
    "please hold", "our office hours", "we are currently closed",
    "all of our operators", "estimated wait time", "thank you for calling"
  ];

  var allNonHuman = [
    { patterns: voicemailPatterns, label: "Voicemail"       },
    { patterns: screeningPatterns, label: "Call Screening"  },
    { patterns: carrierPatterns,   label: "Carrier Message" },
    { patterns: ivrPatterns,       label: "IVR / Automated" }
  ];

  for (var g = 0; g < allNonHuman.length; g++) {
    var group = allNonHuman[g];
    for (var p = 0; p < group.patterns.length; p++) {
      if (transcript.indexOf(group.patterns[p]) >= 0) {
        return group.label;
      }
    }
  }

  // --- LAYER 4: Human interaction signals ---
  var humanPhrases = [
    "hello", "hi", "hey", "yes", "yep", "yeah", "nah", "nope",
    "who is this", "who's this", "who are you", "speaking",
    "what do you want", "what's this about", "wrong number",
    "not interested", "can i help", "may i help", "how can i help",
    "sorry who", "pardon", "go ahead", "what's up"
  ];

  for (var h = 0; h < humanPhrases.length; h++) {
    var escaped = humanPhrases[h].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var regex   = new RegExp("(?:^|\\W)" + escaped + "(?:$|\\W)", "i");
    if (regex.test(transcript)) {
      return "Human Answered";
    }
  }

  // ElevenLabs provides call_successful signal — use as additional signal
  if (callSuccessful === true) return "Human Answered";
  if (callSuccessful === "failure" && duration < 5) return "No Answer";

  return "Needs Review";
}

// Build transcript preview from ElevenLabs conversation data
function getElevenLabsTranscript(recipientData, convData) {
  if (!convData) return "";

  var transcript = convData.transcript || "";
  if (typeof transcript === "string" && transcript.length > 0) {
    return transcript.substring(0, 300);
  }

  // Try messages array
  var messages = convData.messages || (convData.analysis && convData.analysis.transcript) || [];
  if (Array.isArray(messages) && messages.length > 0) {
    return messages
      .filter(function(m) { return m.role !== "system"; })
      .map(function(m) {
        var label = m.role === "agent" ? "MANGO" : "Caller";
        return label + ": " + (m.message || m.content || "");
      })
      .join(" | ")
      .substring(0, 300);
  }

  return "";
}

// ============================================================
// MENU
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Validation Engine")
    .addItem("Fire Batch (current time slot)", "fireBatch")
    .addItem("TEST Fire Batch (bypass time check)", "testFireBatch")
    .addItem("Poll Results", "pollResults")
    .addSeparator()
    .addItem("Start Automation (set up all triggers)", "setupAllTriggers")
    .addItem("Stop All Triggers", "stopAllTriggers")
    .addSeparator()
    .addItem("Export Validated Numbers (with proof)", "exportValidated")
    .addItem("View Stats", "viewStats")
    .addSeparator()
    .addItem("RESET ALL - Start Fresh", "resetAll")
    .addToUi();
}

// ============================================================
// TRIGGER SETUP
// ============================================================
function setupAllTriggers() {
  clearAllTriggers();

  ScriptApp.newTrigger("fireBatch")
    .timeBased()
    .everyHours(1)
    .create();

  ScriptApp.newTrigger("pollResults")
    .timeBased()
    .everyMinutes(5)
    .create();

  ScriptApp.newTrigger("onOpen")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();

  SpreadsheetApp.getUi().alert(
    "All triggers set up:\n\n" +
    "1. fireBatch   — every 1 hour (only fires during 8am-6pm ET)\n" +
    "2. pollResults — every 5 minutes (checks ElevenLabs batch outcomes)\n" +
    "3. onOpen      — adds Validation Engine menu on sheet open\n\n" +
    "The system is now fully automated.\n" +
    "To stop everything: Validation Engine > Stop All Triggers."
  );
}

function clearAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function stopAllTriggers() {
  clearAllTriggers();
  SpreadsheetApp.getUi().alert("All triggers stopped. Use 'Start Automation' to resume.");
}

// ============================================================
// EXPORT - Client-ready output with proof
// ============================================================
function exportValidated() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var nums    = ss.getSheetByName("Numbers");
  var lastRow = nums.getLastRow();
  if (lastRow < 2) return;

  var data      = nums.getRange(2, 1, lastRow - 1, 16).getValues();
  var validated = data.filter(function(row) { return row[1] === "Human Answered"; });

  var exportSheet = ss.getSheetByName("Validated Export");
  if (exportSheet) {
    exportSheet.clear();
  } else {
    exportSheet = ss.insertSheet("Validated Export");
  }

  var headers = [
    "Phone Number", "Time Window Answered", "Answered At",
    "Call Duration (s)", "Total Attempts", "Recording URL", "Transcript"
  ];
  for (var i = 0; i < headers.length; i++) {
    var cell = exportSheet.getRange(1, i + 1);
    cell.setValue(headers[i]);
    cell.setFontWeight("bold");
    cell.setBackground("#F1AB1C");
    cell.setFontColor("#FFFFFF");
  }

  for (var j = 0; j < validated.length; j++) {
    var r = j + 2;
    exportSheet.getRange(r, 1).setValue(validated[j][0]);
    exportSheet.getRange(r, 2).setValue(validated[j][2]);
    exportSheet.getRange(r, 3).setValue(validated[j][15]);
    exportSheet.getRange(r, 4).setValue(validated[j][10]);
    exportSheet.getRange(r, 5).setValue(validated[j][8]);
    exportSheet.getRange(r, 6).setValue(validated[j][14]);
    exportSheet.getRange(r, 7).setValue(validated[j][11]);
  }

  exportSheet.setColumnWidth(1, 160);
  exportSheet.setColumnWidth(2, 150);
  exportSheet.setColumnWidth(3, 200);
  exportSheet.setColumnWidth(4, 120);
  exportSheet.setColumnWidth(5, 120);
  exportSheet.setColumnWidth(6, 350);
  exportSheet.setColumnWidth(7, 400);

  SpreadsheetApp.getUi().alert(
    "Exported " + validated.length + " validated numbers to 'Validated Export' sheet.\n" +
    "Download via File > Download > CSV."
  );
}

// ============================================================
// VIEW STATS
// ============================================================
function viewStats() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var nums    = ss.getSheetByName("Numbers");
  var lastRow = nums.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert("No data yet."); return; }

  var data        = nums.getRange(2, 1, lastRow - 1, 16).getValues();
  var total       = data.filter(function(r) { return r[0]; }).length;
  var human       = data.filter(function(r) { return r[1] === "Human Answered"; }).length;
  var needsReview = data.filter(function(r) { return r[1] === "Needs Review"; }).length;
  var dead        = data.filter(function(r) { return r[1] === "Dead"; }).length;
  var pending     = data.filter(function(r) { return r[1] === "Pending" || r[1] === "Retry" || r[1] === ""; }).length;
  var inProgress  = data.filter(function(r) { return r[1] === "In Progress"; }).length;

  var classVoicemail = data.filter(function(r) { return r[12] === "Voicemail"; }).length;
  var classScreening = data.filter(function(r) { return r[12] === "Call Screening"; }).length;
  var classCarrier   = data.filter(function(r) { return r[12] === "Carrier Message"; }).length;
  var classIvr       = data.filter(function(r) { return r[12] === "IVR / Automated"; }).length;
  var classNoAnswer  = data.filter(function(r) { return r[12] === "No Answer"; }).length;

  SpreadsheetApp.getUi().alert(
    "VALIDATION STATS\n\n" +
    "Total Numbers: "    + total       + "\n" +
    "Human Answered: "   + human       + " (" + (total > 0 ? (human / total * 100).toFixed(1) : 0) + "%)\n" +
    "Needs Review: "     + needsReview + "\n" +
    "Dead (10 tries): "  + dead        + "\n" +
    "In Progress: "      + inProgress  + "\n" +
    "Remaining: "        + pending     + "\n\n" +
    "CLASSIFICATION BREAKDOWN:\n" +
    "Voicemail: "        + classVoicemail + "\n" +
    "Call Screening: "   + classScreening + "\n" +
    "Carrier Message: "  + classCarrier   + "\n" +
    "IVR / Automated: "  + classIvr       + "\n" +
    "No Answer: "        + classNoAnswer  + "\n\n" +
    "Total attempts: "   + data.reduce(function(s, r) { return s + (r[8] || 0); }, 0)
  );
}

// ============================================================
// RESET ALL
// ============================================================
function resetAll() {
  var ui      = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "RESET ALL DATA",
    "This will clear ALL statuses, attempt counters, transcripts, and classifications. " +
    "Phone numbers in Column A will be kept.\n\nCall Log will also be cleared.\n\nAre you sure?",
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var nums    = ss.getSheetByName("Numbers");
  var log     = ss.getSheetByName("Call Log");
  var lastRow = nums.getLastRow();
  if (lastRow < 2) return;

  var numRows = lastRow - 1;
  nums.getRange(2, 2, numRows, 15).clearContent();

  var logLastRow = log.getLastRow();
  if (logLastRow >= 2) {
    log.getRange(2, 1, logLastRow - 1, log.getLastColumn()).clearContent();
  }

  ui.alert(
    "Reset complete.\n\n" +
    numRows + " numbers ready for fresh calling.\n" +
    "Click 'TEST Fire Batch' to test immediately."
  );
}

function debugConversation() {
  var config = getConfig();
  var convId = "conv_2101kre0e9q8e1ps31nnmaqvf2qz"; // first recipient's conv ID
  var resp = UrlFetchApp.fetch(
    "https://api.elevenlabs.io/v1/convai/conversations/" + convId,
    { method: "get", headers: { "xi-api-key": config.apiKey }, muteHttpExceptions: true }
  );
  Logger.log(resp.getContentText());
}

function debugBatch() {
  var config = getConfig();
  var batchId = "btcal_6401kre0dvx9f29se3r43yv9qjy0";

  var response = UrlFetchApp.fetch(
    "https://api.elevenlabs.io/v1/convai/batch-calling/" + batchId,
    {
      method: "get",
      headers: { "xi-api-key": config.apiKey },
      muteHttpExceptions: true
    }
  );

  Logger.log("Status code: " + response.getResponseCode());
  Logger.log(response.getContentText());
}