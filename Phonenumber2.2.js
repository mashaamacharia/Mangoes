// ============================================================
// PHONE NUMBER VALIDATION ENGINE - ManyMangoes
// Version: 2.2
// ============================================================
// CHANGELOG:
// v2.2 - FIX 1: Removed lastCalledAt stamp on failed call attempts.
//        Failed calls (e.g. Over Concurrency Limit) no longer stamp today's
//        date, so numbers remain retryable the same day.
//        FIX 2: Replaced optional chaining (?.) with (obj && obj.prop).
//        Apps Script V8 does not support optional chaining syntax.
// v2.1 - forceSlot fix: trigger event object no longer treated as valid slot.
// v2.0 - callsAttempted counter: spacing based on all attempts not just fires.
// ============================================================
// Paste into Extensions > Apps Script in your Google Sheet.
// "Validation Engine" menu auto-appears on sheet open.
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
    apiKey: cfg.getRange("B4").getValue(),
    assistantId: cfg.getRange("B5").getValue(),
    batchSize: parseInt(cfg.getRange("B6").getValue()) || 50,
    maxDuration: parseInt(cfg.getRange("B7").getValue()) || 10,
    concurrent: parseInt(cfg.getRange("B8").getValue()) || 3,
    pollInterval: parseInt(cfg.getRange("B9").getValue()) || 5,
    maxAttempts: parseInt(cfg.getRange("B10").getValue()) || 10,
    maxPerSlot: parseInt(cfg.getRange("B11").getValue()) || 2,
  };
}

function getCallerIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName("Config");
  var ids = [];
  for (var r = 25; r <= 34; r++) {
    var vid = cfg.getRange("C" + r).getValue();
    if (vid) ids.push(vid);
  }
  return ids;
}

// Get current time slot based on Eastern Time
function getCurrentSlot() {
  var now = new Date();
  // Convert to Eastern Time (UTC-4 for EDT, UTC-5 for EST)
  var et = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
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
// I=Total Attempts, J=Last Call ID, K=Last Duration,
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
// FIRE BATCH
// ============================================================
function fireBatch(forceSlot) {
  var config = getConfig();
  if (!config.apiKey) {
    safeAlert("Set your Vapi API Key in the Config sheet first.");
    return;
  }

  // FIX: Only treat forceSlot as valid if it's actually a TIME_SLOTS object
  // (has a .col property). Trigger event objects are truthy but not valid slots.
  var isValidSlot = forceSlot && typeof forceSlot === "object" && forceSlot.col;
  var currentSlot = isValidSlot ? forceSlot : getCurrentSlot();

  if (!currentSlot) {
    var etHour = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).getHours();
    Logger.log("Outside calling hours. ET hour: " + etHour);
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nums = ss.getSheetByName("Numbers");
  var log = ss.getSheetByName("Call Log");
  var callerIds = getCallerIds();

  var lastRow = nums.getLastRow();
  if (lastRow < 2) {
    safeAlert("No phone numbers in the Numbers sheet.");
    return;
  }

  // Read all data at once for performance
  var data = nums.getRange(2, 1, lastRow - 1, 16).getValues();
  var fired = 0;
  var callsAttempted = 0;
  var skippedMaxAttempts = 0;
  var skippedSlotFull = 0;
  var skippedAlreadyDone = 0;
  var skippedCalledToday = 0;
  var skippedStuckReset = 0;
  var callerIndex = 0;

  // Get today's date in ET for daily limit check
  var todayET = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
  var todayDateStr = todayET.getFullYear() + "-" +
    String(todayET.getMonth() + 1).padStart(2, "0") + "-" +
    String(todayET.getDate()).padStart(2, "0");

  // Guard: must have caller IDs configured
  if (callerIds.length === 0) {
    safeAlert("No caller IDs configured. Add Vapi phone number IDs in Config C25:C34.");
    return;
  }

  for (var i = 0; i < data.length && fired < config.batchSize; i++) {
    var phoneNumber = data[i][0];   // A
    var status = data[i][1];         // B
    var slotAttempts = data[i][currentSlot.col - 1] || 0;  // D-H (0-indexed: col-1)
    var totalAttempts = data[i][8] || 0;  // I
    var lastCalledAt = data[i][13] || "";  // N: Last Called At

    // Skip if not callable
    if (!phoneNumber) continue;
    if (status === "Human Answered" || status === "Dead" || status === "Needs Review") {
      skippedAlreadyDone++;
      continue;
    }

    // Unstick numbers that have been "In Progress" for over 30 minutes
    if (status === "In Progress") {
      if (lastCalledAt) {
        var calledTime = new Date(lastCalledAt);
        var minutesAgo = (new Date() - calledTime) / 60000;
        if (minutesAgo > 30) {
          nums.getRange(i + 2, 2).setValue("Retry");
          skippedStuckReset++;
          // Don't call it now - let it get picked up next round
        }
      }
      continue;
    }

    // DAILY LIMIT: Only call each number once per day (ET)
    if (lastCalledAt) {
      var lastCalledDate = new Date(lastCalledAt);
      var lastCalledET = new Date(lastCalledDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
      var lastDateStr = lastCalledET.getFullYear() + "-" +
        String(lastCalledET.getMonth() + 1).padStart(2, "0") + "-" +
        String(lastCalledET.getDate()).padStart(2, "0");
      if (lastDateStr === todayDateStr) {
        skippedCalledToday++;
        continue;
      }
    }

    // Check max attempts
    if (totalAttempts >= config.maxAttempts) {
      if (status !== "Dead") {
        nums.getRange(i + 2, 2).setValue("Dead");
      }
      skippedMaxAttempts++;
      continue;
    }

    // Check slot limit (max 2 attempts per slot across all days)
    if (slotAttempts >= config.maxPerSlot) {
      skippedSlotFull++;
      continue;
    }

    // Only call Pending, Retry, or blank (new) numbers
    if (status !== "Pending" && status !== "Retry" && status !== "") continue;

    // Pick a caller (round-robin, skip if target is one of our own numbers)
    var callerId = callerIds[callerIndex % callerIds.length];
    callerIndex++;

    // Fire the call
    var result = makeVapiCall(config, callerId, phoneNumber);
    var row = i + 2;

    if (result.success) {
      // Update status
      nums.getRange(row, 2).setValue("In Progress");
      // Increment slot attempts
      nums.getRange(row, currentSlot.col).setValue(slotAttempts + 1);
      // Increment total attempts
      nums.getRange(row, 9).setValue(totalAttempts + 1);
      // Last Call ID
      nums.getRange(row, 10).setValue(result.callId);
      // Last Called At
      nums.getRange(row, 14).setValue(new Date().toISOString());

      // Log it
      var logRow = log.getLastRow() + 1;
      log.getRange(logRow, 1).setValue(result.callId);
      log.getRange(logRow, 2).setValue(callerId);
      log.getRange(logRow, 3).setValue(phoneNumber);
      log.getRange(logRow, 4).setValue("In Progress");
      log.getRange(logRow, 9).setValue(currentSlot.name);
      log.getRange(logRow, 10).setValue(totalAttempts + 1);
      log.getRange(logRow, 11).setValue(new Date().toISOString());

      fired++;
    } else {
      nums.getRange(row, 2).setValue("Retry");
      // Log the failure reason into the transcript column so we can see it
      if (result.error) {
        nums.getRange(row, 12).setValue("FIRE ERROR: " + result.error);
      }
    }

    // Per-call spacing to avoid Vapi transport / rate-limit errors
    callsAttempted++;
    Utilities.sleep(750);
    // Extra pause every `concurrent` attempts (success OR failure)
    if (callsAttempted % config.concurrent === 0) {
      Utilities.sleep(3000);
    }
  }

  safeAlert(
    "Batch complete for slot: " + currentSlot.name + "\n\n" +
    "Calls fired: " + fired + "\n" +
    "Skipped (already done): " + skippedAlreadyDone + "\n" +
    "Skipped (already called today): " + skippedCalledToday + "\n" +
    "Skipped (max 10 attempts): " + skippedMaxAttempts + "\n" +
    "Skipped (slot full - 2/2): " + skippedSlotFull + "\n" +
    (skippedStuckReset > 0 ? "Reset (stuck In Progress > 30min): " + skippedStuckReset + "\n" : "") +
    "\nRun pollResults() in a few minutes to check outcomes."
  );
}

// TEST: Fire batch bypassing time check (uses 8am-10am slot)
function testFireBatch() {
  fireBatch(TIME_SLOTS[0]); // Force 8am-10am slot
}

// ============================================================
// POLL RESULTS
// ============================================================
function pollResults() {
  var config = getConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nums = ss.getSheetByName("Numbers");
  var log = ss.getSheetByName("Call Log");

  var lastRow = nums.getLastRow();
  if (lastRow < 2) return;

  var data = nums.getRange(2, 1, lastRow - 1, 16).getValues();

  // Pre-build Call Log index: callId -> row number (for O(1) lookups)
  var logLastRow = log.getLastRow();
  var logIndex = {};  // callId -> sheet row (1-indexed)
  if (logLastRow >= 2) {
    var logIds = log.getRange(2, 1, logLastRow - 1, 1).getValues();
    var logSlots = log.getRange(2, 9, logLastRow - 1, 1).getValues();
    for (var li = 0; li < logIds.length; li++) {
      if (logIds[li][0]) {
        logIndex[logIds[li][0]] = {
          row: li + 2,
          slot: logSlots[li][0] || null
        };
      }
    }
  }

  var updated = 0;

  for (var i = 0; i < data.length; i++) {
    var status = data[i][1];
    var callId = data[i][9]; // J = Last Call ID

    if (status !== "In Progress" || !callId) continue;

    var callData = getVapiCallStatus(config, callId);
    if (!callData) continue;
    if (callData.status === "queued" || callData.status === "ringing" || callData.status === "in-progress") continue;

    var row = i + 2;
    var classification = classifyCall(callData);
    var totalAttempts = data[i][8] || 0;
    var recordingUrl = callData.recordingUrl || (callData.artifact && callData.artifact.recordingUrl) || "";

    // Determine final status
    var finalStatus;
    if (classification === "Human Answered") {
      finalStatus = "Human Answered";
    } else if (classification === "Needs Review") {
      finalStatus = "Needs Review";  // Don't retry - flag for manual check
    } else if (totalAttempts >= config.maxAttempts) {
      finalStatus = "Dead";
    } else {
      finalStatus = "Retry"; // Will be picked up in next batch
    }

    // Update Numbers sheet
    nums.getRange(row, 2).setValue(finalStatus);                          // B: Status
    nums.getRange(row, 11).setValue(callData.duration || 0);              // K: Duration
    nums.getRange(row, 12).setValue(getTranscriptPreview(callData));      // L: Transcript
    nums.getRange(row, 13).setValue(classification);                      // M: Classification
    nums.getRange(row, 14).setValue(callData.endedAt || "");              // N: Last Called At
    nums.getRange(row, 15).setValue(recordingUrl);                        // O: Recording URL

    // If human answered, record the slot from Call Log index (O(1) lookup)
    if (classification === "Human Answered") {
      var logEntry = logIndex[callId];
      var firedSlot = logEntry ? logEntry.slot : null;
      if (!firedSlot) {
        var fallback = getCurrentSlot();
        firedSlot = fallback ? fallback.name : "Unknown";
      }
      nums.getRange(row, 3).setValue(firedSlot);  // C: Answered In Slot
      nums.getRange(row, 16).setValue(callData.startedAt || callData.createdAt || new Date().toISOString()); // P: Answered At
    }

    // Update Call Log using index (O(1) lookup instead of linear scan)
    var logInfo = logIndex[callId];
    if (logInfo) {
      var lr = logInfo.row;
      log.getRange(lr, 4).setValue(callData.status || "ended");
      log.getRange(lr, 5).setValue(callData.duration || 0);
      log.getRange(lr, 6).setValue(callData.endedReason || "");
      log.getRange(lr, 7).setValue(getTranscriptPreview(callData));
      log.getRange(lr, 8).setValue(classification);
      log.getRange(lr, 11).setValue(callData.endedAt || "");
      log.getRange(lr, 12).setValue(recordingUrl);
    }
    updated++;
  }

  if (updated > 0) {
    Logger.log("Polled: " + updated + " calls updated.");
  }
}

// ============================================================
// CLASSIFY CALL
// ============================================================
//
// Classification logic: We need to distinguish a REAL human from:
//   - Voicemail greetings ("leave a message after the tone")
//   - Carrier messages ("the number you have dialled is not connected")
//   - IVR / directory systems ("press 1 for sales")
//   - Robotic / automated pickups ("your call is important to us")
//   - Fax / modem tones
//
// Strategy: Extract only the caller (user) speech, then check against
// known non-human patterns FIRST. Only classify as human if the caller
// speech doesn't match any automated pattern AND shows signs of genuine
// conversational response to our AI's question.
// ============================================================

// Helper: check if a phrase appears as whole words in text (not as substring).
// E.g. matchWholePhrase("hi", "this is a test") = false
//      matchWholePhrase("hi", "hi there") = true
//      matchWholePhrase("not available", "I'm not available") = true
function matchWholePhrase(phrase, text) {
  // Escape regex special chars in the phrase, then wrap in word boundaries
  var escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var regex = new RegExp("(?:^|\\W)" + escaped + "(?:$|\\W)", "i");
  return regex.test(text);
}

function classifyCall(callData) {
  var endReason = callData.endedReason || "";
  var transcript = callData.transcript || (callData.artifact && callData.artifact.transcript) || "";
  var duration = callData.duration || 0;
  var messages = callData.messages || (callData.artifact && callData.artifact.messages) || [];

  // ---- LAYER 1: Vapi/Twilio end-reason signals ----
  if (endReason.includes("voicemail") || endReason.includes("machine-detected")) {
    return "Voicemail";
  }
  if (endReason === "customer-did-not-answer" ||
      endReason === "customer-busy" ||
      endReason === "customer-did-not-pick-up") {
    return "No Answer";
  }
  if (endReason.includes("error") || endReason.includes("transport")) {
    return "No Answer";
  }

  // ---- LAYER 2: Extract caller vs bot speech ----
  var callerSpeech = "";
  var botSpeech = "";
  var hasUserMessages = false;
  var userMsgCount = 0;

  if (messages && messages.length > 0) {
    for (var i = 0; i < messages.length; i++) {
      var role = (messages[i].role || "").toLowerCase();
      var text = messages[i].message || messages[i].content || "";
      if (role === "user") {
        callerSpeech += " " + text;
        hasUserMessages = true;
        userMsgCount++;
      } else if (role === "bot" || role === "assistant") {
        botSpeech += " " + text;
      }
    }
  } else if (transcript && typeof transcript === "string" && transcript.length > 0) {
    callerSpeech = transcript;
    hasUserMessages = transcript.length > 0;
  }

  // If nobody spoke at all
  if (!hasUserMessages || callerSpeech.trim().length === 0) {
    if (duration < 3) return "No Answer";
    return "Voicemail";
  }

  var lower = callerSpeech.trim().toLowerCase();

  // ---- LAYER 3: Non-human pattern detection ----
  // These are multi-word phrases that are unambiguous - safe to use indexOf
  // (no false positive risk because they're long enough to be unique)

  // 3a. Voicemail / answering machine
  var voicemailPatterns = [
    // Core voicemail phrases
    "leave a message",
    "leave me a message",
    "leave your message",
    "leave us a message",
    "after the tone",
    "after the beep",
    "at the tone",
    "record your message",
    "record a message",
    // "not available" variants
    "is not available",
    "not available right now",
    "not available at the moment",
    "not available to take",
    "not here right now",
    "not here to take",
    // "can't take your call" variants
    "can't come to the phone",
    "can't take your call",
    "can't answer the phone",
    "can't get to the phone",
    "cannot take your call",
    "cannot answer",
    "unable to take your call",
    "unable to answer",
    // "please leave" variants
    "please leave",
    "please record",
    // Voicemail system words
    "voicemail",
    "voice mail",
    "mailbox is full",
    "mailbox full",
    "personal greeting",
    // "you've reached" variants
    "you've reached the voicemail",
    "you have reached the voicemail",
    "you've reached the message",
    "you have reached the message",
    "to leave a callback",
    // Unavailable variants
    "currently unavailable",
    "is unavailable",
    // Carrier voicemail systems (AU)
    "reached the message bank",
    "message bank",
    "optus messaging",
    "telstra messaging",
    "vodafone messaging",
    "messagebank",
    // Personal voicemail greetings - common patterns
    "i'll call you back",
    "i will call you back",
    "call you right back",
    "get back to you",
    "return your call",
    "i'll get back to you",
    "i will get back to you",
    "call me back",
    "try again later",
    "try me again",
    "try back later",
    "try your call again",
    "and i'll call",
    "and i will call"
  ];

  // 3a-2. iPhone Call Screening / Google Call Screen / carrier screening
  var screeningPatterns = [
    "name and reason for calling",
    "reason for your call",
    "state your name",
    "who's calling",
    "who is calling please",
    "if this person is available",
    "see if this person",
    "i'll see if",
    "let me see if",
    "screening your call",
    "screening this call",
    "call is being screened",
    "is screening calls",
    "go ahead and say",
    "say your name",
    "please say your name",
    "announce yourself",
    "identify yourself",
    "google call screen",
    "call screen",
    "live voicemail"
  ];

  // 3b. Carrier / network messages (long unambiguous phrases)
  var carrierPatterns = [
    "the number you have dialled",
    "the number you have called",
    "the number you are calling",
    "this number is not in service",
    "not in service",
    "has been disconnected",
    "is no longer in service",
    "is not a working number",
    "cannot be completed as dialled",
    "cannot be completed as dialed",
    "the person you're trying to reach",
    "the person you are trying to reach",
    "the person you called is not available",
    "this call cannot be completed",
    "the subscriber you have dialled",
    "temporarily unavailable please try",
    "the phone is switched off",
    "is switched off",
    "call could not be connected",
    "call cannot be connected",
    "please check the number",
    "check the number and try again",
    "is not a valid number"
  ];

  // 3c. IVR / directory / automated system (long unambiguous phrases)
  var ivrPatterns = [
    "press 1", "press 2", "press 3", "press 4", "press 5",
    "press 6", "press 7", "press 8", "press 9", "press 0",
    "press star", "press zero", "press one", "press two",
    "press pound", "press hash",
    "for sales", "for support", "for billing", "for accounts",
    "for enquiries", "for inquiries", "for customer service",
    "for technical", "for reception", "for directory",
    "dial the extension",
    "enter the extension",
    "if you know your party",
    "if you know the extension",
    "main menu",
    "automated attendant",
    "auto attendant",
    "your call is important",
    "your call may be recorded",
    "your call may be monitored",
    "this call may be recorded",
    "for quality assurance",
    "for training purposes",
    "please hold",
    "our office hours",
    "our business hours",
    "our opening hours",
    "outside business hours",
    "outside office hours",
    "between the hours of",
    "we are currently closed",
    "we are currently experiencing",
    "high call volume",
    "all of our operators",
    "all operators are busy",
    "all our representatives",
    "estimated wait time",
    "you are number",
    "in the queue",
    "thank you for calling",
    "thanks for calling"
  ];

  // 3d. Fax / modem
  var faxPatterns = [
    "beeeep",
    "beeep"
  ];

  // Check all non-human patterns (these are long enough for safe indexOf)
  var allNonHuman = [
    { patterns: voicemailPatterns, label: "Voicemail" },
    { patterns: screeningPatterns, label: "Call Screening" },
    { patterns: carrierPatterns, label: "Carrier Message" },
    { patterns: ivrPatterns, label: "IVR / Automated" },
    { patterns: faxPatterns, label: "Fax / Modem" }
  ];

  for (var g = 0; g < allNonHuman.length; g++) {
    var group = allNonHuman[g];
    for (var p = 0; p < group.patterns.length; p++) {
      if (lower.indexOf(group.patterns[p]) >= 0) {
        return group.label;
      }
    }
  }

  // ---- LAYER 4: Human interaction signals ----
  // Caller said something that didn't match automated patterns.
  // Now check for genuine conversational response.

  // If the caller's speech is very short (< 5 chars), likely noise
  if (lower.length < 5) {
    return "Voicemail";
  }

  // Count genuine turn-taking (bot -> user -> bot = conversation)
  var turnCount = 0;
  var lastRole = "";
  for (var t = 0; t < messages.length; t++) {
    var msgRole = (messages[t].role || "").toLowerCase();
    if (msgRole === "system") continue;
    if (msgRole !== lastRole && (msgRole === "user" || msgRole === "bot" || msgRole === "assistant")) {
      turnCount++;
      lastRole = msgRole;
    }
  }

  // BUT: even with 3+ turns, check that the user speech isn't just a
  // voicemail greeting playing while our bot talks over it. If there's
  // genuine back-and-forth AND no non-human patterns matched, high confidence.
  if (turnCount >= 3) {
    return "Human Answered";
  }

  // For shorter conversations, use WORD-BOUNDARY matching to avoid
  // false positives like "hi" matching "this" or "no" matching "now"
  var humanPhrases = [
    // Greetings (word-boundary safe)
    "hello", "hey there", "hey mate", "hey buddy",
    // Short words that need word-boundary check
    "hi", "hey", "yes", "yep", "yea", "yeah", "nah", "nope",
    // Multi-word phrases (safe for indexOf but we use matchWholePhrase anyway)
    "who is this", "who's this", "who are you", "who's calling", "who calling",
    "speaking", "you've got", "you got",
    "i can hear", "hear you", "hearing you", "can hear you",
    "what do you want", "what's this about", "what is this",
    "wrong number", "don't call", "stop calling", "don't ring",
    "how did you get", "take me off", "remove my number",
    "not interested", "no thanks", "no thank you",
    "can i help", "may i help", "how can i help",
    "what's up", "what do you need", "go ahead",
    "sorry who", "sorry what", "pardon"
  ];

  for (var h = 0; h < humanPhrases.length; h++) {
    if (matchWholePhrase(humanPhrases[h], lower)) {
      return "Human Answered";
    }
  }

  // Caller said something unrecognised - flag for manual review
  return "Needs Review";
}

function getTranscriptPreview(callData) {
  var messages = callData.messages || (callData.artifact && callData.artifact.messages) || [];
  if (messages.length > 0) {
    return messages
      .filter(function(m) {
        // Skip the system prompt - it's instructions to the AI, not spoken dialogue
        return (m.role || "").toLowerCase() !== "system";
      })
      .map(function(m) {
        var role = (m.role || "?").toLowerCase();
        // Friendlier labels: bot/assistant -> AI, user -> Caller
        var label = (role === "bot" || role === "assistant") ? "MANGO"
                  : (role === "user") ? "Caller"
                  : role;
        return label + ": " + (m.message || m.content || "");
      })
      .join(" | ")
      .substring(0, 300);
  }
  var t = callData.transcript || (callData.artifact && callData.artifact.transcript) || "";
  if (typeof t === "string") return t.substring(0, 300);
  return "";
}

// ============================================================
// VAPI API
// ============================================================
function makeVapiCall(config, phoneNumberId, customerNumber) {
  try {
    // Use assistantOverrides to force listen-first mode:
    // - No first message (AI stays silent, waits for caller to speak)
    // - Short silenceTimeout so the call ends quickly if nobody speaks
    // This way: humans say "Hello?", voicemails play their greeting,
    // screening services play their prompt - and we classify from THEIR
    // first words, not from a response to our AI talking.
    var payload = {
      assistantId: config.assistantId,
      assistantOverrides: {
        firstMessage: "",
        firstMessageMode: "assistant-waits-for-user",
        silenceTimeoutSeconds: 10,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: "You are on a phone call. Stay completely silent. Do not say anything at all. Do not respond to anything the other person says. Just listen. If asked who you are or why you are calling, say nothing. End the call silently."
          }]
        }
      },
      phoneNumberId: phoneNumberId,
      customer: { number: customerNumber },
      maxDurationSeconds: config.maxDuration
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + config.apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch("https://api.vapi.ai/call", options);
    var code = response.getResponseCode();
    var body = JSON.parse(response.getContentText());

    if ((code === 201 || code === 200) && body && body.id) {
      return { success: true, callId: body.id, fromNumber: phoneNumberId };
    } else {
      Logger.log("Vapi create call failed (" + code + "): " + response.getContentText());
      return { success: false, error: (body && body.message) || ("HTTP " + code) };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getVapiCallStatus(config, callId) {
  try {
    var options = {
      method: "get",
      headers: { "Authorization": "Bearer " + config.apiKey },
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch("https://api.vapi.ai/call/" + callId, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
    return null;
  } catch (e) {
    Logger.log("Error polling " + callId + ": " + e.message);
    return null;
  }
}

// Look up the "Slot" column (I = 9) from the Call Log for a given callId.
// Returns the slot name string, or null if not found.
function lookupSlotFromCallLog(log, callId) {
  var lastRow = log.getLastRow();
  if (lastRow < 2) return null;
  // Pull minimal range to keep this fast
  var ids = log.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var r = 0; r < ids.length; r++) {
    if (ids[r][0] === callId) {
      return log.getRange(r + 2, 9).getValue() || null;
    }
  }
  return null;
}

function updateCallLog(log, callId, callData, classification, recordingUrl) {
  var lastRow = log.getLastRow();
  for (var r = 2; r <= lastRow; r++) {
    if (log.getRange(r, 1).getValue() === callId) {
      log.getRange(r, 4).setValue(callData.status || "ended");
      log.getRange(r, 5).setValue(callData.duration || 0);
      log.getRange(r, 6).setValue(callData.endedReason || "");
      log.getRange(r, 7).setValue(getTranscriptPreview(callData));
      log.getRange(r, 8).setValue(classification);
      log.getRange(r, 11).setValue(callData.endedAt || "");
      // Add recording URL in a new column (12)
      log.getRange(r, 12).setValue(recordingUrl);
      return;
    }
  }
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
// TRIGGER SETUP - Run this ONCE to set up all automation
// ============================================================
function setupAllTriggers() {
  // Clear any existing triggers first
  clearAllTriggers();

  // 1. fireBatch every 1 hour so we get TWO firings per 2-hour ET slot
  //    (matches maxPerSlot = 2). The function itself checks if we're in
  //    a valid ET time slot and skips if outside 8am-6pm ET.
  ScriptApp.newTrigger("fireBatch")
    .timeBased()
    .everyHours(1)
    .create();

  // 2. pollResults every 5 minutes to check call outcomes
  ScriptApp.newTrigger("pollResults")
    .timeBased()
    .everyMinutes(5)
    .create();

  // 3. onOpen when spreadsheet is opened (adds menu)
  ScriptApp.newTrigger("onOpen")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();

  SpreadsheetApp.getUi().alert(
    "All triggers set up:\n\n" +
    "1. fireBatch - runs every 1 hour (only fires during 8am-6pm ET; 2 firings per 2-hour slot = maxPerSlot)\n" +
    "2. pollResults - runs every 5 minutes (checks call outcomes)\n" +
    "3. onOpen - adds Validation Engine menu when sheet opens\n\n" +
    "The system is now fully automated. It will:\n" +
    "- Fire batches during each US Eastern time slot\n" +
    "- Auto-poll results and classify calls\n" +
    "- Stop calling numbers that pick up (Human Answered)\n" +
    "- Kill numbers after 10 failed attempts (Dead)\n" +
    "- Respect 2 calls per slot limit\n\n" +
    "To stop everything, use Validation Engine > Stop All Triggers."
  );
}

function clearAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function setupAutoPoll() {
  // Legacy function - use setupAllTriggers instead
  clearPollTriggers();
  var config = getConfig();
  ScriptApp.newTrigger("pollResults")
    .timeBased()
    .everyMinutes(config.pollInterval)
    .create();
  SpreadsheetApp.getUi().alert("Auto-poll enabled every " + config.pollInterval + " minutes.");
}

function clearPollTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "pollResults") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function stopAutoPoll() {
  clearPollTriggers();
}

function stopAllTriggers() {
  clearAllTriggers();
  SpreadsheetApp.getUi().alert("All triggers stopped. The system is now paused.\n\nUse 'Start Automation' to resume.");
}

// ============================================================
// EXPORT - Client-ready output with proof
// ============================================================
function exportValidated() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nums = ss.getSheetByName("Numbers");
  var lastRow = nums.getLastRow();
  if (lastRow < 2) return;

  var data = nums.getRange(2, 1, lastRow - 1, 16).getValues();
  var validated = data.filter(function(row) { return row[1] === "Human Answered"; });

  var exportSheet = ss.getSheetByName("Validated Export");
  if (exportSheet) {
    exportSheet.clear();
  } else {
    exportSheet = ss.insertSheet("Validated Export");
  }

  // Headers
  var exportHeaders = [
    "Phone Number", "Time Window Answered", "Exact Time Answered",
    "Call Duration (s)", "Total Attempts", "Call Recording URL", "Transcript"
  ];
  for (var i = 0; i < exportHeaders.length; i++) {
    var cell = exportSheet.getRange(1, i + 1);
    cell.setValue(exportHeaders[i]);
    cell.setFontWeight("bold");
    cell.setBackground("#F1AB1C");
    cell.setFontColor("#FFFFFF");
  }

  // Data
  for (var j = 0; j < validated.length; j++) {
    var r = j + 2;
    exportSheet.getRange(r, 1).setValue(validated[j][0]);   // Phone Number
    exportSheet.getRange(r, 2).setValue(validated[j][2]);   // Answered In Slot
    exportSheet.getRange(r, 3).setValue(validated[j][15]);  // Answered At (exact timestamp)
    exportSheet.getRange(r, 4).setValue(validated[j][10]);  // Duration
    exportSheet.getRange(r, 5).setValue(validated[j][8]);   // Total Attempts
    exportSheet.getRange(r, 6).setValue(validated[j][14]);  // Recording URL
    exportSheet.getRange(r, 7).setValue(validated[j][11]);  // Transcript
  }

  // Auto-size
  exportSheet.setColumnWidth(1, 160);
  exportSheet.setColumnWidth(2, 150);
  exportSheet.setColumnWidth(3, 200);
  exportSheet.setColumnWidth(4, 120);
  exportSheet.setColumnWidth(5, 120);
  exportSheet.setColumnWidth(6, 350);
  exportSheet.setColumnWidth(7, 400);

  SpreadsheetApp.getUi().alert(
    "Exported " + validated.length + " validated numbers to 'Validated Export' sheet.\n\n" +
    "Each row includes:\n" +
    "- Time window they answered in\n" +
    "- Exact timestamp of the answer\n" +
    "- Call recording URL (proof)\n" +
    "- Transcript of the call\n\n" +
    "Download as CSV via File > Download > CSV."
  );
}

function viewStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nums = ss.getSheetByName("Numbers");
  var lastRow = nums.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert("No data yet."); return; }

  var data = nums.getRange(2, 1, lastRow - 1, 16).getValues();
  var total = data.filter(function(r) { return r[0]; }).length;
  var human = data.filter(function(r) { return r[1] === "Human Answered"; }).length;
  var needsReview = data.filter(function(r) { return r[1] === "Needs Review"; }).length;
  var dead = data.filter(function(r) { return r[1] === "Dead"; }).length;
  var pending = data.filter(function(r) { return r[1] === "Pending" || r[1] === "Retry" || r[1] === ""; }).length;
  var inProgress = data.filter(function(r) { return r[1] === "In Progress"; }).length;

  // Count by classification (Column M) for detailed breakdown
  var classVoicemail = data.filter(function(r) { return r[12] === "Voicemail"; }).length;
  var classScreening = data.filter(function(r) { return r[12] === "Call Screening"; }).length;
  var classCarrier = data.filter(function(r) { return r[12] === "Carrier Message"; }).length;
  var classIvr = data.filter(function(r) { return r[12] === "IVR / Automated"; }).length;
  var classFax = data.filter(function(r) { return r[12] === "Fax / Modem"; }).length;
  var classNoAnswer = data.filter(function(r) { return r[12] === "No Answer"; }).length;

  SpreadsheetApp.getUi().alert(
    "VALIDATION STATS\n\n" +
    "Total Numbers: " + total + "\n" +
    "Human Answered: " + human + " (" + (total > 0 ? (human/total*100).toFixed(1) : 0) + "%)\n" +
    "Needs Review: " + needsReview + "\n" +
    "Dead (10 tries): " + dead + "\n" +
    "In Progress: " + inProgress + "\n" +
    "Remaining: " + pending + "\n\n" +
    "CLASSIFICATION BREAKDOWN:\n" +
    "Voicemail: " + classVoicemail + "\n" +
    "Call Screening: " + classScreening + "\n" +
    "Carrier Message: " + classCarrier + "\n" +
    "IVR / Automated: " + classIvr + "\n" +
    "Fax / Modem: " + classFax + "\n" +
    "No Answer: " + classNoAnswer + "\n\n" +
    "Total calls made: " + data.reduce(function(s, r) { return s + (r[8] || 0); }, 0)
  );
}

// ============================================================
// RESET ALL - Wipe all statuses and counters for a fresh start
// ============================================================
function resetAll() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    "RESET ALL DATA",
    "This will clear ALL statuses, attempt counters, transcripts, and classifications " +
    "for every number in the sheet. Phone numbers in Column A will be kept.\n\n" +
    "The Call Log will also be cleared.\n\n" +
    "Are you sure?",
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nums = ss.getSheetByName("Numbers");
  var log = ss.getSheetByName("Call Log");
  var lastRow = nums.getLastRow();
  if (lastRow < 2) return;

  var numRows = lastRow - 1;

  // Clear columns B through P (Status, Answered In Slot, slot attempts D-H,
  // Total Attempts, Last Call ID, Duration, Transcript, Classification,
  // Last Called At, Recording URL, Answered At)
  // B = col 2, P = col 16, so 15 columns starting from col 2
  nums.getRange(2, 2, numRows, 15).clearContent();

  // Clear Call Log (keep headers in row 1)
  var logLastRow = log.getLastRow();
  if (logLastRow >= 2) {
    log.getRange(2, 1, logLastRow - 1, log.getLastColumn()).clearContent();
  }

  ui.alert(
    "Reset complete.\n\n" +
    numRows + " numbers ready for fresh calling.\n" +
    "All statuses, counters, and transcripts cleared.\n" +
    "Call Log cleared.\n\n" +
    "The automation will start calling on the next trigger cycle.\n" +
    "Or click 'TEST Fire Batch' to test immediately."
  );
}

// Incase of a deadlock on vapi run this function to clear stale calls

function cancelAllScheduledCalls() {
  var config = getConfig();
  var headers = { "Authorization": "Bearer " + config.apiKey };
  var cancelled = 0;
  var failed = 0;
  var skipped = 0;
  var pageToken = null;
  var totalFetched = 0;

  do {
    // Vapi list calls endpoint — no status filter, paginate with createdAtLt
    var url = "https://api.vapi.ai/call?limit=100";
    if (pageToken) url += "&createdAtLt=" + pageToken;

    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log("Fetch failed (" + code + "): " + response.getContentText());
      break;
    }

    var calls = JSON.parse(response.getContentText());
    if (!Array.isArray(calls) || calls.length === 0) break;

    totalFetched += calls.length;
    Logger.log("Fetched " + calls.length + " calls (total so far: " + totalFetched + ")");

    for (var i = 0; i < calls.length; i++) {
      var call = calls[i];

      // Only cancel scheduled calls
      if (call.status !== "scheduled") {
        skipped++;
        continue;
      }

      try {
        var delResp = UrlFetchApp.fetch("https://api.vapi.ai/call/" + call.id, {
          method: "delete",
          headers: headers,
          muteHttpExceptions: true
        });
        var delCode = delResp.getResponseCode();
        if (delCode === 200 || delCode === 204) {
          cancelled++;
          Logger.log("Cancelled: " + call.id + " (" + call.customer.number + ")");
        } else {
          failed++;
          Logger.log("Failed to cancel " + call.id + ": " + delResp.getContentText());
        }
      } catch(e) {
        failed++;
        Logger.log("Error on " + call.id + ": " + e.message);
      }
      Utilities.sleep(150);
    }

    // Use the createdAt of the last item as the next page cursor
    pageToken = calls[calls.length - 1].createdAt;

    // Stop if we got fewer than 100 (last page)
  } while (calls.length === 100);

  Logger.log("DONE — Fetched: " + totalFetched + " | Cancelled: " + cancelled + " | Skipped (non-scheduled): " + skipped + " | Failed: " + failed);
  
  SpreadsheetApp.getUi().alert(
    "Done!\n\n" +
    "Total calls fetched: " + totalFetched + "\n" +
    "Scheduled calls cancelled: " + cancelled + "\n" +
    "Non-scheduled (skipped): " + skipped + "\n" +
    (failed > 0 ? "Failed: " + failed + " — check Apps Script logs\n" : "") +
    "\nYou can now run TEST Fire Batch."
  );
}

function diagVapiCall() {
  var config = getConfig();
  var headers = { "Authorization": "Bearer " + config.apiKey };
  var statusCounts = {};
  var pageToken = null;
  var totalFetched = 0;

  do {
    var url = "https://api.vapi.ai/call?limit=100";
    if (pageToken) url += "&createdAtLt=" + pageToken;

    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });

    var calls = JSON.parse(response.getContentText());
    if (!Array.isArray(calls) || calls.length === 0) break;

    totalFetched += calls.length;

    for (var i = 0; i < calls.length; i++) {
      var s = calls[i].status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    pageToken = calls[calls.length - 1].createdAt;

  } while (calls.length === 100);

  var summary = "Total calls fetched: " + totalFetched + "\n\nBreakdown by status:\n";
  for (var status in statusCounts) {
    summary += "  " + status + ": " + statusCounts[status] + "\n";
  }

  Logger.log(summary);
  SpreadsheetApp.getUi().alert(summary);
}

function diagVapiCalls() {
  var config = getConfig();
  var headers = { "Authorization": "Bearer " + config.apiKey };
  var statusCounts = {};
  var totalFetched = 0;
  var lastCreatedAt = null;
  var lastIdSeen = null;
  var page = 0;

  do {
    var url = "https://api.vapi.ai/call?limit=100";
    if (lastCreatedAt) url += "&createdAtLt=" + encodeURIComponent(lastCreatedAt);

    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log("Fetch failed (" + code + "): " + response.getContentText());
      break;
    }

    var calls = JSON.parse(response.getContentText());
    if (!Array.isArray(calls) || calls.length === 0) break;

    // Skip first record if it's the same as the last one from previous page
    // This handles duplicate timestamps at page boundaries
    var startIndex = (lastIdSeen && calls[0].id === lastIdSeen) ? 1 : 0;

    for (var i = startIndex; i < calls.length; i++) {
      var s = calls[i].status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      totalFetched++;
    }

    page++;
    lastIdSeen = calls[calls.length - 1].id;
    lastCreatedAt = calls[calls.length - 1].createdAt;

    Logger.log("Page " + page + " | total so far: " + totalFetched);

  } while (calls.length === 100);

  var summary = "Total: " + totalFetched + "\n\nBreakdown:\n";
  for (var s in statusCounts) summary += "  " + s + ": " + statusCounts[s] + "\n";
  Logger.log(summary);
  SpreadsheetApp.getUi().alert(summary);
}

function checkStuckCall() {
  var config = getConfig();
  var callId = "019e08aa-312d-7000-94ab-973edc6cb94a";
  var response = UrlFetchApp.fetch("https://api.vapi.ai/call/" + callId, {
    method: "get",
    headers: { "Authorization": "Bearer " + config.apiKey },
    muteHttpExceptions: true
  });
  Logger.log(response.getContentText());
}