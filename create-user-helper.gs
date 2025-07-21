// Helper script to create your first user
// Run this once in Google Apps Script to get hashed password

function createHashedPassword() {
  const password = "YourPassword123!"; // Replace with your desired password
  const hashedPassword = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
  
  console.log("Original password: " + password);
  console.log("Hashed password: " + hashedPassword);
  console.log("Copy the hashed password to your Google Sheet Users tab");
}

// Run this to create your first admin user
function createFirstUser() {
  const SPREADSHEET_ID = '1zJHUpcWaOBhKCzHS-uGPqaJepv_eZm019ElKtt249fg'; // Your sheet ID
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    console.error("Users sheet not found. Please create it first.");
    return;
  }
  
  const email = "admin@gym.com"; // Replace with your email
  const password = "Admin123!"; // Replace with your password
  const hashedPassword = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
  const currentTime = new Date().toISOString();
  
  // Add headers if sheet is empty
  if (usersSheet.getLastRow() === 0) {
    usersSheet.getRange(1, 1, 1, 10).setValues([[
      'email', 'password', 'role', 'name', 'needs_password_change', 
      'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry'
    ]]);
  }
  
  // Add user
  usersSheet.appendRow([
    email,
    hashedPassword,
    'admin',
    'Administrator',
    false,
    currentTime,
    '',
    'active',
    '',
    ''
  ]);
  
  console.log("User created successfully!");
  console.log("Email: " + email);
  console.log("Password: " + password);
  console.log("You can now login with these credentials.");
}