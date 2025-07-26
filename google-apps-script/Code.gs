/**
 * Racket Warrior - Google Apps Script Backend
 * Badminton Group Management System
 */

// Configuration
const CONFIG = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE', // Replace with your Google Sheet ID
  EMAIL_FROM: 'your-email@gmail.com', // Replace with your email
  APP_NAME: 'Racket Warrior',
  BASE_URL: 'YOUR_WEB_APP_URL_HERE' // Replace with your deployed web app URL
};

// Sheet names mapping
const SHEETS = {
  USERS: 'Users',
  PLAYERS: 'Players', 
  INCOME: 'Income',
  EXPENSES: 'Expenses',
  LOGS: 'Logs',
  SETTINGS: 'Settings'
};

/**
 * Main doGet function - handles GET requests
 */
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  
  try {
    let result = { success: false, message: 'Invalid action' };
    
    switch (action) {
      case 'health_check':
        result = { success: true, message: 'Backend is running', timestamp: new Date().toISOString() };
        break;
      default:
        result = { success: false, message: 'Action not supported via GET' };
    }
    
    // JSONP response for cross-origin requests
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(result)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    const errorResult = { success: false, message: error.toString() };
    
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(errorResult)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main doPost function - handles POST requests
 */
function doPost(e) {
  const action = e.parameter.action;
  
  try {
    let result = { success: false, message: 'Invalid action' };
    
    // Route to appropriate handler
    switch (action) {
      // Authentication
      case 'login':
        result = handleLogin(e.parameter);
        break;
      case 'logout':
        result = handleLogout(e.parameter);
        break;
      case 'forgot_password':
        result = handleForgotPassword(e.parameter);
        break;
      case 'verify_otp':
        result = handleVerifyOTP(e.parameter);
        break;
      case 'reset_password':
        result = handleResetPassword(e.parameter);
        break;
      case 'change_password':
        result = handleChangePassword(e.parameter);
        break;
        
      // Users
      case 'get_users':
        result = handleGetUsers(e.parameter);
        break;
      case 'add_user':
        result = handleAddUser(e.parameter);
        break;
      case 'update_user':
        result = handleUpdateUser(e.parameter);
        break;
      case 'delete_user':
        result = handleDeleteUser(e.parameter);
        break;
        
      // Players
      case 'get_players':
        result = handleGetPlayers(e.parameter);
        break;
      case 'add_player':
        result = handleAddPlayer(e.parameter);
        break;
      case 'update_player':
        result = handleUpdatePlayer(e.parameter);
        break;
      case 'delete_player':
        result = handleDeletePlayer(e.parameter);
        break;
        
      // Income/Collections
      case 'get_income':
        result = handleGetIncome(e.parameter);
        break;
      case 'add_income':
        result = handleAddIncome(e.parameter);
        break;
      case 'update_income':
        result = handleUpdateIncome(e.parameter);
        break;
      case 'delete_income':
        result = handleDeleteIncome(e.parameter);
        break;
        
      // Expenses
      case 'get_expenses':
        result = handleGetExpenses(e.parameter);
        break;
      case 'add_expense':
        result = handleAddExpense(e.parameter);
        break;
      case 'update_expense':
        result = handleUpdateExpense(e.parameter);
        break;
      case 'delete_expense':
        result = handleDeleteExpense(e.parameter);
        break;
        
      // Dashboard
      case 'get_dashboard_stats':
        result = handleGetDashboardStats(e.parameter);
        break;
        
      // Reports
      case 'get_monthly_report':
        result = handleGetMonthlyReport(e.parameter);
        break;
        
      // Logs
      case 'get_logs':
        result = handleGetLogs(e.parameter);
        break;
      case 'add_log':
        result = handleAddLog(e.parameter);
        break;
        
      // Settings
      case 'get_settings':
        result = handleGetSettings(e.parameter);
        break;
      case 'update_settings':
        result = handleUpdateSettings(e.parameter);
        break;
        
      // File Upload
      case 'upload_photo':
        result = handleUploadPhoto(e.parameter);
        break;
        
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Authentication Functions
 */

function handleLogin(params) {
  try {
    const username = params.username;
    const password = params.password;
    
    if (!username || !password) {
      return { success: false, message: 'Username and password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    // Find user by email or username
    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === username.toLowerCase()) ||
      (u.name && u.name.toLowerCase() === username.toLowerCase())
    );
    
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Verify password (in production, use proper password hashing)
    if (user.password !== password) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return { success: false, message: 'Account is inactive' };
    }
    
    // Update last login
    updateUserLastLogin(user.email);
    
    // Generate token (simple timestamp-based for demo)
    const token = generateAuthToken(user.email);
    
    // Log the login
    addLog(user.email, user.role, 'LOGIN', 'User logged in');
    
    return {
      success: true,
      user: {
        id: user.email,
        email: user.email,
        name: user.name,
        role: user.role,
        needs_password_change: user.needs_password_change === 'TRUE',
        photo_url: user.photo_url || null,
        last_login: user.last_login
      },
      token: token
    };
    
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return { success: false, message: 'Login failed' };
  }
}

function handleLogout(params) {
  // In a real implementation, you might invalidate the token
  return { success: true, message: 'Logged out successfully' };
}

function handleForgotPassword(params) {
  try {
    const email = params.email;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, message: 'Email not found' };
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in user record
    updateUserResetToken(email, otp, expiry.toISOString());
    
    // Send OTP email
    sendOTPEmail(email, otp, user.name);
    
    return { success: true, message: 'OTP sent to your email' };
    
  } catch (error) {
    Logger.log('Forgot password error: ' + error.toString());
    return { success: false, message: 'Failed to send OTP' };
  }
}

function handleVerifyOTP(params) {
  try {
    const email = params.email;
    const otp = params.otp;
    
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Check OTP
    if (user.resetToken !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }
    
    // Check expiry
    if (new Date() > new Date(user.resetTokenExpiry)) {
      return { success: false, message: 'OTP expired' };
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    updateUserResetToken(email, resetToken, new Date(Date.now() + 30 * 60 * 1000).toISOString());
    
    return { success: true, message: 'OTP verified', resetToken: resetToken };
    
  } catch (error) {
    Logger.log('Verify OTP error: ' + error.toString());
    return { success: false, message: 'OTP verification failed' };
  }
}

function handleResetPassword(params) {
  try {
    const resetToken = params.resetToken;
    const newPassword = params.newPassword;
    
    if (!resetToken || !newPassword) {
      return { success: false, message: 'Reset token and new password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.resetToken === resetToken);
    
    if (!user) {
      return { success: false, message: 'Invalid reset token' };
    }
    
    // Check expiry
    if (new Date() > new Date(user.resetTokenExpiry)) {
      return { success: false, message: 'Reset token expired' };
    }
    
    // Update password
    updateUserPassword(user.email, newPassword);
    
    // Clear reset token
    updateUserResetToken(user.email, '', '');
    
    return { success: true, message: 'Password reset successfully' };
    
  } catch (error) {
    Logger.log('Reset password error: ' + error.toString());
    return { success: false, message: 'Password reset failed' };
  }
}

function handleChangePassword(params) {
  try {
    // Verify user token first
    const user = verifyToken(params.token);
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const currentPassword = params.currentPassword;
    const newPassword = params.newPassword;
    
    if (!newPassword) {
      return { success: false, message: 'New password is required' };
    }
    
    // If current password is provided, verify it
    if (currentPassword) {
      const usersSheet = getSheet(SHEETS.USERS);
      const users = getSheetData(usersSheet);
      
      const userRecord = users.find(u => u.email === user.email);
      if (!userRecord || userRecord.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }
    }
    
    // Update password
    updateUserPassword(user.email, newPassword);
    
    // Clear needs_password_change flag
    updateUserPasswordChangeFlag(user.email, false);
    
    return { success: true, message: 'Password changed successfully' };
    
  } catch (error) {
    Logger.log('Change password error: ' + error.toString());
    return { success: false, message: 'Password change failed' };
  }
}

/**
 * Player Management Functions
 */

function handleGetPlayers(params) {
  try {
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const players = getSheetData(playersSheet);
    
    let filteredPlayers = players;
    
    // Filter by month if specified
    if (params.month) {
      filteredPlayers = players.filter(player => {
        try {
          const monthlyStatus = JSON.parse(player.MonthlyStatus || '{}');
          return monthlyStatus[params.month] === true;
        } catch (e) {
          return false;
        }
      });
    }
    
    return { success: true, data: filteredPlayers };
    
  } catch (error) {
    Logger.log('Get players error: ' + error.toString());
    return { success: false, message: 'Failed to get players' };
  }
}

function handleAddPlayer(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user || !hasPermission(user.role, 'add')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const newId = generateId();
    
    const playerData = [
      newId,
      params.Name,
      params.Phone,
      params.Email || '',
      params.Status,
      params.JoinDate,
      new Date().toISOString(),
      params.MonthlyStatus || '{}'
    ];
    
    playersSheet.appendRow(playerData);
    
    // Log the action
    addLog(user.email, user.role, 'PLAYER_ADD', `Added player: ${params.Name}`);
    
    return { success: true, message: 'Player added successfully', data: { ID: newId } };
    
  } catch (error) {
    Logger.log('Add player error: ' + error.toString());
    return { success: false, message: 'Failed to add player' };
  }
}

function handleUpdatePlayer(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user || !hasPermission(user.role, 'edit')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const data = playersSheet.getDataRange().getValues();
    
    // Find player row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.playerId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    // Update player data
    playersSheet.getRange(rowIndex, 2).setValue(params.Name);
    playersSheet.getRange(rowIndex, 3).setValue(params.Phone);
    playersSheet.getRange(rowIndex, 4).setValue(params.Email || '');
    playersSheet.getRange(rowIndex, 5).setValue(params.Status);
    playersSheet.getRange(rowIndex, 6).setValue(params.JoinDate);
    
    // Log the action
    addLog(user.email, user.role, 'PLAYER_UPDATE', `Updated player: ${params.Name}`);
    
    return { success: true, message: 'Player updated successfully' };
    
  } catch (error) {
    Logger.log('Update player error: ' + error.toString());
    return { success: false, message: 'Failed to update player' };
  }
}

function handleDeletePlayer(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user || !hasPermission(user.role, 'delete')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const data = playersSheet.getDataRange().getValues();
    
    // Find player row
    let rowIndex = -1;
    let playerName = '';
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.playerId) {
        rowIndex = i + 1;
        playerName = data[i][1];
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    // Delete row
    playersSheet.deleteRow(rowIndex);
    
    // Log the action
    addLog(user.email, user.role, 'PLAYER_DELETE', `Deleted player: ${playerName}`);
    
    return { success: true, message: 'Player deleted successfully' };
    
  } catch (error) {
    Logger.log('Delete player error: ' + error.toString());
    return { success: false, message: 'Failed to delete player' };
  }
}

/**
 * Dashboard Functions
 */

function handleGetDashboardStats(params) {
  try {
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const incomeSheet = getSheet(SHEETS.INCOME);
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    
    const players = getSheetData(playersSheet);
    const income = getSheetData(incomeSheet);
    const expenses = getSheetData(expensesSheet);
    
    let filteredIncome = income;
    let filteredExpenses = expenses;
    let activePlayers = 0;
    
    // Filter by month if specified
    if (params.month) {
      filteredIncome = income.filter(item => item.Month === params.month);
      filteredExpenses = expenses.filter(item => item.Month === params.month);
      
      // Count active players for the month
      activePlayers = players.filter(player => {
        try {
          const monthlyStatus = JSON.parse(player.MonthlyStatus || '{}');
          return monthlyStatus[params.month] === true;
        } catch (e) {
          return false;
        }
      }).length;
    } else {
      // Count all active players
      activePlayers = players.filter(player => player.Status === 'active').length;
    }
    
    const totalIncome = filteredIncome.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
    
    return {
      success: true,
      data: {
        totalPlayers: activePlayers,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        balance: totalIncome - totalExpenses
      }
    };
    
  } catch (error) {
    Logger.log('Get dashboard stats error: ' + error.toString());
    return { success: false, message: 'Failed to get dashboard stats' };
  }
}

/**
 * Income/Collection Functions
 */

function handleGetIncome(params) {
  try {
    const incomeSheet = getSheet(SHEETS.INCOME);
    const income = getSheetData(incomeSheet);
    
    let filteredIncome = income;
    
    // Filter by month if specified
    if (params.month) {
      filteredIncome = income.filter(item => item.Month === params.month);
    }
    
    return { success: true, data: filteredIncome };
    
  } catch (error) {
    Logger.log('Get income error: ' + error.toString());
    return { success: false, message: 'Failed to get income data' };
  }
}

function handleAddIncome(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user || !hasPermission(user.role, 'add')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const incomeSheet = getSheet(SHEETS.INCOME);
    const newId = generateId();
    
    // Get month from date
    const month = getMonthFromDate(params.Date);
    
    const incomeData = [
      newId,
      params.Date,
      params.PlayerId,
      params.PlayerName,
      params.Amount,
      params.Description || '',
      new Date().toISOString(),
      month
    ];
    
    incomeSheet.appendRow(incomeData);
    
    // Log the action
    addLog(user.email, user.role, 'INCOME_ADD', `Added income: ${params.Amount} from ${params.PlayerName}`);
    
    return { success: true, message: 'Income added successfully', data: { ID: newId } };
    
  } catch (error) {
    Logger.log('Add income error: ' + error.toString());
    return { success: false, message: 'Failed to add income' };
  }
}

/**
 * Expense Functions
 */

function handleGetExpenses(params) {
  try {
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    const expenses = getSheetData(expensesSheet);
    
    let filteredExpenses = expenses;
    
    // Filter by month if specified
    if (params.month) {
      filteredExpenses = expenses.filter(item => item.Month === params.month);
    }
    
    return { success: true, data: filteredExpenses };
    
  } catch (error) {
    Logger.log('Get expenses error: ' + error.toString());
    return { success: false, message: 'Failed to get expenses data' };
  }
}

function handleAddExpense(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user || !hasPermission(user.role, 'add')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    const newId = generateId();
    
    // Get month from date
    const month = getMonthFromDate(params.Date);
    
    const expenseData = [
      newId,
      params.Date,
      params.Category,
      params.Amount,
      params.Description,
      new Date().toISOString(),
      month
    ];
    
    expensesSheet.appendRow(expenseData);
    
    // Log the action
    addLog(user.email, user.role, 'EXPENSE_ADD', `Added expense: ${params.Amount} - ${params.Description}`);
    
    return { success: true, message: 'Expense added successfully', data: { ID: newId } };
    
  } catch (error) {
    Logger.log('Add expense error: ' + error.toString());
    return { success: false, message: 'Failed to add expense' };
  }
}

/**
 * Logs Functions
 */

function handleGetLogs(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user || !hasPermission(user.role, 'logs')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const logsSheet = getSheet(SHEETS.LOGS);
    const logs = getSheetData(logsSheet);
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return { success: true, data: logs };
    
  } catch (error) {
    Logger.log('Get logs error: ' + error.toString());
    return { success: false, message: 'Failed to get logs' };
  }
}

function handleAddLog(params) {
  try {
    // Verify user token
    const user = verifyToken(params.token);
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    
    addLog(user.email, user.role, params.action, params.details);
    
    return { success: true, message: 'Log added' };
    
  } catch (error) {
    Logger.log('Add log error: ' + error.toString());
    return { success: false, message: 'Failed to add log' };
  }
}

/**
 * Utility Functions
 */

function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    // Create sheet if it doesn't exist
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

function initializeSheet(sheet, sheetName) {
  let headers = [];
  
  switch (sheetName) {
    case SHEETS.USERS:
      headers = ['email', 'password', 'role', 'name', 'needs_password_change', 'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry', 'photo_url'];
      break;
    case SHEETS.PLAYERS:
      headers = ['ID', 'Name', 'Phone', 'Email', 'Status', 'JoinDate', 'CreatedAt', 'MonthlyStatus'];
      break;
    case SHEETS.INCOME:
      headers = ['ID', 'Date', 'PlayerId', 'PlayerName', 'Amount', 'Description', 'CreatedAt', 'Month'];
      break;
    case SHEETS.EXPENSES:
      headers = ['ID', 'Date', 'Category', 'Amount', 'Description', 'CreatedAt', 'Month'];
      break;
    case SHEETS.LOGS:
      headers = ['timestamp', 'user', 'role', 'action', 'details'];
      break;
    case SHEETS.SETTINGS:
      headers = ['key', 'value'];
      break;
  }
  
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function generateId() {
  return Utilities.getUuid();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAuthToken(email) {
  return Utilities.base64Encode(email + ':' + Date.now());
}

function generateResetToken() {
  return Utilities.getUuid();
}

function verifyToken(token) {
  if (!token) return null;
  
  try {
    const decoded = Utilities.base64Decode(token);
    const parts = decoded.split(':');
    if (parts.length !== 2) return null;
    
    const email = parts[0];
    const timestamp = parseInt(parts[1]);
    
    // Token expires after 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return { email: email };
  } catch (e) {
    return null;
  }
}

function hasPermission(role, action) {
  const permissions = {
    admin: ['view', 'add', 'edit', 'delete', 'admin', 'logs'],
    view_edit: ['view', 'add', 'edit', 'delete'],
    view: ['view']
  };
  
  return permissions[role] && permissions[role].includes(action);
}

function addLog(user, role, action, details) {
  try {
    const logsSheet = getSheet(SHEETS.LOGS);
    const logData = [
      new Date().toISOString(),
      user,
      role,
      action,
      details
    ];
    logsSheet.appendRow(logData);
  } catch (error) {
    Logger.log('Add log error: ' + error.toString());
  }
}

function getMonthFromDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

function updateUserLastLogin(email) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        usersSheet.getRange(i + 1, 7).setValue(new Date().toISOString());
        break;
      }
    }
  } catch (error) {
    Logger.log('Update last login error: ' + error.toString());
  }
}

function updateUserResetToken(email, token, expiry) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        usersSheet.getRange(i + 1, 9).setValue(token);
        usersSheet.getRange(i + 1, 10).setValue(expiry);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update reset token error: ' + error.toString());
  }
}

function updateUserPassword(email, newPassword) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        usersSheet.getRange(i + 1, 2).setValue(newPassword);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update password error: ' + error.toString());
  }
}

function updateUserPasswordChangeFlag(email, needsChange) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        usersSheet.getRange(i + 1, 5).setValue(needsChange ? 'TRUE' : 'FALSE');
        break;
      }
    }
  } catch (error) {
    Logger.log('Update password change flag error: ' + error.toString());
  }
}

function sendOTPEmail(email, otp, name) {
  try {
    const subject = `${CONFIG.APP_NAME} - Password Reset OTP`;
    const body = `
Hello ${name},

You have requested to reset your password for ${CONFIG.APP_NAME}.

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
${CONFIG.APP_NAME} Team
    `;
    
    MailApp.sendEmail(email, subject, body);
  } catch (error) {
    Logger.log('Send OTP email error: ' + error.toString());
  }
}

// Placeholder functions for unimplemented features
function handleGetUsers(params) { return { success: false, message: 'Not implemented' }; }
function handleAddUser(params) { return { success: false, message: 'Not implemented' }; }
function handleUpdateUser(params) { return { success: false, message: 'Not implemented' }; }
function handleDeleteUser(params) { return { success: false, message: 'Not implemented' }; }
function handleUpdateIncome(params) { return { success: false, message: 'Not implemented' }; }
function handleDeleteIncome(params) { return { success: false, message: 'Not implemented' }; }
function handleUpdateExpense(params) { return { success: false, message: 'Not implemented' }; }
function handleDeleteExpense(params) { return { success: false, message: 'Not implemented' }; }
function handleGetMonthlyReport(params) { return { success: false, message: 'Not implemented' }; }
function handleGetSettings(params) { return { success: false, message: 'Not implemented' }; }
function handleUpdateSettings(params) { return { success: false, message: 'Not implemented' }; }
function handleUploadPhoto(params) { return { success: false, message: 'Not implemented' }; }