{
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes"
            }
          ]
        }
      },
      "id": "node-schedule",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.3,
      "position": [
        -16,
        304
      ]
    },
    {
      "parameters": {
        "documentId": {
          "mode": "id",
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI"
        },
        "sheetName": {
          "__rl": true,
          "value": 1258521478,
          "mode": "list",
          "cachedResultName": "Config",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit#gid=1258521478"
        },
        "options": {}
      },
      "id": "node-read-config",
      "name": "Read Config",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        224,
        304
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const rows = items.map(i => i.json);\nfunction getRow(rows, rowNum) {\n  const r = rows.find(x => x.row_number === rowNum);\n  return r ? (r['col_2'] || r['B'] || '') : '';\n}\nconst config = {\n  apiKey:       String(getRow(rows, 4)),\n  agentId:      String(getRow(rows, 5)),\n  batchSize:    parseInt(getRow(rows, 6)) || 50,\n  maxDuration:  parseInt(getRow(rows, 7)) || 10,\n  maxAttempts:  parseInt(getRow(rows, 10)) || 10,\n  maxPerSlot:   parseInt(getRow(rows, 11)) || 2,\n  phoneNumberId: String(getRow(rows, 12))\n};\nconst now = new Date();\nconst etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });\nconst etHour = new Date(etStr).getHours();\nconst slots = [\n  { name: '8am-10am',  startHour: 8,  endHour: 10, col: 'D' },\n  { name: '10am-12pm', startHour: 10, endHour: 12, col: 'E' },\n  { name: '12pm-2pm',  startHour: 12, endHour: 14, col: 'F' },\n  { name: '2pm-4pm',   startHour: 14, endHour: 16, col: 'G' },\n  { name: '4pm-6pm',   startHour: 16, endHour: 18, col: 'H' },\n];\nconst currentSlot = slots.find(s => etHour >= s.startHour && etHour < s.endHour) || null;\nconst etDate = new Date(etStr);\nconst todayDateStr = etDate.getFullYear() + '-' +\n  String(etDate.getMonth() + 1).padStart(2, '0') + '-' +\n  String(etDate.getDate()).padStart(2, '0');\nreturn [{ json: { config, currentSlot, todayDateStr, etHour, withinHours: currentSlot !== null } }];"
      },
      "id": "node-extract-config",
      "name": "Extract Config Values",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        448,
        304
      ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{ $json.withinHours }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              },
              "id": "ae28f630-b8e9-4c43-9285-38ba6ddce592"
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "node-check-hours",
      "name": "Within Calling Hours?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        672,
        304
      ]
    },
    {
      "parameters": {
        "documentId": {
          "mode": "id",
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI"
        },
        "sheetName": {
          "__rl": true,
          "value": 2141969193,
          "mode": "list",
          "cachedResultName": "Numbers",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit#gid=2141969193"
        },
        "options": {}
      },
      "id": "node-read-numbers",
      "name": "Read Numbers Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        880,
        384
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "documentId": {
          "mode": "id",
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI"
        },
        "sheetName": {
          "__rl": true,
          "value": 2075355757,
          "mode": "list",
          "cachedResultName": "ManyMangos Pick for MM(Sheet1)",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit#gid=2075355757"
        },
        "options": {}
      },
      "id": "node-read-pick",
      "name": "Read ManyMangos Pick",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        880,
        192
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Input 0 = Read ManyMangos Pick  (has 'Mobile Phone Number' + 'Contact ID')\n// Input 1 = Read Numbers Sheet     (has 'Phone Number')\n// Read by input index to avoid misclassification by column names\n\nconst pickItems   = $input.all(0).map(i => i.json);\nconst numberItems = $input.all(1).map(i => i.json);\n\n// Normalise: strip spaces, dashes, dots, parens, plus signs\nfunction normalise(p) {\n  return String(p || '').trim().replace(/[\\s\\-().+]/g, '');\n}\n\n// Build set of existing phone numbers from the Numbers sheet\nconst existingNumbers = new Set(\n  numberItems\n    .map(r => normalise(r['Phone Number']))\n    .filter(Boolean)\n);\n\n// Find pick contacts whose mobile number isn't already in the Numbers sheet\nconst seen = new Set();\nconst newContacts = pickItems.filter(r => {\n  const phone = normalise(r['Mobile Phone Number']);\n  if (!phone) return false;\n  if (existingNumbers.has(phone)) return false;  // already tracked\n  if (seen.has(phone)) return false;             // deduplicate within pick list\n  seen.add(phone);\n  return true;\n});\n\nreturn [{ json: { newContacts, newCount: newContacts.length } }];"
      },
      "id": "a93d72f5-b760-4995-a43f-b3903b561d80",
      "name": "Sync New Numbers",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1216,
        304
      ]
    },
    {
      "parameters": {
        "jsCode": "const { newContacts } = items[0].json;\nreturn newContacts.map(c => ({\n  json: {\n    'Phone Number': String(c['Mobile Phone Number'] || c['C'] || '').trim(),\n    'Status': '',\n    'Answered In Slot': '',\n    '8am-10am': '',\n    '10am-12pm': '',\n    '12pm-2pm': '',\n    '2pm-4pm': '',\n    '4pm-6pm': '',\n    'Total Attempts': '',\n    'Last Call ID': '',\n    'Last Duration (s)': '',\n    'Last Transcript': '',\n    'Last Classification': '',\n    'Last Called At': '',\n    'Recording URL': '',\n    'Answered At': ''\n  }\n}));"
      },
      "id": "42562aa5-491c-4324-b647-c927d423c40c",
      "name": "Split New Contacts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1568,
        192
      ]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "mode": "id",
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI"
        },
        "sheetName": {
          "mode": "name",
          "value": "Numbers"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Phone Number": "={{ $json['Phone Number'] }}",
            "Status": "={{ $json['Status'] }}",
            "Answered In Slot": "={{ $json['Answered In Slot'] }}",
            "8am-10am": "={{ $json['8am-10am'] }}",
            "10am-12pm": "={{ $json['10am-12pm'] }}",
            "12pm-2pm": "={{ $json['12pm-2pm'] }}",
            "2pm-4pm": "={{ $json['2pm-4pm'] }}",
            "4pm-6pm": "={{ $json['4pm-6pm'] }}",
            "Total Attempts": "={{ $json['Total Attempts'] }}",
            "Last Call ID": "={{ $json['Last Call ID'] }}",
            "Last Duration (s)": "={{ $json['Last Duration (s)'] }}",
            "Last Transcript": "={{ $json['Last Transcript'] }}",
            "Last Classification": "={{ $json['Last Classification'] }}",
            "Last Called At": "={{ $json['Last Called At'] }}",
            "Recording URL": "={{ $json['Recording URL'] }}",
            "Answered At": "={{ $json['Answered At'] }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "Phone Number",
              "displayName": "Phone Number",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Status",
              "displayName": "Status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Answered In Slot",
              "displayName": "Answered In Slot",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "8am-10am",
              "displayName": "8am-10am",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "10am-12pm",
              "displayName": "10am-12pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "12pm-2pm",
              "displayName": "12pm-2pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "2pm-4pm",
              "displayName": "2pm-4pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "4pm-6pm",
              "displayName": "4pm-6pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Total Attempts",
              "displayName": "Total Attempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Call ID",
              "displayName": "Last Call ID",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Duration (s)",
              "displayName": "Last Duration (s)",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Transcript",
              "displayName": "Last Transcript",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Classification",
              "displayName": "Last Classification",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Called At",
              "displayName": "Last Called At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Recording URL",
              "displayName": "Recording URL",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Answered At",
              "displayName": "Answered At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "id": "db12b022-30ac-4971-ab64-1f29f34eb80b",
      "name": "Append to Numbers Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        1760,
        192
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 3
          },
          "conditions": [
            {
              "id": "26bb1dca-9732-48d9-97ca-44e5675c684d",
              "leftValue": "={{ $json.newCount }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.3,
      "position": [
        1376,
        304
      ],
      "id": "0d7f3a09-265a-4242-93ee-40fc6c8d06a9",
      "name": "If"
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        1056,
        304
      ],
      "id": "0b5c5dd6-7808-4337-bc13-ae4041bd8244",
      "name": "Merge"
    },
    {
      "parameters": {
        "jsCode": "const configData = $('Extract Config Values').first().json;\nlet { config, currentSlot, todayDateStr } = configData;\nif (!currentSlot) {\n  // Outside calling hours — use first slot as fallback so testing works at any time\n  currentSlot = { name: '8am-10am', startHour: 8, endHour: 10, col: 'D' };\n}\nconst slotColMap = { 'D': '8am-10am', 'E': '10am-12pm', 'F': '12pm-2pm', 'G': '2pm-4pm', 'H': '4pm-6pm' };\nconst slotHeader = slotColMap[currentSlot.col];\nconst allRows = items.map((item, idx) => ({ ...item.json, _rowIndex: idx + 2 }));\nconst eligible = [];\nconst skipped = { done: 0, calledToday: 0, maxAttempts: 0, slotFull: 0, inProgress: 0 };\nfor (const row of allRows) {\n  const phone = String(row['Phone Number'] || '').trim();\n  if (!phone) continue;\n  const status = String(row['Status'] || '').trim();\n  const totalAttempts = parseInt(row['Total Attempts']) || 0;\n  const slotAttempts = parseInt(row[slotHeader]) || 0;\n  const lastCalledAt = row['Last Called At'] || '';\n  if (['Human Answered', 'Dead', 'Needs Review'].includes(status)) { skipped.done++; continue; }\n  if (status === 'In Progress') { skipped.inProgress++; continue; }\n  if (lastCalledAt) {\n    const lastDate = new Date(lastCalledAt);\n    const lastET = new Date(lastDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));\n    const lastStr = lastET.getFullYear() + '-' + String(lastET.getMonth()+1).padStart(2,'0') + '-' + String(lastET.getDate()).padStart(2,'0');\n    if (lastStr === todayDateStr) { skipped.calledToday++; continue; }\n  }\n  if (totalAttempts >= config.maxAttempts) { skipped.maxAttempts++; continue; }\n  if (slotAttempts >= config.maxPerSlot) { skipped.slotFull++; continue; }\n  if (!['Pending', 'Retry', ''].includes(status)) continue;\n  if (eligible.length < config.batchSize) {\n    eligible.push({ phone_number: phone, _rowIndex: row._rowIndex, _totalAttempts: totalAttempts, _slotAttempts: slotAttempts, _slotHeader: slotHeader });\n  }\n}\nreturn [{ json: { eligible, skipped, currentSlot, config, todayDateStr, hasEligible: eligible.length > 0 } }];"
      },
      "id": "88cfc318-db87-4cf2-8d4f-fefcb24ce91e",
      "name": "Filter Eligible Numbers",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        2176,
        320
      ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{ $json.hasEligible }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              },
              "id": "86c6612e-b551-479a-a822-520175eba9b6"
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "828277cb-1756-4cad-9854-42a40b509467",
      "name": "Has Eligible Numbers?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        2368,
        320
      ]
    },
    {
      "parameters": {
        "jsCode": "const existingItems = $('Read Numbers Sheet').all();\nconst existingData = existingItems.map(i => i.json);\n\n// If incoming items have Phone Number they are newly appended contacts (true branch)\n// Otherwise it's the pass-through from the If false branch\nconst incomingItems = items.map(i => i.json);\nconst hasNewData = incomingItems.some(i => i['Phone Number'] || i['phoneNumber']);\n\nconst merged = hasNewData\n  ? [...existingData, ...incomingItems]\n  : existingData;\n\nreturn merged.map(d => ({ json: d }));"
      },
      "id": "5f25a364-8d41-4607-a027-4c82e0537004",
      "name": "Merge Number Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1984,
        320
      ]
    },
    {
      "parameters": {
        "jsCode": "const batchResponse = $('Batch calling').first().json;\nconst batchId = batchResponse.id;\nconst eligible = $('Filter Eligible Numbers').first().json.eligible;\nconst currentSlot = $('Filter Eligible Numbers').first().json.currentSlot;\nconst now = new Date().toISOString();\nif (!batchId) throw new Error('No batch ID returned from ElevenLabs: ' + JSON.stringify(batchResponse));\nreturn eligible.map(e => ({\n  json: {\n    'Phone Number': e.phone_number,\n    phone: e.phone_number,\n    batchId,\n    currentSlotName: currentSlot.name,\n    newTotalAttempts: (e._totalAttempts || 0) + 1,\n    now,\n    Status: 'In Progress',\n    '8am-10am':  currentSlot.col === 'D' ? (e._slotAttempts || 0) + 1 : '',\n    '10am-12pm': currentSlot.col === 'E' ? (e._slotAttempts || 0) + 1 : '',\n    '12pm-2pm':  currentSlot.col === 'F' ? (e._slotAttempts || 0) + 1 : '',\n    '2pm-4pm':   currentSlot.col === 'G' ? (e._slotAttempts || 0) + 1 : '',\n    '4pm-6pm':   currentSlot.col === 'H' ? (e._slotAttempts || 0) + 1 : '',\n    'Total Attempts': (e._totalAttempts || 0) + 1,\n    'Last Call ID': batchId,\n    'Last Called At': now\n  }\n}));"
      },
      "id": "91a44bfd-d8c8-4416-8c87-8766de0e7bdb",
      "name": "Mark Numbers In Progress",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        2784,
        304
      ],
      "alwaysOutputData": false
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "mode": "id",
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI"
        },
        "sheetName": {
          "mode": "name",
          "value": "Call Log"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Phone Number": "={{ $json[\"Phone Number\"] }}",
            "phone": "={{ $json.phone }}",
            "batchId": "={{ $json.batchId }}",
            "currentSlotName": "={{ $json.currentSlotName }}",
            "newTotalAttempts": "={{ $json.newTotalAttempts }}",
            "now": "={{ $json.now }}",
            "Status": "={{ $json.Status }}",
            "8am-10am": "={{ $json[\"8am-10am\"] }}",
            "10am-12pm": "={{ $json[\"10am-12pm\"] }}",
            "12pm-2pm": "={{ $json[\"12pm-2pm\"] }}",
            "2pm-4pm": "={{ $json[\"2pm-4pm\"] }}",
            "4pm-6pm": "={{ $json[\"4pm-6pm\"] }}",
            "Total Attempts": "={{ $json[\"Total Attempts\"] }}",
            "Last Call ID": "={{ $json[\"Last Call ID\"] }}",
            "Last Called At": "={{ $json[\"Last Called At\"] }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "Phone Number",
              "displayName": "Phone Number",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "phone",
              "displayName": "phone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "batchId",
              "displayName": "batchId",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "currentSlotName",
              "displayName": "currentSlotName",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "newTotalAttempts",
              "displayName": "newTotalAttempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "now",
              "displayName": "now",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Status",
              "displayName": "Status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "8am-10am",
              "displayName": "8am-10am",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "10am-12pm",
              "displayName": "10am-12pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "12pm-2pm",
              "displayName": "12pm-2pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "2pm-4pm",
              "displayName": "2pm-4pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "4pm-6pm",
              "displayName": "4pm-6pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Total Attempts",
              "displayName": "Total Attempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Last Call ID",
              "displayName": "Last Call ID",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Last Called At",
              "displayName": "Last Called At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "id": "8f2e29ec-782e-4865-8ef1-86a82575b196",
      "name": "Log to Call Log",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        2976,
        432
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "unit": "minutes"
      },
      "id": "7286e1ba-1e4d-4967-9339-b0e39a179646",
      "name": "Wait 5 Min For Batch",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        3328,
        304
      ],
      "webhookId": "d72a9652-4993-4935-80c8-068a713d1caf"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.elevenlabs.io/v1/convai/batch-calling/submit",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "xi-api-key",
              "value": "={{ $json.config.apiKey }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"call_name\": \"ManyMangoes-Validation-{{ $json.currentSlot.name }}-{{ $now.toISO() }}\",\n  \"agent_id\": \"{{ $json.config.agentId }}\",\n  \"agent_phone_number_id\": \"{{ $json.config.phoneNumberId }}\",\n  \"recipients\": {{ JSON.stringify($json.eligible.map(r => ({ phone_number: r.phone_number }))) }}\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        2592,
        304
      ],
      "id": "700bcb39-730d-45e7-8926-adb7085af708",
      "name": "Batch calling"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{ $json.status }}",
              "rightValue": "completed",
              "operator": {
                "type": "string",
                "operation": "equals"
              },
              "id": "9866571c-cfce-4f84-a3bd-09013f42a4b8"
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "3497d266-d103-42c5-9d52-8f0a45a0ad1e",
      "name": "Batch Completed?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        3936,
        304
      ]
    },
    {
      "parameters": {
        "amount": 4,
        "unit": "minutes"
      },
      "id": "2adccd31-a817-4457-9b30-fb2427d10347",
      "name": "Wait 5 More Minutes",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        4192,
        320
      ],
      "webhookId": "4ac73b09-5c15-444f-8f51-28964ca2da31"
    },
    {
      "parameters": {
        "jsCode": "const batchData = items[0].json; // comes directly from previous node\nconst recipients = batchData.recipients || [];\nconst apiKey = $('Filter Eligible Numbers').first().json.config.apiKey;\nconst maxAttempts = $('Filter Eligible Numbers').first().json.config.maxAttempts;\nconst eligible = $('Filter Eligible Numbers').first().json.eligible;\n\n// Build lookup: phone -> row data\nconst rowLookup = {};\nfor (const e of eligible) {\n  rowLookup[e.phone_number] = {\n    _rowIndex: e._rowIndex,\n    _totalAttempts: e._totalAttempts + 1\n  };\n}\n\n// Filter only recipients that have a conversation_id (regardless of status)\nreturn recipients\n  .filter(r => r.conversation_id)\n  .map(r => ({\n    json: {\n      phone: r.phone_number,\n      recipientStatus: r.status, // voicemail, answered, no_answer etc\n      conversationId: r.conversation_id,\n      batchId: batchData.id,\n      apiKey,\n      maxAttempts,\n      _rowIndex: (rowLookup[r.phone_number] || {})._rowIndex,\n      _totalAttempts: (rowLookup[r.phone_number] || {})._totalAttempts || 1\n    }\n  }));"
      },
      "id": "46a4e808-8883-4a6a-983d-47a2a92b28f8",
      "name": "Split Recipients",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        4240,
        128
      ]
    },
    {
      "parameters": {
        "url": "=https://api.elevenlabs.io/v1/convai/batch-calling/{{ $('Batch calling').item.json.id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "xi-api-key",
              "value": "={{ $('Has Eligible Numbers?').item.json.config.apiKey }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        3504,
        304
      ],
      "id": "8bcfc1c0-9088-4ccc-9b21-358d474c9ab2",
      "name": "Poll Batch"
    },
    {
      "parameters": {
        "jsCode": "// Take only the first item from poll response\nreturn [items[0]];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        3712,
        304
      ],
      "id": "7e786e3a-05a9-4838-9868-82e288587151",
      "name": "Collapse to one"
    },
    {
      "parameters": {
        "url": "=https://api.elevenlabs.io/v1/convai/conversations/{{ $json.conversationId }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "xi-api-key",
              "value": "={{ $('Filter Eligible Numbers').item.json.config.apiKey }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        4656,
        144
      ],
      "id": "2d98914a-aaa9-40d0-aad6-ff608096de57",
      "name": "Get Convo details"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        4416,
        128
      ],
      "id": "7172a841-bbe6-45cc-84ce-515d1808302c",
      "name": "Loop Over Items"
    },
    {
      "parameters": {
        "amount": 2
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        4672,
        320
      ],
      "id": "4b57f876-9986-43fb-9de3-db320676b05b",
      "name": "Wait",
      "webhookId": "5937fe6f-b401-4e26-b4d0-d216cb26e3d4"
    },
    {
      "parameters": {
        "jsCode": "const conv = items[0].json;\n\n// Build readable transcript\nconst transcriptText = (conv.transcript || [])\n  .filter(t => t.message && (t.role === 'agent' || t.role === 'user'))\n  .map(t => `${t.role.toUpperCase()}: ${t.message}`)\n  .join(' | ');\n\n// Classify based on termination_reason and transcript\nfunction classify(conv) {\n  const reason = (conv.metadata.termination_reason || '').toLowerCase();\n  const transcript = transcriptText.toLowerCase();\n\n  if (reason.includes('voicemail_detection')) return 'Voicemail';\n  if (reason.includes('user_hangup') || reason.includes('agent_hangup')) {\n    if (transcript.includes('press') && transcript.includes('option')) return 'IVR / Automated';\n    return 'Human Answered';\n  }\n  if (reason.includes('no_answer') || reason.includes('timeout')) return 'No Answer';\n  if (reason.includes('carrier') || reason.includes('not in service')) return 'Carrier Message';\n  if (reason.includes('screening')) return 'Call Screening';\n  return 'Needs Review';\n}\n\nconst classification = classify(conv);\nconst duration = (conv.metadata && conv.metadata.call_duration_secs) || 0;\nconst phone = (conv.user_id || '').replace('+', '');\nconst lastCalledAt = new Date(conv.metadata.start_time_unix_secs * 1000).toISOString();\n\n// Determine final status\nconst finalStatus = classification === 'Human Answered' ? 'Human Answered'\n  : classification === 'Needs Review' ? 'Needs Review'\n  : 'Retry';\n\nreturn [{\n  json: {\n    'Phone Number': phone,\n    'Status': finalStatus,\n    'Last Classification': classification,\n    'Last Duration (s)': duration,\n    'Last Transcript': transcriptText,\n    'Last Called At': lastCalledAt,\n    'Last Call ID': conv.conversation_id,\n    _rowIndex: $input.first().json._rowIndex,\n    _totalAttempts: $input.first().json._totalAttempts\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        4864,
        144
      ],
      "id": "9c3ce259-e482-4e9e-83a2-d45ee5175dd0",
      "name": "Format conversation details"
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "const conv = $('Get Convo details').item.json;\nconst recipient = $('Split Recipients').item.json;\nconst currentSlot = $('Filter Eligible Numbers').first().json.currentSlot;\nconst maxAttempts = recipient.maxAttempts;\nconst totalAttempts = recipient._totalAttempts;\nconst now = new Date().toISOString();\n\n// Pull conversation data\nconst duration = conv.metadata?.call_duration_secs || 0;\nconst recordingUrl = conv.metadata?.recording_url || '';\nconst terminationReason = conv.metadata?.termination_reason || '';\n\n// Build transcript\nlet transcript = '';\nif (Array.isArray(conv.transcript)) {\n  transcript = conv.transcript\n    .map(t => (t.role === 'agent' ? 'AGENT' : 'CALLER') + ': ' + t.message)\n    .join(' | ')\n    .substring(0, 700);\n}\n\n// ── Extract classification from LLM output ──────────────────────────────────\nconst llmText = $('Classify').item.json?.output?.[0]?.content?.[0]?.text || '';\nconst match = llmText.match(/Last Classification:\\s*(.+)/i);\nconst classification = match ? match[1].trim() : 'No Answer';\n// ────────────────────────────────────────────────────────────────────────────\n\n// Determine final status\nlet finalStatus;\nif (classification === 'Human Answered')       finalStatus = 'Human Answered';\nelse if (classification === 'IVR / Automated') finalStatus = 'Dead';\nelse if (totalAttempts >= maxAttempts)         finalStatus = 'Dead';\nelse                                           finalStatus = 'Retry';\n\nconst isHuman = classification === 'Human Answered';\nconst slotName = currentSlot ? currentSlot.name : '8am-10am';\nconst slotCol  = currentSlot ? currentSlot.col  : 'D';\nconst phone = (recipient.phone || '').replace('+', '');\n\nreturn {\n  json: {\n    'Phone Number':        phone,\n    phone:                 phone,\n    'Status':              finalStatus,\n    'Last Duration (s)':   duration,\n    'Last Transcript':     transcript,\n    'Last Classification': classification,\n    'Last Call ID':        recipient.batchId,\n    'Recording URL':       recordingUrl,\n    'Answered At':         isHuman ? now : '',\n    'Answered In Slot':    isHuman ? slotName : '',\n    '8am-10am':            slotCol === 'D' ? totalAttempts : '',\n    '10am-12pm':           slotCol === 'E' ? totalAttempts : '',\n    '12pm-2pm':            slotCol === 'F' ? totalAttempts : '',\n    '2pm-4pm':             slotCol === 'G' ? totalAttempts : '',\n    '4pm-6pm':             slotCol === 'H' ? totalAttempts : '',\n    totalAttempts,\n    slotName,\n    batchId:               recipient.batchId,\n    finalStatus,\n    classification,\n    duration,\n    transcript,\n    recordingUrl,\n    terminationReason,\n    now,\n    isHuman\n  }\n};"
      },
      "id": "e9691ba5-8e6c-44bc-8ad2-1413ab9dcf0a",
      "name": "Build Final Result1",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        5376,
        144
      ]
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        3168,
        304
      ],
      "id": "6132a347-f030-413a-b430-aee46fbec5dd",
      "name": "Merge1"
    },
    {
      "parameters": {
        "operation": "update",
        "documentId": {
          "__rl": true,
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI",
          "mode": "list",
          "cachedResultName": "Copy of Phone_Number_Validation_Dashboard - Exclusive Networks",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": 17002756,
          "mode": "list",
          "cachedResultName": "Call Log",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit#gid=17002756"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Status": "={{ $json.Status }}",
            "Phone Number": "={{ $json[\"Phone Number\"] }}",
            "phone": "={{ $json.phone }}",
            "batchId": "={{ $json.batchId }}",
            "currentSlotName": "={{ $json.slotName }}",
            "8am-10am": "={{ $json[\"8am-10am\"] }}",
            "10am-12pm": "={{ $json[\"10am-12pm\"] }}",
            "12pm-2pm": "={{ $json[\"12pm-2pm\"] }}",
            "2pm-4pm": "={{ $json[\"2pm-4pm\"] }}",
            "4pm-6pm": "={{ $json[\"4pm-6pm\"] }}",
            "Total Attempts": "={{ $json.totalAttempts }}",
            "Last Called At": "={{ $json.now }}",
            "now": "={{ $json.now }}",
            "newTotalAttempts": "={{ $json.totalAttempts }}",
            "Last Call ID": "={{ $json[\"Last Call ID\"] }}"
          },
          "matchingColumns": [
            "Phone Number"
          ],
          "schema": [
            {
              "id": "Phone Number",
              "displayName": "Phone Number",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "phone",
              "displayName": "phone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "batchId",
              "displayName": "batchId",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "currentSlotName",
              "displayName": "currentSlotName",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "newTotalAttempts",
              "displayName": "newTotalAttempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "now",
              "displayName": "now",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Status",
              "displayName": "Status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "8am-10am",
              "displayName": "8am-10am",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "10am-12pm",
              "displayName": "10am-12pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "12pm-2pm",
              "displayName": "12pm-2pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "2pm-4pm",
              "displayName": "2pm-4pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "4pm-6pm",
              "displayName": "4pm-6pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Total Attempts",
              "displayName": "Total Attempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Last Call ID",
              "displayName": "Last Call ID",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Last Called At",
              "displayName": "Last Called At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "id": "append-calllog-node",
      "name": "Append to Call Log",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        5888,
        240
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        6128,
        112
      ],
      "id": "c997d225-7b23-4540-8e73-4cabe3a788f8",
      "name": "Merge2"
    },
    {
      "parameters": {
        "operation": "update",
        "documentId": {
          "__rl": true,
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI",
          "mode": "list",
          "cachedResultName": "Copy of Phone_Number_Validation_Dashboard - Exclusive Networks",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": 2141969193,
          "mode": "list",
          "cachedResultName": "Numbers",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit#gid=2141969193"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Phone Number": "={{ $json[\"Phone Number\"] }}",
            "Status": "={{ $json.Status }}",
            "Answered In Slot": "={{ $json[\"Answered In Slot\"] }}",
            "8am-10am": "={{ $json[\"8am-10am\"] }}",
            "10am-12pm": "={{ $json[\"10am-12pm\"] }}",
            "12pm-2pm": "={{ $json[\"12pm-2pm\"] }}",
            "2pm-4pm": "={{ $json[\"2pm-4pm\"] }}",
            "4pm-6pm": "={{ $json[\"4pm-6pm\"] }}",
            "Total Attempts": "={{ $json.totalAttempts }}",
            "Last Call ID": "={{ $json[\"Last Call ID\"] }}",
            "Last Duration (s)": "={{ $json[\"Last Duration (s)\"] }}",
            "Last Transcript": "={{ $json[\"Last Transcript\"] }}",
            "Last Classification": "={{ $json[\"Last Classification\"] }}",
            "Recording URL": "={{ $json.recordingUrl }}",
            "Answered At": "={{ $json[\"Answered At\"] }}",
            "Last Called At": "={{ $json.now }}"
          },
          "matchingColumns": [
            "Phone Number"
          ],
          "schema": [
            {
              "id": "Phone Number",
              "displayName": "Phone Number",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Status",
              "displayName": "Status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Answered In Slot",
              "displayName": "Answered In Slot",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "8am-10am",
              "displayName": "8am-10am",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "10am-12pm",
              "displayName": "10am-12pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "12pm-2pm",
              "displayName": "12pm-2pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "2pm-4pm",
              "displayName": "2pm-4pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "4pm-6pm",
              "displayName": "4pm-6pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Total Attempts",
              "displayName": "Total Attempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Call ID",
              "displayName": "Last Call ID",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Duration (s)",
              "displayName": "Last Duration (s)",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Transcript",
              "displayName": "Last Transcript",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Classification",
              "displayName": "Last Classification",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Called At",
              "displayName": "Last Called At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Recording URL",
              "displayName": "Recording URL",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Answered At",
              "displayName": "Answered At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        5904,
        -32
      ],
      "id": "fca430b8-d36a-41ba-8b29-328045a34949",
      "name": "Write Results to Numbers Sheet1",
      "alwaysOutputData": false,
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "operation": "update",
        "documentId": {
          "__rl": true,
          "value": "1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI",
          "mode": "list",
          "cachedResultName": "Copy of Phone_Number_Validation_Dashboard - Exclusive Networks",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": 2141969193,
          "mode": "list",
          "cachedResultName": "Numbers",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1hV49ALbkL0CSV1J5jEki0J45ohziRFxI4gww-aUhDRI/edit#gid=2141969193"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Phone Number": "={{ $json[\"Phone Number\"] }}",
            "Status": "={{ $json.Status }}",
            "8am-10am": "={{ $json[\"8am-10am\"] }}",
            "10am-12pm": "={{ $json[\"10am-12pm\"] }}",
            "12pm-2pm": "={{ $json[\"12pm-2pm\"] }}",
            "2pm-4pm": "={{ $json[\"2pm-4pm\"] }}",
            "4pm-6pm": "={{ $json[\"4pm-6pm\"] }}",
            "Total Attempts": "={{ $json[\"Total Attempts\"] }}",
            "Last Call ID": "={{ $json[\"Last Call ID\"] }}",
            "Last Called At": "={{ $json[\"Last Called At\"] }}"
          },
          "matchingColumns": [
            "Phone Number"
          ],
          "schema": [
            {
              "id": "Phone Number",
              "displayName": "Phone Number",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "Status",
              "displayName": "Status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Answered In Slot",
              "displayName": "Answered In Slot",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "8am-10am",
              "displayName": "8am-10am",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "10am-12pm",
              "displayName": "10am-12pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "12pm-2pm",
              "displayName": "12pm-2pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "2pm-4pm",
              "displayName": "2pm-4pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "4pm-6pm",
              "displayName": "4pm-6pm",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Total Attempts",
              "displayName": "Total Attempts",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Call ID",
              "displayName": "Last Call ID",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Last Duration (s)",
              "displayName": "Last Duration (s)",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "Last Transcript",
              "displayName": "Last Transcript",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "Last Classification",
              "displayName": "Last Classification",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "Last Called At",
              "displayName": "Last Called At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "Recording URL",
              "displayName": "Recording URL",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "Answered At",
              "displayName": "Answered At",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        2976,
        224
      ],
      "id": "60ebb7c1-661c-4c30-b323-d04ced811ed8",
      "name": "Update Numbers Sheet Status",
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "ofSXLwCeUOtdtlJR",
          "name": "manymangoes"
        }
      }
    },
    {
      "parameters": {
        "amount": 2
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        5728,
        -32
      ],
      "id": "76988f8f-7fc3-45b3-bc9c-00821c4f0eb2",
      "name": "Wait1",
      "webhookId": "730f88ef-58d0-471b-89e2-d518dab715c6"
    },
    {
      "parameters": {
        "amount": 4
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        5712,
        240
      ],
      "id": "4862fa47-f7c5-475c-9125-470d67f77b64",
      "name": "Wait2",
      "webhookId": "d68de398-43f3-4a0a-9291-cd52b714463c"
    },
    {
      "parameters": {
        "modelId": {
          "__rl": true,
          "value": "gpt-4o-mini",
          "mode": "list",
          "cachedResultName": "GPT-4O-MINI"
        },
        "responses": {
          "values": [
            {
              "content": "=You are a call classification engine. Your only job is to classify a phone call transcript.\n\nINSTRUCTIONS:\n- Analyze ONLY the CALLER's side of the transcript (lines starting with CALLER:)\n- Completely ignore the AGENT's lines — the agent has an audio issue and says \"Hello can you hear me\" on every call regardless of outcome\n- Output ONLY the classification label, nothing else — no explanation, no punctuation, no extra words\n\nCLASSIFICATION RULES:\nHuman Answered     → A real human spoke (greetings, questions, responses like \"yes\", \"who's this\", \"hello\", \"yeah\")\nVoicemail          → An automated personal greeting asking to leave a message, or carrier voicemail prompt\nIVR               → A school, business, or automated phone menu with press 1/2/3 options or directory prompts\nCall Screening     → Google/iPhone screening: \"record your name and reason for calling\", \"I'll see if this person is available\"\nNo Answer          → No CALLER lines at all, or only silence, or call ended with no response\n\nEXAMPLES:\nCALLER: Yeah. Hey, how's it going? Hello? Who's this?\n→ Human Answered\n\nCALLER: Hi, this is Suzanne Kroll. Leave me a message and I'll call you back.\n→ Voicemail\n\nCALLER: The person you're trying to reach is not available. At the tone, please record your message.\n→ Voicemail\n\nCALLER: If you record your name and reason for calling, I'll see if this person is available.\n→ Call Screening\n\nCALLER: For sales press 1. For support press 2. For billing press 3.\n→ IVR\n\nCALLER: The subscriber you have called is not available. Please leave a message after the tone.\n→ Voicemail\n\nCALLER: Thank you for calling Perrysburg Schools. If you know your party's extension, dial it at any time.\n→ IVR\n\n(no CALLER lines) \n→ No Answer   CRITICAL RULE: If the transcript contains NO lines starting with \n\"CALLER:\", you MUST output \"No Answer\".\n\nTHIS is the TRANSCRIPT:\n{{ $json['Last Transcript'] }}\nOUTPUT FORMAT:\nRespond with exactly this structure and nothing else:\n\nLast Classification: [classification]\n\nWhere [classification] is exactly one of:\nHuman Answered | Voicemail | IVR/Call Screening | No Answer\n\nCRITICAL RULE: If the transcript contains NO lines starting with \n\"CALLER:\", you MUST output \"No Answer\"."
            }
          ]
        },
        "builtInTools": {},
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "typeVersion": 2.1,
      "position": [
        5072,
        144
      ],
      "id": "cae57f5e-a888-4c50-a4bf-f3fe72ece21b",
      "name": "Classify",
      "credentials": {
        "openAiApi": {
          "id": "ADBOpsreUXGHfz40",
          "name": "OpenAi account 8"
        }
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Read Config",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Read Config": {
      "main": [
        [
          {
            "node": "Extract Config Values",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract Config Values": {
      "main": [
        [
          {
            "node": "Within Calling Hours?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Within Calling Hours?": {
      "main": [
        [
          {
            "node": "Read Numbers Sheet",
            "type": "main",
            "index": 0
          },
          {
            "node": "Read ManyMangos Pick",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Read Numbers Sheet": {
      "main": [
        [
          {
            "node": "Merge",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Read ManyMangos Pick": {
      "main": [
        [
          {
            "node": "Merge",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Sync New Numbers": {
      "main": [
        [
          {
            "node": "If",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split New Contacts": {
      "main": [
        [
          {
            "node": "Append to Numbers Sheet",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Append to Numbers Sheet": {
      "main": [
        [
          {
            "node": "Merge Number Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If": {
      "main": [
        [
          {
            "node": "Split New Contacts",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Merge Number Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge": {
      "main": [
        [
          {
            "node": "Sync New Numbers",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Eligible Numbers": {
      "main": [
        [
          {
            "node": "Has Eligible Numbers?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has Eligible Numbers?": {
      "main": [
        [
          {
            "node": "Batch calling",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge Number Data": {
      "main": [
        [
          {
            "node": "Filter Eligible Numbers",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Mark Numbers In Progress": {
      "main": [
        [
          {
            "node": "Log to Call Log",
            "type": "main",
            "index": 0
          },
          {
            "node": "Update Numbers Sheet Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Log to Call Log": {
      "main": [
        [
          {
            "node": "Merge1",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Wait 5 Min For Batch": {
      "main": [
        [
          {
            "node": "Poll Batch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Batch calling": {
      "main": [
        [
          {
            "node": "Mark Numbers In Progress",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Batch Completed?": {
      "main": [
        [
          {
            "node": "Split Recipients",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Wait 5 More Minutes",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait 5 More Minutes": {
      "main": [
        [
          {
            "node": "Poll Batch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Recipients": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Poll Batch": {
      "main": [
        [
          {
            "node": "Collapse to one",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Collapse to one": {
      "main": [
        [
          {
            "node": "Batch Completed?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Convo details": {
      "main": [
        [
          {
            "node": "Format conversation details",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Over Items": {
      "main": [
        [],
        [
          {
            "node": "Get Convo details",
            "type": "main",
            "index": 0
          },
          {
            "node": "Wait",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format conversation details": {
      "main": [
        [
          {
            "node": "Classify",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Build Final Result1": {
      "main": [
        [
          {
            "node": "Wait1",
            "type": "main",
            "index": 0
          },
          {
            "node": "Wait2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge1": {
      "main": [
        [
          {
            "node": "Wait 5 Min For Batch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Append to Call Log": {
      "main": [
        [
          {
            "node": "Merge2",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Write Results to Numbers Sheet1": {
      "main": [
        [
          {
            "node": "Merge2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Update Numbers Sheet Status": {
      "main": [
        [
          {
            "node": "Merge1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait1": {
      "main": [
        [
          {
            "node": "Write Results to Numbers Sheet1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait2": {
      "main": [
        [
          {
            "node": "Append to Call Log",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Classify": {
      "main": [
        [
          {
            "node": "Build Final Result1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {
    "Schedule Trigger": [
      {
        "timestamp": "2026-05-15T08:25:57.004-04:00",
        "Readable date": "May 15th 2026, 8:25:57 am",
        "Readable time": "8:25:57 am",
        "Day of week": "Friday",
        "Year": "2026",
        "Month": "May",
        "Day of month": "15",
        "Hour": "08",
        "Minute": "25",
        "Second": "57",
        "Timezone": "America/New_York (UTC-04:00)"
      }
    ]
  },
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "b7ff1e69201968833d88d7592a2d50b06ea8540a200afa0538e34cf1a57976ac"
  }
}