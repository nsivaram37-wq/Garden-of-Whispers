function setupDatabase() {
  const ss = SpreadsheetApp.openById("1zMo8QYFWtrGCaYJ1ljccvh4TslxpCRhjiq2E-RguFnE");
  
  // 1. Create Whispers Sheet
  let whisperSheet = ss.getSheetByName("Whispers");
  if (!whisperSheet) {
    whisperSheet = ss.insertSheet("Whispers");
    whisperSheet.appendRow(["ID", "Timestamp", "Content", "Light Score", "Tags", "Status", "Contact Info"]);
    whisperSheet.setFrozenRows(1);
  }
  
  // 2. Create Global_Stats Sheet
  let statsSheet = ss.getSheetByName("Global_Stats");
  if (!statsSheet) {
    statsSheet = ss.insertSheet("Global_Stats");
    statsSheet.appendRow(["Metric", "Value"]);
    statsSheet.appendRow(["Total Hope Count", 0]);
  }
  
  // 3. Create Guidance_Threads Sheet (for comments)
  let threadSheet = ss.getSheetByName("Guidance_Threads");
  if (!threadSheet) {
    threadSheet = ss.insertSheet("Guidance_Threads");
    threadSheet.appendRow(["CommentID", "ParentID", "Author", "Text", "Timestamp"]);
    threadSheet.setFrozenRows(1);
  }
  
  Logger.log("Database Setup Complete!");
}
