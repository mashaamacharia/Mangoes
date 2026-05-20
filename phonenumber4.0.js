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
      "id": "0093aef2-808a-4859-9c5c-99ae013927e2",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.3,
      "position": [
        -6928,
        192
      ]
    },
    {
      "parameters": {
        "documentId": {
          "__rl": true,
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": 1258521478,
          "mode": "list",
          "cachedResultName": "Config",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I/edit#gid=1258521478"
        },
        "options": {}
      },
      "id": "8ba3c5ba-f6e8-49ed-89a4-89bea95500db",
      "name": "Read Config",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        -6656,
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
        "jsCode": "const rows = items.map(i => i.json);\n\nfunction getRow(rows, rowNum) {\n  const r = rows.find(x => x.row_number === rowNum);\n  return r ? (r['col_2'] || r['B'] || '') : '';\n}\n\nconst config = {\n  apiKey:          String(getRow(rows, 4)),\n  assistantId:     String(getRow(rows, 5)),\n  batchSize:       parseInt(getRow(rows, 6))  || 10,\n  maxDuration:     parseInt(getRow(rows, 7))  || 10,\n  concurrentCalls: parseInt(getRow(rows, 8))  || 1,\n  pollIntervalMin: parseInt(getRow(rows, 9))  || 2,\n  maxAttempts:     parseInt(getRow(rows, 10)) || 10,\n  maxPerSlot:      parseInt(getRow(rows, 11)) || 2,\n};\n\nconst callerPhoneRows = rows.filter(r => r.row_number >= 25 && r.row_number <= 34);\nconst callerPhoneNumbers = [];\nconst areaCodeMap = {};\n\nfor (const r of callerPhoneRows) {\n  const label   = String(r['CONFIGURATION'] || r['A'] || '').trim();\n  const phoneNum = String(r['col_2'] || r['B'] || '').trim();\n  const vapiId   = String(r['col_3'] || r['C'] || '').trim();\n  if (!vapiId || !phoneNum) continue;\n  callerPhoneNumbers.push({ label, phoneNumber: phoneNum, vapiPhoneNumberId: vapiId });\n  const digits = phoneNum.replace(/\\D/g, '');\n  const areaCode = digits.length === 11 ? digits.substring(1, 4) : digits.substring(0, 3);\n  if (areaCode) areaCodeMap[areaCode] = vapiId;\n}\n\nconst defaultPhoneNumberId = String(getRow(rows, 12)).trim() ||\n  (callerPhoneNumbers.length > 0 ? callerPhoneNumbers[0].vapiPhoneNumberId : '');\n\nconst now = new Date();\nconst etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });\nconst etDate = new Date(etStr);\nconst etHour = etDate.getHours();\nconst todayDateStr = etDate.getFullYear() + '-' + String(etDate.getMonth()+1).padStart(2,'0') + '-' + String(etDate.getDate()).padStart(2,'0');\n\nconst slots = [\n  { name: '8am-10am',  startHour: 8,  endHour: 10, col: 'D' },\n  { name: '10am-12pm', startHour: 10, endHour: 12, col: 'E' },\n  { name: '12pm-2pm',  startHour: 12, endHour: 14, col: 'F' },\n  { name: '2pm-4pm',   startHour: 14, endHour: 16, col: 'G' },\n  { name: '4pm-6pm',   startHour: 16, endHour: 18, col: 'H' },\n];\n\nconst currentSlot = slots.find(s => etHour >= s.startHour && etHour < s.endHour) || null;\nconst withinHours = currentSlot !== null;\n\nreturn [{ json: { config, currentSlot, todayDateStr, withinHours, callerPhoneNumbers, areaCodeMap, defaultPhoneNumberId } }];"
      },
      "id": "ff4098e6-e756-489a-a589-1ab7df92a146",
      "name": "Extract Config Values",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -6400,
        192
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
      "id": "58d351b5-061a-4580-9ba7-651b4cdf96d3",
      "name": "Within Calling Hours?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        -6112,
        192
      ]
    },
    {
      "parameters": {
        "documentId": {
          "mode": "id",
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I"
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
      "id": "fc4a2254-401b-44cc-a087-5e53f955f051",
      "name": "Read Numbers Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        -5840,
        368
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
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I"
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
      "id": "c3449974-da36-4d57-a129-f46805cae10b",
      "name": "Read ManyMangos Pick",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        -5824,
        0
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
        "jsCode": "const pickItems = $input.all(0).map(i => i.json);\nconst numberItems = $input.all(1).map(i => i.json);\n\nfunction normalise(p) {\n  return String(p || '').trim().replace(/[\\s\\-().+]/g, '');\n}\n\nconst existingNumbers = new Set(numberItems.map(r => normalise(r['Phone Number'])).filter(Boolean));\n\nconst seen = new Set();\nconst newContacts = pickItems.filter(r => {\n  const phone = normalise(r['Mobile Phone Number']);\n  if (!phone) return false;\n  if (existingNumbers.has(phone)) return false;\n  if (seen.has(phone)) return false;\n  seen.add(phone);\n  return true;\n});\n\nreturn [{ json: { newContacts, newCount: newContacts.length } }];"
      },
      "id": "67238c26-6f52-4931-9a67-5a19f9d5a6a8",
      "name": "Sync New Numbers",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -5312,
        192
      ]
    },
    {
      "parameters": {
        "jsCode": "const { newContacts } = items[0].json;\nreturn newContacts.map(c => ({\n  json: {\n    'Phone Number': (() => {\n      const raw = String(c['Mobile Phone Number'] || c['C'] || '').trim();\n      return raw && !raw.startsWith('+') ? '+' + raw : raw;\n    })(),\n    'Status': '', 'Answered In Slot': '', '8am-10am': '', '10am-12pm': '', '12pm-2pm': '', '2pm-4pm': '', '4pm-6pm': '',\n    'Total Attempts': '', 'Last Call ID': '', 'Last Duration (s)': '', 'Last Transcript': '', 'Last Classification': '',\n    'Last Called At': '', 'Recording URL': '', 'Answered At': ''\n  }\n}));"
      },
      "id": "21db9522-fe1b-4a41-8c86-89d192946d42",
      "name": "Split New Contacts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -4880,
        64
      ]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "mode": "id",
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I"
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
      "id": "cd0fa9db-6d23-4e5f-b702-916feda3daea",
      "name": "Append to Numbers Sheet",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        -4688,
        64
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
        -5088,
        192
      ],
      "id": "5fe313ff-0423-4eac-a394-8d6651648dd6",
      "name": "If"
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        -5536,
        192
      ],
      "id": "6eb92891-326a-4aea-8253-e5431f0feda1",
      "name": "Merge"
    },
    {
      "parameters": {
        "jsCode": "const configData = $('Extract Config Values').first().json;\nlet { config, currentSlot, todayDateStr } = configData;\nif (!currentSlot) {\n  currentSlot = { name: '8am-10am', startHour: 8, endHour: 10, col: 'D' };\n}\nconst slotColMap = { 'D': '8am-10am', 'E': '10am-12pm', 'F': '12pm-2pm', 'G': '2pm-4pm', 'H': '4pm-6pm' };\nconst slotHeader = slotColMap[currentSlot.col];\nconst allRows = items.map((item, idx) => ({ ...item.json, _rowIndex: idx + 2 }));\nconst eligible = [];\nconst skipped = { done: 0, calledToday: 0, maxAttempts: 0, slotFull: 0, inProgress: 0 };\nfor (const row of allRows) {\n  const phone = String(row['Phone Number'] || '').trim();\n  if (!phone) continue;\n  const status = String(row['Status'] || '').trim();\n  const totalAttempts = parseInt(row['Total Attempts']) || 0;\n  const slotAttempts = parseInt(row[slotHeader]) || 0;\n  const lastCalledAt = row['Last Called At'] || '';\n  if (['Human Answered', 'Dead', 'Needs Review'].includes(status)) { skipped.done++; continue; }\n  if (status === 'In Progress') { skipped.inProgress++; continue; }\n  if (lastCalledAt) {\n    const lastDate = new Date(lastCalledAt);\n    const lastET = new Date(lastDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));\n    const lastStr = lastET.getFullYear() + '-' + String(lastET.getMonth()+1).padStart(2,'0') + '-' + String(lastET.getDate()).padStart(2,'0');\n    if (lastStr === todayDateStr) { skipped.calledToday++; continue; }\n  }\n  if (totalAttempts >= config.maxAttempts) { skipped.maxAttempts++; continue; }\n  if (slotAttempts >= config.maxPerSlot) { skipped.slotFull++; continue; }\n  if (!['Pending', 'Retry', ''].includes(status)) continue;\n  if (eligible.length < config.batchSize) {\n    const e164Phone = phone.startsWith('+') ? phone : '+' + phone;\n    eligible.push({ phone_number: e164Phone, _rowIndex: row._rowIndex, _totalAttempts: totalAttempts, _slotAttempts: slotAttempts, _slotHeader: slotHeader });\n  }\n}\nreturn [{ json: { eligible, hasEligible: eligible.length > 0, currentSlot, skipped, config, todayDateStr } }];"
      },
      "id": "c39d9c2c-1a24-45f6-982a-a9b4f99e5cff",
      "name": "Filter Eligible Numbers",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -4208,
        208
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
      "id": "1e6f69fd-3cf7-47e3-b354-63270229ea4d",
      "name": "Has Eligible Numbers?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        -4016,
        208
      ]
    },
    {
      "parameters": {
        "jsCode": "const existingItems = $('Read Numbers Sheet').all();\nconst existingData = existingItems.map(i => i.json);\nconst incomingItems = items.map(i => i.json);\nconst hasNewData = incomingItems.some(i => i['Phone Number'] || i['phoneNumber']);\nconst merged = hasNewData ? [...existingData, ...incomingItems] : existingData;\nreturn merged.map(d => ({ json: d }));"
      },
      "id": "be54a1e6-804c-459c-9f4f-d414e847542a",
      "name": "Merge Number Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -4400,
        208
      ]
    },
    {
      "parameters": {
        "jsCode": "// Divide eligible numbers across caller phone numbers (round-robin groups)\n// Each group becomes one Vapi campaign with its own phoneNumberId\n\nconst eligible = $('Filter Eligible Numbers').first().json.eligible || [];\nconst currentSlot = $('Filter Eligible Numbers').first().json.currentSlot;\nconst config = $('Filter Eligible Numbers').first().json.config;\nconst callerPhoneNumbers = $('Extract Config Values').first().json.callerPhoneNumbers || [];\nconst defaultPhoneNumberId = $('Extract Config Values').first().json.defaultPhoneNumberId || '';\n\nif (callerPhoneNumbers.length === 0) {\n  return [{\n    json: {\n      phoneNumberId: defaultPhoneNumberId,\n      customers: eligible.map(e => ({ number: e.phone_number })),\n      eligibleSubset: eligible,\n      currentSlot,\n      config,\n      groupIndex: 0\n    }\n  }];\n}\n\nconst numGroups = callerPhoneNumbers.length;\nconst groups = callerPhoneNumbers.map((caller, idx) => ({\n  phoneNumberId: caller.vapiPhoneNumberId,\n  label: caller.label,\n  customers: [],\n  eligibleSubset: [],\n  groupIndex: idx\n}));\n\neligible.forEach((e, idx) => {\n  const groupIdx = idx % numGroups;\n  groups[groupIdx].customers.push({ number: e.phone_number });\n  groups[groupIdx].eligibleSubset.push(e);\n});\n\nreturn groups\n  .filter(g => g.customers.length > 0)\n  .map(g => ({\n    json: {\n      phoneNumberId: g.phoneNumberId,\n      label: g.label,\n      customers: g.customers,\n      eligibleSubset: g.eligibleSubset,\n      currentSlot,\n      config,\n      groupIndex: g.groupIndex\n    }\n  }));"
      },
      "id": "b1c2d3e4-0001-0000-0000-000000000001",
      "name": "Split Into Campaign Groups",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -3776,
        192
      ]
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "b1c2d3e4-0002-0000-0000-000000000002",
      "name": "Loop Over Campaigns",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        -3520,
        192
      ]
    },
    {
      "parameters": {
        "jsCode": "const batchResponse = $('Batch calling').first().json;\nconst batchId = batchResponse.id;\nconst loopItem = $('Loop Over Campaigns').first().json;\nconst eligible = loopItem.eligibleSubset || $('Filter Eligible Numbers').first().json.eligible;\nconst currentSlot = loopItem.currentSlot || $('Filter Eligible Numbers').first().json.currentSlot;\nconst now = new Date().toISOString();\n\nif (!batchId) throw new Error('No campaign ID returned from Vapi: ' + JSON.stringify(batchResponse));\n\nreturn eligible.map(e => {\n  const phone = String(e.phone_number).replace(/^\\+/, '');\n  return {\n    json: {\n      'Phone Number': phone,\n      phone: phone,\n      batchId,\n      currentSlotName: currentSlot.name,\n      newTotalAttempts: (e._totalAttempts || 0) + 1,\n      now,\n      Status: 'In Progress',\n      '8am-10am':  currentSlot.col === 'D' ? (e._slotAttempts || 0) + 1 : '',\n      '10am-12pm': currentSlot.col === 'E' ? (e._slotAttempts || 0) + 1 : '',\n      '12pm-2pm':  currentSlot.col === 'F' ? (e._slotAttempts || 0) + 1 : '',\n      '2pm-4pm':   currentSlot.col === 'G' ? (e._slotAttempts || 0) + 1 : '',\n      '4pm-6pm':   currentSlot.col === 'H' ? (e._slotAttempts || 0) + 1 : '',\n      'Total Attempts': (e._totalAttempts || 0) + 1,\n      'Last Call ID': batchId,\n      callerPhoneNumberId: e.callerPhoneNumberId || '',\n      'Last Called At': now\n    }\n  };\n});"
      },
      "id": "be5a5538-bf1d-4cf4-ad8e-0d1084c185ff",
      "name": "Mark Numbers In Progress",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -3104,
        208
      ],
      "alwaysOutputData": false
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "mode": "id",
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I"
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
      "id": "80a3ffd2-3fc2-464e-8a75-3aac49a74521",
      "name": "Log to Call Log",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        -2816,
        320
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
      "id": "fad03cf2-2525-49cb-a3a0-3b7ade75d6f1",
      "name": "Wait 5 Min For Batch",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        -2320,
        192
      ],
      "webhookId": "d72a9652-4993-4935-80c8-068a713d1caf"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.vapi.ai/campaign",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "authorization",
              "value": "=Bearer {{ $json.config.apiKey }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"name\": \"ManyMangoes_{{ $json.label }}_batch\",\n  \"assistantId\": \"{{ $json.config.assistantId }}\",\n  \"phoneNumberId\": \"{{ $json.phoneNumberId }}\",\n  \"customers\": {{ JSON.stringify($json.customers) }}\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        -3280,
        208
      ],
      "id": "221d7366-a369-4fc4-99da-8a9e0a890123",
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
              "id": "9866571c-cfce-4f84-a3bd-09013f42a4b8",
              "leftValue": "={{ $json.status }}",
              "rightValue": "ended",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            },
            {
              "id": "a1b2c3d4-0000-0000-0000-000000000001",
              "leftValue": "={{ $json.callsCounterInProgress }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "equals"
              }
            },
            {
              "id": "a1b2c3d4-0000-0000-0000-000000000002",
              "leftValue": "={{ $json.callsCounterQueued }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "7e8efdc7-0149-42fa-8057-c6beb961887b",
      "name": "Batch Completed?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        -1648,
        192
      ]
    },
    {
      "parameters": {
        "amount": 8
      },
      "id": "34b66a3f-d045-4bde-a7a9-368aa6d0f3ec",
      "name": "Wait 5 More Minutes",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        -1408,
        208
      ],
      "webhookId": "4ac73b09-5c15-444f-8f51-28964ca2da31"
    },
    {
      "parameters": {
        "jsCode": "const campaignData = items[0].json;\nconst campaignId = campaignData.id;\nconst apiKey = $('Extract Config Values').first().json.config.apiKey;\nconst maxAttempts = $('Extract Config Values').first().json.config.maxAttempts;\nconst loopItem = $('Loop Over Campaigns').first().json;\nconst eligible = loopItem.eligibleSubset || $('Filter Eligible Numbers').first().json.eligible;\n\nfunction normalisePhone(p) {\n  return String(p || '').replace(/\\D/g, '');\n}\nconst rowLookup = {};\nfor (const e of eligible) {\n  rowLookup[normalisePhone(e.phone_number)] = {\n    _rowIndex: e._rowIndex,\n    _totalAttempts: (e._totalAttempts || 0) + 1\n  };\n}\n\nreturn [{ json: { campaignId, apiKey, maxAttempts, rowLookup, eligible } }];"
      },
      "id": "8c8a64a1-db07-4a47-96ce-15b6a0e09e9d",
      "name": "Split Recipients",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1312,
        0
      ]
    },
    {
      "parameters": {
        "url": "=https://api.vapi.ai/campaign/{{ $('Batch calling').first().json.id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "authorization",
              "value": "=Bearer {{ $('Extract Config Values').first().json.config.apiKey }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        -2096,
        192
      ],
      "id": "3ca0f87e-7e11-40fb-a79c-d25b677ded34",
      "name": "Poll Batch"
    },
    {
      "parameters": {
        "jsCode": "return [items[0]];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1904,
        192
      ],
      "id": "8ca49b7b-ca8f-4664-b8b4-ab081324ce44",
      "name": "Collapse to one"
    },
    {
      "parameters": {
        "url": "=https://api.vapi.ai/call/{{ $json.callId }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "authorization",
              "value": "=Bearer {{ $('Extract Config Values').first().json.config.apiKey }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        -400,
        16
      ],
      "id": "d80bc77f-b47d-4814-8f0b-3cc421bf14f3",
      "name": "Get Convo details"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        -640,
        0
      ],
      "id": "5b4f4a2d-c1b1-4188-8223-7ba12364c21a",
      "name": "Loop Over Items"
    },
    {
      "parameters": {
        "amount": 2
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        -400,
        192
      ],
      "id": "002ec546-dc55-483a-bb74-6a99022f4da4",
      "name": "Wait",
      "webhookId": "5937fe6f-b401-4e26-b4d0-d216cb26e3d4"
    },
    {
      "parameters": {
        "jsCode": "const call = items[0].json;\nconst recipient = $input.first().json;\n\nconst phone = (call.customer?.number || recipient.phone || '').trim();\nconst startedAt = call.startedAt ? new Date(call.startedAt) : null;\nconst endedAt   = call.endedAt   ? new Date(call.endedAt)   : null;\nconst duration  = (startedAt && endedAt) ? Math.round((endedAt - startedAt) / 1000) : 0;\nconst recordingUrl = call.artifact?.recordingUrl || call.artifact?.stereoRecordingUrl || '';\nconst transcriptText = String(call.artifact?.transcript || '').substring(0, 700);\nconst endedReason = String(call.endedReason || '').toLowerCase();\nconst lastCalledAt = call.startedAt || new Date().toISOString();\n\nreturn [{\n  json: {\n    callId: call.id,\n    phone,\n    endedReason,\n    duration,\n    recordingUrl,\n    transcriptText,\n    lastCalledAt,\n    analysis: call.analysis || {},\n    _rowIndex: recipient._rowIndex,\n    _totalAttempts: recipient._totalAttempts,\n    maxAttempts: recipient.maxAttempts,\n    campaignId: recipient.campaignId,\n    'Last Transcript': transcriptText\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -208,
        16
      ],
      "id": "1647a078-ec4c-4dc3-8298-05bd6363511d",
      "name": "Format conversation details"
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "const formatted = $('Format conversation details').item.json;\nconst currentSlot = $('Filter Eligible Numbers').first().json.currentSlot;\nconst maxAttempts = formatted.maxAttempts;\nconst totalAttempts = formatted._totalAttempts;\nconst now = new Date().toISOString();\n\nconst duration = formatted.duration;\nconst recordingUrl = formatted.recordingUrl;\nconst endedReason = formatted.endedReason;\nconst transcriptText = formatted.transcriptText;\n\nconst llmText = $('Classify').item.json?.output?.[0]?.content?.[0]?.text || '';\nconst match = llmText.match(/Last Classification:\\s*(.+)/i);\nconst classification = match ? match[1].trim() : 'No Answer';\n\nlet finalStatus;\nif (classification === 'Human Answered')       finalStatus = 'Human Answered';\nelse if (classification === 'IVR / Automated') finalStatus = 'Dead';\nelse if (totalAttempts >= maxAttempts)         finalStatus = 'Dead';\nelse                                           finalStatus = 'Retry';\n\nconst isHuman  = classification === 'Human Answered';\nconst slotName = currentSlot ? currentSlot.name : '8am-10am';\nconst slotCol  = currentSlot ? currentSlot.col  : 'D';\nconst phone    = (formatted.phone || '').replace(/^\\+/, '');\n\nreturn {\n  json: {\n    'Phone Number': phone, phone,\n    'Status': finalStatus,\n    'Last Duration (s)': duration,\n    'Last Transcript': transcriptText,\n    'Last Classification': classification,\n    'Last Call ID': formatted.callId,\n    'Recording URL': recordingUrl,\n    'Answered At': isHuman ? now : '',\n    'Answered In Slot': isHuman ? slotName : '',\n    '8am-10am': slotCol === 'D' ? totalAttempts : '',\n    '10am-12pm': slotCol === 'E' ? totalAttempts : '',\n    '12pm-2pm': slotCol === 'F' ? totalAttempts : '',\n    '2pm-4pm': slotCol === 'G' ? totalAttempts : '',\n    '4pm-6pm': slotCol === 'H' ? totalAttempts : '',\n    totalAttempts, slotName,\n    campaignId: formatted.campaignId,\n    finalStatus, classification, duration,\n    transcript: transcriptText, recordingUrl, endedReason,\n    now, isHuman,\n    'Last Called At': now\n  }\n};"
      },
      "id": "5d90461d-9719-4153-aae7-62dcb010a307",
      "name": "Build Final Result1",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        320,
        16
      ]
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        -2560,
        192
      ],
      "id": "7bbb5d1c-4f2f-45ab-a1ea-a06bb19f1ebb",
      "name": "Merge1"
    },
    {
      "parameters": {
        "operation": "update",
        "documentId": {
          "__rl": true,
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I",
          "mode": "id",
          "cachedResultName": "Vapi Campaign Sheet"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "id",
          "cachedResultName": "Call Log"
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
      "id": "b5abf4a5-a1bb-4ee4-bb72-2600e41ee1c5",
      "name": "Append to Call Log",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        784,
        128
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
        1072,
        112
      ],
      "id": "a68b7329-6c6e-420e-a052-2952a8dfd480",
      "name": "Merge2"
    },
    {
      "parameters": {
        "operation": "update",
        "documentId": {
          "__rl": true,
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I",
          "mode": "id",
          "cachedResultName": "Vapi Campaign Sheet"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "id",
          "cachedResultName": "Numbers"
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
        752,
        -144
      ],
      "id": "e93f378b-31f6-4659-9c49-1d61e46f43d6",
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
          "value": "1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I",
          "mode": "id",
          "cachedResultName": "Vapi Campaign Sheet"
        },
        "sheetName": {
          "__rl": true,
          "value": 2141969193,
          "mode": "list",
          "cachedResultName": "Numbers",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1vogVrOWPyUQqwsR14qExrOULFmm-sy_-elD3ZNa0h8I/edit#gid=2141969193"
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
              "canBeUsedToMatch": true,
              "removed": false
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
            },
            {
              "id": "row_number",
              "displayName": "row_number",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "readOnly": true,
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
        -2816,
        64
      ],
      "id": "866cbbaa-14d8-4100-ac99-5bc86705a6ca",
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
        544,
        -144
      ],
      "id": "d2957cb0-f9af-4775-900b-04af9406840d",
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
        576,
        128
      ],
      "id": "6c0db2fb-1718-482f-8fab-644826a6dcfc",
      "name": "Wait2",
      "webhookId": "d68de398-43f3-4a0a-9291-cd52b714463c"
    },
    {
      "parameters": {
        "modelId": {
          "__rl": true,
          "value": "claude-haiku-4-5-20251001",
          "mode": "list",
          "cachedResultName": "claude-haiku-4-5-20251001"
        },
        "messages": {
          "values": [
            {
              "content": "=You are a call classification engine. Your only job is to classify a phone call transcript.\n\nINSTRUCTIONS:\n- Analyze ONLY the CALLER's side of the transcript (lines starting with CALLER:)\n- Completely ignore the AGENT's lines — the agent has an audio issue and says \"Hello can you hear me\" on every call regardless of outcome\n- Output ONLY the classification label, nothing else — no explanation, no punctuation, no extra words\n\nCLASSIFICATION RULES:\nHuman Answered     → A real human spoke (greetings, questions, responses like \"yes\", \"who's this\", \"hello\", \"yeah\")\nVoicemail          → An automated personal greeting asking to leave a message, or carrier voicemail prompt\nIVR               → A school, business, or automated phone menu with press 1/2/3 options or directory prompts\nCall Screening     → Google/iPhone screening: \"record your name and reason for calling\", \"I'll see if this person is available\"\nNo Answer          → No CALLER lines at all, or only silence, or call ended with no response\n\nEXAMPLES:\nCALLER: Yeah. Hey, how's it going? Hello? Who's this?\n→ Human Answered\n\nCALLER: Hi, this is Suzanne Kroll. Leave me a message and I'll call you back.\n→ Voicemail\n\nCALLER: The person you're trying to reach is not available. At the tone, please record your message.\n→ Voicemail\n\nCALLER: If you record your name and reason for calling, I'll see if this person is available.\n→ Call Screening\n\nCALLER: For sales press 1. For support press 2. For billing press 3.\n→ IVR\n\nCALLER: The subscriber you have called is not available. Please leave a message after the tone.\n→ Voicemail\n\nCALLER: Thank you for calling Perrysburg Schools. If you know your party's extension, dial it at any time.\n→ IVR\n\n(no CALLER lines) \n→ No Answer   CRITICAL RULE: If the transcript contains NO lines starting with \n\"CALLER:\", you MUST output \"No Answer\".\n\nTHIS is the TRANSCRIPT:\n{{ $json['Last Transcript'] }}\nOUTPUT FORMAT:\nLast Classification: <label>"
            }
          ]
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.anthropic",
      "typeVersion": 1,
      "position": [
        -16,
        16
      ],
      "id": "1abc6d2f-db3f-4784-87c7-5789f80135ae",
      "name": "Classify",
      "credentials": {
        "anthropicApi": {
          "id": "bYMWBIfYEauc3HuQ",
          "name": "Anthropic account 3"
        }
      }
    },
    {
      "parameters": {
        "url": "=https://api.vapi.ai/v2/call",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "campaignId",
              "value": "={{ $json.campaignId }}"
            },
            {
              "name": "limit",
              "value": "1000"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "authorization",
              "value": "=Bearer {{ $json.apiKey }}"
            }
          ]
        },
        "options": {}
      },
      "id": "a1b2c3d4-cafe-0001-0000-000000000010",
      "name": "List Campaign Calls",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        -1120,
        0
      ]
    },
    {
      "parameters": {
        "jsCode": "const responseData = items[0].json;\nconst calls = responseData.results || responseData || [];\nconst maxAttempts = $('Split Recipients').first().json.maxAttempts;\nconst rowLookup = $('Split Recipients').first().json.rowLookup || {};\nconst eligible = $('Split Recipients').first().json.eligible || [];\n\nfunction normalisePhone(p) {\n  return String(p || '').replace(/\\D/g, '');\n}\n\nconst eligiblePhones = new Set(eligible.map(e => normalisePhone(e.phone_number)));\n\nreturn calls\n  .filter(c => c.id && c.customer?.number)\n  .filter(c => eligiblePhones.has(normalisePhone(c.customer.number)))\n  .map(c => {\n    const normPhone = normalisePhone(c.customer.number);\n    const rowData = rowLookup[normPhone] || {};\n    return {\n      json: {\n        callId: c.id,\n        phone: c.customer.number,\n        campaignId: $('Split Recipients').first().json.campaignId,\n        maxAttempts,\n        _rowIndex: rowData._rowIndex,\n        _totalAttempts: rowData._totalAttempts || 1\n      }\n    };\n  });"
      },
      "id": "a1b2c3d4-cafe-0002-0000-000000000011",
      "name": "Split Call Items",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -912,
        0
      ]
    },
    {
      "parameters": {
        "content": "Option B — Multiple campaigns per batch run (true round-robin)\n- Split the 10 eligible leads into groups, one campaign per caller number\n- e.g. if you have 10 leads and 10 numbers → 10 campaigns of 1 lead each\n- Or if batch=50 and 10 numbers → 10 campaigns of 5 leads each\n- Each campaign uses a different phoneNumberId\n- This is the only way to actually distribute calls across numbers in a single run",
        "height": 272,
        "width": 1168
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -3104,
        -400
      ],
      "id": "06c5b65e-1f87-4012-995d-966109700ef6",
      "name": "Sticky Note"
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
            "node": "Split Into Campaign Groups",
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
    "Split Into Campaign Groups": {
      "main": [
        [
          {
            "node": "Loop Over Campaigns",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Over Campaigns": {
      "main": [
        [],
        [
          {
            "node": "Batch calling",
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
            "node": "List Campaign Calls",
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
    "Merge2": {
      "main": [
        [
          {
            "node": "Loop Over Campaigns",
            "type": "main",
            "index": 0
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
    },
    "List Campaign Calls": {
      "main": [
        [
          {
            "node": "Split Call Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Call Items": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {
    "Batch calling": [
      {
        "id": "1f092b2a-7bc6-4dfc-b2fb-6f15da17e162",
        "orgId": "9d9772f3-9eb6-4d88-a410-1b90f2fd7280",
        "name": "ManyMangoes_Michigan_batch",
        "assistantId": "93c9c55d-6338-4fc2-af33-62a72e7ccfe3",
        "phoneNumberId": "99529619-e612-4a78-9d35-b1e8cc26342a",
        "customers": [
          {
            "number": "+17325228751"
          }
        ],
        "status": "scheduled",
        "createdAt": "2026-05-20T15:24:47.287Z",
        "updatedAt": "2026-05-20T15:24:47.287Z",
        "callsCounterEnded": 0,
        "callsCounterScheduled": 0,
        "callsCounterQueued": 0,
        "callsCounterInProgress": 0,
        "callsCounterEndedVoicemail": 0
      }
    ]
  },
  "meta": {
    "instanceId": "b7ff1e69201968833d88d7592a2d50b06ea8540a200afa0538e34cf1a57976ac"
  }
}