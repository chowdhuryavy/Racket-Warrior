// Google Apps Script Backend for Racket Warrior
// Configuration
const CONFIG = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE', // Replace with your actual Google Sheet ID
  EMAIL_FROM: 'your-email@gmail.com', // Replace with your email
  BASE_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec' // Replace with your script URL
};

const SHEETS = {
  USERS: 'Users',
  PLAYERS: 'Players', 
  INCOME: 'Income',
  EXPENSES: 'Expenses',
  LOGS: 'Logs',
  SETTINGS: 'Settings'
};

// Main handlers
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'health_check') {
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Server is running' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, message: 'GET method not supported for this action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  
  try {
    let result = { success: false, message: 'Invalid action' };
    
    switch (action) {
      // Authentication
      case 'login': result = handleLogin(e.parameter); break;
      case 'logout': result = handleLogout(e.parameter); break;
      case 'forgot_password': result = handleForgotPassword(e.parameter); break;
      case 'verify_otp': result = handleVerifyOTP(e.parameter); break;
      case 'reset_password': result = handleResetPassword(e.parameter); break;
      case 'change_password': result = handleChangePassword(e.parameter); break;
        
      // Users
      case 'get_users': result = handleGetUsers(e.parameter); break;
      case 'add_user': result = handleAddUser(e.parameter); break;
      case 'update_user': result = handleUpdateUser(e.parameter); break;
      case 'delete_user': result = handleDeleteUser(e.parameter); break;
        
      // Players
      case 'get_players': result = handleGetPlayers(e.parameter); break;
      case 'add_player': result = handleAddPlayer(e.parameter); break;
      case 'update_player': result = handleUpdatePlayer(e.parameter); break;
      case 'delete_player': result = handleDeletePlayer(e.parameter); break;
        
      // Income/Collections
      case 'get_income': result = handleGetIncome(e.parameter); break;
      case 'add_income': result = handleAddIncome(e.parameter); break;
      case 'update_income': result = handleUpdateIncome(e.parameter); break;
      case 'delete_income': result = handleDeleteIncome(e.parameter); break;
        
      // Expenses
      case 'get_expenses': result = handleGetExpenses(e.parameter); break;
      case 'add_expense': result = handleAddExpense(e.parameter); break;
      case 'update_expense': result = handleUpdateExpense(e.parameter); break;
      case 'delete_expense': result = handleDeleteExpense(e.parameter); break;
        
      // Dashboard
      case 'get_dashboard_stats': result = handleGetDashboardStats(e.parameter); break;
        
      // Reports
      case 'get_monthly_report': result = handleGetMonthlyReport(e.parameter); break;
        
      // Logs
      case 'get_logs': result = handleGetLogs(e.parameter); break;
      case 'add_log': result = handleAddLog(e.parameter); break;
        
      // Settings
      case 'get_settings': result = handleGetSettings(e.parameter); break;
      case 'update_settings': result = handleUpdateSettings(e.parameter); break;
        
      // File Upload
      case 'upload_photo': result = handleUploadPhoto(e.parameter); break;
        
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

// Authentication handlers
function handleLogin(params) {
  try {
    const { username, password } = params;
    
    if (!username || !password) {
      return { success: false, message: 'Username and password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === username && u.password === password);
    
    if (!user) {
      addLog('FAILED_LOGIN', `Failed login attempt for ${username}`);
      return { success: false, message: 'Invalid username or password' };
    }
    
    if (user.status !== 'active') {
      return { success: false, message: 'Account is inactive' };
    }
    
    const token = generateAuthToken();
    
    updateUserLastLogin(user.email, token);
    addLog('LOGIN', `User ${user.name} logged in`);
    
    return {
      success: true,
      message: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        needs_password_change: user.needs_password_change === 'true',
        photo_url: user.photo_url || ''
      },
      token: token
    };
  } catch (error) {
    Logger.log('Login Error: ' + error.toString());
    return { success: false, message: 'Login failed' };
  }
}

function handleLogout(params) {
  try {
    const { token } = params;
    
    if (!token) {
      return { success: false, message: 'Token is required' };
    }
    
    addLog('LOGOUT', 'User logged out');
    
    return { success: true, message: 'Logout successful' };
  } catch (error) {
    Logger.log('Logout Error: ' + error.toString());
    return { success: false, message: 'Logout failed' };
  }
}

function handleForgotPassword(params) {
  try {
    const { email } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Email not found' };
    }
    
    const otp = generateOTP();
    
    updateUserResetToken(email, otp, new Date(Date.now() + 10 * 60 * 1000));
    
    sendOTPEmail(email, otp);
    
    addLog('FORGOT_PASSWORD', `Password reset requested for ${email}`);
    
    return { success: true, message: 'OTP sent to your email' };
  } catch (error) {
    Logger.log('Forgot Password Error: ' + error.toString());
    return { success: false, message: 'Failed to send OTP' };
  }
}

function handleVerifyOTP(params) {
  try {
    const { email, otp } = params;
    
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    if (user.resetToken !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }
    
    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);
    
    if (now > expiry) {
      return { success: false, message: 'OTP has expired' };
    }
    
    const resetToken = generateResetToken();
    updateUserResetToken(email, resetToken, new Date(Date.now() + 30 * 60 * 1000));
    
    addLog('OTP_VERIFIED', `OTP verified for ${email}`);
    
    return { success: true, message: 'OTP verified', resetToken: resetToken };
  } catch (error) {
    Logger.log('Verify OTP Error: ' + error.toString());
    return { success: false, message: 'OTP verification failed' };
  }
}

function handleResetPassword(params) {
  try {
    const { email, resetToken, newPassword } = params;
    
    if (!email || !resetToken || !newPassword) {
      return { success: false, message: 'Email, reset token, and new password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    if (user.resetToken !== resetToken) {
      return { success: false, message: 'Invalid reset token' };
    }
    
    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);
    
    if (now > expiry) {
      return { success: false, message: 'Reset token has expired' };
    }
    
    updateUserPassword(email, newPassword);
    updateUserResetToken(email, '', '');
    
    addLog('PASSWORD_RESET', `Password reset for ${email}`);
    
    return { success: true, message: 'Password reset successful' };
  } catch (error) {
    Logger.log('Reset Password Error: ' + error.toString());
    return { success: false, message: 'Password reset failed' };
  }
}

function handleChangePassword(params) {
  try {
    const { token, currentPassword, newPassword } = params;
    
    if (!token || !currentPassword || !newPassword) {
      return { success: false, message: 'Current password and new password are required' };
    }
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const userRecord = users.find(u => u.email === user.email);
    
    if (!userRecord || userRecord.password !== currentPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    updateUserPassword(user.email, newPassword);
    updateUserPasswordChangeFlag(user.email, 'false');
    
    addLog('PASSWORD_CHANGED', `Password changed for ${user.email}`);
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    Logger.log('Change Password Error: ' + error.toString());
    return { success: false, message: 'Password change failed' };
  }
}

// User management handlers
function handleGetUsers(params) {
  try {
    const { token } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Access denied' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    const sanitizedUsers = users.map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
      last_login: u.last_login,
      photo_url: u.photo_url || ''
    }));
    
    return { success: true, data: sanitizedUsers };
  } catch (error) {
    Logger.log('Get Users Error: ' + error.toString());
    return { success: false, message: 'Failed to get users' };
  }
}

function handleAddUser(params) {
  try {
    const { token, email, name, role, password } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Access denied' };
    }
    
    if (!email || !name || !role || !password) {
      return { success: false, message: 'Email, name, role, and password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const users = getSheetData(usersSheet);
    
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    const newUser = [
      email,
      password,
      role,
      name,
      'true', // needs_password_change
      new Date().toISOString(),
      '',
      'active',
      '',
      '',
      '' // photo_url
    ];
    
    usersSheet.appendRow(newUser);
    
    addLog('USER_ADDED', `User ${name} (${email}) added by ${user.email}`);
    
    // Send welcome email
    try {
      sendWelcomeEmail(email, name, password);
    } catch (emailError) {
      Logger.log('Welcome email error: ' + emailError.toString());
    }
    
    return { success: true, message: 'User added successfully' };
  } catch (error) {
    Logger.log('Add User Error: ' + error.toString());
    return { success: false, message: 'Failed to add user' };
  }
}

function handleUpdateUser(params) {
  try {
    const { token, email, name, role, status } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Access denied' };
    }
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        if (name) data[i][3] = name;
        if (role) data[i][2] = role;
        if (status) data[i][7] = status;
        
        usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        
        addLog('USER_UPDATED', `User ${email} updated by ${user.email}`);
        
        return { success: true, message: 'User updated successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Update User Error: ' + error.toString());
    return { success: false, message: 'Failed to update user' };
  }
}

function handleDeleteUser(params) {
  try {
    const { token, email } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Access denied' };
    }
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    if (email === user.email) {
      return { success: false, message: 'Cannot delete your own account' };
    }
    
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        usersSheet.deleteRow(i + 1);
        
        addLog('USER_DELETED', `User ${email} deleted by ${user.email}`);
        
        return { success: true, message: 'User deleted successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Delete User Error: ' + error.toString());
    return { success: false, message: 'Failed to delete user' };
  }
}

// Player Management Functions
function handleGetPlayers(params) {
  try {
    const { token, month } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    let players = getSheetData(playersSheet);
    
    // Filter by month if provided
    if (month) {
      players = players.filter(player => {
        // Check if player was active in the specified month
        // This logic can be enhanced based on your MonthlyStatus field structure
        return player.MonthlyStatus && player.MonthlyStatus.split(',').some(status => {
          const [statusMonth, statusValue] = status.split(':');
          return statusMonth === month && statusValue === 'active';
        });
      });
    }
    
    return { success: true, data: players };
    
  } catch (error) {
    Logger.log('handleGetPlayers Error: ' + error.toString());
    return { success: false, message: 'Failed to get players: ' + error.toString() };
  }
}

function handleAddPlayer(params) {
  try {
    const { token, name, phone, email, status } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!name || !phone) {
      return { success: false, message: 'Name and phone are required' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const players = getSheetData(playersSheet);
    
    // Check if phone already exists
    if (players.find(p => p.Phone === phone)) {
      return { success: false, message: 'Phone number already exists' };
    }
    
    const playerId = generateId();
    const currentDate = new Date().toISOString();
    const currentMonth = getMonthFromDate(new Date());
    
    const newPlayer = [
      playerId,
      name,
      phone,
      email || '',
      status || 'active',
      currentDate.split('T')[0], // JoinDate
      currentDate,
      `${currentMonth}:${status || 'active'}` // MonthlyStatus
    ];
    
    playersSheet.appendRow(newPlayer);
    
    addLog(token, 'unknown', 'PLAYER_ADDED', `New player added: ${name} (${phone})`);
    
    return { success: true, message: 'Player added successfully', playerId: playerId };
    
  } catch (error) {
    Logger.log('handleAddPlayer Error: ' + error.toString());
    return { success: false, message: 'Failed to add player: ' + error.toString() };
  }
}

function handleUpdatePlayer(params) {
  try {
    const { token, playerId, name, phone, email, status } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!playerId) {
      return { success: false, message: 'Player ID is required' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const data = playersSheet.getDataRange().getValues();
    const headers = data[0];
    
    const playerRowIndex = data.findIndex((row, index) => index > 0 && row[0] === playerId);
    
    if (playerRowIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    const actualRowIndex = playerRowIndex + 1;
    
    // Update fields if provided
    if (name) {
      const nameColIndex = headers.indexOf('Name') + 1;
      playersSheet.getRange(actualRowIndex, nameColIndex).setValue(name);
    }
    
    if (phone) {
      const phoneColIndex = headers.indexOf('Phone') + 1;
      playersSheet.getRange(actualRowIndex, phoneColIndex).setValue(phone);
    }
    
    if (email !== undefined) {
      const emailColIndex = headers.indexOf('Email') + 1;
      playersSheet.getRange(actualRowIndex, emailColIndex).setValue(email);
    }
    
    if (status) {
      const statusColIndex = headers.indexOf('Status') + 1;
      playersSheet.getRange(actualRowIndex, statusColIndex).setValue(status);
      
      // Update monthly status
      const currentMonth = getMonthFromDate(new Date());
      const monthlyStatusColIndex = headers.indexOf('MonthlyStatus') + 1;
      const currentMonthlyStatus = data[playerRowIndex][monthlyStatusColIndex - 1] || '';
      
      // Parse existing monthly status and update current month
      let monthlyStatusObj = {};
      if (currentMonthlyStatus) {
        const statusPairs = currentMonthlyStatus.split(',');
        statusPairs.forEach(pair => {
          const [month, stat] = pair.split(':');
          if (month && stat) {
            monthlyStatusObj[month] = stat;
          }
        });
      }
      
      monthlyStatusObj[currentMonth] = status;
      
      const newMonthlyStatus = Object.entries(monthlyStatusObj)
        .map(([month, stat]) => `${month}:${stat}`)
        .join(',');
      
      playersSheet.getRange(actualRowIndex, monthlyStatusColIndex).setValue(newMonthlyStatus);
    }
    
    addLog(token, 'unknown', 'PLAYER_UPDATED', `Player updated: ${playerId}`);
    
    return { success: true, message: 'Player updated successfully' };
    
  } catch (error) {
    Logger.log('handleUpdatePlayer Error: ' + error.toString());
    return { success: false, message: 'Failed to update player: ' + error.toString() };
  }
}

function handleDeletePlayer(params) {
  try {
    const { token, playerId } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!playerId) {
      return { success: false, message: 'Player ID is required' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const data = playersSheet.getDataRange().getValues();
    
    const playerRowIndex = data.findIndex((row, index) => index > 0 && row[0] === playerId);
    
    if (playerRowIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    const actualRowIndex = playerRowIndex + 1;
    playersSheet.deleteRow(actualRowIndex);
    
    addLog(token, 'unknown', 'PLAYER_DELETED', `Player deleted: ${playerId}`);
    
    return { success: true, message: 'Player deleted successfully' };
    
  } catch (error) {
    Logger.log('handleDeletePlayer Error: ' + error.toString());
    return { success: false, message: 'Failed to delete player: ' + error.toString() };
  }
}

// Income/Collection Functions
function handleGetIncome(params) {
  try {
    const { token, month } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    const incomeSheet = getSheet(SHEETS.INCOME);
    let income = getSheetData(incomeSheet);
    
    // Filter by month if provided
    if (month) {
      income = income.filter(record => record.Month === month);
    }
    
    return { success: true, data: income };
    
  } catch (error) {
    Logger.log('handleGetIncome Error: ' + error.toString());
    return { success: false, message: 'Failed to get income: ' + error.toString() };
  }
}

function handleAddIncome(params) {
  try {
    const { token, date, playerId, playerName, amount, description } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!date || !playerId || !amount) {
      return { success: false, message: 'Date, player ID, and amount are required' };
    }
    
    const incomeId = generateId();
    const currentDate = new Date().toISOString();
    const month = getMonthFromDate(new Date(date));
    
    const newIncome = [
      incomeId,
      date,
      playerId,
      playerName || '',
      parseFloat(amount),
      description || '',
      currentDate,
      month
    ];
    
    const incomeSheet = getSheet(SHEETS.INCOME);
    incomeSheet.appendRow(newIncome);
    
    addLog(token, 'unknown', 'INCOME_ADDED', `New income added: ${amount} from ${playerName || playerId}`);
    
    return { success: true, message: 'Income added successfully', incomeId: incomeId };
    
  } catch (error) {
    Logger.log('handleAddIncome Error: ' + error.toString());
    return { success: false, message: 'Failed to add income: ' + error.toString() };
  }
}

function handleUpdateIncome(params) {
  try {
    const { token, incomeId, date, playerId, playerName, amount, description } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!incomeId) {
      return { success: false, message: 'Income ID is required' };
    }
    
    const incomeSheet = getSheet(SHEETS.INCOME);
    const data = incomeSheet.getDataRange().getValues();
    const headers = data[0];
    
    const incomeRowIndex = data.findIndex((row, index) => index > 0 && row[0] === incomeId);
    
    if (incomeRowIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }
    
    const actualRowIndex = incomeRowIndex + 1;
    
    // Update fields if provided
    if (date) {
      const dateColIndex = headers.indexOf('Date') + 1;
      incomeSheet.getRange(actualRowIndex, dateColIndex).setValue(date);
      
      // Update month
      const monthColIndex = headers.indexOf('Month') + 1;
      const month = getMonthFromDate(new Date(date));
      incomeSheet.getRange(actualRowIndex, monthColIndex).setValue(month);
    }
    
    if (playerId) {
      const playerIdColIndex = headers.indexOf('PlayerId') + 1;
      incomeSheet.getRange(actualRowIndex, playerIdColIndex).setValue(playerId);
    }
    
    if (playerName !== undefined) {
      const playerNameColIndex = headers.indexOf('PlayerName') + 1;
      incomeSheet.getRange(actualRowIndex, playerNameColIndex).setValue(playerName);
    }
    
    if (amount) {
      const amountColIndex = headers.indexOf('Amount') + 1;
      incomeSheet.getRange(actualRowIndex, amountColIndex).setValue(parseFloat(amount));
    }
    
    if (description !== undefined) {
      const descColIndex = headers.indexOf('Description') + 1;
      incomeSheet.getRange(actualRowIndex, descColIndex).setValue(description);
    }
    
    addLog(token, 'unknown', 'INCOME_UPDATED', `Income updated: ${incomeId}`);
    
    return { success: true, message: 'Income updated successfully' };
    
  } catch (error) {
    Logger.log('handleUpdateIncome Error: ' + error.toString());
    return { success: false, message: 'Failed to update income: ' + error.toString() };
  }
}

function handleDeleteIncome(params) {
  try {
    const { token, incomeId } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!incomeId) {
      return { success: false, message: 'Income ID is required' };
    }
    
    const incomeSheet = getSheet(SHEETS.INCOME);
    const data = incomeSheet.getDataRange().getValues();
    
    const incomeRowIndex = data.findIndex((row, index) => index > 0 && row[0] === incomeId);
    
    if (incomeRowIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }
    
    const actualRowIndex = incomeRowIndex + 1;
    incomeSheet.deleteRow(actualRowIndex);
    
    addLog(token, 'unknown', 'INCOME_DELETED', `Income deleted: ${incomeId}`);
    
    return { success: true, message: 'Income deleted successfully' };
    
  } catch (error) {
    Logger.log('handleDeleteIncome Error: ' + error.toString());
    return { success: false, message: 'Failed to delete income: ' + error.toString() };
  }
}

// Expense Functions
function handleGetExpenses(params) {
  try {
    const { token, month } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    let expenses = getSheetData(expensesSheet);
    
    // Filter by month if provided
    if (month) {
      expenses = expenses.filter(record => record.Month === month);
    }
    
    return { success: true, data: expenses };
    
  } catch (error) {
    Logger.log('handleGetExpenses Error: ' + error.toString());
    return { success: false, message: 'Failed to get expenses: ' + error.toString() };
  }
}

function handleAddExpense(params) {
  try {
    const { token, date, category, amount, description } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!date || !category || !amount) {
      return { success: false, message: 'Date, category, and amount are required' };
    }
    
    const expenseId = generateId();
    const currentDate = new Date().toISOString();
    const month = getMonthFromDate(new Date(date));
    
    const newExpense = [
      expenseId,
      date,
      category,
      parseFloat(amount),
      description || '',
      currentDate,
      month
    ];
    
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    expensesSheet.appendRow(newExpense);
    
    addLog(token, 'unknown', 'EXPENSE_ADDED', `New expense added: ${amount} for ${category}`);
    
    return { success: true, message: 'Expense added successfully', expenseId: expenseId };
    
  } catch (error) {
    Logger.log('handleAddExpense Error: ' + error.toString());
    return { success: false, message: 'Failed to add expense: ' + error.toString() };
  }
}

function handleUpdateExpense(params) {
  try {
    const { token, expenseId, date, category, amount, description } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!expenseId) {
      return { success: false, message: 'Expense ID is required' };
    }
    
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    const data = expensesSheet.getDataRange().getValues();
    const headers = data[0];
    
    const expenseRowIndex = data.findIndex((row, index) => index > 0 && row[0] === expenseId);
    
    if (expenseRowIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }
    
    const actualRowIndex = expenseRowIndex + 1;
    
    // Update fields if provided
    if (date) {
      const dateColIndex = headers.indexOf('Date') + 1;
      expensesSheet.getRange(actualRowIndex, dateColIndex).setValue(date);
      
      // Update month
      const monthColIndex = headers.indexOf('Month') + 1;
      const month = getMonthFromDate(new Date(date));
      expensesSheet.getRange(actualRowIndex, monthColIndex).setValue(month);
    }
    
    if (category) {
      const categoryColIndex = headers.indexOf('Category') + 1;
      expensesSheet.getRange(actualRowIndex, categoryColIndex).setValue(category);
    }
    
    if (amount) {
      const amountColIndex = headers.indexOf('Amount') + 1;
      expensesSheet.getRange(actualRowIndex, amountColIndex).setValue(parseFloat(amount));
    }
    
    if (description !== undefined) {
      const descColIndex = headers.indexOf('Description') + 1;
      expensesSheet.getRange(actualRowIndex, descColIndex).setValue(description);
    }
    
    addLog(token, 'unknown', 'EXPENSE_UPDATED', `Expense updated: ${expenseId}`);
    
    return { success: true, message: 'Expense updated successfully' };
    
  } catch (error) {
    Logger.log('handleUpdateExpense Error: ' + error.toString());
    return { success: false, message: 'Failed to update expense: ' + error.toString() };
  }
}

function handleDeleteExpense(params) {
  try {
    const { token, expenseId } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin', 'view_edit')) {
      return { success: false, message: 'Access denied. Admin or view_edit role required.' };
    }
    
    if (!expenseId) {
      return { success: false, message: 'Expense ID is required' };
    }
    
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    const data = expensesSheet.getDataRange().getValues();
    
    const expenseRowIndex = data.findIndex((row, index) => index > 0 && row[0] === expenseId);
    
    if (expenseRowIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }
    
    const actualRowIndex = expenseRowIndex + 1;
    expensesSheet.deleteRow(actualRowIndex);
    
    addLog(token, 'unknown', 'EXPENSE_DELETED', `Expense deleted: ${expenseId}`);
    
    return { success: true, message: 'Expense deleted successfully' };
    
  } catch (error) {
    Logger.log('handleDeleteExpense Error: ' + error.toString());
    return { success: false, message: 'Failed to delete expense: ' + error.toString() };
  }
}

// Dashboard Functions
function handleGetDashboardStats(params) {
  try {
    const { token, month } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const incomeSheet = getSheet(SHEETS.INCOME);
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    
    let players = getSheetData(playersSheet);
    let income = getSheetData(incomeSheet);
    let expenses = getSheetData(expensesSheet);
    
    // Filter by month if provided
    if (month) {
      // For players, check monthly status
      players = players.filter(player => {
        if (!player.MonthlyStatus) return false;
        const monthlyStatuses = player.MonthlyStatus.split(',');
        return monthlyStatuses.some(status => {
          const [statusMonth, statusValue] = status.split(':');
          return statusMonth === month && statusValue === 'active';
        });
      });
      
      income = income.filter(record => record.Month === month);
      expenses = expenses.filter(record => record.Month === month);
    } else {
      // For "all time", only count currently active players
      players = players.filter(player => player.Status === 'active');
    }
    
    const totalIncome = income.reduce((sum, record) => sum + (parseFloat(record.Amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, record) => sum + (parseFloat(record.Amount) || 0), 0);
    const finalBalance = totalIncome - totalExpenses;
    
    return {
      success: true,
      data: {
        activePlayersCount: players.length,
        totalCollection: totalIncome,
        totalExpense: totalExpenses,
        finalBalance: finalBalance,
        recentPlayers: players.slice(-5).reverse(),
        recentIncome: income.slice(-5).reverse(),
        recentExpenses: expenses.slice(-5).reverse()
      }
    };
    
  } catch (error) {
    Logger.log('handleGetDashboardStats Error: ' + error.toString());
    return { success: false, message: 'Failed to get dashboard stats: ' + error.toString() };
  }
}

// Reports Functions
function handleGetMonthlyReport(params) {
  try {
    const { token, month } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!month) {
      return { success: false, message: 'Month is required for monthly report' };
    }
    
    const playersSheet = getSheet(SHEETS.PLAYERS);
    const incomeSheet = getSheet(SHEETS.INCOME);
    const expensesSheet = getSheet(SHEETS.EXPENSES);
    
    let players = getSheetData(playersSheet);
    let income = getSheetData(incomeSheet);
    let expenses = getSheetData(expensesSheet);
    
    // Filter by month
    const activePlayersInMonth = players.filter(player => {
      if (!player.MonthlyStatus) return false;
      const monthlyStatuses = player.MonthlyStatus.split(',');
      return monthlyStatuses.some(status => {
        const [statusMonth, statusValue] = status.split(':');
        return statusMonth === month && statusValue === 'active';
      });
    });
    
    const monthlyIncome = income.filter(record => record.Month === month);
    const monthlyExpenses = expenses.filter(record => record.Month === month);
    
    const totalIncome = monthlyIncome.reduce((sum, record) => sum + (parseFloat(record.Amount) || 0), 0);
    const totalExpenses = monthlyExpenses.reduce((sum, record) => sum + (parseFloat(record.Amount) || 0), 0);
    const finalBalance = totalIncome - totalExpenses;
    
    // Group expenses by category
    const expensesByCategory = {};
    monthlyExpenses.forEach(expense => {
      const category = expense.Category || 'Other';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += parseFloat(expense.Amount) || 0;
    });
    
    return {
      success: true,
      data: {
        month: month,
        activePlayers: activePlayersInMonth,
        totalCollection: totalIncome,
        totalExpense: totalExpenses,
        finalBalance: finalBalance,
        incomeDetails: monthlyIncome,
        expenseDetails: monthlyExpenses,
        expensesByCategory: expensesByCategory,
        playerCount: activePlayersInMonth.length,
        incomeTransactionCount: monthlyIncome.length,
        expenseTransactionCount: monthlyExpenses.length
      }
    };
    
  } catch (error) {
    Logger.log('handleGetMonthlyReport Error: ' + error.toString());
    return { success: false, message: 'Failed to generate monthly report: ' + error.toString() };
  }
}

// Logs Functions
function handleGetLogs(params) {
  try {
    const { token, limit, offset } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin')) {
      return { success: false, message: 'Access denied. Admin role required.' };
    }
    
    const logsSheet = getSheet(SHEETS.LOGS);
    let logs = getSheetData(logsSheet);
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || 50;
    const paginatedLogs = logs.slice(startIndex, startIndex + limitNum);
    
    return {
      success: true,
      data: paginatedLogs,
      total: logs.length,
      offset: startIndex,
      limit: limitNum
    };
    
  } catch (error) {
    Logger.log('handleGetLogs Error: ' + error.toString());
    return { success: false, message: 'Failed to get logs: ' + error.toString() };
  }
}

function handleAddLog(params) {
  try {
    const { token, action, details } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    const user = getUserFromToken(token); // This would need to be implemented
    addLog(action, details);
    
    return { success: true, message: 'Log added successfully' };
    
  } catch (error) {
    Logger.log('handleAddLog Error: ' + error.toString());
    return { success: false, message: 'Failed to add log: ' + error.toString() };
  }
}

// Settings Functions
function handleGetSettings(params) {
  try {
    const { token } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin')) {
      return { success: false, message: 'Access denied. Admin role required.' };
    }
    
    const settingsSheet = getSheet(SHEETS.SETTINGS);
    const settings = getSheetData(settingsSheet);
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    return { success: true, data: settingsObj };
    
  } catch (error) {
    Logger.log('handleGetSettings Error: ' + error.toString());
    return { success: false, message: 'Failed to get settings: ' + error.toString() };
  }
}

function handleUpdateSettings(params) {
  try {
    const { token, settings } = params;
    
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid session' };
    }
    
    if (!hasPermission(token, 'admin')) {
      return { success: false, message: 'Access denied. Admin role required.' };
    }
    
    if (!settings || typeof settings !== 'object') {
      return { success: false, message: 'Settings object is required' };
    }
    
    const settingsSheet = getSheet(SHEETS.SETTINGS);
    const data = settingsSheet.getDataRange().getValues();
    
    // Update or insert settings
    Object.entries(settings).forEach(([key, value]) => {
      const existingRowIndex = data.findIndex((row, index) => index > 0 && row[0] === key);
      
      if (existingRowIndex > -1) {
        // Update existing setting
        const actualRowIndex = existingRowIndex + 1;
        settingsSheet.getRange(actualRowIndex, 2).setValue(value);
      } else {
        // Insert new setting
        settingsSheet.appendRow([key, value]);
      }
    });
    
    addLog(token, 'admin', 'SETTINGS_UPDATED', `Settings updated: ${Object.keys(settings).join(', ')}`);
    
    return { success: true, message: 'Settings updated successfully' };
    
  } catch (error) {
    Logger.log('handleUpdateSettings Error: ' + error.toString());
    return { success: false, message: 'Failed to update settings: ' + error.toString() };
  }
}

// File Upload Functions
function handleUploadPhoto(params) {
  try {
    const { token, photoData, fileName } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Access denied' };
    }
    
    if (!photoData || !fileName) {
      return { success: false, message: 'Photo data and filename are required' };
    }
    
    try {
      // Create blob from base64 data
      const blob = Utilities.newBlob(
        Utilities.base64Decode(photoData),
        'image/' + fileName.split('.').pop(),
        fileName
      );
      
      // Create or get photos folder in Drive
      const folders = DriveApp.getFoldersByName('Racket Warrior Photos');
      let photosFolder;
      
      if (folders.hasNext()) {
        photosFolder = folders.next();
      } else {
        photosFolder = DriveApp.createFolder('Racket Warrior Photos');
      }
      
      // Upload file
      const file = photosFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const photoUrl = `https://drive.google.com/uc?id=${file.getId()}`;
      
      // Update user's photo URL
      const usersSheet = getSheet(SHEETS.USERS);
      const data = usersSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === user.email) {
          data[i][10] = photoUrl; // photo_url column
          usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
          break;
        }
      }
      
      addLog(token, 'unknown', 'PHOTO_UPLOADED', `Profile photo updated by ${user.email}`);
      
      return { 
        success: true, 
        message: 'Photo uploaded successfully',
        photo_url: photoUrl
      };
    } catch (uploadError) {
      Logger.log('Photo upload error: ' + uploadError.toString());
      return { success: false, message: 'Failed to upload photo' };
    }
  } catch (error) {
    Logger.log('Upload Photo Error: ' + error.toString());
    return { success: false, message: 'Failed to upload photo' };
  }
}

// Utility Functions
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function initializeSheet(sheet, sheetName) {
  const headers = {
    [SHEETS.USERS]: ['email', 'password', 'role', 'name', 'needs_password_change', 'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry', 'photo_url'],
    [SHEETS.PLAYERS]: ['ID', 'Name', 'Phone', 'Email', 'Status', 'JoinDate', 'CreatedAt', 'MonthlyStatus'],
    [SHEETS.INCOME]: ['ID', 'Date', 'PlayerId', 'PlayerName', 'Amount', 'Description', 'CreatedAt', 'Month'],
    [SHEETS.EXPENSES]: ['ID', 'Date', 'Category', 'Amount', 'Description', 'CreatedAt', 'Month'],
    [SHEETS.LOGS]: ['timestamp', 'user', 'role', 'action', 'details'],
    [SHEETS.SETTINGS]: ['key', 'value']
  };
  
  if (headers[sheetName]) {
    sheet.appendRow(headers[sheetName]);
  }
}

function generateId() {
  return 'ID_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAuthToken() {
  return 'AUTH_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
}

function generateResetToken() {
  return 'RST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
}

function verifyToken(token) {
  if (!token) return null;
  
  // In a real implementation, you would validate the token properly
  // For now, we'll do a simple check
  if (token.startsWith('AUTH_')) {
    // Extract user info from token or lookup in database
    // This is a simplified implementation
    return { email: 'user@example.com', role: 'admin' };
  }
  
  return null;
}

function hasPermission(role, action) {
  const permissions = {
    admin: ['view', 'add', 'edit', 'delete', 'admin'],
    view_edit: ['view', 'add', 'edit'],
    view: ['view']
  };
  
  return permissions[role] && permissions[role].includes(action);
}

function addLog(action, details) {
  try {
    const logsSheet = getSheet(SHEETS.LOGS);
    logsSheet.appendRow([
      new Date().toISOString(),
      'System',
      'system',
      action,
      details
    ]);
  } catch (error) {
    Logger.log('Add Log Error: ' + error.toString());
  }
}

function getMonthFromDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function updateUserLastLogin(email, token) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        data[i][6] = new Date().toISOString();
        usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update Last Login Error: ' + error.toString());
  }
}

function updateUserResetToken(email, token, expiry) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        data[i][8] = token;
        data[i][9] = expiry ? expiry.toISOString() : '';
        usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update Reset Token Error: ' + error.toString());
  }
}

function updateUserPassword(email, password) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        data[i][1] = password;
        usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update Password Error: ' + error.toString());
  }
}

function updateUserPasswordChangeFlag(email, flag) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        data[i][4] = flag;
        usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update Password Change Flag Error: ' + error.toString());
  }
}

function updateUserPhoto(email, photoUrl) {
  try {
    const usersSheet = getSheet(SHEETS.USERS);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        data[i][10] = photoUrl;
        usersSheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        break;
      }
    }
  } catch (error) {
    Logger.log('Update User Photo Error: ' + error.toString());
  }
}

function getUserFromToken(token) {
  // In production, decode token to get user info
  // For now, return a placeholder
  return { email: 'admin@example.com', role: 'admin' };
}

function sendOTPEmail(email, otp) {
  try {
    const subject = 'Racket Warrior - Password Reset OTP';
    const body = `
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>You have requested to reset your password for Racket Warrior.</p>
      <p>Your OTP (One-Time Password) is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Racket Warrior Team</p>
    `;
    
    MailApp.sendEmail({
      to: email,
      from: CONFIG.EMAIL_FROM,
      subject: subject,
      htmlBody: body
    });
  } catch (error) {
    Logger.log('Send OTP Email Error: ' + error.toString());
    throw error;
  }
}

function sendWelcomeEmail(email, name, tempPassword) {
  try {
    const subject = 'Welcome to Racket Warrior';
    const body = `
      <h2>Welcome to Racket Warrior!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully.</p>
      <p>Here are your login credentials:</p>
      <ul>
        <li><strong>Username:</strong> ${email}</li>
        <li><strong>Temporary Password:</strong> ${tempPassword}</li>
      </ul>
      <p>Please log in to the system and change your password immediately.</p>
      <p>Login URL: <a href="${CONFIG.BASE_URL}">${CONFIG.BASE_URL}</a></p>
      <br>
      <p>Best regards,<br>Racket Warrior Team</p>
    `;
    
    MailApp.sendEmail({
      to: email,
      from: CONFIG.EMAIL_FROM,
      subject: subject,
      htmlBody: body
    });
  } catch (error) {
    Logger.log('Send Welcome Email Error: ' + error.toString());
    throw error;
  }
}

// Reset User Password (Admin function)
function handleResetUserPassword(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Admin access required' };
    }
    
    const { email, newPassword } = params;
    
    if (!email || !newPassword) {
      return { success: false, message: 'Email and new password are required' };
    }
    
    const sheet = getSheet(SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        sheet.getRange(i + 1, 2).setValue(newPassword); // password
        sheet.getRange(i + 1, 5).setValue(true); // needs_password_change
        
        // Send password reset notification email
        try {
          sendPasswordResetNotification(email, data[i][3], newPassword);
        } catch (emailError) {
          Logger.log('Password reset email error: ' + emailError.toString());
        }
        
        addLog(params.token, 'RESET_USER_PASSWORD', `Reset password for user: ${email}`);
        return { success: true, message: 'Password reset successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Reset user password error: ' + error.toString());
    return { success: false, message: 'Failed to reset password' };
  }
}

function sendPasswordResetNotification(email, name, newPassword) {
  try {
    const subject = 'Password Reset - Racket Warrior';
    const body = `
      Dear ${name},
      
      Your password has been reset by an administrator.
      
      New Login Details:
      - Username: ${email}
      - New Password: ${newPassword}
      - Login URL: ${CONFIG.BASE_URL}
      
      You will be required to change this password on your next login.
      
      If you did not request this password reset, please contact your administrator immediately.
      
      Best regards,
      Racket Warrior Team
    `;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">Racket Warrior</h1>
            <p style="color: #6b7280; margin: 5px 0;">Badminton Group Manager</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset</h2>
            <p style="color: #374151;">Dear ${name},</p>
            <p style="color: #374151;">Your password has been reset by an administrator.</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">New Login Details:</h3>
            <p style="color: #374151; margin: 5px 0;"><strong>Username:</strong> ${email}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>New Password:</strong> ${newPassword}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Login URL:</strong> <a href="${CONFIG.BASE_URL}" style="color: #3b82f6;">${CONFIG.BASE_URL}</a></p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0;"><strong>Security Notice:</strong> You will be required to change this password on your next login.</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
            <p style="color: #991b1b; margin: 0;"><strong>Important:</strong> If you did not request this password reset, please contact your administrator immediately.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0;">Best regards,<br>Racket Warrior Team</p>
          </div>
        </div>
      `
    });
    
    Logger.log(`Password reset notification sent to: ${email}`);
  } catch (error) {
    Logger.log('Send password reset notification error: ' + error.toString());
    throw error;
  }
}

// Initialize default settings
function initializeDefaultSettings() {
  try {
    const sheet = getSheet(SHEETS.SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    // Check if settings already exist
    if (data.length > 1) {
      return; // Settings already initialized
    }
    
    // Default settings
    const defaultSettings = [
      ['app_name', 'Racket Warrior'],
      ['currency', 'QAR'],
      ['email_from', CONFIG.EMAIL_FROM],
      ['monthly_fee', '50'],
      ['late_fee', '10'],
      ['max_login_attempts', '5'],
      ['session_timeout', '24'], // hours
      ['backup_frequency', 'daily'],
      ['notification_email', CONFIG.EMAIL_FROM]
    ];
    
    // Add headers if sheet is empty
    if (data.length === 0) {
      sheet.appendRow(['key', 'value']);
    }
    
    // Add default settings
    defaultSettings.forEach(setting => {
      sheet.appendRow(setting);
    });
    
    Logger.log('Default settings initialized');
  } catch (error) {
    Logger.log('Initialize default settings error: ' + error.toString());
  }
}

// Get user profile data
function handleGetUserProfile(params) {
  try {
    const { email } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const sheet = getSheet(SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        const user = {
          email: data[i][0],
          role: data[i][2],
          name: data[i][3],
          status: data[i][7],
          created_at: data[i][5],
          last_login: data[i][6],
          photo_url: data[i][10]
        };
        
        return { success: true, user: user };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Get user profile error: ' + error.toString());
    return { success: false, message: 'Failed to retrieve user profile' };
  }
}

// Update user profile
function handleUpdateUserProfile(params) {
  try {
    const { email, name, photo_url } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const sheet = getSheet(SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        if (name) sheet.getRange(i + 1, 4).setValue(name);
        if (photo_url) sheet.getRange(i + 1, 11).setValue(photo_url);
        
        addLog(params.token, 'UPDATE_PROFILE', `Updated profile for user: ${email}`);
        return { success: true, message: 'Profile updated successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    Logger.log('Update user profile error: ' + error.toString());
    return { success: false, message: 'Failed to update profile' };
  }
}