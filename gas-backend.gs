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

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Utility functions
function generateId() {
  return 'ID_' + Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function hashPassword(password) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
}

function validatePassword(password) {
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function logAction(user, action, details = '') {
  try {
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

function createResponseWithHeaders(response) {
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(CORS_HEADERS);
}

// CRITICAL: Handle CORS preflight requests
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(CORS_HEADERS);
}

// Main handler function
function doPost(e) {
  try {
    // Parse request data
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
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
      
      // Income management
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
      
      // Dashboard data
      case 'getDashboardData':
        response = handleGetDashboardData(requestData);
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
      
      // Test endpoint
      case 'test':
        response = createSuccessResponse({ message: 'Backend is working', timestamp: getCurrentTimestamp() });
        break;
      
      default:
        response = createErrorResponse(`Unknown action: ${action}`, 'UNKNOWN_ACTION');
    }
    
    return createResponseWithHeaders(response);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    const errorResponse = createErrorResponse(`Server error: ${error.toString()}`, 'SERVER_ERROR');
    return createResponseWithHeaders(errorResponse);
  }
}

// Authentication handlers
function handleLogin(data) {
  try {
    const { email, password } = data;
    
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
    const headers = users[0];
    
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
        // Hash the input password to compare
        const hashedInput = hashPassword(password);
        
        if (userPassword === hashedInput) {
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
    const { email } = data;
    
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
    
    // Send email
    const subject = 'Password Reset OTP - Racket Warrior';
    const body = `
      Your OTP for password reset is: ${otp}
      
      This OTP will expire in 10 minutes.
      
      If you didn't request this, please ignore this email.
      
      Racket Warrior Badminton Management System
    `;
    
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
    const { email, otp } = data;
    
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
    const { email, otp, newPassword } = data;
    
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
    const headers = players[0];
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
    const { name, phone, email, status, joinDate, monthlyStatus } = data;
    
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
      email || '',
      status || 'active',
      joinDate || timestamp,
      timestamp,
      monthlyStatus || 'active'
    ]);
    
    logAction(data.user, 'ADD_PLAYER', `Added player: ${name}`);
    
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
    if (playersSheet) {
      const players = playersSheet.getDataRange().getValues();
      for (let i = 1; i < players.length; i++) {
        if (players[i][4] === 'active') {
          dashboardData.activePlayersCount++;
        }
      }
      
      // Get recent players (last 5)
      const recentPlayers = players.slice(-6, -1).map(row => ({
        name: row[1],
        joinDate: row[5],
        status: row[4]
      }));
      dashboardData.recentPlayers = recentPlayers;
    }
    
    // Calculate monthly collection
    if (incomeSheet) {
      const income = incomeSheet.getDataRange().getValues();
      for (let i = 1; i < income.length; i++) {
        const date = new Date(income[i][1]);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          dashboardData.totalCollection += parseFloat(income[i][4]) || 0;
        }
      }
    }
    
    // Calculate monthly expenses
    if (expensesSheet) {
      const expenses = expensesSheet.getDataRange().getValues();
      for (let i = 1; i < expenses.length; i++) {
        const date = new Date(expenses[i][1]);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          dashboardData.totalExpenses += parseFloat(expenses[i][3]) || 0;
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

// Placeholder functions for other operations
function handleEditPlayer(data) { return createErrorResponse('Edit player not implemented yet', 'NOT_IMPLEMENTED'); }
function handleDeletePlayer(data) { return createErrorResponse('Delete player not implemented yet', 'NOT_IMPLEMENTED'); }
function handleGetIncome(data) { return createSuccessResponse([], 'Income data not implemented yet'); }
function handleAddIncome(data) { return createErrorResponse('Add income not implemented yet', 'NOT_IMPLEMENTED'); }
function handleEditIncome(data) { return createErrorResponse('Edit income not implemented yet', 'NOT_IMPLEMENTED'); }
function handleDeleteIncome(data) { return createErrorResponse('Delete income not implemented yet', 'NOT_IMPLEMENTED'); }
function handleGetExpenses(data) { return createSuccessResponse([], 'Expenses data not implemented yet'); }
function handleAddExpense(data) { return createErrorResponse('Add expense not implemented yet', 'NOT_IMPLEMENTED'); }
function handleEditExpense(data) { return createErrorResponse('Edit expense not implemented yet', 'NOT_IMPLEMENTED'); }
function handleDeleteExpense(data) { return createErrorResponse('Delete expense not implemented yet', 'NOT_IMPLEMENTED'); }
function handleGetUsers(data) { return createErrorResponse('Get users not implemented yet', 'NOT_IMPLEMENTED'); }
function handleAddUser(data) { return createErrorResponse('Add user not implemented yet', 'NOT_IMPLEMENTED'); }
function handleEditUser(data) { return createErrorResponse('Edit user not implemented yet', 'NOT_IMPLEMENTED'); }
function handleDeleteUser(data) { return createErrorResponse('Delete user not implemented yet', 'NOT_IMPLEMENTED'); }
function handleGetLogs(data) { return createSuccessResponse([], 'Logs data not implemented yet'); }