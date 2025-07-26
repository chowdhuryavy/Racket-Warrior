/**
 * Racket Warrior - Badminton Group Manager
 * Google Apps Script Backend
 */

// Configuration
const CONFIG = {
  SHEET_ID: '1zJHUpcWaOBhKCzHS-uGPqaJepv_eZm019ElKtt249fg', // Your Google Sheet ID
  EMAIL_FROM: 'chowdhuryavy@gmail.com', // Your Gmail address
  OTP_EXPIRY_MINUTES: 10,
  TOKEN_EXPIRY_HOURS: 24,
  DEFAULT_PASSWORD: 'RacketWarrior123!',
  APP_NAME: 'Racket Warrior'
};

// Sheet configurations (updated based on user requirements)
const SHEETS = {
  users: {
    name: 'Users',
    columns: ['email', 'password', 'role', 'name', 'needs_password_change', 'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry', 'photo_url']
  },
  players: {
    name: 'Players',
    columns: ['ID', 'Name', 'Phone', 'Email', 'Status', 'JoinDate', 'CreatedAt', 'MonthlyStatus']
  },
  income: {
    name: 'Income',
    columns: ['ID', 'Date', 'PlayerId', 'PlayerName', 'Amount', 'Description', 'CreatedAt', 'Month']
  },
  expenses: {
    name: 'Expenses',
    columns: ['ID', 'Date', 'Category', 'Amount', 'Description', 'CreatedAt', 'Month']
  },
  logs: {
    name: 'Logs',
    columns: ['timestamp', 'user', 'role', 'action', 'details']
  },
  settings: {
    name: 'Settings',
    columns: ['key', 'value']
  }
};

/**
 * Handle GET requests
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    let result = { success: false, message: 'Invalid action' };
    
    switch (action) {
      case 'health_check':
        result = {
          success: true,
          message: 'Racket Warrior API is running',
          timestamp: new Date().toISOString()
        };
        break;
      
      case 'initialize_app':
        result = initializeApplication();
        break;
      

      
      // Authentication
      case 'login': result = handleLogin(e.parameter); break;
      case 'logout': result = handleLogout(e.parameter); break;
      case 'forgot_password': result = handleForgotPassword(e.parameter); break;
      case 'verify_otp': result = handleVerifyOTP(e.parameter); break;
      case 'reset_password': result = handleResetPassword(e.parameter); break;
      case 'change_password': result = handleChangePassword(e.parameter); break;
      
      // Dashboard
      case 'get_dashboard_stats': result = handleGetDashboardStats(e.parameter); break;
      
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
      
      // Users Management
      case 'get_users': result = handleGetUsers(e.parameter); break;
      case 'add_user': result = handleAddUser(e.parameter); break;
      case 'update_user': result = handleUpdateUser(e.parameter); break;
      case 'delete_user': result = handleDeleteUser(e.parameter); break;
      
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
    
    // Handle JSONP callback if provided
    const callback = e.parameter.callback;
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(result)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    const errorResult = {
      success: false,
      message: 'Server error: ' + error.toString()
    };
    
    // Handle JSONP callback for errors too
    const callback = e.parameter.callback;
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(errorResult)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests
 */
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

// ==================== AUTHENTICATION HANDLERS ====================

/**
 * Handle user login
 */
function handleLogin(params) {
  try {
    const { username, password } = params;
    const email = username; // Frontend sends 'username' but it's actually email
    
    if (!username || !password) {
      return { success: false, message: 'Username and password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    

    
    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      addLog('LOGIN_FAILED', `Failed login attempt for ${username}`, 'SYSTEM', 'unknown');
      return { success: false, message: 'Invalid username or password' };
    }
    
    // Check password 
    if (user.password !== password) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return { success: false, message: 'Account is disabled. Contact administrator.' };
    }
    
    // Update last login
    updateUserLastLogin(email);
    
    // Generate token
    const token = generateAuthToken(user.email);
    
    // Log successful login
    addLog('LOGIN', `User logged in successfully`, user.email, user.role);
    
    return {
      success: true,
      message: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        needs_password_change: user.needs_password_change === 'TRUE',
        photo_url: user.photo_url || ''
      },
      token: token
    };
    
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return { success: false, message: 'Login failed: ' + error.toString() };
  }
}

/**
 * Handle user logout
 */
function handleLogout(params) {
  try {
    const { token } = params;
    
    if (!token) {
      return { success: false, message: 'Token is required' };
    }
    
    // In a real implementation, you would invalidate the token
    // For this simple version, we just log the logout
    const user = verifyToken(token);
    if (user) {
      addLog('LOGOUT', `User logged out`, user.email, user.role);
    }
    
    return { success: true, message: 'Logout successful' };
    
  } catch (error) {
    Logger.log('Logout error: ' + error.toString());
    return { success: false, message: 'Logout failed: ' + error.toString() };
  }
}

/**
 * Handle forgot password request
 */
function handleForgotPassword(params) {
  try {
    const { email } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: 'If your email is registered, you will receive an OTP shortly.' };
    }
    
    const otp = generateOTP();
    const expiry = new Date(Date.now() + CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    
    // Update user with reset token and expiry
    updateUserResetToken(email, otp, expiry);
    
    // Send OTP email
    const emailSent = sendOTPEmail(email, user.name, otp);
    
    if (!emailSent) {
      return { success: false, message: 'Failed to send OTP email. Please try again.' };
    }
    
    addLog('PASSWORD_RESET_REQUEST', `OTP sent to ${email}`, email, user.role);
    
    return { success: true, message: 'OTP sent to your email address.' };
    
  } catch (error) {
    Logger.log('Forgot password error: ' + error.toString());
    return { success: false, message: 'Failed to process request: ' + error.toString() };
  }
}

/**
 * Handle OTP verification
 */
function handleVerifyOTP(params) {
  try {
    const { email, otp } = params;
    
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Invalid request' };
    }
    
    // Check OTP and expiry
    if (user.resetToken !== otp) {
      addLog('OTP_VERIFICATION_FAILED', `Invalid OTP for ${email}`, email, user.role);
      return { success: false, message: 'Invalid OTP' };
    }
    
    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);
    
    if (now > expiry) {
      addLog('OTP_VERIFICATION_FAILED', `Expired OTP for ${email}`, email, user.role);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }
    
    // Generate reset token for password change
    const resetToken = generateResetToken();
    updateUserResetToken(email, resetToken, new Date(Date.now() + 30 * 60 * 1000).toISOString()); // 30 minutes
    
    addLog('OTP_VERIFIED', `OTP verified for ${email}`, email, user.role);
    
    return { 
      success: true, 
      message: 'OTP verified successfully',
      resetToken: resetToken
    };
    
  } catch (error) {
    Logger.log('Verify OTP error: ' + error.toString());
    return { success: false, message: 'OTP verification failed: ' + error.toString() };
  }
}

/**
 * Handle password reset
 */
function handleResetPassword(params) {
  try {
    const { email, resetToken, newPassword } = params;
    
    if (!email || !resetToken || !newPassword) {
      return { success: false, message: 'Email, reset token, and new password are required' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Invalid request' };
    }
    
    // Verify reset token and expiry
    if (user.resetToken !== resetToken) {
      return { success: false, message: 'Invalid reset token' };
    }
    
    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);
    
    if (now > expiry) {
      return { success: false, message: 'Reset token has expired. Please start the process again.' };
    }
    
    // Update password and clear reset tokens
    updateUserPassword(email, newPassword);
    updateUserResetToken(email, '', ''); // Clear tokens
    
    addLog('PASSWORD_RESET', `Password reset successfully for ${email}`, email, user.role);
    
    return { success: true, message: 'Password reset successfully. You can now login with your new password.' };
    
  } catch (error) {
    Logger.log('Reset password error: ' + error.toString());
    return { success: false, message: 'Password reset failed: ' + error.toString() };
  }
}

/**
 * Handle password change (for logged-in users)
 */
function handleChangePassword(params) {
  try {
    const { token, currentPassword, newPassword } = params;
    
    if (!token || !currentPassword || !newPassword) {
      return { success: false, message: 'All fields are required' };
    }
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Invalid session. Please login again.' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    
    const userData = users.find(u => u.email === user.email);
    
    if (!userData) {
      return { success: false, message: 'User not found' };
    }
    
    // Verify current password
    if (userData.password !== currentPassword) {
      addLog('PASSWORD_CHANGE_FAILED', `Wrong current password for ${user.email}`, user.email, user.role);
      return { success: false, message: 'Current password is incorrect' };
    }
    
    // Update password and clear needs_password_change flag
    updateUserPassword(user.email, newPassword);
    updateUserPasswordChangeFlag(user.email, false);
    
    addLog('PASSWORD_CHANGED', `Password changed successfully`, user.email, user.role);
    
    return { success: true, message: 'Password changed successfully' };
    
  } catch (error) {
    Logger.log('Change password error: ' + error.toString());
    return { success: false, message: 'Password change failed: ' + error.toString() };
  }
}

// ==================== USER MANAGEMENT HANDLERS ====================

/**
 * Get all users (admin only)
 */
function handleGetUsers(params) {
  try {
    const { token } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      needs_password_change: user.needs_password_change === 'TRUE',
      photo_url: user.photo_url || ''
    }));
    
    return { success: true, data: sanitizedUsers };
    
  } catch (error) {
    Logger.log('Get users error: ' + error.toString());
    return { success: false, message: 'Failed to get users: ' + error.toString() };
  }
}

/**
 * Add new user (admin only)
 */
function handleAddUser(params) {
  try {
    const { token, email, name, role } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!email || !name || !role) {
      return { success: false, message: 'Email, name, and role are required' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Validate role
    const validRoles = ['admin', 'view_edit', 'view'];
    if (!validRoles.includes(role)) {
      return { success: false, message: 'Invalid role specified' };
    }
    
    // Add user
    const now = new Date().toISOString();
    const tempPassword = CONFIG.DEFAULT_PASSWORD;
    
    usersSheet.appendRow([
      email,
      tempPassword,
      role,
      name,
      'TRUE', // needs_password_change
      now,    // created_at
      '',     // last_login
      'active', // status
      '',     // resetToken
      ''      // resetTokenExpiry
    ]);
    
    // Send welcome email
    sendWelcomeEmail(email, name, tempPassword);
    
    addLog('USER_ADDED', `New user added: ${name} (${email}) with role ${role}`, user.email, user.role);
    
    return { success: true, message: 'User added successfully. Welcome email sent.' };
    
  } catch (error) {
    Logger.log('Add user error: ' + error.toString());
    return { success: false, message: 'Failed to add user: ' + error.toString() };
  }
}

/**
 * Update user (admin only)
 */
function handleUpdateUser(params) {
  try {
    const { token, email, name, role, status } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // email is first column
        userRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Update fields
    if (name) {
      const nameIndex = headers.indexOf('name');
      usersSheet.getRange(userRowIndex, nameIndex + 1).setValue(name);
    }
    
    if (role) {
      const validRoles = ['admin', 'view_edit', 'view'];
      if (!validRoles.includes(role)) {
        return { success: false, message: 'Invalid role specified' };
      }
      const roleIndex = headers.indexOf('role');
      usersSheet.getRange(userRowIndex, roleIndex + 1).setValue(role);
    }
    
    if (status) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        return { success: false, message: 'Invalid status specified' };
      }
      const statusIndex = headers.indexOf('status');
      usersSheet.getRange(userRowIndex, statusIndex + 1).setValue(status);
    }
    
    addLog('USER_UPDATED', `User updated: ${email}`, user.email, user.role);
    
    return { success: true, message: 'User updated successfully' };
    
  } catch (error) {
    Logger.log('Update user error: ' + error.toString());
    return { success: false, message: 'Failed to update user: ' + error.toString() };
  }
}

/**
 * Delete user (admin only)
 */
function handleDeleteUser(params) {
  try {
    const { token, email } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    // Don't allow deleting yourself
    if (email === user.email) {
      return { success: false, message: 'Cannot delete your own account' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const data = usersSheet.getDataRange().getValues();
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // email is first column
        userRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Delete the row
    usersSheet.deleteRow(userRowIndex);
    
    addLog('USER_DELETED', `User deleted: ${email}`, user.email, user.role);
    
    return { success: true, message: 'User deleted successfully' };
    
  } catch (error) {
    Logger.log('Delete user error: ' + error.toString());
    return { success: false, message: 'Failed to delete user: ' + error.toString() };
  }
}

// ==================== PLAYER MANAGEMENT HANDLERS ====================

/**
 * Get all players
 */
function handleGetPlayers(params) {
  try {
    const { token, month } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const playersSheet = getSheet(SHEETS.players.name);
    let players = getSheetData(playersSheet);
    
    // Filter by month if provided
    if (month) {
      players = players.filter(player => {
        if (player.MonthlyStatus) {
          try {
            const monthlyStatus = JSON.parse(player.MonthlyStatus);
            return monthlyStatus[month] === 'active';
          } catch (e) {
            return player.Status === 'active';
          }
        }
        return player.Status === 'active';
      });
    }
    
    return { success: true, data: players };
    
  } catch (error) {
    Logger.log('Get players error: ' + error.toString());
    return { success: false, message: 'Failed to get players: ' + error.toString() };
  }
}

/**
 * Add new player
 */
function handleAddPlayer(params) {
  try {
    const { token, name, phone, email, status } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'add')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!name || !phone) {
      return { success: false, message: 'Name and phone are required' };
    }
    
    const playersSheet = getSheet(SHEETS.players.name);
    const players = getSheetData(playersSheet);
    
    // Check for duplicate phone
    if (players.find(p => p.Phone === phone)) {
      return { success: false, message: 'Player with this phone number already exists' };
    }
    
    // Check for duplicate email if provided
    if (email && players.find(p => p.Email === email)) {
      return { success: false, message: 'Player with this email already exists' };
    }
    
    const id = generateId();
    const now = new Date().toISOString();
    const joinDate = new Date().toISOString().split('T')[0];
    
    playersSheet.appendRow([
      id,
      name,
      phone,
      email || '',
      status || 'active',
      joinDate,
      now,
      JSON.stringify({}) // Empty monthly status object
    ]);
    
    addLog('PLAYER_ADDED', `New player added: ${name} (${phone})`, user.email, user.role);
    
    return { success: true, message: 'Player added successfully', data: { ID: id } };
    
  } catch (error) {
    Logger.log('Add player error: ' + error.toString());
    return { success: false, message: 'Failed to add player: ' + error.toString() };
  }
}

/**
 * Update player
 */
function handleUpdatePlayer(params) {
  try {
    const { token, id, name, phone, email, status } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'edit')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!id) {
      return { success: false, message: 'Player ID is required' };
    }
    
    const playersSheet = getSheet(SHEETS.players.name);
    const data = playersSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find player row
    let playerRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { // ID is first column
        playerRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (playerRowIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    // Update fields
    if (name) {
      const nameIndex = headers.indexOf('Name');
      playersSheet.getRange(playerRowIndex, nameIndex + 1).setValue(name);
    }
    
    if (phone) {
      const phoneIndex = headers.indexOf('Phone');
      playersSheet.getRange(playerRowIndex, phoneIndex + 1).setValue(phone);
    }
    
    if (email !== undefined) {
      const emailIndex = headers.indexOf('Email');
      playersSheet.getRange(playerRowIndex, emailIndex + 1).setValue(email);
    }
    
    if (status) {
      const statusIndex = headers.indexOf('Status');
      playersSheet.getRange(playerRowIndex, statusIndex + 1).setValue(status);
    }
    
    addLog('PLAYER_UPDATED', `Player updated: ${id}`, user.email, user.role);
    
    return { success: true, message: 'Player updated successfully' };
    
  } catch (error) {
    Logger.log('Update player error: ' + error.toString());
    return { success: false, message: 'Failed to update player: ' + error.toString() };
  }
}

/**
 * Delete player
 */
function handleDeletePlayer(params) {
  try {
    const { token, id } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'delete')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!id) {
      return { success: false, message: 'Player ID is required' };
    }
    
    const playersSheet = getSheet(SHEETS.players.name);
    const data = playersSheet.getDataRange().getValues();
    
    // Find player row
    let playerRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { // ID is first column
        playerRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (playerRowIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    // Delete the row
    playersSheet.deleteRow(playerRowIndex);
    
    addLog('PLAYER_DELETED', `Player deleted: ${id}`, user.email, user.role);
    
    return { success: true, message: 'Player deleted successfully' };
    
  } catch (error) {
    Logger.log('Delete player error: ' + error.toString());
    return { success: false, message: 'Failed to delete player: ' + error.toString() };
  }
}

// ==================== INCOME/COLLECTION HANDLERS ====================

/**
 * Get income/collections
 */
function handleGetIncome(params) {
  try {
    const { token, month } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const incomeSheet = getSheet(SHEETS.income.name);
    let income = getSheetData(incomeSheet);
    
    // Filter by month if provided
    if (month) {
      income = income.filter(item => item.Month === month);
    }
    
    // Sort by date (newest first)
    income.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    
    return { success: true, data: income };
    
  } catch (error) {
    Logger.log('Get income error: ' + error.toString());
    return { success: false, message: 'Failed to get income: ' + error.toString() };
  }
}

/**
 * Add income/collection
 */
function handleAddIncome(params) {
  try {
    const { token, date, playerId, amount, description, month } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'add')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!date || !playerId || !amount || !month) {
      return { success: false, message: 'Date, player, amount, and month are required' };
    }
    
    // Get player name
    const playersSheet = getSheet(SHEETS.players.name);
    const players = getSheetData(playersSheet);
    const player = players.find(p => p.ID === playerId);
    
    if (!player) {
      return { success: false, message: 'Player not found' };
    }
    
    const incomeSheet = getSheet(SHEETS.income.name);
    const id = generateId();
    const now = new Date().toISOString();
    
    incomeSheet.appendRow([
      id,
      date,
      playerId,
      player.Name,
      parseFloat(amount),
      description || '',
      now,
      month
    ]);
    
    addLog('INCOME_ADDED', `Income added: ${player.Name} - QAR ${amount}`, user.email, user.role);
    
    return { success: true, message: 'Income added successfully', data: { ID: id } };
    
  } catch (error) {
    Logger.log('Add income error: ' + error.toString());
    return { success: false, message: 'Failed to add income: ' + error.toString() };
  }
}

/**
 * Update income/collection
 */
function handleUpdateIncome(params) {
  try {
    const { token, id, date, playerId, amount, description, month } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'edit')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!id) {
      return { success: false, message: 'Income ID is required' };
    }
    
    const incomeSheet = getSheet(SHEETS.income.name);
    const data = incomeSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find income row
    let incomeRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { // ID is first column
        incomeRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (incomeRowIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }
    
    // Get player name if playerId is being updated
    let playerName = null;
    if (playerId) {
      const playersSheet = getSheet(SHEETS.players.name);
      const players = getSheetData(playersSheet);
      const player = players.find(p => p.ID === playerId);
      if (!player) {
        return { success: false, message: 'Player not found' };
      }
      playerName = player.Name;
    }
    
    // Update fields
    if (date) {
      const dateIndex = headers.indexOf('Date');
      incomeSheet.getRange(incomeRowIndex, dateIndex + 1).setValue(date);
    }
    
    if (playerId) {
      const playerIdIndex = headers.indexOf('PlayerId');
      const playerNameIndex = headers.indexOf('PlayerName');
      incomeSheet.getRange(incomeRowIndex, playerIdIndex + 1).setValue(playerId);
      incomeSheet.getRange(incomeRowIndex, playerNameIndex + 1).setValue(playerName);
    }
    
    if (amount) {
      const amountIndex = headers.indexOf('Amount');
      incomeSheet.getRange(incomeRowIndex, amountIndex + 1).setValue(parseFloat(amount));
    }
    
    if (description !== undefined) {
      const descIndex = headers.indexOf('Description');
      incomeSheet.getRange(incomeRowIndex, descIndex + 1).setValue(description);
    }
    
    if (month) {
      const monthIndex = headers.indexOf('Month');
      incomeSheet.getRange(incomeRowIndex, monthIndex + 1).setValue(month);
    }
    
    addLog('INCOME_UPDATED', `Income updated: ${id}`, user.email, user.role);
    
    return { success: true, message: 'Income updated successfully' };
    
  } catch (error) {
    Logger.log('Update income error: ' + error.toString());
    return { success: false, message: 'Failed to update income: ' + error.toString() };
  }
}

/**
 * Delete income/collection
 */
function handleDeleteIncome(params) {
  try {
    const { token, id } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'delete')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!id) {
      return { success: false, message: 'Income ID is required' };
    }
    
    const incomeSheet = getSheet(SHEETS.income.name);
    const data = incomeSheet.getDataRange().getValues();
    
    // Find income row
    let incomeRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { // ID is first column
        incomeRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (incomeRowIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }
    
    // Delete the row
    incomeSheet.deleteRow(incomeRowIndex);
    
    addLog('INCOME_DELETED', `Income deleted: ${id}`, user.email, user.role);
    
    return { success: true, message: 'Income deleted successfully' };
    
  } catch (error) {
    Logger.log('Delete income error: ' + error.toString());
    return { success: false, message: 'Failed to delete income: ' + error.toString() };
  }
}

// ==================== EXPENSE HANDLERS ====================

/**
 * Get expenses
 */
function handleGetExpenses(params) {
  try {
    const { token, month } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const expensesSheet = getSheet(SHEETS.expenses.name);
    let expenses = getSheetData(expensesSheet);
    
    // Filter by month if provided
    if (month) {
      expenses = expenses.filter(expense => expense.Month === month);
    }
    
    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    
    return { success: true, data: expenses };
    
  } catch (error) {
    Logger.log('Get expenses error: ' + error.toString());
    return { success: false, message: 'Failed to get expenses: ' + error.toString() };
  }
}

/**
 * Add expense
 */
function handleAddExpense(params) {
  try {
    const { token, date, category, amount, description, month } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'add')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!date || !category || !amount || !description || !month) {
      return { success: false, message: 'Date, category, amount, description, and month are required' };
    }
    
    const expensesSheet = getSheet(SHEETS.expenses.name);
    const id = generateId();
    const now = new Date().toISOString();
    
    expensesSheet.appendRow([
      id,
      date,
      category,
      parseFloat(amount),
      description,
      now,
      month
    ]);
    
    addLog('EXPENSE_ADDED', `Expense added: ${category} - QAR ${amount}`, user.email, user.role);
    
    return { success: true, message: 'Expense added successfully', data: { ID: id } };
    
  } catch (error) {
    Logger.log('Add expense error: ' + error.toString());
    return { success: false, message: 'Failed to add expense: ' + error.toString() };
  }
}

/**
 * Update expense
 */
function handleUpdateExpense(params) {
  try {
    const { token, id, date, category, amount, description, month } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'edit')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!id) {
      return { success: false, message: 'Expense ID is required' };
    }
    
    const expensesSheet = getSheet(SHEETS.expenses.name);
    const data = expensesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find expense row
    let expenseRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { // ID is first column
        expenseRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (expenseRowIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }
    
    // Update fields
    if (date) {
      const dateIndex = headers.indexOf('Date');
      expensesSheet.getRange(expenseRowIndex, dateIndex + 1).setValue(date);
    }
    
    if (category) {
      const categoryIndex = headers.indexOf('Category');
      expensesSheet.getRange(expenseRowIndex, categoryIndex + 1).setValue(category);
    }
    
    if (amount) {
      const amountIndex = headers.indexOf('Amount');
      expensesSheet.getRange(expenseRowIndex, amountIndex + 1).setValue(parseFloat(amount));
    }
    
    if (description !== undefined) {
      const descIndex = headers.indexOf('Description');
      expensesSheet.getRange(expenseRowIndex, descIndex + 1).setValue(description);
    }
    
    if (month) {
      const monthIndex = headers.indexOf('Month');
      expensesSheet.getRange(expenseRowIndex, monthIndex + 1).setValue(month);
    }
    
    addLog('EXPENSE_UPDATED', `Expense updated: ${id}`, user.email, user.role);
    
    return { success: true, message: 'Expense updated successfully' };
    
  } catch (error) {
    Logger.log('Update expense error: ' + error.toString());
    return { success: false, message: 'Failed to update expense: ' + error.toString() };
  }
}

/**
 * Delete expense
 */
function handleDeleteExpense(params) {
  try {
    const { token, id } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'delete')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!id) {
      return { success: false, message: 'Expense ID is required' };
    }
    
    const expensesSheet = getSheet(SHEETS.expenses.name);
    const data = expensesSheet.getDataRange().getValues();
    
    // Find expense row
    let expenseRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) { // ID is first column
        expenseRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (expenseRowIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }
    
    // Delete the row
    expensesSheet.deleteRow(expenseRowIndex);
    
    addLog('EXPENSE_DELETED', `Expense deleted: ${id}`, user.email, user.role);
    
    return { success: true, message: 'Expense deleted successfully' };
    
  } catch (error) {
    Logger.log('Delete expense error: ' + error.toString());
    return { success: false, message: 'Failed to delete expense: ' + error.toString() };
  }
}

// ==================== DASHBOARD HANDLERS ====================

/**
 * Get dashboard statistics
 */
function handleGetDashboardStats(params) {
  try {
    const { token, month } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    // Get players
    const playersSheet = getSheet(SHEETS.players.name);
    const players = getSheetData(playersSheet);
    
    let activePlayersCount = 0;
    
    if (month) {
      // Count active players for specific month
      activePlayersCount = players.filter(player => {
        if (player.MonthlyStatus) {
          try {
            const monthlyStatus = JSON.parse(player.MonthlyStatus);
            return monthlyStatus[month] === 'active';
          } catch (e) {
            return player.Status === 'active';
          }
        }
        return player.Status === 'active';
      }).length;
    } else {
      // Count overall active players
      activePlayersCount = players.filter(player => player.Status === 'active').length;
    }
    
    // Get income
    const incomeSheet = getSheet(SHEETS.income.name);
    let income = getSheetData(incomeSheet);
    
    if (month) {
      income = income.filter(item => item.Month === month);
    }
    
    const totalCollection = income.reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0);
    
    // Get expenses
    const expensesSheet = getSheet(SHEETS.expenses.name);
    let expenses = getSheetData(expensesSheet);
    
    if (month) {
      expenses = expenses.filter(expense => expense.Month === month);
    }
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.Amount || 0), 0);
    
    // Calculate balance
    const finalBalance = totalCollection - totalExpenses;
    
    return {
      success: true,
      data: {
        activePlayersCount,
        totalCollection,
        totalExpenses,
        finalBalance,
        month: month || 'all'
      }
    };
    
  } catch (error) {
    Logger.log('Get dashboard stats error: ' + error.toString());
    return { success: false, message: 'Failed to get dashboard stats: ' + error.toString() };
  }
}

// ==================== REPORTS HANDLERS ====================

/**
 * Get monthly report
 */
function handleGetMonthlyReport(params) {
  try {
    const { token, month } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!month) {
      return { success: false, message: 'Month is required' };
    }
    
    // Get active players for the month
    const playersSheet = getSheet(SHEETS.players.name);
    const players = getSheetData(playersSheet);
    
    const activePlayers = players.filter(player => {
      if (player.MonthlyStatus) {
        try {
          const monthlyStatus = JSON.parse(player.MonthlyStatus);
          return monthlyStatus[month] === 'active';
        } catch (e) {
          return player.Status === 'active';
        }
      }
      return player.Status === 'active';
    });
    
    // Get income for the month
    const incomeSheet = getSheet(SHEETS.income.name);
    const income = getSheetData(incomeSheet).filter(item => item.Month === month);
    
    // Get expenses for the month
    const expensesSheet = getSheet(SHEETS.expenses.name);
    const expenses = getSheetData(expensesSheet).filter(expense => expense.Month === month);
    
    const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.Amount || 0), 0);
    const finalBalance = totalIncome - totalExpenses;
    
    return {
      success: true,
      data: {
        month,
        activePlayers,
        income,
        expenses,
        summary: {
          totalIncome,
          totalExpenses,
          finalBalance,
          activePlayersCount: activePlayers.length
        }
      }
    };
    
  } catch (error) {
    Logger.log('Get monthly report error: ' + error.toString());
    return { success: false, message: 'Failed to get monthly report: ' + error.toString() };
  }
}

// ==================== LOGS HANDLERS ====================

/**
 * Get system logs (admin only)
 */
function handleGetLogs(params) {
  try {
    const { token, limit } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const logsSheet = getSheet(SHEETS.logs.name);
    let logs = getSheetData(logsSheet);
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results if specified
    if (limit && !isNaN(parseInt(limit))) {
      logs = logs.slice(0, parseInt(limit));
    }
    
    return { success: true, data: logs };
    
  } catch (error) {
    Logger.log('Get logs error: ' + error.toString());
    return { success: false, message: 'Failed to get logs: ' + error.toString() };
  }
}

/**
 * Add log entry
 */
function handleAddLog(params) {
  try {
    const { token, action, details } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!action) {
      return { success: false, message: 'Action is required' };
    }
    
    addLog(action, details || '', user.email, user.role);
    
    return { success: true, message: 'Log added successfully' };
    
  } catch (error) {
    Logger.log('Add log error: ' + error.toString());
    return { success: false, message: 'Failed to add log: ' + error.toString() };
  }
}

// ==================== SETTINGS HANDLERS ====================

/**
 * Get settings (admin only)
 */
function handleGetSettings(params) {
  try {
    const { token } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const settingsSheet = getSheet(SHEETS.settings.name);
    const settings = getSheetData(settingsSheet);
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    return { success: true, data: settingsObj };
    
  } catch (error) {
    Logger.log('Get settings error: ' + error.toString());
    return { success: false, message: 'Failed to get settings: ' + error.toString() };
  }
}

/**
 * Update settings (admin only)
 */
function handleUpdateSettings(params) {
  try {
    const { token, key, value } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'admin')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!key) {
      return { success: false, message: 'Setting key is required' };
    }
    
    const settingsSheet = getSheet(SHEETS.settings.name);
    const data = settingsSheet.getDataRange().getValues();
    
    // Find setting row
    let settingRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) { // key is first column
        settingRowIndex = i + 1; // +1 for 1-based indexing
        break;
      }
    }
    
    if (settingRowIndex === -1) {
      // Add new setting
      settingsSheet.appendRow([key, value || '']);
    } else {
      // Update existing setting
      settingsSheet.getRange(settingRowIndex, 2).setValue(value || '');
    }
    
    addLog('SETTINGS_UPDATED', `Setting updated: ${key}`, user.email, user.role);
    
    return { success: true, message: 'Setting updated successfully' };
    
  } catch (error) {
    Logger.log('Update settings error: ' + error.toString());
    return { success: false, message: 'Failed to update settings: ' + error.toString() };
  }
}

// ==================== FILE UPLOAD HANDLERS ====================

/**
 * Handle photo upload (placeholder - actual implementation would use Drive API)
 */
function handleUploadPhoto(params) {
  try {
    const { token, type, file } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    // This is a placeholder - actual implementation would require Drive API
    // For now, return a mock response
    return {
      success: true,
      message: 'Photo upload feature is not implemented yet',
      data: {
        url: 'assets/default-avatar.png', // Default placeholder
        filename: 'placeholder.png'
      }
    };
    
  } catch (error) {
    Logger.log('Upload photo error: ' + error.toString());
    return { success: false, message: 'Failed to upload photo: ' + error.toString() };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get or create a sheet
 */
function getSheet(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      initializeSheet(sheet, sheetName);
    }
    
    return sheet;
  } catch (error) {
    Logger.log('Error getting sheet: ' + error.toString());
    throw new Error('Failed to access sheet: ' + sheetName);
  }
}

/**
 * Get data from sheet as array of objects
 */
function getSheetData(sheet) {
  try {
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    Logger.log('Error getting sheet data: ' + error.toString());
    return [];
  }
}

/**
 * Initialize sheet with headers
 */
function initializeSheet(sheet, sheetName) {
  try {
    const sheetConfig = Object.values(SHEETS).find(config => config.name === sheetName);
    if (sheetConfig) {
      sheet.getRange(1, 1, 1, sheetConfig.columns.length).setValues([sheetConfig.columns]);
      sheet.getRange(1, 1, 1, sheetConfig.columns.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  } catch (error) {
    Logger.log('Error initializing sheet: ' + error.toString());
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'RW_' + Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
}

/**
 * Generate OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate auth token
 */
function generateAuthToken(email) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Utilities.base64Encode(`${email}:${timestamp}:${random}`);
}

/**
 * Generate reset token
 */
function generateResetToken() {
  return Utilities.getUuid().replace(/-/g, '');
}

/**
 * Verify auth token
 */
function verifyToken(token) {
  try {
    if (!token) return null;
    
    const decoded = Utilities.base64Decode(token);
    const parts = Utilities.newBlob(decoded).getDataAsString().split(':');
    
    if (parts.length !== 3) return null;
    
    const email = parts[0];
    const timestamp = parseInt(parts[1]);
    
    // Check if token is expired (24 hours)
    const now = Date.now();
    if (now - timestamp > CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000) {
      return null;
    }
    
    // Get user data
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    const user = users.find(u => u.email === email && u.status === 'active');
    
    return user || null;
    
  } catch (error) {
    Logger.log('Token verification error: ' + error.toString());
    return null;
  }
}

/**
 * Check user permissions
 */
function hasPermission(userRole, action) {
  const permissions = {
    'admin': ['add', 'edit', 'delete', 'view', 'admin'],
    'view_edit': ['add', 'edit', 'delete', 'view'],
    'view': ['view']
  };
  
  return permissions[userRole] && permissions[userRole].includes(action);
}

/**
 * Add log entry
 */
function addLog(action, details, userEmail, userRole) {
  try {
    const logsSheet = getSheet(SHEETS.logs.name);
    const timestamp = new Date().toISOString();
    
    logsSheet.appendRow([
      timestamp,
      userEmail || 'SYSTEM',
      userRole || 'unknown',
      action,
      details || ''
    ]);
  } catch (error) {
    Logger.log('Error adding log: ' + error.toString());
  }
}

/**
 * Get month from date
 */
function getMonthFromDate(dateString) {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  } catch (error) {
    return null;
  }
}

/**
 * Update user last login
 */
function updateUserLastLogin(email) {
  try {
    const usersSheet = getSheet(SHEETS.users.name);
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // email is first column
        const lastLoginIndex = headers.indexOf('last_login');
        if (lastLoginIndex !== -1) {
          usersSheet.getRange(i + 1, lastLoginIndex + 1).setValue(new Date().toISOString());
        }
        break;
      }
    }
  } catch (error) {
    Logger.log('Error updating last login: ' + error.toString());
  }
}

/**
 * Update user reset token
 */
function updateUserResetToken(email, token, expiry) {
  try {
    const usersSheet = getSheet(SHEETS.users.name);
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // email is first column
        const tokenIndex = headers.indexOf('resetToken');
        const expiryIndex = headers.indexOf('resetTokenExpiry');
        
        if (tokenIndex !== -1) {
          usersSheet.getRange(i + 1, tokenIndex + 1).setValue(token);
        }
        if (expiryIndex !== -1) {
          usersSheet.getRange(i + 1, expiryIndex + 1).setValue(expiry);
        }
        break;
      }
    }
  } catch (error) {
    Logger.log('Error updating reset token: ' + error.toString());
  }
}

/**
 * Update user password
 */
function updateUserPassword(email, newPassword) {
  try {
    const usersSheet = getSheet(SHEETS.users.name);
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // email is first column
        const passwordIndex = headers.indexOf('password');
        if (passwordIndex !== -1) {
          usersSheet.getRange(i + 1, passwordIndex + 1).setValue(newPassword);
        }
        break;
      }
    }
  } catch (error) {
    Logger.log('Error updating password: ' + error.toString());
  }
}

/**
 * Update user password change flag
 */
function updateUserPasswordChangeFlag(email, needsChange) {
  try {
    const usersSheet = getSheet(SHEETS.users.name);
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) { // email is first column
        const flagIndex = headers.indexOf('needs_password_change');
        if (flagIndex !== -1) {
          usersSheet.getRange(i + 1, flagIndex + 1).setValue(needsChange ? 'TRUE' : 'FALSE');
        }
        break;
      }
    }
  } catch (error) {
    Logger.log('Error updating password change flag: ' + error.toString());
  }
}

/**
 * Send OTP email
 */
function sendOTPEmail(email, name, otp) {
  try {
    const subject = 'Racket Warrior - Password Reset OTP';
    const body = `
Dear ${name},

You have requested to reset your password for Racket Warrior.

Your OTP (One-Time Password) is: ${otp}

This OTP will expire in ${CONFIG.OTP_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.

Best regards,
Racket Warrior Team
`;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
    
    return true;
  } catch (error) {
    Logger.log('Error sending OTP email: ' + error.toString());
    return false;
  }
}

/**
 * Send welcome email for new users
 */
function sendWelcomeEmail(email, name, tempPassword) {
  try {
    const subject = 'Welcome to Racket Warrior - Account Created';
    const body = `
Dear ${name},

Welcome to Racket Warrior! Your account has been created successfully.

Your login credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Please login and change your password immediately.
You can access ${CONFIG.APP_NAME} through your usual login page.

Best regards,
${CONFIG.APP_NAME} Team
`;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
    
    return true;
  } catch (error) {
    Logger.log('Error sending welcome email: ' + error.toString());
    return false;
  }
}

/**
 * Initialize application with default data
 */
function initializeApplication() {
  try {
    Logger.log('Starting application initialization...');
    
    // Initialize Users sheet
    const usersSheet = getSheet(SHEETS.users.name);
    const userData = getSheetData(usersSheet);
    
    // Check if admin user already exists
    const adminExists = userData.find(user => user.email === 'chowdhuryavy@gmail.com');
    
    if (!adminExists) {
      Logger.log('Creating default admin user...');
      
      // Add default admin user
      usersSheet.appendRow([
        'chowdhuryavy@gmail.com',  // email
        'Doha@2580',              // password (plain text for now)
        'admin',                  // role
        'Avy Chowdhury',          // name
        'FALSE',                  // needs_password_change
        new Date().toISOString(), // created_at
        '',                       // last_login
        'active',                 // status
        '',                       // resetToken
        '',                       // resetTokenExpiry
        ''                        // photo_url
      ]);
      
      Logger.log('Default admin user created successfully');
    } else {
      Logger.log('Admin user already exists');
    }
    
    // Initialize other sheets
    getSheet(SHEETS.players.name);
    getSheet(SHEETS.income.name);
    getSheet(SHEETS.expenses.name);
    getSheet(SHEETS.logs.name);
    getSheet(SHEETS.settings.name);
    
    // Add default settings
    const settingsSheet = getSheet(SHEETS.settings.name);
    const settingsData = getSheetData(settingsSheet);
    
    if (settingsData.length === 0) {
      Logger.log('Adding default settings...');
      settingsSheet.appendRow(['app_name', CONFIG.APP_NAME]);
      settingsSheet.appendRow(['currency', 'QAR']);
      settingsSheet.appendRow(['timezone', 'Asia/Qatar']);
    }
    
    Logger.log('Application initialization completed successfully');
    
    return {
      success: true,
      message: 'Application initialized successfully',
      details: {
        userCreated: !adminExists,
        sheetsInitialized: true,
        settingsAdded: settingsData.length === 0
      }
    };
    
  } catch (error) {
    Logger.log('Application initialization error: ' + error.toString());
    return {
      success: false,
      message: 'Failed to initialize application: ' + error.toString()
    };
  }
}

