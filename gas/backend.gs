/**
 * Racket Warrior - Badminton Group Manager
 * Google Apps Script Backend
 */

// Configuration
const CONFIG = {
  SHEET_ID: '1P7Sj5dJcz9SRKvEYkOleGsdLknzJje6BZOPoHyH9jfw', // Your Google Sheet ID
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
    columns: ['email', 'password', 'role', 'name', 'needs_password_change', 'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry', 'img_url']
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
    columns: ['ID', 'Timestamp', 'User', 'Role', 'Type', 'Action', 'Details', 'Status', 'IP', 'UserAgent', 'Month']
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

  
  // Safety check for parameters
  if (!e || !e.parameter) {
    const errorResult = { success: false, message: 'No parameters provided' };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
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
        
      case 'create_admin':
        result = createAdminUser();
        break;
        
      case 'list_users':
        result = handleGetUsers(e.parameter);
        break;
      
      case 'upload_photo':
        result = handleUploadPhoto(e.parameter);
        break;
      

      
      // Authentication
      case 'login': result = handleLogin(e.parameter); break;
      case 'logout': result = handleLogout(e.parameter); break;
      case 'forgot_password': result = handleForgotPassword(e.parameter); break;
      case 'verify_otp': result = handleVerifyOTP(e.parameter); break;
      case 'reset_password': result = handleResetPassword(e.parameter); break;
      case 'change_password': result = handleChangePassword(e.parameter); break;
      case 'get_user_profile': result = handleGetUserProfile(e.parameter); break;
      case 'debug_user_data': result = handleDebugUserData(e.parameter); break;
      
      // Dashboard
      case 'get_dashboard_stats': result = handleGetDashboardStats(e.parameter); break;
      case 'get_available_months': result = handleGetAvailableMonths(e.parameter); break;
      
      // Players
      case 'get_players': result = handleGetPlayers(e.parameter); break;
      case 'add_player': result = handleAddPlayer(e.parameter); break;
      case 'update_player': result = handleUpdatePlayer(e.parameter); break;
      case 'delete_player': result = handleDeletePlayer(e.parameter); break;
      case 'update_player_monthly_status': result = handleUpdatePlayerMonthlyStatus(e.parameter); break;
      
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
      case 'log_page_visit': result = handleLogPageVisit(e.parameter); break;
      case 'log_click': result = handleLogClick(e.parameter); break;
      
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
  // Safety check for parameters
  if (!e || !e.parameter) {
    const errorResult = { success: false, message: 'No parameters provided' };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
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
      case 'update_player_monthly_status': result = handleUpdatePlayerMonthlyStatus(e.parameter); break;
        
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
      case 'get_available_months': result = handleGetAvailableMonths(e.parameter); break;
        
      // Reports
      case 'get_monthly_report': result = handleGetMonthlyReport(e.parameter); break;
        
      // Logs
      case 'get_logs': result = handleGetLogs(e.parameter); break;
      case 'add_log': result = handleAddLog(e.parameter); break;
      case 'log_page_visit': result = handleLogPageVisit(e.parameter); break;
      case 'log_click': result = handleLogClick(e.parameter); break;
        
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
    // Safety check for params
    if (!params) {
      return { success: false, message: 'No login parameters provided' };
    }

    const { username, password } = params;
    const email = username; // Frontend sends 'username' but it's actually email

    if (!username || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    // Get users from sheet
    const usersSheet = getSheet(SHEETS.users.name);
    let users = getSheetData(usersSheet);

    // Auto-create admin user if sheet is empty
    if (users.length === 0) {
      // Create default admin user
      usersSheet.appendRow([
        'chowdhuryavy@gmail.com',
        'Doha@2580',
        'admin',
        'Avy Chowdhury',
        'TRUE', // FORCE PASSWORD CHANGE FOR NEW USERS
        new Date().toISOString(),
        '',
        'active',
        '',
        '',
        'https://ui-avatars.com/api/?name=Avy+Chowdhury&background=667eea&color=fff&size=128'
      ]);
      // Reload users data
      users = getSheetData(usersSheet);
    }

    // Also create admin user if someone tries to login with admin@gmail.com but it doesn't exist
    if (email === 'admin@gmail.com' && !users.find(u => String(u.email).toLowerCase().trim() === 'admin@gmail.com')) {
      usersSheet.appendRow([
        'admin@gmail.com',
        'admin123',
        'admin',
        'Admin User',
        'TRUE', // FORCE PASSWORD CHANGE FOR NEW USERS
        new Date().toISOString(),
        '',
        'active',
        '',
        '',
        'https://ui-avatars.com/api/?name=Admin+User&background=667eea&color=fff&size=128'
      ]);
      // Reload users data
      users = getSheetData(usersSheet);
    }

    // Find user by email (case insensitive)
    const user = users.find(u => {
      const userEmail = String(u.email || '').toLowerCase().trim();
      const loginEmail = String(email || '').toLowerCase().trim();
      return userEmail === loginEmail;
    });

    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Check password (convert to string and trim)
    const storedPassword = String(user.password || '').trim();
    const inputPassword = String(password || '').trim();

    if (storedPassword !== inputPassword) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return { success: false, message: 'Account is disabled. Contact administrator.' };
    }

    // Update last login
    try {
      const userIndex = users.indexOf(user) + 2; // +2 for header and 0-based index
      usersSheet.getRange(userIndex, 7).setValue(new Date().toISOString());
    } catch (updateError) {
      // Silent fail for last login update
    }

    // Generate token
    const token = generateAuthToken(user.email);

    // Log successful login
    addLog('LOGIN', `User logged in successfully`, user.email, user.role);

    // Prepare user response data
    const userData = {
      email: user.email,
      name: user.name,
      role: user.role,
      needs_password_change: user.needs_password_change === 'TRUE',
              photo_url: user.img_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=667eea&color=fff&size=128'
    };

    return {
      success: true,
      message: 'Login successful',
      user: userData,
      token: token
    };

  } catch (error) {
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
    
        // Verify current password (with proper string handling)
    const storedPassword = String(userData.password || '').trim();
    const inputCurrentPassword = String(currentPassword || '').trim();

    if (storedPassword !== inputCurrentPassword) {
      addLog('PASSWORD_CHANGE_FAILED', `Wrong current password for ${user.email}`, user.email, user.role);
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }
    
    // Update password and clear needs_password_change flag
    updateUserPassword(user.email, newPassword);
    updateUserPasswordChangeFlag(user.email, false);
    
    addLog('PASSWORD_CHANGED', `Password changed successfully`, user.email, user.role);
    
    return { success: true, message: 'Password changed successfully' };
    
  } catch (error) {
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
              photo_url: user.img_url || ''
    }));
    
    return { success: true, data: sanitizedUsers };
    
  } catch (error) {
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
      '',     // resetTokenExpiry
      ''      // img_url
    ]);
    
    // Send welcome email
    sendWelcomeEmail(email, name, tempPassword);
    
    addLog('USER_ADDED', `New user added: ${name} (${email}) with role ${role}`, user.email, user.role);
    
    return { success: true, message: 'User added successfully. Welcome email sent.' };
    
  } catch (error) {
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
    return { success: false, message: 'Failed to get players: ' + error.toString() };
  }
}

/**
 * Add new player
 */
function handleAddPlayer(params) {
  try {
    const { token, name, phone, email, status, joinDate } = params;
    
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
    const playerJoinDate = joinDate || new Date().toISOString().split('T')[0];
    
    // Set player as active for current month
    const currentDate = new Date();
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthlyStatus = {};
    monthlyStatus[currentMonth] = 'active';
    
    playersSheet.appendRow([
      id,
      name,
      phone,
      email || '',
      status || 'active',
      playerJoinDate,
      now,
      JSON.stringify(monthlyStatus) // Monthly status with current month active
    ]);
    
    addLog('PLAYER_ADDED', `New player added: ${name} (${phone})`, user.email, user.role);
    
    return { success: true, message: 'Player added successfully', data: { ID: id } };
    
  } catch (error) {
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
      player.name || player.Name, // Handle both old and new formats
      parseFloat(amount),
      description || '',
      now,
      month
    ]);
    
    addLog('INCOME_ADDED', `Income added: ${player.Name} - QAR ${amount}`, user.email, user.role);
    
    return { success: true, message: 'Income added successfully', data: { ID: id } };
    
  } catch (error) {
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
    return { success: false, message: 'Failed to get dashboard stats: ' + error.toString() };
  }
}

/**
 * Get available months with data
 */
function handleGetAvailableMonths(params) {
  try {
    const { token } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    // Get all months that have data
    const availableMonths = new Set();
    
    // Check income sheet for months
    const incomeSheet = getSheet(SHEETS.income.name);
    const incomeData = getSheetData(incomeSheet);
    incomeData.forEach(item => {
      if (item.Month) {
        availableMonths.add(item.Month);
      }
    });
    
    // Check expenses sheet for months
    const expensesSheet = getSheet(SHEETS.expenses.name);
    const expensesData = getSheetData(expensesSheet);
    expensesData.forEach(expense => {
      if (expense.Month) {
        availableMonths.add(expense.Month);
      }
    });
    
    // Check players sheet for months (from MonthlyStatus)
    const playersSheet = getSheet(SHEETS.players.name);
    const playersData = getSheetData(playersSheet);
    playersData.forEach(player => {
      if (player.MonthlyStatus) {
        try {
          const monthlyStatus = JSON.parse(player.MonthlyStatus);
          Object.keys(monthlyStatus).forEach(month => {
            availableMonths.add(month);
          });
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    });
    
    // Convert to sorted array
    const monthsArray = Array.from(availableMonths).sort();
    
    return {
      success: true,
      data: monthsArray
    };
    
  } catch (error) {
    return { success: false, message: 'Failed to get available months: ' + error.toString() };
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
    return { success: false, message: 'Failed to get logs: ' + error.toString() };
  }
}

/**
 * Add log entry
 */
function handleAddLog(params) {
  try {
    const { token, action, details, type, status } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!action) {
      return { success: false, message: 'Action is required' };
    }
    
    addLog(action, details || '', user.email, user.role, type, status);
    
    return { success: true, message: 'Log added successfully' };
    
  } catch (error) {
    return { success: false, message: 'Failed to add log: ' + error.toString() };
  }
}

/**
 * Handle page visit logging
 */
function handleLogPageVisit(params) {
  try {
    const { token, page } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    addPageLog(page, user.email, user.role);
    
    return { success: true, message: 'Page visit logged' };
  } catch (error) {
    return { success: false, message: 'Failed to log page visit: ' + error.toString() };
  }
}

/**
 * Handle click logging
 */
function handleLogClick(params) {
  try {
    const { token, element, details } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    addClickLog(element, user.email, user.role);
    
    return { success: true, message: 'Click logged' };
  } catch (error) {
    return { success: false, message: 'Failed to log click: ' + error.toString() };
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
    return { success: false, message: 'Failed to update settings: ' + error.toString() };
  }
}

// ==================== FILE UPLOAD HANDLERS ====================

// Removed duplicate placeholder handleUploadPhoto function - actual implementation is below

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
        obj[header] = row[index] || ''; // Handle undefined values
      });
      
      // Handle column name variations for img_url
      if (headers.includes('img_url') && !obj.img_url) {
        // Try alternative column names
        obj.img_url = obj['image_url'] || obj['photo_url'] || obj['avatar_url'] || '';
      }
      
      return obj;
    });
  } catch (error) {
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
 * Add comprehensive log entry
 */
function addLog(action, details, userEmail, userRole, type = 'user', status = 'success', additionalData = {}) {
  try {
    const logsSheet = getSheet(SHEETS.logs.name);
    const timestamp = new Date().toISOString();
    const month = getMonthFromDate(timestamp);
    
    // Generate unique ID
    const id = generateUniqueId();
    
    // Determine log type from action
    const logType = type || determineLogType(action);
    
    logsSheet.appendRow([
      id,                                    // ID
      timestamp,                            // Timestamp  
      userEmail || 'SYSTEM',               // User
      userRole || 'unknown',               // Role
      logType,                             // Type (auth, user, player, finance, system)
      action,                              // Action
      details || '',                       // Details
      status,                              // Status (success, error, warning)
      additionalData.ip || 'N/A',         // IP Address
      additionalData.userAgent || 'N/A',   // User Agent
      month                                // Month
    ]);
    
    console.log(`📋 Log added: ${action} by ${userEmail}`);
  } catch (error) {
    console.error('📋 Failed to add log:', error);
  }
}

/**
 * Determine log type from action
 */
function determineLogType(action) {
  const actionUpper = action.toUpperCase();
  
  if (actionUpper.includes('LOGIN') || actionUpper.includes('LOGOUT') || actionUpper.includes('PASSWORD')) {
    return 'auth';
  } else if (actionUpper.includes('USER') || actionUpper.includes('ROLE')) {
    return 'user';
  } else if (actionUpper.includes('PLAYER')) {
    return 'player';
  } else if (actionUpper.includes('INCOME') || actionUpper.includes('EXPENSE') || actionUpper.includes('FINANCE')) {
    return 'finance';
  } else if (actionUpper.includes('SETTING') || actionUpper.includes('PHOTO')) {
    return 'system';
  } else {
    return 'general';
  }
}

/**
 * Add enhanced logging for all page visits and clicks
 */
function addPageLog(page, userEmail, userRole) {
  addLog(`PAGE_VISIT`, `User visited ${page} page`, userEmail, userRole, 'navigation', 'success');
}

function addClickLog(element, userEmail, userRole) {
  addLog(`UI_CLICK`, `User clicked ${element}`, userEmail, userRole, 'interaction', 'success');
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
  }
}

/**
 * Send OTP email
 */
function sendOTPEmail(email, name, otp) {
  try {
    const subject = 'OTP for Password Reset';
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP for Password Reset</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
            animation: slideIn 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(40px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 50px 40px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%;
            animation: float 8s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
            33% { transform: translateY(-15px) rotate(120deg) scale(1.05); }
            66% { transform: translateY(10px) rotate(240deg) scale(0.95); }
        }
        
        .logo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin: 0 auto 25px;
            animation: logoPulse 3s ease-in-out infinite;
            border: 4px solid rgba(255,255,255,0.3);
            position: relative;
            z-index: 2;
        }
        
        @keyframes logoPulse {
            0%, 100% { 
                transform: scale(1) rotate(0deg); 
                box-shadow: 0 0 0 0 rgba(255,255,255,0.4);
            }
            50% { 
                transform: scale(1.08) rotate(5deg); 
                box-shadow: 0 0 0 15px rgba(255,255,255,0);
            }
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 12px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.2);
            position: relative;
            z-index: 2;
        }
        
        .header p {
            font-size: 18px;
            opacity: 0.9;
            font-weight: 400;
            position: relative;
            z-index: 2;
        }
        
        .content {
            padding: 50px 40px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .message {
            font-size: 17px;
            line-height: 1.7;
            color: #4a5568;
            margin-bottom: 35px;
            text-align: center;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
        }
        
        .otp-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: shimmer 4s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
            50% { transform: translateX(100%) translateY(100%) rotate(30deg); }
        }
        
        .otp-label {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            position: relative;
            z-index: 2;
        }
        
        .otp-code {
            font-size: 48px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 12px;
            margin-bottom: 20px;
            text-shadow: 0 4px 8px rgba(0,0,0,0.2);
            position: relative;
            z-index: 2;
            font-family: 'Courier New', monospace;
            background: rgba(255,255,255,0.1);
            padding: 20px 30px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        .otp-validity {
            font-size: 16px;
            color: #ffffff;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            position: relative;
            z-index: 2;
            opacity: 0.9;
        }
        
        .warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 6px solid #f59e0b;
            padding: 25px;
            border-radius: 16px;
            margin: 30px 0;
            box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2);
        }
        
        .warning-text {
            font-size: 16px;
            color: #92400e;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
            line-height: 1.5;
        }
        
        .security-tips {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-radius: 16px;
            padding: 30px;
            margin-top: 30px;
            border: 2px solid #93c5fd;
        }
        
        .tips-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .tips-list {
            font-size: 15px;
            color: #1e40af;
            line-height: 1.7;
            font-weight: 500;
        }
        
        .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 40px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
        }
        
        .signature {
            font-size: 18px;
            color: #4a5568;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .admin-text {
            font-size: 20px;
            color: #667eea;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .company {
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 25px;
        }
        
        .footer-logo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            animation: logoSpin 10s linear infinite;
            border: 3px solid #667eea;
        }
        
        @keyframes logoSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior" class="logo">
            <h1>🏸 Racket Warrior</h1>
            <p>Badminton Group Management System</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${name}! 👋</div>
            
            <div class="message">
                We received a request to reset the password for your account associated with this email.
                <br><br>
                To proceed, please use the One-Time Password (OTP) below:
            </div>
            
            <div class="otp-container">
                <div class="otp-label">
                    🔐 OTP Code
                </div>
                <div class="otp-code">${otp}</div>
                <div class="otp-validity">
                    ⏰ This OTP is valid for the next ${CONFIG.OTP_EXPIRY_MINUTES} minutes
                </div>
            </div>
            
            <div class="warning">
                <div class="warning-text">
                    ⚠️ If you did not request a password reset, please ignore this email or contact our admin immediately.
                </div>
            </div>
            
            <div class="security-tips">
                <div class="tips-title">
                    🛡️ Security Tips
                </div>
                <div class="tips-list">
                    • Never share your OTP with anyone<br>
                    • Our team will never ask for your OTP via phone or email<br>
                    • Use this OTP only on the official Racket Warrior platform<br>
                    • Report suspicious activity immediately
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="signature">Stay secure,</div>
            <div class="admin-text">Admin</div>
            <div class="company">Racket Warrior</div>
            <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior Logo" class="footer-logo">
        </div>
    </div>
</body>
</html>
`;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Handle get user profile request
 */
function handleGetUserProfile(params) {
  try {
    const { token } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    // Get fresh user data from sheet
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    const currentUser = users.find(u => u.email === user.email);
    
    if (!currentUser) {
      return { success: false, message: 'User not found' };
    }
    
    // Return updated user data
    const userData = {
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      needs_password_change: currentUser.needs_password_change === 'TRUE',
      photo_url: currentUser.img_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=667eea&color=fff&size=128'
    };
    
    return { success: true, data: userData };
    
  } catch (error) {
    return { success: false, message: 'Failed to get user profile: ' + error.toString() };
  }
}

/**
 * Handle photo upload
 */
function handleUploadPhoto(params) {
  try {
    const { token, photoData, fileName } = params;
    
    console.log('handleUploadPhoto called with params:', { token: token ? 'present' : 'missing', photoData: photoData ? 'present' : 'missing', fileName });
    
    const user = verifyToken(token);
    if (!user) {
      console.log('Upload failed: unauthorized access');
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!photoData) {
      console.log('Upload failed: no photo data');
      return { success: false, message: 'Photo data is required' };
    }
    
    console.log('Photo upload processing for user:', user.email);
    
    // For now, we'll store the photo data in the Users sheet
    // In a production environment, you might want to upload to Google Drive
    const usersSheet = getSheet(SHEETS.users.name);
    const users = getSheetData(usersSheet);
    const userIndex = users.findIndex(u => u.email === user.email);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Update the img_url column (column K - index 11)
    const rowIndex = userIndex + 2; // +2 because array is 0-indexed and sheet starts at row 2
    const columnIndex = SHEETS.users.columns.indexOf('img_url') + 1; // Get correct column index
    usersSheet.getRange(rowIndex, columnIndex).setValue(photoData); // Set the photo URL
    
    // Update the user data in storage
    const updatedUser = { ...user, img_url: photoData };
    
    // Generate new token with updated user data
    const newToken = generateAuthToken(updatedUser);
    
    addLog('PHOTO_UPDATED', `Profile photo updated`, user.email, user.role);
    
    return { 
      success: true, 
      message: 'Photo uploaded successfully',
      data: {
        photo_url: photoData,
        token: newToken
      }
    };
    
  } catch (error) {
    return { success: false, message: 'Failed to upload photo: ' + error.toString() };
  }
}

/**
 * Send welcome email for new users
 */
function sendWelcomeEmail(email, name, tempPassword) {
  try {
    const subject = 'Welcome! RACKET WARRIOR';
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome! RACKET WARRIOR</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
            animation: slideIn 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(50px) scale(0.95);
                opacity: 0;
            }
            to {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            padding: 60px 40px 40px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: rotate 20s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .welcome-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            position: relative;
            z-index: 2;
        }
        
        .main-title {
            font-size: 42px;
            font-weight: 900;
            margin-bottom: 15px;
            text-shadow: 0 4px 12px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
            letter-spacing: -1px;
        }
        
        .header-subtitle {
            font-size: 18px;
            opacity: 0.9;
            font-weight: 400;
            position: relative;
            z-index: 2;
        }
        
        .content {
            padding: 60px 40px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            text-align: center;
        }
        
        .subtitle {
            font-size: 20px;
            color: #374151;
            margin-bottom: 50px;
            line-height: 1.7;
            font-weight: 500;
        }
        
        .credentials-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 24px;
            padding: 40px;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(102, 126, 234, 0.3);
        }
        
        .credentials-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: shimmer 4s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
            50% { transform: translateX(100%) translateY(100%) rotate(30deg); }
        }
        
        .credentials-title {
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }
        
        .credential-item {
            background: rgba(255,255,255,0.15);
            border-radius: 16px;
            padding: 25px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            z-index: 2;
        }
        
        .credential-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        
        .credential-icon {
            font-size: 24px;
        }
        
        .credential-label {
            font-weight: 600;
            color: #ffffff;
            font-size: 18px;
        }
        
        .credential-value {
            font-weight: 800;
            color: #ffffff;
            font-family: 'Courier New', monospace;
            font-size: 20px;
            background: rgba(255,255,255,0.1);
            padding: 15px 20px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.2);
            letter-spacing: 1px;
        }
        
        .warning-section {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border: 3px solid #f87171;
            border-radius: 20px;
            padding: 30px;
            margin: 40px 0;
            position: relative;
            animation: warningPulse 3s ease-in-out infinite;
        }
        
        @keyframes warningPulse {
            0%, 100% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4);
            }
            50% { 
                transform: scale(1.02); 
                box-shadow: 0 0 0 15px rgba(248, 113, 113, 0);
            }
        }
        
        .warning-icon {
            font-size: 32px;
            margin-bottom: 15px;
        }
        
        .warning-text {
            font-size: 18px;
            font-weight: 700;
            color: #dc2626;
            line-height: 1.5;
        }
        
        .features-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 20px;
            padding: 35px;
            margin: 40px 0;
            border: 2px solid #7dd3fc;
        }
        
        .features-title {
            font-size: 20px;
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .features-list {
            color: #0369a1;
            font-size: 16px;
            line-height: 1.8;
            font-weight: 500;
            text-align: left;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .support-text {
            font-size: 17px;
            color: #6b7280;
            margin: 40px 0;
            line-height: 1.7;
            font-weight: 500;
        }
        
        .signature-section {
            margin-top: 50px;
            padding-top: 40px;
            border-top: 3px solid #e5e7eb;
        }
        
        .signature-text {
            font-size: 18px;
            color: #374151;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .admin-name {
            font-size: 22px;
            font-weight: 800;
            color: #667eea;
            margin-bottom: 8px;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: 900;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 30px;
            letter-spacing: -1px;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            animation: logoFloat 4s ease-in-out infinite;
            border: 4px solid #667eea;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        @keyframes logoFloat {
            0%, 100% { 
                transform: translateY(0px) rotate(0deg) scale(1); 
            }
            50% { 
                transform: translateY(-8px) rotate(10deg) scale(1.05); 
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="welcome-badge">🎉 Account Created</div>
            <h1 class="main-title">Welcome to Racket Warrior!</h1>
            <p class="header-subtitle">Your Badminton Journey Begins Here</p>
        </div>
        
        <div class="content">
            <p class="subtitle">Your account has been successfully created and you're ready to start managing your badminton group!</p>
            
            <div class="credentials-section">
                <div class="credentials-title">🔐 Your Login Credentials</div>
                
                <div class="credential-item">
                    <div class="credential-header">
                        <span class="credential-icon">👤</span>
                        <span class="credential-label">Username:</span>
                    </div>
                    <div class="credential-value">${email}</div>
                </div>
                
                <div class="credential-item">
                    <div class="credential-header">
                        <span class="credential-icon">🔐</span>
                        <span class="credential-label">Temporary Password:</span>
                    </div>
                    <div class="credential-value">${tempPassword}</div>
                </div>
            </div>
            
            <div class="warning-section">
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                    Please change your password after your first login for security purposes.
                </div>
            </div>
            
            <div class="features-section">
                <div class="features-title">
                    🏸 What You Can Do
                </div>
                <div class="features-list">
                    • Manage player registrations and status<br>
                    • Track monthly collections and expenses<br>
                    • Generate detailed financial reports<br>
                    • Monitor group activities and logs<br>
                    • Access role-based features and permissions
                </div>
            </div>
            
            <p class="support-text">
                If you need any help getting started or have questions about using the platform, feel free to reach out to our support team.
            </p>
            
            <div class="signature-section">
                <p class="signature-text">Best Regards,</p>
                <div class="admin-name">Admin</div>
                <div class="company-name">Racket Warrior</div>
                <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior Logo" class="logo">
            </div>
        </div>
    </div>
</body>
</html>
`;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize application with default data
 */
function initializeApplication() {
  try {
    // Initialize Users sheet
    const usersSheet = getSheet(SHEETS.users.name);
    const userData = getSheetData(usersSheet);
    
    // Check if admin user already exists
    const adminExists = userData.find(user => user.email === 'chowdhuryavy@gmail.com');
    
    if (!adminExists) {
      // Add default admin user
      usersSheet.appendRow([
        'chowdhuryavy@gmail.com',  // email
        'Doha@2580',              // password
        'admin',                  // role
        'Avy Chowdhury',          // name
        'TRUE',                   // needs_password_change - FORCE PASSWORD CHANGE
        new Date().toISOString(), // created_at
        '',                       // last_login
        'active',                 // status
        '',                       // resetToken
        '',                       // resetTokenExpiry
        'https://ui-avatars.com/api/?name=Avy+Chowdhury&background=667eea&color=fff&size=128' // img_url
      ]);
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
      settingsSheet.appendRow(['app_name', CONFIG.APP_NAME]);
      settingsSheet.appendRow(['currency', 'QAR']);
      settingsSheet.appendRow(['timezone', 'Asia/Qatar']);
    }
    
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
    return {
      success: false,
      message: 'Failed to initialize application: ' + error.toString()
    };
  }
}

/**
 * Debug function to check user data and sheet structure
 */
function handleDebugUserData(params) {
  try {
    const { token } = params;
    
    const user = verifyToken(token);
    if (!user) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const usersSheet = getSheet(SHEETS.users.name);
    const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    const users = getSheetData(usersSheet);
    const currentUser = users.find(u => u.email === user.email);
    
    return {
      success: true,
      debug_info: {
        sheet_headers: headers,
        expected_columns: SHEETS.users.columns,
        img_url_column_index: headers.indexOf('img_url'),
        current_user_data: currentUser,
        current_user_img_url: currentUser ? currentUser.img_url : 'User not found',
        total_users: users.length
      }
    };
    
  } catch (error) {
    return { 
      success: false, 
      message: 'Debug failed: ' + error.toString(),
      error_details: error.stack 
    };
  }
}

/**
 * Update player monthly status
 */
function handleUpdatePlayerMonthlyStatus(params) {
  try {
    const { token, playerId, month, status } = params;
    
    const user = verifyToken(token);
    if (!user || !hasPermission(user.role, 'edit')) {
      return { success: false, message: 'Unauthorized access' };
    }
    
    if (!playerId || !month || !status) {
      return { success: false, message: 'Player ID, month, and status are required' };
    }
    
    const playersSheet = getSheet(SHEETS.players.name);
    const players = getSheetData(playersSheet);
    const playerIndex = players.findIndex(p => p.ID === playerId);
    
    if (playerIndex === -1) {
      return { success: false, message: 'Player not found' };
    }
    
    const player = players[playerIndex];
    let monthlyStatus = {};
    
    // Parse existing monthly status
    if (player.MonthlyStatus) {
      try {
        monthlyStatus = JSON.parse(player.MonthlyStatus);
      } catch (e) {
        monthlyStatus = {};
      }
    }
    
    // Update the monthly status for the specific month
    monthlyStatus[month] = status;
    
    // Update the sheet (MonthlyStatus is column 8, index 7)
    const rowIndex = playerIndex + 2; // +2 because array is 0-indexed and sheet starts at row 2
    const columnIndex = SHEETS.players.columns.indexOf('MonthlyStatus') + 1;
    
    playersSheet.getRange(rowIndex, columnIndex).setValue(JSON.stringify(monthlyStatus));
    
    addLog('PLAYER_STATUS_UPDATED', `Player ${player.Name} status updated for ${month}: ${status}`, user.email, user.role);
    
    return { 
      success: true, 
      message: 'Player monthly status updated successfully',
      data: { playerId, month, status, monthlyStatus }
    };
    
  } catch (error) {
    return { success: false, message: 'Failed to update player status: ' + error.toString() };
  }
}


