# 🚨 EXACT CORS FIX - Do This NOW

## The Problem
Your Google Apps Script is missing the `doOptions` function. Without this, CORS will NEVER work.

## The Solution - Copy This EXACT Code

### Step 1: Open Your Google Apps Script
- Go to: https://script.google.com/
- Open the project with URL ending in: `...3iTmeK2MxQ/exec`

### Step 2: DELETE ALL CODE and Replace with This

```javascript
// Google Apps Script Backend for Gym Management System
const SPREADSHEET_ID = '1zJHUpcWaOBhKCzHS-uGPqaJepv_eZm019ElKtt249fg';

// CRITICAL: This function MUST exist for CORS to work
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// Main handler function
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    let response;
    
    switch (action) {
      case 'login':
        response = handleLogin(requestData);
        break;
      default:
        response = { success: false, message: 'Unknown action' };
    }
    
    // CRITICAL: Response MUST have CORS headers
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

// Login handler
function handleLogin(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    const users = usersSheet.getDataRange().getValues();
    const headers = users[0];
    
    // Find user
    for (let i = 1; i < users.length; i++) {
      const row = users[i];
      const email = row[0]; // Assuming email is in column A
      const password = row[1]; // Assuming password is in column B
      const role = row[2]; // Assuming role is in column C
      const status = row[7]; // Assuming status is in column H
      
      if (email === data.email && status === 'active') {
        // Hash the input password to compare
        const hashedInput = Utilities.base64Encode(
          Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data.password)
        );
        
        if (password === hashedInput) {
          return {
            success: true,
            message: 'Login successful',
            user: {
              email: email,
              role: role,
              name: row[3] // Assuming name is in column D
            }
          };
        }
      }
    }
    
    return { success: false, message: 'Invalid credentials' };
    
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed: ' + error.toString() };
  }
}
```

### Step 3: Save and Deploy
1. Save the code (Ctrl+S)
2. Click "Deploy" → "New deployment"
3. Type: Web app
4. Execute as: Me
5. Who has access: Anyone
6. Click "Deploy"

### Step 4: Test CORS
Run this in browser console:
```javascript
fetch('https://script.google.com/macros/s/AKfycbwJy_ti8Ficp8R_TYV6V9f0r6T9R-GPrjIfsvokiDUEo7fcmkopDbcBp1me3iTmeK2MxQ/exec', {
  method: 'OPTIONS'
}).then(r => console.log('CORS:', r.headers.get('access-control-allow-origin')))
```

**If it returns `*` then CORS is working!**

## Why This Keeps Failing

You're deploying WITHOUT the `doOptions` function. This function is MANDATORY for CORS preflight requests.

**The key is: BOTH `doOptions` AND `doPost` must have CORS headers!**