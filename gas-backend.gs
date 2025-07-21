// Google Apps Script Backend for Racket Warrior Badminton Management System
// Replace YOUR_SPREADSHEET_ID with your actual spreadsheet ID
const SPREADSHEET_ID = '1zJHUpcWaOBhKCzHS-uGPqaJepv_eZm019ElKtt249fg';

// Sheet configuration
const SHEETS = {
  users:    { name: 'Users',    columns: ['email', 'password', 'role', 'name', 'needs_password_change', 'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry'] },
  players:  { name: 'Players',  columns: ['ID', 'Name', 'Phone', 'Email', 'Status', 'JoinDate', 'CreatedAt', 'MonthlyStatus'] },
  income:   { name: 'Income',   columns: ['ID', 'Date', 'PlayerId', 'PlayerName', 'Amount', 'Description', 'CreatedAt'] },
  expenses: { name: 'Expenses', columns: ['ID', 'Date', 'Category', 'Amount', 'Description', 'CreatedAt'] },
  logs:     { name: 'Logs',     columns: ['timestamp', 'user', 'role', 'action', 'details'] },
  settings: { name: 'Settings', columns: ['key', 'value'] }
};

// Utility functions
function generateId() {
  return 'ID_' + Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function hashPassword(password) {
  if (!password) {
    throw new Error('Password cannot be null or empty');
  }
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
}

function validatePassword(password) {
  if (!password) {
    return { isValid: false, requirements: { error: 'Password is required' } };
  }
  
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(requirements).every(req => req);
  return { isValid, requirements };
}

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function logAction(user, action, details = '') {
  try {
    if (!user || !user.email) {
      console.log('Skipping log - invalid user data');
      return;
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logsSheet = ss.getSheetByName(SHEETS.logs.name);
    
    if (logsSheet) {
      logsSheet.appendRow([
        getCurrentTimestamp(),
        user.email || 'Unknown',
        user.role || 'Unknown',
        action,
        details
      ]);
    }
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}

function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message: message,
    data: data,
    timestamp: getCurrentTimestamp()
  };
}

function createErrorResponse(message, code = 'ERROR') {
  return {
    success: false,
    message: message,
    code: code,
    timestamp: getCurrentTimestamp()
  };
}

// Fixed CORS response function for Google Apps Script compatibility
function createResponseWithHeaders(response) {
  const output = ContentService.createTextOutput(JSON.stringify(response));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers individually (Google Apps Script compatibility)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
  
  // Set headers one by one for compatibility
  for (const [key, value] of Object.entries(headers)) {
    output.setHeader(key, value);
  }
  
  return output;
}

// CRITICAL: Handle CORS preflight requests (Fixed for Google Apps Script)
function doOptions(e) {
  console.log('doOptions called - CORS preflight request');
  
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  
  // Set CORS headers individually
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '86400');
  
  return output;
}

// Main handler function (Fixed parameter handling)
function doPost(e) {
  console.log('doPost called, e:', e);
  
  try {
    // Safe parameter extraction
    let requestData = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
        console.log('Parsed request data:', requestData);
      } catch (parseError) {
        console.error('Failed to parse request data:', parseError);
        return createResponseWithHeaders(createErrorResponse('Invalid JSON in request', 'PARSE_ERROR'));
      }
    } else {
      console.log('No postData found, using empty request');
    }
    
    const action = requestData.action || 'unknown';
    console.log(`Processing action: ${action}`);
    
    let response;
    
    switch (action) {
      // Authentication
      case 'login':
        response = handleLogin(requestData);
        break;
      case 'sendOTP':
        response = handleSendOTP(requestData);
        break;
      case 'verifyOTP':
        response = handleVerifyOTP(requestData);
        break;
      case 'resetPassword':
        response = handleResetPassword(requestData);
        break;
      
      // Players management
      case 'getPlayers':
        response = handleGetPlayers(requestData);
        break;
      case 'addPlayer':
        response = handleAddPlayer(requestData);
        break;
      case 'editPlayer':
        response = handleEditPlayer(requestData);
        break;
      case 'deletePlayer':
        response = handleDeletePlayer(requestData);
        break;
      
      // Dashboard data
      case 'getDashboardData':
        response = handleGetDashboardData(requestData);
        break;
      
      // Test endpoint
      case 'test':
        response = createSuccessResponse({ message: 'Backend is working', timestamp: getCurrentTimestamp() });
        break;
      
      default:
        response = createErrorResponse(`Unknown action: ${action}`, 'UNKNOWN_ACTION');
    }
    
    console.log('Sending response:', response);
    return createResponseWithHeaders(response);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    const errorResponse = createErrorResponse(`Server error: ${error.toString()}`, 'SERVER_ERROR');
    return createResponseWithHeaders(errorResponse);
  }
}

// Authentication handlers (Fixed parameter destructuring)
function handleLogin(data) {
  console.log('handleLogin called with:', data);
  
  try {
    // Safe parameter extraction
    const email = data && data.email ? data.email : null;
    const password = data && data.password ? data.password : null;
    
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 'MISSING_CREDENTIALS');
    }
    
    if (!validateEmail(email)) {
      return createErrorResponse('Invalid email format', 'INVALID_EMAIL');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    if (!usersSheet) {
      return createErrorResponse('Users sheet not found. Please set up your Google Sheet properly.', 'SHEET_NOT_FOUND');
    }
    
    const users = usersSheet.getDataRange().getValues();
    console.log('Found users sheet with', users.length, 'rows');
    
    // Find user
    for (let i = 1; i < users.length; i++) {
      const row = users[i];
      const userEmail = row[0];
      const userPassword = row[1];
      const userRole = row[2];
      const userName = row[3];
      const needsPasswordChange = row[4];
      const userStatus = row[7];
      
      if (userEmail === email && userStatus === 'active') {
        console.log('Found matching user:', userEmail);
        
        // Hash the input password to compare
        const hashedInput = hashPassword(password);
        
        if (userPassword === hashedInput) {
          console.log('Password match successful');
          
          // Update last login
          usersSheet.getRange(i + 1, 7).setValue(getCurrentTimestamp());
          
          const user = {
            email: userEmail,
            role: userRole,
            name: userName,
            needsPasswordChange: needsPasswordChange
          };
          
          logAction(user, 'LOGIN', `Successful login from ${email}`);
          
          return createSuccessResponse({
            user: user,
            message: 'Login successful'
          });
        } else {
          console.log('Password mismatch');
        }
      }
    }
    
    return createErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS');
    
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse(`Login failed: ${error.toString()}`, 'LOGIN_ERROR');
  }
}

function handleSendOTP(data) {
  try {
    const email = data && data.email ? data.email : null;
    
    if (!email || !validateEmail(email)) {
      return createErrorResponse('Valid email is required', 'INVALID_EMAIL');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    if (!usersSheet) {
      return createErrorResponse('Users sheet not found', 'SHEET_NOT_FOUND');
    }
    
    // Check if user exists
    const users = usersSheet.getDataRange().getValues();
    let userRowIndex = -1;
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        userRowIndex = i + 1;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return createErrorResponse('Email not found', 'EMAIL_NOT_FOUND');
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    // Update user record with OTP
    usersSheet.getRange(userRowIndex, 9).setValue(otp); // resetToken column
    usersSheet.getRange(userRowIndex, 10).setValue(expiry); // resetTokenExpiry column
    
    // Get user name for personalization
    const userName = users[userRowIndex - 1][3] || 'User';
    
    // Send email
    const subject = 'OTP - Racket Warrior';
    const body = `Hi ${userName},

We received a request to reset the password for your account associated with this email.

To proceed, please use the One-Time Password (OTP) below:

🔐 OTP Code: ${otp}

This OTP is valid for the next 10 minutes.

If you did not request a password reset, please ignore this email or contact our support team immediately.

Stay secure,

Support Team
Racket Warrior`;
    
    try {
      GmailApp.sendEmail(email, subject, body);
      return createSuccessResponse({ message: 'OTP sent successfully' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return createErrorResponse('Failed to send OTP email', 'EMAIL_SEND_ERROR');
    }
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return createErrorResponse(`Send OTP failed: ${error.toString()}`, 'OTP_ERROR');
  }
}

function handleVerifyOTP(data) {
  try {
    const email = data && data.email ? data.email : null;
    const otp = data && data.otp ? data.otp : null;
    
    if (!email || !otp) {
      return createErrorResponse('Email and OTP are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    const users = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      const row = users[i];
      if (row[0] === email) {
        const storedOTP = row[8];
        const expiry = new Date(row[9]);
        
        if (storedOTP === otp && new Date() < expiry) {
          return createSuccessResponse({ message: 'OTP verified successfully' });
        } else if (new Date() >= expiry) {
          return createErrorResponse('OTP has expired', 'OTP_EXPIRED');
        } else {
          return createErrorResponse('Invalid OTP', 'INVALID_OTP');
        }
      }
    }
    
    return createErrorResponse('Email not found', 'EMAIL_NOT_FOUND');
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return createErrorResponse(`Verify OTP failed: ${error.toString()}`, 'VERIFY_ERROR');
  }
}

function handleResetPassword(data) {
  try {
    const email = data && data.email ? data.email : null;
    const otp = data && data.otp ? data.otp : null;
    const newPassword = data && data.newPassword ? data.newPassword : null;
    
    if (!email || !otp || !newPassword) {
      return createErrorResponse('Email, OTP, and new password are required', 'MISSING_DATA');
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return createErrorResponse('Password does not meet requirements', 'WEAK_PASSWORD');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    const users = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      const row = users[i];
      if (row[0] === email) {
        const storedOTP = row[8];
        const expiry = new Date(row[9]);
        
        if (storedOTP === otp && new Date() < expiry) {
          // Update password
          const hashedPassword = hashPassword(newPassword);
          usersSheet.getRange(i + 1, 2).setValue(hashedPassword);
          
          // Clear OTP
          usersSheet.getRange(i + 1, 9).setValue('');
          usersSheet.getRange(i + 1, 10).setValue('');
          
          const user = { email: email, role: row[2] };
          logAction(user, 'PASSWORD_RESET', 'Password reset successfully');
          
          return createSuccessResponse({ message: 'Password reset successfully' });
        } else {
          return createErrorResponse('Invalid or expired OTP', 'INVALID_OTP');
        }
      }
    }
    
    return createErrorResponse('Email not found', 'EMAIL_NOT_FOUND');
    
  } catch (error) {
    console.error('Reset password error:', error);
    return createErrorResponse(`Reset password failed: ${error.toString()}`, 'RESET_ERROR');
  }
}

// Players management
function handleGetPlayers(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const playersSheet = ss.getSheetByName(SHEETS.players.name);
    
    if (!playersSheet) {
      return createSuccessResponse([], 'Players sheet not found, returning empty list');
    }
    
    const players = playersSheet.getDataRange().getValues();
    const playersList = [];
    
    for (let i = 1; i < players.length; i++) {
      const row = players[i];
      const player = {
        id: row[0],
        name: row[1],
        phone: row[2],
        email: row[3],
        status: row[4],
        joinDate: row[5],
        createdAt: row[6],
        monthlyStatus: row[7]
      };
      playersList.push(player);
    }
    
    return createSuccessResponse(playersList);
    
  } catch (error) {
    console.error('Get players error:', error);
    return createErrorResponse(`Failed to get players: ${error.toString()}`, 'GET_PLAYERS_ERROR');
  }
}

function handleAddPlayer(data) {
  try {
    const name = data && data.name ? data.name : null;
    const phone = data && data.phone ? data.phone : null;
    const email = data && data.email ? data.email : '';
    const status = data && data.status ? data.status : 'active';
    const joinDate = data && data.joinDate ? data.joinDate : getCurrentTimestamp();
    const monthlyStatus = data && data.monthlyStatus ? data.monthlyStatus : 'active';
    
    if (!name || !phone) {
      return createErrorResponse('Name and phone are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const playersSheet = ss.getSheetByName(SHEETS.players.name);
    
    if (!playersSheet) {
      return createErrorResponse('Players sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const playerId = generateId();
    const timestamp = getCurrentTimestamp();
    
    playersSheet.appendRow([
      playerId,
      name,
      phone,
      email,
      status,
      joinDate,
      timestamp,
      monthlyStatus
    ]);
    
    if (data && data.user) {
      logAction(data.user, 'ADD_PLAYER', `Added player: ${name}`);
    }
    
    return createSuccessResponse({ 
      id: playerId,
      message: 'Player added successfully' 
    });
    
  } catch (error) {
    console.error('Add player error:', error);
    return createErrorResponse(`Failed to add player: ${error.toString()}`, 'ADD_PLAYER_ERROR');
  }
}

// Dashboard data
function handleGetDashboardData(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const playersSheet = ss.getSheetByName(SHEETS.players.name);
    const incomeSheet = ss.getSheetByName(SHEETS.income.name);
    const expensesSheet = ss.getSheetByName(SHEETS.expenses.name);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let dashboardData = {
      activePlayersCount: 0,
      totalCollection: 0,
      totalExpenses: 0,
      totalBalance: 0,
      recentPlayers: [],
      recentTransactions: []
    };
    
    // Count active players
    if (playersSheet && playersSheet.getLastRow() > 1) {
      const players = playersSheet.getDataRange().getValues();
      for (let i = 1; i < players.length; i++) {
        if (players[i][4] === 'active') {
          dashboardData.activePlayersCount++;
        }
      }
      
      // Get recent players (last 5)
      const recentPlayers = players.slice(-6, -1).map(row => ({
        name: row[1] || 'Unknown',
        joinDate: row[5] || getCurrentTimestamp(),
        status: row[4] || 'active'
      }));
      dashboardData.recentPlayers = recentPlayers;
    }
    
    // Calculate monthly collection
    if (incomeSheet && incomeSheet.getLastRow() > 1) {
      const income = incomeSheet.getDataRange().getValues();
      for (let i = 1; i < income.length; i++) {
        try {
          const date = new Date(income[i][1]);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            dashboardData.totalCollection += parseFloat(income[i][4]) || 0;
          }
        } catch (dateError) {
          console.log('Invalid date in income row:', i);
        }
      }
    }
    
    // Calculate monthly expenses
    if (expensesSheet && expensesSheet.getLastRow() > 1) {
      const expenses = expensesSheet.getDataRange().getValues();
      for (let i = 1; i < expenses.length; i++) {
        try {
          const date = new Date(expenses[i][1]);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            dashboardData.totalExpenses += parseFloat(expenses[i][3]) || 0;
          }
        } catch (dateError) {
          console.log('Invalid date in expenses row:', i);
        }
      }
    }
    
    dashboardData.totalBalance = dashboardData.totalCollection - dashboardData.totalExpenses;
    
    return createSuccessResponse(dashboardData);
    
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return createErrorResponse(`Failed to get dashboard data: ${error.toString()}`, 'DASHBOARD_ERROR');
  }
}

// Placeholder for additional functions (add these gradually after testing basic functionality)
function handleEditPlayer(data) { return createErrorResponse('Edit player not implemented yet', 'NOT_IMPLEMENTED'); }
function handleDeletePlayer(data) { return createErrorResponse('Delete player not implemented yet', 'NOT_IMPLEMENTED'); }