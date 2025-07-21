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

function handleEditPlayer(data) {
  try {
    const { id, name, phone, email, status, joinDate, monthlyStatus } = data;
    
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
        playersSheet.getRange(i + 1, 4).setValue(email || '');
        playersSheet.getRange(i + 1, 5).setValue(status || 'active');
        playersSheet.getRange(i + 1, 6).setValue(joinDate || players[i][5]);
        playersSheet.getRange(i + 1, 8).setValue(monthlyStatus || 'active');
        
        logAction(data.user, 'EDIT_PLAYER', `Updated player: ${name}`);
        
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
    const { id } = data;
    
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
        
        logAction(data.user, 'DELETE_PLAYER', `Deleted player: ${playerName}`);
        
        return createSuccessResponse({ message: 'Player deleted successfully' });
      }
    }
    
    return createErrorResponse('Player not found', 'PLAYER_NOT_FOUND');
    
  } catch (error) {
    console.error('Delete player error:', error);
    return createErrorResponse(`Failed to delete player: ${error.toString()}`, 'DELETE_PLAYER_ERROR');
  }
}

// Income management
function handleGetIncome(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const incomeSheet = ss.getSheetByName(SHEETS.income.name);
    
    if (!incomeSheet) {
      return createSuccessResponse([], 'Income sheet not found, returning empty list');
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
    const { date, playerId, playerName, amount, description } = data;
    
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
      playerId || '',
      playerName || '',
      parseFloat(amount),
      description || '',
      timestamp
    ]);
    
    logAction(data.user, 'ADD_INCOME', `Added income: QAR ${amount} from ${playerName || 'N/A'}`);
    
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
    const { id, date, playerId, playerName, amount, description } = data;
    
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
        incomeSheet.getRange(i + 1, 3).setValue(playerId || '');
        incomeSheet.getRange(i + 1, 4).setValue(playerName || '');
        incomeSheet.getRange(i + 1, 5).setValue(parseFloat(amount));
        incomeSheet.getRange(i + 1, 6).setValue(description || '');
        
        logAction(data.user, 'EDIT_INCOME', `Updated income: QAR ${amount}`);
        
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
    const { id } = data;
    
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
        
        logAction(data.user, 'DELETE_INCOME', `Deleted income: QAR ${amount} from ${playerName}`);
        
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
    
    if (!expensesSheet) {
      return createSuccessResponse([], 'Expenses sheet not found, returning empty list');
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
    const { date, category, amount, description } = data;
    
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
      description || '',
      timestamp
    ]);
    
    logAction(data.user, 'ADD_EXPENSE', `Added expense: QAR ${amount} for ${category}`);
    
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
    const { id, date, category, amount, description } = data;
    
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
        expensesSheet.getRange(i + 1, 5).setValue(description || '');
        
        logAction(data.user, 'EDIT_EXPENSE', `Updated expense: QAR ${amount} for ${category}`);
        
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
    const { id } = data;
    
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
        
        logAction(data.user, 'DELETE_EXPENSE', `Deleted expense: QAR ${amount} for ${category}`);
        
        return createSuccessResponse({ message: 'Expense deleted successfully' });
      }
    }
    
    return createErrorResponse('Expense record not found', 'EXPENSE_NOT_FOUND');
    
  } catch (error) {
    console.error('Delete expense error:', error);
    return createErrorResponse(`Failed to delete expense: ${error.toString()}`, 'DELETE_EXPENSE_ERROR');
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
    const { name, email, role, status } = data;
    
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
      status || 'active',
      '', // resetToken
      ''  // resetTokenExpiry
    ]);
    
    // Send welcome email
    try {
      const subject = 'Welcome! RACKET WARRIOR';
      const body = `Welcome to Racket Warrior!
Your account has been successfully created.

👤 Username: ${email}
🔐 Temporary Password: ${tempPassword}

⚠️ Please change your password after your first login for security purposes.

If you need any help, feel free to reach out to our support team.

Warm regards,

Support Team
Racket Warrior`;
      
      GmailApp.sendEmail(email, subject, body);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    logAction(data.user, 'ADD_USER', `Added user: ${name} (${email}) with role ${role}`);
    
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
    const { email, name, role, status } = data;
    
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
        usersSheet.getRange(i + 1, 8).setValue(status || 'active');
        
        logAction(data.user, 'EDIT_USER', `Updated user: ${name} (${email})`);
        
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
    const { email } = data;
    
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
        
        logAction(data.user, 'DELETE_USER', `Deleted user: ${userName} (${email})`);
        
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
    
    if (!logsSheet) {
      return createSuccessResponse([], 'Logs sheet not found, returning empty list');
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