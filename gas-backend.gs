// Google Apps Script Backend for Gym Management System
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
  
  return Object.values(requirements).every(req => req);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(sheetName) {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // Add headers
    const sheetConfig = Object.values(SHEETS).find(s => s.name === sheetName);
    if (sheetConfig) {
      sheet.getRange(1, 1, 1, sheetConfig.columns.length).setValues([sheetConfig.columns]);
    }
  }
  
  return sheet;
}

function addLog(user, role, action, details) {
  try {
    const sheet = getSheet(SHEETS.logs.name);
    const logData = [getCurrentTimestamp(), user, role, action, details];
    sheet.appendRow(logData);
  } catch (error) {
    console.error('Failed to add log:', error);
  }
}

// Main handler function
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
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
      
      // Players
      case 'getPlayers':
        response = handleGetPlayers();
        break;
      case 'addPlayer':
        response = handleAddPlayer(requestData);
        break;
      case 'updatePlayer':
        response = handleUpdatePlayer(requestData);
        break;
      case 'deletePlayer':
        response = handleDeletePlayer(requestData);
        break;
      
      // Income/Collections
      case 'getIncome':
        response = handleGetIncome();
        break;
      case 'addIncome':
        response = handleAddIncome(requestData);
        break;
      case 'updateIncome':
        response = handleUpdateIncome(requestData);
        break;
      case 'deleteIncome':
        response = handleDeleteIncome(requestData);
        break;
      
      // Expenses
      case 'getExpenses':
        response = handleGetExpenses();
        break;
      case 'addExpense':
        response = handleAddExpense(requestData);
        break;
      case 'updateExpense':
        response = handleUpdateExpense(requestData);
        break;
      case 'deleteExpense':
        response = handleDeleteExpense(requestData);
        break;
      
      // Logs (Admin only)
      case 'getLogs':
        response = handleGetLogs();
        break;
      
      // Users (Admin only)
      case 'getUsers':
        response = handleGetUsers();
        break;
      case 'addUser':
        response = handleAddUser(requestData);
        break;
      case 'updateUser':
        response = handleUpdateUser(requestData);
        break;
      case 'deleteUser':
        response = handleDeleteUser(requestData);
        break;
      
      default:
        response = { success: false, message: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Authentication handlers
function handleLogin(data) {
  try {
    const { email, password } = data;
    const sheet = getSheet(SHEETS.users.name);
    const users = sheet.getDataRange().getValues();
    
    // Find user
    for (let i = 1; i < users.length; i++) {
      const user = users[i];
      if (user[0] === email && user[1] === hashPassword(password)) {
        if (user[7] === 'inactive') {
          return { success: false, message: 'Account is inactive' };
        }
        
        // Update last login
        sheet.getRange(i + 1, 7).setValue(getCurrentTimestamp());
        
        // Log login
        addLog(user[3], user[2], 'login', 'User logged in');
        
        return {
          success: true,
          data: {
            email: user[0],
            role: user[2],
            name: user[3],
            needs_password_change: user[4]
          }
        };
      }
    }
    
    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleSendOTP(data) {
  try {
    const { email } = data;
    const sheet = getSheet(SHEETS.users.name);
    const users = sheet.getDataRange().getValues();
    
    // Find user
    let userRowIndex = -1;
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        userRowIndex = i + 1;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'Email not found' };
    }
    
    // Generate OTP and expiry
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    // Update user with reset token
    sheet.getRange(userRowIndex, 9).setValue(otp); // resetToken
    sheet.getRange(userRowIndex, 10).setValue(expiry); // resetTokenExpiry
    
    // Send email
    const subject = 'Password Reset OTP - Gym Management System';
    const body = `
      Hi ${users[userRowIndex - 1][3]},
      
      Your password reset OTP is: ${otp}
      
      This OTP will expire in 10 minutes.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      Gym Management Team
    `;
    
    GmailApp.sendEmail(email, subject, body);
    
    addLog(email, 'user', 'otp_sent', 'Password reset OTP sent');
    
    return { success: true, data: { message: 'OTP sent successfully' } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleVerifyOTP(data) {
  try {
    const { email, otp } = data;
    const sheet = getSheet(SHEETS.users.name);
    const users = sheet.getDataRange().getValues();
    
    // Find user
    for (let i = 1; i < users.length; i++) {
      const user = users[i];
      if (user[0] === email) {
        const storedOTP = user[8];
        const expiry = new Date(user[9]);
        const now = new Date();
        
        if (storedOTP === otp && now < expiry) {
          addLog(email, 'user', 'otp_verified', 'Password reset OTP verified');
          return { success: true, data: { message: 'OTP verified' } };
        } else {
          return { success: false, message: 'Invalid or expired OTP' };
        }
      }
    }
    
    return { success: false, message: 'Email not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleResetPassword(data) {
  try {
    const { email, password } = data;
    
    if (!validatePassword(password)) {
      return { success: false, message: 'Password does not meet requirements' };
    }
    
    const sheet = getSheet(SHEETS.users.name);
    const users = sheet.getDataRange().getValues();
    
    // Find user and update password
    for (let i = 1; i < users.length; i++) {
      const user = users[i];
      if (user[0] === email) {
        // Update password and clear reset tokens
        sheet.getRange(i + 1, 2).setValue(hashPassword(password));
        sheet.getRange(i + 1, 9).setValue(''); // Clear resetToken
        sheet.getRange(i + 1, 10).setValue(''); // Clear resetTokenExpiry
        
        addLog(email, 'user', 'password_reset', 'Password reset successfully');
        
        return { success: true, data: { message: 'Password reset successfully' } };
      }
    }
    
    return { success: false, message: 'Email not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Players handlers
function handleGetPlayers() {
  try {
    const sheet = getSheet(SHEETS.players.name);
    const data = sheet.getDataRange().getValues();
    const players = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      players.push({
        ID: row[0],
        Name: row[1],
        Phone: row[2],
        Email: row[3],
        Status: row[4],
        JoinDate: row[5],
        CreatedAt: row[6],
        MonthlyStatus: row[7]
      });
    }
    
    return { success: true, data: players };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleAddPlayer(data) {
  try {
    const { name, phone, email, joinDate, status, monthlyStatus } = data;
    const sheet = getSheet(SHEETS.players.name);
    
    const playerId = generateId();
    const timestamp = getCurrentTimestamp();
    
    const playerData = [
      playerId,
      name,
      phone,
      email,
      status,
      joinDate,
      timestamp,
      monthlyStatus
    ];
    
    sheet.appendRow(playerData);
    
    addLog('system', 'user', 'add_player', `Added player: ${name}`);
    
    return { success: true, data: { id: playerId } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleUpdatePlayer(data) {
  try {
    const { id, name, phone, email, joinDate, status, monthlyStatus } = data;
    const sheet = getSheet(SHEETS.players.name);
    const players = sheet.getDataRange().getValues();
    
    // Find and update player
    for (let i = 1; i < players.length; i++) {
      if (players[i][0] === id) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[name, phone, email, status, joinDate, players[i][6]]]);
        sheet.getRange(i + 1, 8).setValue(monthlyStatus);
        
        addLog('system', 'user', 'update_player', `Updated player: ${name}`);
        
        return { success: true, data: { message: 'Player updated successfully' } };
      }
    }
    
    return { success: false, message: 'Player not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleDeletePlayer(data) {
  try {
    const { id } = data;
    const sheet = getSheet(SHEETS.players.name);
    const players = sheet.getDataRange().getValues();
    
    // Find and delete player
    for (let i = 1; i < players.length; i++) {
      if (players[i][0] === id) {
        const playerName = players[i][1];
        sheet.deleteRow(i + 1);
        
        addLog('system', 'user', 'delete_player', `Deleted player: ${playerName}`);
        
        return { success: true, data: { message: 'Player deleted successfully' } };
      }
    }
    
    return { success: false, message: 'Player not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Income handlers
function handleGetIncome() {
  try {
    const sheet = getSheet(SHEETS.income.name);
    const data = sheet.getDataRange().getValues();
    const income = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      income.push({
        ID: row[0],
        Date: row[1],
        PlayerId: row[2],
        PlayerName: row[3],
        Amount: row[4],
        Description: row[5],
        CreatedAt: row[6]
      });
    }
    
    return { success: true, data: income };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleAddIncome(data) {
  try {
    const { date, playerId, playerName, amount, description } = data;
    const sheet = getSheet(SHEETS.income.name);
    
    const incomeId = generateId();
    const timestamp = getCurrentTimestamp();
    
    const incomeData = [
      incomeId,
      date,
      playerId,
      playerName,
      amount,
      description || '',
      timestamp
    ];
    
    sheet.appendRow(incomeData);
    
    addLog('system', 'user', 'add_income', `Added collection: ₹${amount} from ${playerName}`);
    
    return { success: true, data: { id: incomeId } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleUpdateIncome(data) {
  try {
    const { id, date, playerId, playerName, amount, description } = data;
    const sheet = getSheet(SHEETS.income.name);
    const income = sheet.getDataRange().getValues();
    
    // Find and update income
    for (let i = 1; i < income.length; i++) {
      if (income[i][0] === id) {
        sheet.getRange(i + 1, 2, 1, 5).setValues([[date, playerId, playerName, amount, description || '']]);
        
        addLog('system', 'user', 'update_income', `Updated collection: ₹${amount} from ${playerName}`);
        
        return { success: true, data: { message: 'Collection updated successfully' } };
      }
    }
    
    return { success: false, message: 'Collection not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleDeleteIncome(data) {
  try {
    const { id } = data;
    const sheet = getSheet(SHEETS.income.name);
    const income = sheet.getDataRange().getValues();
    
    // Find and delete income
    for (let i = 1; i < income.length; i++) {
      if (income[i][0] === id) {
        const amount = income[i][4];
        const playerName = income[i][3];
        sheet.deleteRow(i + 1);
        
        addLog('system', 'user', 'delete_income', `Deleted collection: ₹${amount} from ${playerName}`);
        
        return { success: true, data: { message: 'Collection deleted successfully' } };
      }
    }
    
    return { success: false, message: 'Collection not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Expenses handlers
function handleGetExpenses() {
  try {
    const sheet = getSheet(SHEETS.expenses.name);
    const data = sheet.getDataRange().getValues();
    const expenses = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      expenses.push({
        ID: row[0],
        Date: row[1],
        Category: row[2],
        Amount: row[3],
        Description: row[4],
        CreatedAt: row[5]
      });
    }
    
    return { success: true, data: expenses };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleAddExpense(data) {
  try {
    const { date, category, amount, description } = data;
    const sheet = getSheet(SHEETS.expenses.name);
    
    const expenseId = generateId();
    const timestamp = getCurrentTimestamp();
    
    const expenseData = [
      expenseId,
      date,
      category,
      amount,
      description || '',
      timestamp
    ];
    
    sheet.appendRow(expenseData);
    
    addLog('system', 'user', 'add_expense', `Added expense: ₹${amount} for ${category}`);
    
    return { success: true, data: { id: expenseId } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleUpdateExpense(data) {
  try {
    const { id, date, category, amount, description } = data;
    const sheet = getSheet(SHEETS.expenses.name);
    const expenses = sheet.getDataRange().getValues();
    
    // Find and update expense
    for (let i = 1; i < expenses.length; i++) {
      if (expenses[i][0] === id) {
        sheet.getRange(i + 1, 2, 1, 4).setValues([[date, category, amount, description || '']]);
        
        addLog('system', 'user', 'update_expense', `Updated expense: ₹${amount} for ${category}`);
        
        return { success: true, data: { message: 'Expense updated successfully' } };
      }
    }
    
    return { success: false, message: 'Expense not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleDeleteExpense(data) {
  try {
    const { id } = data;
    const sheet = getSheet(SHEETS.expenses.name);
    const expenses = sheet.getDataRange().getValues();
    
    // Find and delete expense
    for (let i = 1; i < expenses.length; i++) {
      if (expenses[i][0] === id) {
        const amount = expenses[i][3];
        const category = expenses[i][2];
        sheet.deleteRow(i + 1);
        
        addLog('system', 'user', 'delete_expense', `Deleted expense: ₹${amount} for ${category}`);
        
        return { success: true, data: { message: 'Expense deleted successfully' } };
      }
    }
    
    return { success: false, message: 'Expense not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Logs handlers (Admin only)
function handleGetLogs() {
  try {
    const sheet = getSheet(SHEETS.logs.name);
    const data = sheet.getDataRange().getValues();
    const logs = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      logs.push({
        timestamp: row[0],
        user: row[1],
        role: row[2],
        action: row[3],
        details: row[4]
      });
    }
    
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return { success: true, data: logs };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Users handlers (Admin only)
function handleGetUsers() {
  try {
    const sheet = getSheet(SHEETS.users.name);
    const data = sheet.getDataRange().getValues();
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      users.push({
        email: row[0],
        role: row[2],
        name: row[3],
        needs_password_change: row[4],
        created_at: row[5],
        last_login: row[6],
        status: row[7]
      });
    }
    
    return { success: true, data: users };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleAddUser(data) {
  try {
    const { name, email, role, status } = data;
    const sheet = getSheet(SHEETS.users.name);
    
    // Check if user already exists
    const users = sheet.getDataRange().getValues();
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        return { success: false, message: 'User already exists' };
      }
    }
    
    // Generate temporary password
    const tempPassword = 'TempPass123!';
    const timestamp = getCurrentTimestamp();
    
    const userData = [
      email,
      hashPassword(tempPassword),
      role,
      name,
      true, // needs_password_change
      timestamp,
      '', // last_login
      status,
      '', // resetToken
      ''  // resetTokenExpiry
    ];
    
    sheet.appendRow(userData);
    
    // Send welcome email
    const subject = 'Welcome to Gym Management System';
    const body = `
      Hi ${name},
      
      Your account has been created in the Gym Management System.
      
      Login Details:
      Email: ${email}
      Temporary Password: ${tempPassword}
      
      Please login and change your password immediately.
      
      Best regards,
      Gym Management Team
    `;
    
    GmailApp.sendEmail(email, subject, body);
    
    addLog('system', 'admin', 'add_user', `Added user: ${name} (${email})`);
    
    return { success: true, data: { message: 'User added successfully' } };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleUpdateUser(data) {
  try {
    const { id, name, email, role, status } = data;
    const sheet = getSheet(SHEETS.users.name);
    const users = sheet.getDataRange().getValues();
    
    // Find and update user
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === id) {
        sheet.getRange(i + 1, 3, 1, 2).setValues([[role, name]]);
        sheet.getRange(i + 1, 8).setValue(status);
        
        addLog('system', 'admin', 'update_user', `Updated user: ${name} (${email})`);
        
        return { success: true, data: { message: 'User updated successfully' } };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleDeleteUser(data) {
  try {
    const { email } = data;
    const sheet = getSheet(SHEETS.users.name);
    const users = sheet.getDataRange().getValues();
    
    // Find and delete user
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        const userName = users[i][3];
        sheet.deleteRow(i + 1);
        
        addLog('system', 'admin', 'delete_user', `Deleted user: ${userName} (${email})`);
        
        return { success: true, data: { message: 'User deleted successfully' } };
      }
    }
    
    return { success: false, message: 'User not found' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Initialize function to set up the spreadsheet with sample data
function initializeSpreadsheet() {
  try {
    console.log('Initializing spreadsheet...');
    
    // Create all sheets if they don't exist
    Object.values(SHEETS).forEach(sheetConfig => {
      getSheet(sheetConfig.name);
    });
    
    // Add sample admin user if no users exist
    const usersSheet = getSheet(SHEETS.users.name);
    const userData = usersSheet.getDataRange().getValues();
    
    if (userData.length <= 1) { // Only headers exist
      const adminData = [
        'admin@gym.com',
        hashPassword('Admin123!'),
        'admin',
        'System Administrator',
        false,
        getCurrentTimestamp(),
        '',
        'active',
        '',
        ''
      ];
      
      usersSheet.appendRow(adminData);
      console.log('Sample admin user created: admin@gym.com / Admin123!');
    }
    
    console.log('Spreadsheet initialized successfully');
  } catch (error) {
    console.error('Error initializing spreadsheet:', error);
  }
}

// Test function
function testBackend() {
  console.log('Testing backend...');
  
  // Test login
  const loginResult = handleLogin({
    email: 'admin@gym.com',
    password: 'Admin123!'
  });
  
  console.log('Login test result:', loginResult);
  
  // Test get players
  const playersResult = handleGetPlayers();
  console.log('Get players test result:', playersResult);
  
  console.log('Backend test completed');
}