/**
 * Setup Script for Echoes of Hope - Seed of Thought
 * Run the 'setupEchoesOfHope' function ONCE to initialize the project.
 */

function setupEchoesOfHope() {
  // 1. Create the Form
  const form = FormApp.create('Seed of Thought');
  form.setDescription('Messages from the heart. \n"You are seen. You are heard. This space holds your thoughts gently."')
      .setConfirmationMessage('Your seed has been planted. It will be nurtured here. Thank you for sharing.')
      .setProgressBar(true);

  // 2. Add Questions
  
  // Section 1: Intro
  // Note: We can't fully control the "Visual Design" (gradients/stars) via script, 
  // but we set the text tone. User must manually apply a theme.
  
  // Question: What's on your heart today?
  const qHeart = form.addParagraphTextItem();
  qHeart.setTitle("What's on your heart today?")
        .setHelpText("Share any cloud, however small, or any flicker of hope you're holding onto. This is your safe space to simply be. (No names, just thoughts.)")
        .setRequired(true);

  // Question: How bright is your inner light right now?
  // Using a Scale Item (1-5) as close approximation to "Emoji Slider"
  // Custom emojis in labels help.
  const qLight = form.addScaleItem();
  qLight.setTitle("How bright is your inner light right now?")
        .setHelpText("It's okay for the light to dim sometimes. We're here to help it shine again.")
        .setBounds(1, 5)
        .setLabels("🕯️ Just a Glow...", "🌟 Shining Bright!");

  // Question: Tag your current journey
  const qJourney = form.addCheckboxItem();
  qJourney.setTitle("Tag your current journey")
          .setChoices([
            qJourney.createChoice("✨ Discovering My Path"),
            qJourney.createChoice("📚 Navigating Academics"),
            qJourney.createChoice("🤝 Connecting with Others"),
            qJourney.createChoice("💡 Seeking Inspiration"),
            qJourney.createChoice("🚀 Feeling Overwhelmed"),
            qJourney.createChoice("🌱 Growing Pains"),
            qJourney.createChoice("☁️ A Bit Cloudy")
          ]);

  // Question: A Guiding Hand (Optional)
  const qHand = form.addTextItem();
  qHand.setTitle("A Guiding Hand (Optional)")
       .setHelpText("If you'd like a kind soul to gently reach out, you may share a way to connect here. This is completely optional and always private.");

  // 3. Create/Link Spreadsheet
  const ss = SpreadsheetApp.create("Echoes of Hope - Garden Keeper's Journal");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  // 4. Log URLs
  Logger.log('Form Created: ' + form.getEditUrl());
  Logger.log('Published Form URL: ' + form.getPublishedUrl());
  Logger.log('Spreadsheet Created: ' + ss.getUrl());
  
  // 5. Setup Dashboard in Spreadsheet (Basic)
  setupDashboard(ss);
}

function setupDashboard(ss) {
  // We'll wait for the form input to create the specific "Form Responses 1" sheet,
  // but we can prepare the "Dashboard" sheet.
  let dashboardSheet = ss.getSheetByName("Dashboard");
  if (!dashboardSheet) {
    dashboardSheet = ss.insertSheet("Dashboard");
  }

  // Set headers for Dashboard (mockup for now, data fills later)
  dashboardSheet.getRange("A1").setValue("Garden Overview");
  dashboardSheet.getRange("A3").setValue("Total Seeds Planted");
  dashboardSheet.getRange("B3").setValue("Average Light");
  
  // Instructions
  dashboardSheet.getRange("A10").setValue("Instructions: Verify 'Form Responses 1' is linked.");
}
