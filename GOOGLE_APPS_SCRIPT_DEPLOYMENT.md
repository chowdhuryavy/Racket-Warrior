# 🚀 Google Apps Script Deployment Guide

## ⚠️ CRITICAL: This must be done to fix CORS errors!

### Step 1: Open Your Google Apps Script Project

1. Go to: https://script.google.com/
2. Open your existing project or create a new one
3. **IMPORTANT**: Make sure you're using the same project that generated this URL:
   ```
   https://script.google.com/macros/s/AKfycbyv8UCgWkR_TL7H3ChH2ku76bk9NzfhyvfR79WD2Q28uImnzbhOSWlpzHvY9-mfCX35IQ/exec
   ```

### Step 2: Replace ALL Code

1. **Delete all existing code** in your Google Apps Script
2. **Copy the ENTIRE contents** of `gas-backend.gs` file
3. **Paste it** into your Google Apps Script editor
4. **Save** the project (Ctrl+S)

### Step 3: Verify CORS Functions Are Present

Make sure these functions exist in your code:

```javascript
// Handle CORS preflight requests
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
```

And in doPost function, the return should have headers:
```javascript
return ContentService
  .createTextOutput(JSON.stringify(response))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
```

### Step 4: Deploy as Web App

1. **Click "Deploy"** → **"New deployment"**
2. **Settings**:
   - Type: **Web app**
   - Execute as: **Me (your email)**
   - Who has access: **Anyone**
3. **Click "Deploy"**
4. **Copy the Web App URL** (should be the same as your current one)
5. **Click "Done"**

### Step 5: Test Deployment

1. Open your browser console
2. Test the deployment with this command:
```javascript
fetch('https://script.google.com/macros/s/AKfycbyv8UCgWkR_TL7H3ChH2ku76bk9NzfhyvfR79WD2Q28uImnzbhOSWlpzHvY9-mfCX35IQ/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'test' })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
```

### Step 6: Verify Google Sheets Setup

Your Google Sheet should have these tabs with exact headers:

**Users Sheet:**
```
A: email
B: password  
C: role
D: name
E: needs_password_change
F: created_at
G: last_login
H: status
I: resetToken
J: resetTokenExpiry
```

**Sample User Row:**
```
A: admin@gym.com
B: [HASHED_PASSWORD - use password-hasher.html]
C: admin
D: Administrator  
E: FALSE
F: 2024-01-01T00:00:00.000Z
G: 
H: active
I: 
J: 
```

### Step 7: Update Spreadsheet ID (if needed)

In your Google Apps Script, make sure this line has YOUR spreadsheet ID:
```javascript
const SPREADSHEET_ID = '1zJHUpcWaOBhKCzHS-uGPqaJepv_eZm019ElKtt249fg';
```

To find your spreadsheet ID:
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the ID from the URL

## 🔍 Troubleshooting

### If you still get CORS errors:
1. Make sure you deployed with the updated code
2. Try creating a NEW deployment instead of updating existing one
3. Wait 2-3 minutes after deployment
4. Clear browser cache

### If you get "Invalid credentials":
1. Use `password-hasher.html` to generate correct password hash
2. Make sure user status is "active"
3. Check that email matches exactly

### If you get "Script not found":
1. Make sure the URL in your code matches the deployed URL
2. Check that the deployment is set to "Anyone" access

## 🎯 Final Test

Once deployed correctly, you should be able to:
1. Open `standalone-fixed.html` 
2. Enter your credentials
3. Login successfully without CORS errors

**The key is that BOTH `doOptions` AND `doPost` functions must have CORS headers!**