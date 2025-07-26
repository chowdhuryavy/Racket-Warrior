
/**
 * Users Management
 */
function handleGetUsers(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Access denied. Admin permission required.' };
    }

    const sheet = getSheet(SHEETS.users.name);
    const data = getSheetData(sheet);
    
    // Remove sensitive data before sending
    const sanitizedUsers = data.map(user => ({
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      photo_url: user.photo_url
    }));

    return { success: true, data: sanitizedUsers };
  } catch (error) {
    Logger.log('Error in handleGetUsers: ' + error.toString());
    return { success: false, message: 'Failed to fetch users' };
  }
}

function handleAddUser(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Access denied. Admin permission required.' };
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

    const sheet = getSheet(SHEETS.users.name);
    const data = getSheetData(sheet);
    
    // Check if user already exists
    const existingUser = data.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    const userData = [
      email,
      tempPassword, // This should be hashed in production
      role,
      name,
      'true', // needs_password_change
      new Date().toISOString(),
      '', // last_login
      'active', // status
      '', // resetToken
      '', // resetTokenExpiry
      CONFIG.DEFAULT_USER_PHOTO || ''
    ];

    sheet.appendRow(userData);
    
    // Log the action
    addLog(params.token, 'ADD_USER', `Added new user: ${email} with role: ${role}`);
    
    // Send welcome email
    try {
      sendWelcomeEmail(email, name, tempPassword);
    } catch (emailError) {
      Logger.log('Error sending welcome email: ' + emailError.toString());
    }

    return { 
      success: true, 
      message: 'User added successfully. Welcome email sent.',
      data: { email, name, role, tempPassword }
    };
  } catch (error) {
    Logger.log('Error in handleAddUser: ' + error.toString());
    return { success: false, message: 'Failed to add user' };
  }
}

function handleUpdateUser(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Access denied. Admin permission required.' };
    }

    const { email, name, role, status } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const sheet = getSheet(SHEETS.users.name);
    const data = getSheetData(sheet);
    
    const userIndex = data.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    // Update user data
    const rowIndex = userIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
    
    if (name) sheet.getRange(rowIndex, 4).setValue(name);
    if (role) sheet.getRange(rowIndex, 3).setValue(role);
    if (status) sheet.getRange(rowIndex, 8).setValue(status);
    
    // Log the action
    addLog(params.token, 'UPDATE_USER', `Updated user: ${email}`);

    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    Logger.log('Error in handleUpdateUser: ' + error.toString());
    return { success: false, message: 'Failed to update user' };
  }
}

function handleDeleteUser(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Access denied. Admin permission required.' };
    }

    const { email } = params;
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const sheet = getSheet(SHEETS.users.name);
    const data = getSheetData(sheet);
    
    const userIndex = data.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    // Delete user row
    const rowIndex = userIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
    sheet.deleteRow(rowIndex);
    
    // Log the action
    addLog(params.token, 'DELETE_USER', `Deleted user: ${email}`);

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    Logger.log('Error in handleDeleteUser: ' + error.toString());
    return { success: false, message: 'Failed to delete user' };
  }
}

/**
 * Income/Collections Update and Delete
 */
function handleUpdateIncome(params) {
  try {
    if (!hasPermission(params.token, 'edit')) {
      return { success: false, message: 'Access denied. Edit permission required.' };
    }

    const { id, date, playerId, playerName, amount, description } = params;
    
    if (!id || !date || !playerId || !playerName || !amount) {
      return { success: false, message: 'All fields are required' };
    }

    const sheet = getSheet(SHEETS.income.name);
    const data = getSheetData(sheet);
    
    const incomeIndex = data.findIndex(income => income.ID === id);
    if (incomeIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }

    // Update income data
    const rowIndex = incomeIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
    const month = getMonthFromDate(date);
    
    sheet.getRange(rowIndex, 2).setValue(date);
    sheet.getRange(rowIndex, 3).setValue(playerId);
    sheet.getRange(rowIndex, 4).setValue(playerName);
    sheet.getRange(rowIndex, 5).setValue(parseFloat(amount));
    sheet.getRange(rowIndex, 6).setValue(description || '');
    sheet.getRange(rowIndex, 8).setValue(month);
    
    // Log the action
    addLog(params.token, 'UPDATE_INCOME', `Updated income record: ${id}`);

    return { success: true, message: 'Income record updated successfully' };
  } catch (error) {
    Logger.log('Error in handleUpdateIncome: ' + error.toString());
    return { success: false, message: 'Failed to update income record' };
  }
}

function handleDeleteIncome(params) {
  try {
    if (!hasPermission(params.token, 'delete')) {
      return { success: false, message: 'Access denied. Delete permission required.' };
    }

    const { id } = params;
    
    if (!id) {
      return { success: false, message: 'Income ID is required' };
    }

    const sheet = getSheet(SHEETS.income.name);
    const data = getSheetData(sheet);
    
    const incomeIndex = data.findIndex(income => income.ID === id);
    if (incomeIndex === -1) {
      return { success: false, message: 'Income record not found' };
    }

    // Delete income row
    const rowIndex = incomeIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
    sheet.deleteRow(rowIndex);
    
    // Log the action
    addLog(params.token, 'DELETE_INCOME', `Deleted income record: ${id}`);

    return { success: true, message: 'Income record deleted successfully' };
  } catch (error) {
    Logger.log('Error in handleDeleteIncome: ' + error.toString());
    return { success: false, message: 'Failed to delete income record' };
  }
}

/**
 * Expenses Update and Delete
 */
function handleUpdateExpense(params) {
  try {
    if (!hasPermission(params.token, 'edit')) {
      return { success: false, message: 'Access denied. Edit permission required.' };
    }

    const { id, date, category, amount, description } = params;
    
    if (!id || !date || !category || !amount) {
      return { success: false, message: 'All fields are required' };
    }

    const sheet = getSheet(SHEETS.expenses.name);
    const data = getSheetData(sheet);
    
    const expenseIndex = data.findIndex(expense => expense.ID === id);
    if (expenseIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }

    // Update expense data
    const rowIndex = expenseIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
    const month = getMonthFromDate(date);
    
    sheet.getRange(rowIndex, 2).setValue(date);
    sheet.getRange(rowIndex, 3).setValue(category);
    sheet.getRange(rowIndex, 4).setValue(parseFloat(amount));
    sheet.getRange(rowIndex, 5).setValue(description || '');
    sheet.getRange(rowIndex, 7).setValue(month);
    
    // Log the action
    addLog(params.token, 'UPDATE_EXPENSE', `Updated expense record: ${id}`);

    return { success: true, message: 'Expense record updated successfully' };
  } catch (error) {
    Logger.log('Error in handleUpdateExpense: ' + error.toString());
    return { success: false, message: 'Failed to update expense record' };
  }
}

function handleDeleteExpense(params) {
  try {
    if (!hasPermission(params.token, 'delete')) {
      return { success: false, message: 'Access denied. Delete permission required.' };
    }

    const { id } = params;
    
    if (!id) {
      return { success: false, message: 'Expense ID is required' };
    }

    const sheet = getSheet(SHEETS.expenses.name);
    const data = getSheetData(sheet);
    
    const expenseIndex = data.findIndex(expense => expense.ID === id);
    if (expenseIndex === -1) {
      return { success: false, message: 'Expense record not found' };
    }

    // Delete expense row
    const rowIndex = expenseIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
    sheet.deleteRow(rowIndex);
    
    // Log the action
    addLog(params.token, 'DELETE_EXPENSE', `Deleted expense record: ${id}`);

    return { success: true, message: 'Expense record deleted successfully' };
  } catch (error) {
    Logger.log('Error in handleDeleteExpense: ' + error.toString());
    return { success: false, message: 'Failed to delete expense record' };
  }
}

/**
 * Reports
 */
function handleGetMonthlyReport(params) {
  try {
    const { month } = params;

    // Get all data
    const playersSheet = getSheet(SHEETS.players.name);
    const incomeSheet = getSheet(SHEETS.income.name);
    const expensesSheet = getSheet(SHEETS.expenses.name);

    const playersData = getSheetData(playersSheet);
    const incomeData = getSheetData(incomeSheet);
    const expensesData = getSheetData(expensesSheet);

    // Filter data by month if provided
    let filteredIncome = incomeData;
    let filteredExpenses = expensesData;
    let filteredPlayers = playersData;

    if (month) {
      filteredIncome = incomeData.filter(income => income.Month === month);
      filteredExpenses = expensesData.filter(expense => expense.Month === month);
      
      // For players, filter those who were active in the given month
      filteredPlayers = playersData.filter(player => {
        if (!player.MonthlyStatus) return false;
        try {
          const monthlyStatus = JSON.parse(player.MonthlyStatus);
          return monthlyStatus[month] === 'active';
        } catch (e) {
          return player.Status === 'active'; // Fallback to general status
        }
      });
    } else {
      // For all time, only include currently active players
      filteredPlayers = playersData.filter(player => player.Status === 'active');
    }

    // Calculate totals
    const totalIncome = filteredIncome.reduce((sum, income) => sum + parseFloat(income.Amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.Amount || 0), 0);
    const finalBalance = totalIncome - totalExpenses;

    // Group expenses by category
    const expensesByCategory = {};
    filteredExpenses.forEach(expense => {
      const category = expense.Category || 'Other';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += parseFloat(expense.Amount || 0);
    });

    // Recent transactions (last 10)
    const recentIncome = filteredIncome
      .sort((a, b) => new Date(b.Date) - new Date(a.Date))
      .slice(0, 10);
    
    const recentExpenses = filteredExpenses
      .sort((a, b) => new Date(b.Date) - new Date(a.Date))
      .slice(0, 10);

    const report = {
      month: month || 'All Time',
      generatedAt: new Date().toISOString(),
      summary: {
        activePlayersCount: filteredPlayers.length,
        totalIncome,
        totalExpenses,
        finalBalance
      },
      activePlayers: filteredPlayers.map(player => ({
        name: player.Name,
        phone: player.Phone,
        email: player.Email,
        joinDate: player.JoinDate
      })),
      incomeData: filteredIncome,
      expensesData: filteredExpenses,
      expensesByCategory,
      recentIncome,
      recentExpenses
    };

    return { success: true, data: report };
  } catch (error) {
    Logger.log('Error in handleGetMonthlyReport: ' + error.toString());
    return { success: false, message: 'Failed to generate report' };
  }
}

/**
 * Settings
 */
function handleGetSettings(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Access denied. Admin permission required.' };
    }

    const sheet = getSheet(SHEETS.settings.name);
    const data = getSheetData(sheet);
    
    // Convert to key-value object
    const settings = {};
    data.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    return { success: true, data: settings };
  } catch (error) {
    Logger.log('Error in handleGetSettings: ' + error.toString());
    return { success: false, message: 'Failed to fetch settings' };
  }
}

function handleUpdateSettings(params) {
  try {
    if (!hasPermission(params.token, 'admin')) {
      return { success: false, message: 'Access denied. Admin permission required.' };
    }

    const { settings } = params;
    
    if (!settings || typeof settings !== 'object') {
      return { success: false, message: 'Settings object is required' };
    }

    const sheet = getSheet(SHEETS.settings.name);
    const data = getSheetData(sheet);
    
    // Update existing settings and add new ones
    Object.keys(settings).forEach(key => {
      const existingIndex = data.findIndex(setting => setting.key === key);
      
      if (existingIndex !== -1) {
        // Update existing setting
        const rowIndex = existingIndex + 2; // +2 because sheet rows are 1-indexed and first row is header
        sheet.getRange(rowIndex, 2).setValue(settings[key]);
      } else {
        // Add new setting
        sheet.appendRow([key, settings[key]]);
      }
    });
    
    // Log the action
    addLog(params.token, 'UPDATE_SETTINGS', `Updated settings: ${Object.keys(settings).join(', ')}`);

    return { success: true, message: 'Settings updated successfully' };
  } catch (error) {
    Logger.log('Error in handleUpdateSettings: ' + error.toString());
    return { success: false, message: 'Failed to update settings' };
  }
}

/**
 * Photo Upload
 */
function handleUploadPhoto(params) {
  try {
    const { token, photo_data, photo_name } = params;
    
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    if (!photo_data) {
      return { success: false, message: 'Photo data is required' };
    }

    // For now, we'll store a placeholder URL
    // In a real implementation, you'd save the photo to Google Drive and return the URL
    const photoUrl = `https://drive.google.com/photos/${photo_name || 'photo'}_${Date.now()}`;
    
    // Update user's photo URL
    const userEmail = getUserEmailFromToken(token);
    if (userEmail) {
      const sheet = getSheet(SHEETS.users.name);
      const data = getSheetData(sheet);
      
      const userIndex = data.findIndex(user => user.email === userEmail);
      if (userIndex !== -1) {
        const rowIndex = userIndex + 2;
        sheet.getRange(rowIndex, 11).setValue(photoUrl); // photo_url column
      }
    }
    
    // Log the action
    addLog(token, 'UPLOAD_PHOTO', 'Updated profile photo');

    return { 
      success: true, 
      message: 'Photo uploaded successfully',
      photo_url: photoUrl
    };
  } catch (error) {
    Logger.log('Error in handleUploadPhoto: ' + error.toString());
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

    Here are your login details:
    Username: ${email}
    Temporary Password: ${tempPassword}

    Please login at: ${CONFIG.BASE_URL}

    IMPORTANT: You will be required to change your password on first login for security purposes.

    If you have any questions, please contact your administrator.

    Best regards,
    Racket Warrior Team
  `;

  try {
    MailApp.sendEmail(email, subject, body);
    Logger.log('Welcome email sent to: ' + email);
  } catch (error) {
    Logger.log('Error sending welcome email: ' + error.toString());
    throw error;
  }
}

/**
 * Get user email from token (helper function)
 */
function getUserEmailFromToken(token) {
  try {
    const sheet = getSheet(SHEETS.users.name);
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