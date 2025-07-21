// SIMPLE CORS TEST - Copy this EXACTLY to your Google Apps Script
// This will prove if CORS is working before adding full functionality

function doOptions(e) {
  console.log('doOptions called');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doPost(e) {
  console.log('doPost called');
  
  try {
    const response = {
      success: true,
      message: 'CORS TEST SUCCESS - Your Google Apps Script is working!',
      timestamp: new Date().toString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
  } catch (error) {
    const errorResponse = {
      success: false,
      message: 'Error: ' + error.toString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}