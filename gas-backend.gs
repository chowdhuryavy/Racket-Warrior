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

// JSONP response function
function createJsonpResponse(response, callback) {
  const jsonpResponse = `${callback}(${JSON.stringify(response)});`;
  return ContentService
    .createTextOutput(jsonpResponse)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// Handle GET requests (JSONP)
function doGet(e) {
  console.log('doGet called with parameters:', e.parameter);
  
  try {
    const callback = e.parameter.callback;
    if (!callback) {
      return ContentService
        .createTextOutput('Missing callback parameter')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Extract request data from URL parameters
    const requestData = {};
    Object.keys(e.parameter).forEach(key => {
      if (key !== 'callback') {
        requestData[key] = e.parameter[key];
      }
    });
    
    console.log('Processing request data:', requestData);
    
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
      
      // Income/Collections management
      case 'getIncome':
        response = handleGetIncome(requestData);
        break;
      case 'addIncome':
        response = handleAddIncome(requestData);
        break;
      case 'editIncome':
        response = handleEditIncome(requestData);
        break;
      case 'deleteIncome':
        response = handleDeleteIncome(requestData);
        break;
      
      // Expenses management
      case 'getExpenses':
        response = handleGetExpenses(requestData);
        break;
      case 'addExpense':
        response = handleAddExpense(requestData);
        break;
      case 'editExpense':
        response = handleEditExpense(requestData);
        break;
      case 'deleteExpense':
        response = handleDeleteExpense(requestData);
        break;
      
      // User management (admin only)
      case 'getUsers':
        response = handleGetUsers(requestData);
        break;
      case 'addUser':
        response = handleAddUser(requestData);
        break;
      case 'editUser':
        response = handleEditUser(requestData);
        break;
      case 'deleteUser':
        response = handleDeleteUser(requestData);
        break;
      
      // Logs (admin only)
      case 'getLogs':
        response = handleGetLogs(requestData);
        break;
      
      // Dashboard data
      case 'getDashboardData':
        response = handleGetDashboardData(requestData);
        break;
      
      // Test endpoint
      case 'test':
        response = createSuccessResponse({ 
          message: 'JSONP Backend is working!', 
          timestamp: getCurrentTimestamp(),
          method: 'GET'
        });
        break;
      
      default:
        response = createErrorResponse(`Unknown action: ${action}`, 'UNKNOWN_ACTION');
    }
    
    console.log('Sending JSONP response:', response);
    return createJsonpResponse(response, callback);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    const errorResponse = createErrorResponse(`Server error: ${error.toString()}`, 'SERVER_ERROR');
    const callback = e.parameter.callback || 'callback';
    return createJsonpResponse(errorResponse, callback);
  }
}

// Keep doPost for backwards compatibility (but recommend using doGet/JSONP)
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
        return createJsonpResponse(createErrorResponse('Invalid JSON in request', 'PARSE_ERROR'), 'callback');
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
      
      // Income/Collections management
      case 'getIncome':
        response = handleGetIncome(requestData);
        break;
      case 'addIncome':
        response = handleAddIncome(requestData);
        break;
      case 'editIncome':
        response = handleEditIncome(requestData);
        break;
      case 'deleteIncome':
        response = handleDeleteIncome(requestData);
        break;
      
      // Expenses management
      case 'getExpenses':
        response = handleGetExpenses(requestData);
        break;
      case 'addExpense':
        response = handleAddExpense(requestData);
        break;
      case 'editExpense':
        response = handleEditExpense(requestData);
        break;
      case 'deleteExpense':
        response = handleDeleteExpense(requestData);
        break;
      
      // User management (admin only)
      case 'getUsers':
        response = handleGetUsers(requestData);
        break;
      case 'addUser':
        response = handleAddUser(requestData);
        break;
      case 'editUser':
        response = handleEditUser(requestData);
        break;
      case 'deleteUser':
        response = handleDeleteUser(requestData);
        break;
      
      // Logs (admin only)
      case 'getLogs':
        response = handleGetLogs(requestData);
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
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    const errorResponse = createErrorResponse(`Server error: ${error.toString()}`, 'SERVER_ERROR');
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
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
    let userName = 'User';
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        userRowIndex = i + 1;
        userName = users[i][3] || 'User';
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
    
    console.log(`Generated OTP for ${email}: ${otp}, expires: ${expiry}`);
    
    // Send beautiful HTML email
    const subject = 'Password Reset - Racket Warrior';
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Racket Warrior</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #4CAF50, #45a049); padding: 40px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 12px; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px; }
        .otp-container { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; }
        .otp-label { color: white; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .otp-code { background: white; color: #ff6b35; font-size: 32px; font-weight: bold; padding: 15px; border-radius: 8px; letter-spacing: 3px; margin: 10px 0; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .validity { color: white; font-size: 14px; opacity: 0.9; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
        .footer { background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer-text { color: #6c757d; font-size: 14px; margin: 5px 0; }
        .brand { color: #4CAF50; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior" class="logo">
            <h1>Racket Warrior</h1>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${userName},</div>
            
            <div class="message">
                We received a request to reset the password for your account associated with this email.
            </div>
            
            <div class="message">
                To proceed, please use the One-Time Password (OTP) below:
            </div>
            
            <div class="otp-container">
                <div class="otp-label">🔐 OTP Code:</div>
                <div class="otp-code">${otp}</div>
                <div class="validity">This OTP is valid for the next 10 minutes.</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                If you did not request a password reset, please ignore this email or contact our support team immediately.
            </div>
            
            <div class="message">
                Stay secure,
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text"><strong>Support Team</strong></div>
            <div class="footer-text brand">Racket Warrior</div>
        </div>
    </div>
</body>
</html>`;
    
    try {
      GmailApp.sendEmail(email, subject, '', {
        htmlBody: htmlBody
      });
      
      return createSuccessResponse({ 
        message: 'OTP sent successfully',
        debug: { otp: otp, expiry: expiry } // Remove this in production
      });
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
    
    console.log(`Verifying OTP for email: ${email}, OTP: ${otp}`);
    
    if (!email || !otp) {
      return createErrorResponse('Email and OTP are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    const users = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      const row = users[i];
      if (row[0] === email) {
        const storedOTP = String(row[8]); // Convert to string for comparison
        const expiryString = row[9];
        
        console.log(`Found user. Stored OTP: ${storedOTP}, Input OTP: ${otp}, Expiry: ${expiryString}`);
        
        // Handle different expiry formats
        let expiry;
        try {
          expiry = new Date(expiryString);
        } catch (e) {
          console.error('Invalid expiry date format:', expiryString);
          return createErrorResponse('Invalid OTP expiry format', 'INVALID_EXPIRY');
        }
        
        const now = new Date();
        console.log(`Current time: ${now}, Expiry time: ${expiry}, Is expired: ${now >= expiry}`);
        
        if (now >= expiry) {
          return createErrorResponse('OTP has expired. Please request a new one.', 'OTP_EXPIRED');
        }
        
        if (storedOTP === String(otp)) {
          console.log('OTP verification successful');
          return createSuccessResponse({ message: 'OTP verified successfully' });
        } else {
          console.log(`OTP mismatch. Expected: '${storedOTP}', Got: '${otp}'`);
          return createErrorResponse('Invalid OTP. Please check and try again.', 'INVALID_OTP');
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
    
    console.log(`Reset password attempt for email: ${email}, OTP: ${otp}`);
    
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
        const storedOTP = String(row[8]);
        const expiryString = row[9];
        
        console.log(`Found user for reset. Stored OTP: ${storedOTP}, Input OTP: ${otp}, Expiry: ${expiryString}`);
        
        // Handle different expiry formats
        let expiry;
        try {
          expiry = new Date(expiryString);
        } catch (e) {
          console.error('Invalid expiry date format:', expiryString);
          return createErrorResponse('Invalid OTP expiry format', 'INVALID_EXPIRY');
        }
        
        const now = new Date();
        
        if (now >= expiry) {
          return createErrorResponse('OTP has expired. Please request a new one.', 'OTP_EXPIRED');
        }
        
        if (storedOTP === String(otp)) {
          // Update password
          const hashedPassword = hashPassword(newPassword);
          usersSheet.getRange(i + 1, 2).setValue(hashedPassword);
          
          // Clear OTP
          usersSheet.getRange(i + 1, 9).setValue('');
          usersSheet.getRange(i + 1, 10).setValue('');
          
          const user = { email: email, role: row[2] };
          logAction(user, 'PASSWORD_RESET', 'Password reset successfully');
          
          console.log('Password reset successful');
          return createSuccessResponse({ message: 'Password reset successfully' });
        } else {
          console.log(`OTP mismatch in reset. Expected: '${storedOTP}', Got: '${otp}'`);
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
    
    // Parse user data if provided as JSON string
    let user = null;
    if (data && data.user) {
      try {
        user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
        logAction(user, 'ADD_PLAYER', `Added player: ${name}`);
      } catch (e) {
        console.log('Could not parse user data for logging');
      }
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

// Income/Collections management
function handleGetIncome(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const incomeSheet = ss.getSheetByName(SHEETS.income.name);
    
    if (!incomeSheet || incomeSheet.getLastRow() <= 1) {
      return createSuccessResponse([], 'Income sheet empty or not found');
    }
    
    const incomeData = incomeSheet.getDataRange().getValues();
    const incomeList = [];
    
    for (let i = 1; i < incomeData.length; i++) {
      const row = incomeData[i];
      const income = {
        id: row[0],
        date: row[1],
        playerId: row[2],
        playerName: row[3],
        amount: row[4],
        description: row[5],
        createdAt: row[6]
      };
      incomeList.push(income);
    }
    
    return createSuccessResponse(incomeList);
    
  } catch (error) {
    console.error('Get income error:', error);
    return createErrorResponse(`Failed to get income: ${error.toString()}`, 'GET_INCOME_ERROR');
  }
}

function handleAddIncome(data) {
  try {
    const date = data && data.date ? data.date : null;
    const playerId = data && data.playerId ? data.playerId : '';
    const playerName = data && data.playerName ? data.playerName : '';
    const amount = data && data.amount ? data.amount : null;
    const description = data && data.description ? data.description : '';
    
    if (!date || !amount) {
      return createErrorResponse('Date and amount are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const incomeSheet = ss.getSheetByName(SHEETS.income.name);
    
    if (!incomeSheet) {
      return createErrorResponse('Income sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const incomeId = generateId();
    const timestamp = getCurrentTimestamp();
    
    incomeSheet.appendRow([
      incomeId,
      date,
      playerId,
      playerName,
      parseFloat(amount),
      description,
      timestamp
    ]);
    
    // Parse user data if provided as JSON string
    let user = null;
    if (data && data.user) {
      try {
        user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
        logAction(user, 'ADD_INCOME', `Added income: QAR ${amount} from ${playerName || 'N/A'}`);
      } catch (e) {
        console.log('Could not parse user data for logging');
      }
    }
    
    return createSuccessResponse({ 
      id: incomeId,
      message: 'Income added successfully' 
    });
    
  } catch (error) {
    console.error('Add income error:', error);
    return createErrorResponse(`Failed to add income: ${error.toString()}`, 'ADD_INCOME_ERROR');
  }
}

function handleEditIncome(data) {
  try {
    const id = data && data.id ? data.id : null;
    const date = data && data.date ? data.date : null;
    const playerId = data && data.playerId ? data.playerId : '';
    const playerName = data && data.playerName ? data.playerName : '';
    const amount = data && data.amount ? data.amount : null;
    const description = data && data.description ? data.description : '';
    
    if (!id || !date || !amount) {
      return createErrorResponse('ID, date, and amount are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const incomeSheet = ss.getSheetByName(SHEETS.income.name);
    
    if (!incomeSheet) {
      return createErrorResponse('Income sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const incomeData = incomeSheet.getDataRange().getValues();
    
    // Find and update income
    for (let i = 1; i < incomeData.length; i++) {
      if (incomeData[i][0] === id) {
        incomeSheet.getRange(i + 1, 2).setValue(date);
        incomeSheet.getRange(i + 1, 3).setValue(playerId);
        incomeSheet.getRange(i + 1, 4).setValue(playerName);
        incomeSheet.getRange(i + 1, 5).setValue(parseFloat(amount));
        incomeSheet.getRange(i + 1, 6).setValue(description);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'EDIT_INCOME', `Updated income: QAR ${amount}`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'Income updated successfully' });
      }
    }
    
    return createErrorResponse('Income record not found', 'INCOME_NOT_FOUND');
    
  } catch (error) {
    console.error('Edit income error:', error);
    return createErrorResponse(`Failed to edit income: ${error.toString()}`, 'EDIT_INCOME_ERROR');
  }
}

function handleDeleteIncome(data) {
  try {
    const id = data && data.id ? data.id : null;
    
    if (!id) {
      return createErrorResponse('Income ID is required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const incomeSheet = ss.getSheetByName(SHEETS.income.name);
    
    if (!incomeSheet) {
      return createErrorResponse('Income sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const incomeData = incomeSheet.getDataRange().getValues();
    
    // Find and delete income
    for (let i = 1; i < incomeData.length; i++) {
      if (incomeData[i][0] === id) {
        const amount = incomeData[i][4];
        const playerName = incomeData[i][3];
        incomeSheet.deleteRow(i + 1);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'DELETE_INCOME', `Deleted income: QAR ${amount} from ${playerName}`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'Income deleted successfully' });
      }
    }
    
    return createErrorResponse('Income record not found', 'INCOME_NOT_FOUND');
    
  } catch (error) {
    console.error('Delete income error:', error);
    return createErrorResponse(`Failed to delete income: ${error.toString()}`, 'DELETE_INCOME_ERROR');
  }
}

// Expenses management
function handleGetExpenses(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const expensesSheet = ss.getSheetByName(SHEETS.expenses.name);
    
    if (!expensesSheet || expensesSheet.getLastRow() <= 1) {
      return createSuccessResponse([], 'Expenses sheet empty or not found');
    }
    
    const expensesData = expensesSheet.getDataRange().getValues();
    const expensesList = [];
    
    for (let i = 1; i < expensesData.length; i++) {
      const row = expensesData[i];
      const expense = {
        id: row[0],
        date: row[1],
        category: row[2],
        amount: row[3],
        description: row[4],
        createdAt: row[5]
      };
      expensesList.push(expense);
    }
    
    return createSuccessResponse(expensesList);
    
  } catch (error) {
    console.error('Get expenses error:', error);
    return createErrorResponse(`Failed to get expenses: ${error.toString()}`, 'GET_EXPENSES_ERROR');
  }
}

function handleAddExpense(data) {
  try {
    const date = data && data.date ? data.date : null;
    const category = data && data.category ? data.category : null;
    const amount = data && data.amount ? data.amount : null;
    const description = data && data.description ? data.description : '';
    
    if (!date || !category || !amount) {
      return createErrorResponse('Date, category, and amount are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const expensesSheet = ss.getSheetByName(SHEETS.expenses.name);
    
    if (!expensesSheet) {
      return createErrorResponse('Expenses sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const expenseId = generateId();
    const timestamp = getCurrentTimestamp();
    
    expensesSheet.appendRow([
      expenseId,
      date,
      category,
      parseFloat(amount),
      description,
      timestamp
    ]);
    
    // Parse user data if provided
    let user = null;
    if (data && data.user) {
      try {
        user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
        logAction(user, 'ADD_EXPENSE', `Added expense: QAR ${amount} for ${category}`);
      } catch (e) {
        console.log('Could not parse user data for logging');
      }
    }
    
    return createSuccessResponse({ 
      id: expenseId,
      message: 'Expense added successfully' 
    });
    
  } catch (error) {
    console.error('Add expense error:', error);
    return createErrorResponse(`Failed to add expense: ${error.toString()}`, 'ADD_EXPENSE_ERROR');
  }
}

function handleEditExpense(data) {
  try {
    const id = data && data.id ? data.id : null;
    const date = data && data.date ? data.date : null;
    const category = data && data.category ? data.category : null;
    const amount = data && data.amount ? data.amount : null;
    const description = data && data.description ? data.description : '';
    
    if (!id || !date || !category || !amount) {
      return createErrorResponse('ID, date, category, and amount are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const expensesSheet = ss.getSheetByName(SHEETS.expenses.name);
    
    if (!expensesSheet) {
      return createErrorResponse('Expenses sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const expensesData = expensesSheet.getDataRange().getValues();
    
    // Find and update expense
    for (let i = 1; i < expensesData.length; i++) {
      if (expensesData[i][0] === id) {
        expensesSheet.getRange(i + 1, 2).setValue(date);
        expensesSheet.getRange(i + 1, 3).setValue(category);
        expensesSheet.getRange(i + 1, 4).setValue(parseFloat(amount));
        expensesSheet.getRange(i + 1, 5).setValue(description);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'EDIT_EXPENSE', `Updated expense: QAR ${amount} for ${category}`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'Expense updated successfully' });
      }
    }
    
    return createErrorResponse('Expense record not found', 'EXPENSE_NOT_FOUND');
    
  } catch (error) {
    console.error('Edit expense error:', error);
    return createErrorResponse(`Failed to edit expense: ${error.toString()}`, 'EDIT_EXPENSE_ERROR');
  }
}

function handleDeleteExpense(data) {
  try {
    const id = data && data.id ? data.id : null;
    
    if (!id) {
      return createErrorResponse('Expense ID is required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const expensesSheet = ss.getSheetByName(SHEETS.expenses.name);
    
    if (!expensesSheet) {
      return createErrorResponse('Expenses sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const expensesData = expensesSheet.getDataRange().getValues();
    
    // Find and delete expense
    for (let i = 1; i < expensesData.length; i++) {
      if (expensesData[i][0] === id) {
        const amount = expensesData[i][3];
        const category = expensesData[i][2];
        expensesSheet.deleteRow(i + 1);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'DELETE_EXPENSE', `Deleted expense: QAR ${amount} for ${category}`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'Expense deleted successfully' });
      }
    }
    
    return createErrorResponse('Expense record not found', 'EXPENSE_NOT_FOUND');
    
  } catch (error) {
    console.error('Delete expense error:', error);
    return createErrorResponse(`Failed to delete expense: ${error.toString()}`, 'DELETE_EXPENSE_ERROR');
  }
}

// User management (admin only)
function handleGetUsers(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    if (!usersSheet) {
      return createSuccessResponse([], 'Users sheet not found, returning empty list');
    }
    
    const usersData = usersSheet.getDataRange().getValues();
    const usersList = [];
    
    for (let i = 1; i < usersData.length; i++) {
      const row = usersData[i];
      const user = {
        email: row[0],
        role: row[2],
        name: row[3],
        needsPasswordChange: row[4],
        createdAt: row[5],
        lastLogin: row[6],
        status: row[7]
      };
      usersList.push(user);
    }
    
    return createSuccessResponse(usersList);
    
  } catch (error) {
    console.error('Get users error:', error);
    return createErrorResponse(`Failed to get users: ${error.toString()}`, 'GET_USERS_ERROR');
  }
}

function handleAddUser(data) {
  try {
    const name = data && data.name ? data.name : null;
    const email = data && data.email ? data.email : null;
    const role = data && data.role ? data.role : null;
    const status = data && data.status ? data.status : 'active';
    
    if (!name || !email || !role) {
      return createErrorResponse('Name, email, and role are required', 'MISSING_DATA');
    }
    
    if (!validateEmail(email)) {
      return createErrorResponse('Invalid email format', 'INVALID_EMAIL');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    if (!usersSheet) {
      return createErrorResponse('Users sheet not found', 'SHEET_NOT_FOUND');
    }
    
    // Check if user already exists
    const users = usersSheet.getDataRange().getValues();
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        return createErrorResponse('User with this email already exists', 'USER_EXISTS');
      }
    }
    
    // Generate temporary password
    const tempPassword = 'TempPass' + Math.floor(Math.random() * 1000) + '!';
    const hashedPassword = hashPassword(tempPassword);
    const timestamp = getCurrentTimestamp();
    
    usersSheet.appendRow([
      email,
      hashedPassword,
      role,
      name,
      true, // needs_password_change
      timestamp,
      '', // last_login
      status,
      '', // resetToken
      ''  // resetTokenExpiry
    ]);
    
    // Send welcome email
    try {
      const subject = 'Welcome! RACKET WARRIOR';
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - Racket Warrior</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #4CAF50, #45a049); padding: 40px 20px; text-align: center; }
        .logo { width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 12px; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px; }
        .credentials { background: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cred-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .cred-label { font-weight: 600; color: #495057; }
        .cred-value { color: #007bff; font-family: monospace; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
        .footer { background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer-text { color: #6c757d; font-size: 14px; margin: 5px 0; }
        .brand { color: #4CAF50; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior" class="logo">
            <h1>Welcome to Racket Warrior!</h1>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${name},</div>
            
            <div class="message">
                Your account has been successfully created. Welcome to the Racket Warrior management system!
            </div>
            
            <div class="credentials">
                <div class="cred-row">
                    <span class="cred-label">👤 Username:</span>
                    <span class="cred-value">${email}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">🔐 Temporary Password:</span>
                    <span class="cred-value">${tempPassword}</span>
                </div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong><br>
                Please change your password after your first login for security purposes.
            </div>
            
            <div class="message">
                If you need any help, feel free to reach out to our support team.
            </div>
            
            <div class="message">
                Warm regards,
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text"><strong>Support Team</strong></div>
            <div class="footer-text brand">Racket Warrior</div>
        </div>
    </div>
</body>
</html>`;
      
      GmailApp.sendEmail(email, subject, '', {
        htmlBody: htmlBody
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    // Parse user data if provided
    let user = null;
    if (data && data.user) {
      try {
        user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
        logAction(user, 'ADD_USER', `Added user: ${name} (${email}) with role ${role}`);
      } catch (e) {
        console.log('Could not parse user data for logging');
      }
    }
    
    return createSuccessResponse({ 
      message: 'User added successfully',
      tempPassword: tempPassword
    });
    
  } catch (error) {
    console.error('Add user error:', error);
    return createErrorResponse(`Failed to add user: ${error.toString()}`, 'ADD_USER_ERROR');
  }
}

function handleEditUser(data) {
  try {
    const email = data && data.email ? data.email : null;
    const name = data && data.name ? data.name : null;
    const role = data && data.role ? data.role : null;
    const status = data && data.status ? data.status : 'active';
    
    if (!email || !name || !role) {
      return createErrorResponse('Email, name, and role are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    if (!usersSheet) {
      return createErrorResponse('Users sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const users = usersSheet.getDataRange().getValues();
    
    // Find and update user
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        usersSheet.getRange(i + 1, 3).setValue(role);
        usersSheet.getRange(i + 1, 4).setValue(name);
        usersSheet.getRange(i + 1, 8).setValue(status);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'EDIT_USER', `Updated user: ${name} (${email})`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'User updated successfully' });
      }
    }
    
    return createErrorResponse('User not found', 'USER_NOT_FOUND');
    
  } catch (error) {
    console.error('Edit user error:', error);
    return createErrorResponse(`Failed to edit user: ${error.toString()}`, 'EDIT_USER_ERROR');
  }
}

function handleDeleteUser(data) {
  try {
    const email = data && data.email ? data.email : null;
    
    if (!email) {
      return createErrorResponse('Email is required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(SHEETS.users.name);
    
    if (!usersSheet) {
      return createErrorResponse('Users sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const users = usersSheet.getDataRange().getValues();
    
    // Find and delete user
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        const userName = users[i][3];
        usersSheet.deleteRow(i + 1);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'DELETE_USER', `Deleted user: ${userName} (${email})`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'User deleted successfully' });
      }
    }
    
    return createErrorResponse('User not found', 'USER_NOT_FOUND');
    
  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse(`Failed to delete user: ${error.toString()}`, 'DELETE_USER_ERROR');
  }
}

// Logs management (admin only)
function handleGetLogs(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logsSheet = ss.getSheetByName(SHEETS.logs.name);
    
    if (!logsSheet || logsSheet.getLastRow() <= 1) {
      return createSuccessResponse([], 'Logs sheet empty or not found');
    }
    
    const logsData = logsSheet.getDataRange().getValues();
    const logsList = [];
    
    for (let i = 1; i < logsData.length; i++) {
      const row = logsData[i];
      const log = {
        timestamp: row[0],
        user: row[1],
        role: row[2],
        action: row[3],
        details: row[4]
      };
      logsList.push(log);
    }
    
    // Sort by timestamp descending (most recent first)
    logsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return createSuccessResponse(logsList);
    
  } catch (error) {
    console.error('Get logs error:', error);
    return createErrorResponse(`Failed to get logs: ${error.toString()}`, 'GET_LOGS_ERROR');
  }
}

// Player management functions (implement the placeholders)
function handleEditPlayer(data) {
  try {
    const id = data && data.id ? data.id : null;
    const name = data && data.name ? data.name : null;
    const phone = data && data.phone ? data.phone : null;
    const email = data && data.email ? data.email : '';
    const status = data && data.status ? data.status : 'active';
    const joinDate = data && data.joinDate ? data.joinDate : null;
    const monthlyStatus = data && data.monthlyStatus ? data.monthlyStatus : 'active';
    
    if (!id || !name || !phone) {
      return createErrorResponse('ID, name, and phone are required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const playersSheet = ss.getSheetByName(SHEETS.players.name);
    
    if (!playersSheet) {
      return createErrorResponse('Players sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const players = playersSheet.getDataRange().getValues();
    
    // Find and update player
    for (let i = 1; i < players.length; i++) {
      if (players[i][0] === id) {
        playersSheet.getRange(i + 1, 2).setValue(name);
        playersSheet.getRange(i + 1, 3).setValue(phone);
        playersSheet.getRange(i + 1, 4).setValue(email);
        playersSheet.getRange(i + 1, 5).setValue(status);
        if (joinDate) playersSheet.getRange(i + 1, 6).setValue(joinDate);
        playersSheet.getRange(i + 1, 8).setValue(monthlyStatus);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'EDIT_PLAYER', `Updated player: ${name}`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'Player updated successfully' });
      }
    }
    
    return createErrorResponse('Player not found', 'PLAYER_NOT_FOUND');
    
  } catch (error) {
    console.error('Edit player error:', error);
    return createErrorResponse(`Failed to edit player: ${error.toString()}`, 'EDIT_PLAYER_ERROR');
  }
}

function handleDeletePlayer(data) {
  try {
    const id = data && data.id ? data.id : null;
    
    if (!id) {
      return createErrorResponse('Player ID is required', 'MISSING_DATA');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const playersSheet = ss.getSheetByName(SHEETS.players.name);
    
    if (!playersSheet) {
      return createErrorResponse('Players sheet not found', 'SHEET_NOT_FOUND');
    }
    
    const players = playersSheet.getDataRange().getValues();
    
    // Find and delete player
    for (let i = 1; i < players.length; i++) {
      if (players[i][0] === id) {
        const playerName = players[i][1];
        playersSheet.deleteRow(i + 1);
        
        // Parse user data if provided
        let user = null;
        if (data && data.user) {
          try {
            user = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            logAction(user, 'DELETE_PLAYER', `Deleted player: ${playerName}`);
          } catch (e) {
            console.log('Could not parse user data for logging');
          }
        }
        
        return createSuccessResponse({ message: 'Player deleted successfully' });
      }
    }
    
    return createErrorResponse('Player not found', 'PLAYER_NOT_FOUND');
    
  } catch (error) {
    console.error('Delete player error:', error);
    return createErrorResponse(`Failed to delete player: ${error.toString()}`, 'DELETE_PLAYER_ERROR');
  }
}