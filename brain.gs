/**
 * The Brain v2 - Relational Logic
 * Distributes Form Responses to the 'Whispers' relational table.
 */

const CONFIG = {
  EMAIL_COUNSELOR: 'CounselorEmail@College.edu', 
  DISTRESS_KEYWORDS: [
    'hurt', 'end', 'suicide', 'hopeless', 'drowning', 'suffocating', 
    'alone', 'trapped', 'despair', 'broken', 'vanish', "can't go on", 'goodbye'
  ]
};

/**
 * Trigger: On Form Submit
 * This processes the raw form response and inserts it into our 'Whispers' DB tab.
 */
function onFormSubmit(e) {
  if (!e) return; 
  
  const responses = e.response.getItemResponses();
  let textOnHeart = "";
  let innerLightScore = 0;
  let journeyTags = [];
  let contactInfo = "";
  
  responses.forEach(r => {
    const title = r.getItem().getTitle();
    const answer = r.getResponse();
    
    if (title.includes("What's on your heart")) textOnHeart = answer;
    if (title.includes("inner light")) innerLightScore = parseInt(answer);
    if (title.includes("Tag your current journey")) journeyTags = Array.isArray(answer) ? answer.join(", ") : answer;
    if (title.includes("Guiding Hand")) contactInfo = answer;
  });

  // 1. Generate PostID
  const uniqueId = "WHISPER_" +  Math.floor(Math.random() * 10000) + "_" + new Date().getTime().toString().slice(-4);
  const timestamp = new Date();

  // 2. Safety Scan
  const distressDetected = detectDistress(textOnHeart);
  let status = "Awaiting Light";
  
  if (distressDetected) {
    status = "URGENT_HIDDEN"; // Do not show on public wall
    sendUrgentAlert(uniqueId, textOnHeart, contactInfo);
  }

  // 3. Insert into 'Whispers' Tab
  const ss = SpreadsheetApp.openById(e.source.getId());
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
