// MINIMAL CORS TEST - Google Apps Script
// Use this to test if CORS is working before adding full functionality

// CRITICAL: Handle CORS preflight requests
function doOptions(e) {
  console.log('doOptions called - this should appear in logs');
  
  return ContentService
    .createTextOutput('OPTIONS response')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
}

// Main handler function
function doPost(e) {
  console.log('doPost called with data:', e.postData ? e.postData.contents : 'No data');
  
  try {
    let response = {
      success: true,
      message: 'CORS Test - doPost function working!',
      timestamp: new Date().toISOString(),
      received: e.postData ? JSON.parse(e.postData.contents) : null
    };
    
    console.log('Sending response:', response);
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
      
  } catch (error) {
    console.error('Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      message: 'Server error: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
  }
}

// Test function you can run manually
function testScript() {
  console.log('Manual test - script is working');
  return 'Script is working!';
}