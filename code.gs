/**
 * ECHOES OF HOPE - COMPLETE BACKEND
 * Includes Web App API + Form Trigger Logic
 */

const CONFIG = {
  EMAIL_COUNSELOR: 'CounselorEmail@College.edu', 
  DISTRESS_KEYWORDS: [
    'hurt', 'end', 'suicide', 'hopeless', 'drowning', 'suffocating', 
    'alone', 'trapped', 'despair', 'broken', 'vanish', "can't go on", 'goodbye'
  ]
};

// --- WEB APP HANDLERS ---

function doGet(e) {
  const action = e.parameter.action || "getData";
  
  try {
    if (action === "getData") {
      const data = {
        hopeCount: getHopeCount(),
        whispers: getForumData()
      };
      return createJsonResponse(data);
    }
    
    // Fallback for simple check
    return ContentService.createTextOutput("Echoes of Hope API Active");
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === "postReply") {
      const result = postReply(data.parentId, data.facultyName, data.text);
      return createJsonResponse(result);
    }
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- TRIGGER: ON FORM SUBMIT ---

function onFormSubmit(e) {
  // If e is undefined (running manually), skip or handle gracefully
  if (!e) {
    console.log("No event object. This function must be run by a Trigger.");
    return;
  }
  
  // 1. Parse Responses
  // Note: On "Spreadsheet Form Submit", e.values is an array of strings. 
  // e.namedValues is an object.
  // BUT the original code used e.response (FormResponse). 
  // "From Spreadsheet" trigger gives e.values. "From Form" trigger gives e.response.
  // We will support BOTH methods to be safe.
  
  let textOnHeart = "";
  let innerLightScore = 0;
  let journeyTags = [];
  let contactInfo = "";
  
  // Method A: From Form (e.response exists)
  if (e.response) {
    const responses = e.response.getItemResponses();
    responses.forEach(r => {
      const title = r.getItem().getTitle();
      const answer = r.getResponse();
      if (title.includes("What's on your heart") || title.includes("whisper one thing")) textOnHeart = answer;
      if (title.includes("inner light")) innerLightScore = parseInt(answer);
      if (title.includes("Tag your current journey")) journeyTags = Array.isArray(answer) ? answer.join(", ") : answer;
      if (title.includes("Guiding Hand")) contactInfo = answer;
    });
  } 
  // Method B: From Spreadsheet (e.namedValues exists)
  else if (e.namedValues) {
    // Keys match Question Titles
    textOnHeart = e.namedValues["What's on your heart today?"] ? e.namedValues["What's on your heart today?"][0] : "";
    if (!textOnHeart) {
       Object.keys(e.namedValues).forEach(key => {
         if (key.includes("whisper one thing")) textOnHeart = e.namedValues[key][0];
       });
    }
    innerLightScore = e.namedValues["How bright is your inner light right now?"] ? parseInt(e.namedValues["How bright is your inner light right now?"][0]) : 0;
    journeyTags = e.namedValues["Tag your current journey"] ? e.namedValues["Tag your current journey"][0] : "";
    contactInfo = e.namedValues["A Guiding Hand (Optional)"] ? e.namedValues["A Guiding Hand (Optional)"][0] : "";
  }

  // 2. Generate PostID
  const uniqueId = "WHISPER_" +  Math.floor(Math.random() * 10000) + "_" + new Date().getTime().toString().slice(-4);
  const timestamp = new Date();

  // 3. Safety Scan
  const distressDetected = detectDistress(textOnHeart);
  let status = "Awaiting Light";
  
  if (distressDetected) {
    status = "URGENT_HIDDEN"; 
    sendUrgentAlert(uniqueId, textOnHeart, contactInfo);
  }

  // 4. Insert into 'Whispers' Tab
  // Using HARDCODED ID to ensure connection
  const ss = SpreadsheetApp.openById("1zMo8QYFWtrGCaYJ1ljccvh4TslxpCRhjiq2E-RguFnE");
  const whisperSheet = ss.getSheetByName("Whispers");
  
  if (whisperSheet) {
    whisperSheet.appendRow([
      uniqueId,
      timestamp,
      textOnHeart,
      innerLightScore,
      journeyTags,
      status,
      contactInfo
    ]);
  }
}

function detectDistress(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return CONFIG.DISTRESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function sendUrgentAlert(id, text, contact) {
  MailApp.sendEmail({
    to: CONFIG.EMAIL_COUNSELOR,
    subject: `URGENT LIFELINE ALERT (ID: ${id})`,
    body: `Distress detected in submission ${id}.\n\nContent: "${text}"\nContact: ${contact}\n\nThis post is HIDDEN from the public wall.`
  });
}

// --- DB HELPERS ---

function getHopeCount() {
  const ss = SpreadsheetApp.openById("1zMo8QYFWtrGCaYJ1ljccvh4TslxpCRhjiq2E-RguFnE");
  const statsSheet = ss.getSheetByName("Global_Stats");
  if (!statsSheet) return 0;
  return statsSheet.getRange("B2").getValue();
}

function getForumData() {
  const ss = SpreadsheetApp.openById("1zMo8QYFWtrGCaYJ1ljccvh4TslxpCRhjiq2E-RguFnE");
  const whisperSheet = ss.getSheetByName("Whispers");
  const threadSheet = ss.getSheetByName("Guidance_Threads");
  if (!whisperSheet || !threadSheet) return [];
  
  const wData = whisperSheet.getDataRange().getValues();
  const whispers = [];
  
  for (let i = 1; i < wData.length; i++) {
    const row = wData[i];
    if (row[5] !== "URGENT_HIDDEN" && row[5] !== "Hidden") { 
      whispers.push({
        id: row[0],
        timestamp: row[1],
        content: row[2],
        light: row[3],
        tag: row[4],
        comments: []
      });
    }
  }
  
  const tData = threadSheet.getDataRange().getValues();
  for (let i = 1; i < tData.length; i++) {
    const row = tData[i];
    const parentId = row[1];
    const parent = whispers.find(w => w.id === parentId);
    if (parent) {
      parent.comments.push({
        author: row[2],
        text: row[3],
        time: row[4]
      });
    }
  }
  return whispers.reverse();
}

function postReply(parentId, facultyName, text) {
  const ss = SpreadsheetApp.openById("1zMo8QYFWtrGCaYJ1ljccvh4TslxpCRhjiq2E-RguFnE");
  const threadSheet = ss.getSheetByName("Guidance_Threads");
  const statsSheet = ss.getSheetByName("Global_Stats");
  const whisperSheet = ss.getSheetByName("Whispers");

  const commentId = "COM_" + new Date().getTime();
  threadSheet.appendRow([commentId, parentId, facultyName, text, new Date()]);
  
  const countCell = statsSheet.getRange("B2");
  const currentCount = countCell.getValue();
  countCell.setValue(currentCount + 1);
  
  const wData = whisperSheet.getDataRange().getValues();
  for (let i = 1; i < wData.length; i++) {
    if (wData[i][0] === parentId) {
      whisperSheet.getRange(i + 1, 6).setValue("Supported");
      break;
    }
  }
  
  return { success: true, newCount: currentCount + 1 };
}