/**
 * Garden Keeper's Journal - Dashboard Setup
 * Run 'setupJournalDashboard' to format the sheet after linked to Form.
 */

function setupJournalDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Ensure we have the Dashboard sheet
  let dashboardSheet = ss.getSheetByName("Dashboard");
  if (!dashboardSheet) {
    dashboardSheet = ss.insertSheet("Dashboard");
  }
  
  // Locate Responses Sheet (usually "Form Responses 1")
  const responseSheet = ss.getSheets()[0]; // Assumption: First sheet
  
  // 1. Conditional Formatting on Response Sheet
  setupConditionalFormatting(responseSheet);
  
  // 2. Vibe Constellation Heatmap (Pivot Table)
  // Note: PivotTable creation via script is complex. 
  // We will set up a summary table manually with formulas for robustness.
  setupVibeHeatmap(dashboardSheet, responseSheet.getName());
  
  // 3. Inner Light Trend (Chart)
  setupLightTrendChart(dashboardSheet, responseSheet.getName());
  
  // 4. Response Status Tracker
  setupResponseTracker(responseSheet);
}

function setupConditionalFormatting(sheet) {
  // Clear old rules
  sheet.clearConditionalFormatRules();
  
  const rules = [];
  
  // Column J is where we put tags in 'brain.gs' (Label Column)
  // Let's assume Column J for tags
  const range = sheet.getRange("A:Z"); 
  
  // Rule 1: URGENT (Label = "URGENT LIFELINE ALERT")
  // Using Custom Formula to highlight the whole row based on Col J value
  const ruleUrgent = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J1="URGENT LIFELINE ALERT"')
    .setBackground("#FFCDD2") // Red-ish
    .setRanges([range])
    .build();
  rules.push(ruleUrgent);
  
  // Rule 2: Gentle Nudge
  const ruleNudge = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J1="Gentle Nudge Needed"')
    .setBackground("#FFE0B2") // Orange-ish
    .setRanges([range])
    .build();
  rules.push(ruleNudge);
  
  // Rule 3: Brightness
  const ruleBright = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$J1="Moment of Brightness"')
    .setBackground("#C8E6C9") // Green-ish
    .setRanges([range])
    .build();
  rules.push(ruleBright);
  
  // Rule 4: Unanswered Needs Attention (Amber)
  // Logic: If (Urgent OR Nudge) AND (Response Column Empty) AND (Timestamp > 12h ago)
  // This is complex for basic CF formula. Simplified: If Tagged AND No Response -> Amber Text
  // Let's assume Column K is "Faculty Response"
  const ruleUnanswered = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(OR($J1="URGENT LIFELINE ALERT",$J1="Gentle Nudge Needed"), ISBLANK($K1))')
    .setFontColor("#E65100") 
    .setBold(true)
    .setRanges([range])
    .build();
  rules.push(ruleUnanswered);
  
  sheet.setConditionalFormatRules(rules);
}

function setupVibeHeatmap(sheet, sourceSheetName) {
  // Create a summary area
  sheet.getRange("A5").setValue("Vibe Constellation (Tag Counts)");
  sheet.getRange("A5").setFontWeight("bold").setFontSize(14);
  
  // Headers
  const tags = [
    "✨ Discovering My Path", "📚 Navigating Academics", "🤝 Connecting with Others",
    "💡 Seeking Inspiration", "🚀 Feeling Overwhelmed", "🌱 Growing Pains", "☁️ A Bit Cloudy"
  ];
  
  tags.forEach((tag, i) => {
    sheet.getRange(6 + i, 1).setValue(tag);
    // Formula to count occurrences in the response sheet (Column D usually for checkboxes)
    // COUNTIF using wildcards because checkboxes store "Tag1, Tag2"
    sheet.getRange(6 + i, 2).setFormula(`=COUNTIF('${sourceSheetName}'!D:D, "*"&A${6+i}&"*")`);
  });
}

function setupLightTrendChart(sheet, sourceSheetName) {
  // Add a Chart for Inner Light (Column C usually)
  // We need a helper column for "Date" and "Average Light" to graph nicely.
  // For simplicity, we'll graph the raw data points of the last 100 entries.
  
  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(sheet.getRange(`'${sourceSheetName}'!C2:C100`)) // Inner Light Scores
    .setPosition(5, 4, 0, 0)
    .setOption('title', 'Inner Light Trend (Last 100 Entries)')
    .setOption('vAxis.title', 'Light Level (1-5)')
    .build();
    
  sheet.insertChart(chart);
}

function setupResponseTracker(responseSheet) {
  // Add Header for Responses if not exists
  responseSheet.getRange("K1").setValue("Faculty Response");
  responseSheet.getRange("L1").setValue("Response Status");
  
  // We can't auto-update status to "Responded" via just setup script easily without 'onEdit' trigger.
  // But we can set a formula in L to check K.
  // L2 Formula: =IF(NOT(ISBLANK(K2)), "Responded", "Pending")
  responseSheet.getRange("L2").setFormula('=IF(NOT(ISBLANK(K2)), "Responded", "Pending")');
  // Drag down logic would need an onFormSubmit to copy formula, or ArrayFormula in L1.
  responseSheet.getRange("L2").setFormula('=ARRAYFORMULA(IF(ROW(A2:A)=1,"Response Status", IF(NOT(ISBLANK(K2:K)), "Responded", "")))');
}
