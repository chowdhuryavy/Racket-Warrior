
/**
 * Users Management
 */
function handleGetUsers(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'admin')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const sheet = getSheet(SHEETS.users);
    const data = getSheetData(sheet);
    
    // Remove sensitive information
    const users = data.map(user => ({
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      photo_url: user.photo_url
    }));
    
    addLog(user.email, user.role, 'GET_USERS', 'Retrieved users list');
    
    return {
      success: true,
      users: users
    };
  } catch (error) {
    Logger.log('handleGetUsers Error: ' + error.toString());
    return { success: false, message: 'Failed to retrieve users' };
  }
}

function handleAddUser(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'admin')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { email, name, role = 'view' } = params;
    
    if (!email || !name) {
      return { success: false, message: 'Email and name are required' };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }
    
    // Check if user already exists
    const sheet = getSheet(SHEETS.users);
    const data = getSheetData(sheet);
    const existingUser = data.find(u => u.email === email);
    
    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tempPassword);
    
    // Add new user
    const newUser = [
      email,
      hashedPassword,
      role,
      name,
      true, // needs_password_change
      new Date().toISOString(),
      '', // last_login
      'active',
      '', // resetToken
      '', // resetTokenExpiry
      '' // photo_url
    ];
    
    sheet.appendRow(newUser);
    
    // Send welcome email
    try {
      sendWelcomeEmail(email, name, tempPassword);
    } catch (emailError) {
      Logger.log('Failed to send welcome email: ' + emailError.toString());
    }
    
    addLog(user.email, user.role, 'ADD_USER', `Added new user: ${email} (${role})`);
    
    return {
      success: true,
      message: 'User added successfully. Welcome email sent.',
      user: {
        email: email,
        name: name,
        role: role,
        status: 'active',
        needs_password_change: true
      }
    };
  } catch (error) {
    Logger.log('handleAddUser Error: ' + error.toString());
    return { success: false, message: 'Failed to add user' };
  }
}

function handleUpdateUser(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'admin')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { email, name, role, status } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const sheet = getSheet(SHEETS.users);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('email')] === email) {
        userRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Update user data
    if (name) {
      sheet.getRange(userRowIndex, headers.indexOf('name') + 1).setValue(name);
    }
    if (role) {
      sheet.getRange(userRowIndex, headers.indexOf('role') + 1).setValue(role);
    }
    if (status) {
      sheet.getRange(userRowIndex, headers.indexOf('status') + 1).setValue(status);
    }
    
    addLog(user.email, user.role, 'UPDATE_USER', `Updated user: ${email}`);
    
    return {
      success: true,
      message: 'User updated successfully'
    };
  } catch (error) {
    Logger.log('handleUpdateUser Error: ' + error.toString());
    return { success: false, message: 'Failed to update user' };
  }
}

function handleDeleteUser(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'admin')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { email } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    // Prevent admin from deleting themselves
    if (email === user.email) {
      return { success: false, message: 'Cannot delete your own account' };
    }
    
    const sheet = getSheet(SHEETS.users);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('email')] === email) {
        userRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Delete the row
    sheet.deleteRow(userRowIndex);
    
    addLog(user.email, user.role, 'DELETE_USER', `Deleted user: ${email}`);
    
    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    Logger.log('handleDeleteUser Error: ' + error.toString());
    return { success: false, message: 'Failed to delete user' };
  }
}

/**
 * Income/Collections Update and Delete
 */
function handleUpdateIncome(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'edit')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { id, date, playerId, playerName, amount, description } = params;
    
    if (!id) {
      return { success: false, message: 'Income ID is required' };
    }
    
    const sheet = getSheet(SHEETS.income);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find income row
    let incomeRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('ID')] === id) {
        incomeRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (incomeRowIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }
    
    // Update income data
    if (date) {
      sheet.getRange(incomeRowIndex, headers.indexOf('Date') + 1).setValue(new Date(date));
      sheet.getRange(incomeRowIndex, headers.indexOf('Month') + 1).setValue(getMonthFromDate(new Date(date)));
    }
    if (playerId) {
      sheet.getRange(incomeRowIndex, headers.indexOf('PlayerId') + 1).setValue(playerId);
    }
    if (playerName) {
      sheet.getRange(incomeRowIndex, headers.indexOf('PlayerName') + 1).setValue(playerName);
    }
    if (amount) {
      sheet.getRange(incomeRowIndex, headers.indexOf('Amount') + 1).setValue(parseFloat(amount));
    }
    if (description) {
      sheet.getRange(incomeRowIndex, headers.indexOf('Description') + 1).setValue(description);
    }
    
    addLog(user.email, user.role, 'UPDATE_INCOME', `Updated income record: ${id}`);
    
    return {
      success: true,
      message: 'Income record updated successfully'
    };
  } catch (error) {
    Logger.log('handleUpdateIncome Error: ' + error.toString());
    return { success: false, message: 'Failed to update income record' };
  }
}

function handleDeleteIncome(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'delete')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { id } = params;
    
    if (!id) {
      return { success: false, message: 'Income ID is required' };
    }
    
    const sheet = getSheet(SHEETS.income);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find income row
    let incomeRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('ID')] === id) {
        incomeRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (incomeRowIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }
    
    // Delete the row
    sheet.deleteRow(incomeRowIndex);
    
    addLog(user.email, user.role, 'DELETE_INCOME', `Deleted income record: ${id}`);
    
    return {
      success: true,
      message: 'Income record deleted successfully'
    };
  } catch (error) {
    Logger.log('handleDeleteIncome Error: ' + error.toString());
    return { success: false, message: 'Failed to delete income record' };
  }
}

/**
 * Expenses Update and Delete
 */
function handleUpdateExpense(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'edit')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { id, date, category, amount, description } = params;
    
    if (!id) {
      return { success: false, message: 'Expense ID is required' };
    }
    
    const sheet = getSheet(SHEETS.expenses);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find expense row
    let expenseRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('ID')] === id) {
        expenseRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (expenseRowIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }
    
    // Update expense data
    if (date) {
      sheet.getRange(expenseRowIndex, headers.indexOf('Date') + 1).setValue(new Date(date));
      sheet.getRange(expenseRowIndex, headers.indexOf('Month') + 1).setValue(getMonthFromDate(new Date(date)));
    }
    if (category) {
      sheet.getRange(expenseRowIndex, headers.indexOf('Category') + 1).setValue(category);
    }
    if (amount) {
      sheet.getRange(expenseRowIndex, headers.indexOf('Amount') + 1).setValue(parseFloat(amount));
    }
    if (description) {
      sheet.getRange(expenseRowIndex, headers.indexOf('Description') + 1).setValue(description);
    }
    
    addLog(user.email, user.role, 'UPDATE_EXPENSE', `Updated expense record: ${id}`);
    
    return {
      success: true,
      message: 'Expense record updated successfully'
    };
  } catch (error) {
    Logger.log('handleUpdateExpense Error: ' + error.toString());
    return { success: false, message: 'Failed to update expense record' };
  }
}

function handleDeleteExpense(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'delete')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { id } = params;
    
    if (!id) {
      return { success: false, message: 'Expense ID is required' };
    }
    
    const sheet = getSheet(SHEETS.expenses);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find expense row
    let expenseRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('ID')] === id) {
        expenseRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (expenseRowIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }
    
    // Delete the row
    sheet.deleteRow(expenseRowIndex);
    
    addLog(user.email, user.role, 'DELETE_EXPENSE', `Deleted expense record: ${id}`);
    
    return {
      success: true,
      message: 'Expense record deleted successfully'
    };
  } catch (error) {
    Logger.log('handleDeleteExpense Error: ' + error.toString());
    return { success: false, message: 'Failed to delete expense record' };
  }
}

/**
 * Reports
 */
function handleGetMonthlyReport(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    const { month } = params;
    
    // Get players data
    const playersSheet = getSheet(SHEETS.players);
    const playersData = getSheetData(playersSheet);
    
    // Get income data
    const incomeSheet = getSheet(SHEETS.income);
    const incomeData = getSheetData(incomeSheet);
    
    // Get expenses data
    const expensesSheet = getSheet(SHEETS.expenses);
    const expensesData = getSheetData(expensesSheet);
    
    // Filter data by month if specified
    let filteredIncome = incomeData;
    let filteredExpenses = expensesData;
    
    if (month) {
      filteredIncome = incomeData.filter(item => item.Month === month);
      filteredExpenses = expensesData.filter(item => item.Month === month);
    }
    
    // Calculate active players for the month
    let activePlayers = playersData.filter(player => player.Status === 'active');
    if (month) {
      // Check monthly status if available
      activePlayers = playersData.filter(player => {
        const monthlyStatus = player.MonthlyStatus ? JSON.parse(player.MonthlyStatus) : {};
        return monthlyStatus[month] === 'active' || (player.Status === 'active' && !monthlyStatus[month]);
      });
    }
    
    // Calculate totals
    const totalIncome = filteredIncome.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
    const finalBalance = totalIncome - totalExpenses;
    
    // Group expenses by category
    const expensesByCategory = {};
    filteredExpenses.forEach(expense => {
      const category = expense.Category || 'Other';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += parseFloat(expense.Amount) || 0;
    });
    
    addLog(user.email, user.role, 'GET_MONTHLY_REPORT', `Generated monthly report for ${month || 'all time'}`);
    
    return {
      success: true,
      report: {
        month: month || 'All Time',
        activePlayers: activePlayers.map(player => ({
          id: player.ID,
          name: player.Name,
          phone: player.Phone,
          email: player.Email,
          joinDate: player.JoinDate
        })),
        totalActivePlayers: activePlayers.length,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        finalBalance: finalBalance,
        incomeRecords: filteredIncome.map(income => ({
          id: income.ID,
          date: income.Date,
          playerName: income.PlayerName,
          amount: income.Amount,
          description: income.Description
        })),
        expenseRecords: filteredExpenses.map(expense => ({
          id: expense.ID,
          date: expense.Date,
          category: expense.Category,
          amount: expense.Amount,
          description: expense.Description
        })),
        expensesByCategory: expensesByCategory
      }
    };
  } catch (error) {
    Logger.log('handleGetMonthlyReport Error: ' + error.toString());
    return { success: false, message: 'Failed to generate monthly report' };
  }
}

/**
 * Settings
 */
function handleGetSettings(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'admin')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const sheet = getSheet(SHEETS.settings);
    const data = getSheetData(sheet);
    
    const settings = {};
    data.forEach(row => {
      settings[row.key] = row.value;
    });
    
    addLog(user.email, user.role, 'GET_SETTINGS', 'Retrieved application settings');
    
    return {
      success: true,
      settings: settings
    };
  } catch (error) {
    Logger.log('handleGetSettings Error: ' + error.toString());
    return { success: false, message: 'Failed to retrieve settings' };
  }
}

function handleUpdateSettings(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    if (!hasPermission(user, 'admin')) {
      return { success: false, message: 'Insufficient permissions' };
    }
    
    const { settings } = params;
    
    if (!settings || typeof settings !== 'object') {
      return { success: false, message: 'Settings object is required' };
    }
    
    const sheet = getSheet(SHEETS.settings);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    Object.keys(settings).forEach(key => {
      const value = settings[key];
      
      // Find existing setting
      let settingRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][headers.indexOf('key')] === key) {
          settingRowIndex = i + 1; // Sheet rows are 1-indexed
          break;
        }
      }
      
      if (settingRowIndex !== -1) {
        // Update existing setting
        sheet.getRange(settingRowIndex, headers.indexOf('value') + 1).setValue(value);
      } else {
        // Add new setting
        sheet.appendRow([key, value]);
      }
    });
    
    addLog(user.email, user.role, 'UPDATE_SETTINGS', `Updated settings: ${Object.keys(settings).join(', ')}`);
    
    return {
      success: true,
      message: 'Settings updated successfully'
    };
  } catch (error) {
    Logger.log('handleUpdateSettings Error: ' + error.toString());
    return { success: false, message: 'Failed to update settings' };
  }
}

/**
 * Photo Upload
 */
function handleUploadPhoto(params) {
  try {
    const token = params.token;
    if (!verifyToken(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = getUserByToken(token);
    const { photoData, fileName, email } = params;
    
    // If email is provided and user is admin, update that user's photo
    // Otherwise, update current user's photo
    const targetEmail = (email && hasPermission(user, 'admin')) ? email : user.email;
    
    if (!photoData || !fileName) {
      return { success: false, message: 'Photo data and filename are required' };
    }
    
    try {
      // Decode base64 data
      const blob = Utilities.newBlob(
        Utilities.base64Decode(photoData.split(',')[1]), 
        'image/' + fileName.split('.').pop().toLowerCase(), 
        fileName
      );
      
      // Create Drive folder for user photos if it doesn't exist
      const folders = DriveApp.getFoldersByName('RacketWarrior_UserPhotos');
      let folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder('RacketWarrior_UserPhotos');
      }
      
      // Delete existing photo if any
      const existingFiles = folder.getFilesByName(targetEmail + '_photo');
      while (existingFiles.hasNext()) {
        existingFiles.next().setTrashed(true);
      }
      
      // Upload new photo
      const file = folder.createFile(blob);
      file.setName(targetEmail + '_photo');
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const photoUrl = 'https://drive.google.com/uc?id=' + file.getId();
      
      // Update user's photo URL in the sheet
      const sheet = getSheet(SHEETS.users);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][headers.indexOf('email')] === targetEmail) {
          sheet.getRange(i + 1, headers.indexOf('photo_url') + 1).setValue(photoUrl);
          break;
        }
      }
      
      addLog(user.email, user.role, 'UPLOAD_PHOTO', `Uploaded photo for ${targetEmail}`);
      
      return {
        success: true,
        message: 'Photo uploaded successfully',
        photoUrl: photoUrl
      };
    } catch (uploadError) {
      Logger.log('Photo upload error: ' + uploadError.toString());
      return { success: false, message: 'Failed to upload photo to Drive' };
    }
  } catch (error) {
    Logger.log('handleUploadPhoto Error: ' + error.toString());
    return { success: false, message: 'Failed to upload photo' };
  }
}

/**
 * Send Welcome Email to New User
 */
function sendWelcomeEmail(email, name, tempPassword) {
  const subject = 'Welcome to Racket Warrior - Your Account Details';
  const body = `
    Dear ${name},
    
    Welcome to Racket Warrior! Your account has been created successfully.
    
    Login Details:
    - Website: ${CONFIG.BASE_URL}
    - Username: ${email}
    - Temporary Password: ${tempPassword}
    
    IMPORTANT: You will be required to change your password on first login for security purposes.
    
    If you have any questions, please contact your administrator.
    
    Best regards,
    Racket Warrior Team
  `;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    replyTo: CONFIG.EMAIL_FROM
  });
}

/**
 * Get user email from token (helper function)
 */
function getUserEmailFromToken(token) {
  try {
    const sheet = getSheet(SHEETS.users);
    const data = getSheetData(sheet);
    
    // In a real implementation, you'd decode the token properly
    // For now, we'll just return the first active user's email
    const activeUser = data.find(user => user.status === 'active');
    return activeUser ? activeUser.email : null;
  } catch (error) {
    Logger.log('Error getting user email from token: ' + error.toString());
    return null;
  }
}

// ===============================
// ADDITIONAL UTILITY FUNCTIONS
// ===============================

function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function verifyToken(token) {
  try {
    const decoded = Utilities.base64Decode(token);
    const tokenData = JSON.parse(Utilities.newBlob(decoded).getDataAsString());
    const user = getUserByToken(token);
    return user && tokenData.email === user.email;
  } catch (e) {
    Logger.log('Token verification failed: ' + e.toString());
    return false;
  }
}

// ===============================
// INITIALIZATION FUNCTION
// ===============================

function initializeApplication() {
  try {
    // Initialize all sheets
    Object.values(SHEETS).forEach(sheetConfig => {
      initializeSheet(sheetConfig.name, sheetConfig.columns);
    });
    
    // Create default admin user if no users exist
    const usersSheet = getSheet(SHEETS.users);
    const userData = getSheetData(usersSheet);
    
    if (userData.length === 0) {
      const adminPassword = 'admin123';
      const hashedPassword = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, adminPassword);
      
      const adminUser = [
        'admin@racketwarrior.com',
        hashedPassword,
        'admin',
        'Administrator',
        true, // needs_password_change
        new Date().toISOString(),
        '',
        'active',
        '',
        '',
        ''
      ];
      
      usersSheet.appendRow(adminUser);
      
      Logger.log('Default admin user created:');
      Logger.log('Email: admin@racketwarrior.com');
      Logger.log('Password: admin123');
    }
    
    // Initialize default settings
    const settingsSheet = getSheet(SHEETS.settings);
    const settingsData = getSheetData(settingsSheet);
    
    if (settingsData.length === 0) {
      const defaultSettings = [
        ['app_name', 'Racket Warrior'],
        ['currency', 'QAR'],
        ['timezone', 'Asia/Qatar'],
        ['date_format', 'DD/MM/YYYY'],
        ['email_notifications', 'true'],
        ['backup_frequency', 'weekly']
      ];
      
      defaultSettings.forEach(setting => {
        settingsSheet.appendRow(setting);
      });
    }
    
    Logger.log('Application initialized successfully');
    return { success: true, message: 'Application initialized successfully' };
  } catch (error) {
    Logger.log('initializeApplication Error: ' + error.toString());
    return { success: false, message: 'Failed to initialize application' };
  }
}