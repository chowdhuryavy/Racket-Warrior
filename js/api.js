// API Module for communicating with Google Apps Script

const API = {
    // Base configuration
    baseURL: CONFIG.API_BASE_URL,
    timeout: 30000, // 30 seconds
    
    // Make HTTP request to Google Apps Script using JSONP
    makeRequest: async function(endpoint, data = {}) {
        const requestData = {
            action: endpoint,
            ...data
        };
        
        // Add auth token if available
        const token = StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            requestData.token = token;
        }
        
        Logger.debug(`API Request: ${endpoint}`, requestData);
        
        return new Promise((resolve, reject) => {
            // Create unique callback name
            const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            
            // Create timeout
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('Request timeout. Please try again.'));
            }, this.timeout);
            
            // Create cleanup function
            const cleanup = () => {
                clearTimeout(timeoutId);
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
            
            // Set up global callback
            window[callbackName] = (result) => {
                cleanup();
                Logger.debug(`API Response: ${endpoint}`, result);
                resolve(result);
            };
            
            // Build URL with parameters
            const url = new URL(this.baseURL);
            Object.keys(requestData).forEach(key => {
                url.searchParams.append(key, requestData[key]);
            });
            url.searchParams.append('callback', callbackName);
            
            // Create script tag for JSONP
            const script = document.createElement('script');
            script.src = url.toString();
            script.onerror = () => {
                cleanup();
                reject(new Error('Network error. Please check your connection.'));
            };
            
            // Add script to DOM
            document.head.appendChild(script);
        });
    },
    
    // Authentication APIs
    login: async function(username, password) {
        return await this.makeRequest(CONFIG.ENDPOINTS.LOGIN, {
            username: username,
            password: password
        });
    },
    
    logout: async function() {
        return await this.makeRequest(CONFIG.ENDPOINTS.LOGOUT);
    },
    
    forgotPassword: async function(email) {
        return await this.makeRequest(CONFIG.ENDPOINTS.FORGOT_PASSWORD, {
            email: email
        });
    },
    
    verifyOTP: async function(email, otp) {
        return await this.makeRequest(CONFIG.ENDPOINTS.VERIFY_OTP, {
            email: email,
            otp: otp
        });
    },
    
    resetPassword: async function(resetToken, newPassword) {
        return await this.makeRequest(CONFIG.ENDPOINTS.RESET_PASSWORD, {
            resetToken: resetToken,
            newPassword: newPassword
        });
    },
    
    changePassword: async function(currentPassword, newPassword) {
        return await this.makeRequest(CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
            currentPassword: currentPassword,
            newPassword: newPassword
        });
    },
    
    // User Management APIs
    getUsers: async function() {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_USERS);
    },
    
    addUser: async function(userData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.ADD_USER, userData);
    },
    
    updateUser: async function(userId, userData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.UPDATE_USER, {
            userId: userId,
            ...userData
        });
    },
    
    deleteUser: async function(userId) {
        return await this.makeRequest(CONFIG.ENDPOINTS.DELETE_USER, {
            userId: userId
        });
    },
    
    // Player Management APIs
    getPlayers: async function(month = null) {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_PLAYERS, {
            month: month
        });
    },
    
    addPlayer: async function(playerData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.ADD_PLAYER, playerData);
    },
    
    updatePlayer: async function(playerId, playerData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.UPDATE_PLAYER, {
            playerId: playerId,
            ...playerData
        });
    },
    
    deletePlayer: async function(playerId) {
        return await this.makeRequest(CONFIG.ENDPOINTS.DELETE_PLAYER, {
            playerId: playerId
        });
    },
    
    // Income/Collection Management APIs
    getIncome: async function(month = null) {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_INCOME, {
            month: month
        });
    },
    
    addIncome: async function(incomeData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.ADD_INCOME, incomeData);
    },
    
    updateIncome: async function(incomeId, incomeData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.UPDATE_INCOME, {
            incomeId: incomeId,
            ...incomeData
        });
    },
    
    deleteIncome: async function(incomeId) {
        return await this.makeRequest(CONFIG.ENDPOINTS.DELETE_INCOME, {
            incomeId: incomeId
        });
    },
    
    // Expense Management APIs
    getExpenses: async function(month = null) {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_EXPENSES, {
            month: month
        });
    },
    
    addExpense: async function(expenseData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.ADD_EXPENSE, expenseData);
    },
    
    updateExpense: async function(expenseId, expenseData) {
        return await this.makeRequest(CONFIG.ENDPOINTS.UPDATE_EXPENSE, {
            expenseId: expenseId,
            ...expenseData
        });
    },
    
    deleteExpense: async function(expenseId) {
        return await this.makeRequest(CONFIG.ENDPOINTS.DELETE_EXPENSE, {
            expenseId: expenseId
        });
    },
    
    // Dashboard APIs
    getDashboardStats: async function(month = null) {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_DASHBOARD_STATS, {
            month: month
        });
    },
    
    // Reports APIs
    getMonthlyReport: async function(month) {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_MONTHLY_REPORT, {
            month: month
        });
    },
    
    // Logs APIs
    getLogs: async function(filters = {}) {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_LOGS, filters);
    },
    
    addLog: async function(action, details = '') {
        return await this.makeRequest(CONFIG.ENDPOINTS.ADD_LOG, {
            action: action,
            details: details
        });
    },
    
    // Settings APIs
    getSettings: async function() {
        return await this.makeRequest(CONFIG.ENDPOINTS.GET_SETTINGS);
    },
    
    updateSettings: async function(settings) {
        return await this.makeRequest(CONFIG.ENDPOINTS.UPDATE_SETTINGS, settings);
    },
    
    // File Upload APIs
    uploadPhoto: async function(photoData, fileName) {
        return await this.makeRequest(CONFIG.ENDPOINTS.UPLOAD_PHOTO, {
            photoData: photoData,
            fileName: fileName
        });
    },
    
    // Utility methods
    
    // Get available months from data
    getAvailableMonths: async function(dataType = 'all') {
        try {
            const requests = [];
            
            if (dataType === 'all' || dataType === 'income') {
                requests.push(this.getIncome());
            }
            if (dataType === 'all' || dataType === 'expenses') {
                requests.push(this.getExpenses());
            }
            if (dataType === 'all' || dataType === 'players') {
                requests.push(this.getPlayers());
            }
            
            const results = await Promise.all(requests);
            const months = new Set();
            
            results.forEach(result => {
                if (result.success && result.data) {
                    result.data.forEach(item => {
                        if (item.Date || item.CreatedAt) {
                            const date = new Date(item.Date || item.CreatedAt);
                            const monthYear = DateUtils.getMonthYear(date);
                            months.add(monthYear);
                        }
                    });
                }
            });
            
            return Array.from(months).sort().reverse(); // Most recent first
        } catch (error) {
            Logger.error('Error getting available months', error);
            return [];
        }
    },
    
    // Batch operations
    batchRequest: async function(requests) {
        try {
            const promises = requests.map(request => 
                this.makeRequest(request.endpoint, request.data, request.method)
            );
            
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            Logger.error('Batch request error', error);
            throw error;
        }
    },
    
    // Health check
    healthCheck: async function() {
        try {
            const response = await this.makeRequest('health_check');
            return response;
        } catch (error) {
            Logger.error('Health check failed', error);
            return { success: false, error: error.message };
        }
    }
};

// Mock API for development/testing
const MockAPI = {
    // Mock data
    users: [
        {
            id: '1',
            email: 'admin@racketwarrior.com',
            password: 'Admin123!',
            name: 'Admin User',
            role: 'admin',
            status: 'active',
            needs_password_change: false,
            photo_url: null,
            created_at: '2024-01-01',
            last_login: new Date().toISOString()
        },
        {
            id: '2',
            email: 'user@racketwarrior.com',
            password: 'User123!',
            name: 'Regular User',
            role: 'view_edit',
            status: 'active',
            needs_password_change: false,
            photo_url: null,
            created_at: '2024-01-01',
            last_login: '2024-01-15'
        }
    ],
    
    players: [
        {
            ID: '1',
            Name: 'John Doe',
            Phone: '+974-1234-5678',
            Email: 'john@example.com',
            Status: 'active',
            JoinDate: '2024-01-01',
            CreatedAt: '2024-01-01',
            MonthlyStatus: JSON.stringify({'2024-01': 'active', '2024-02': 'active'})
        },
        {
            ID: '2',
            Name: 'Jane Smith',
            Phone: '+974-8765-4321',
            Email: 'jane@example.com',
            Status: 'active',
            JoinDate: '2024-01-15',
            CreatedAt: '2024-01-15',
            MonthlyStatus: JSON.stringify({'2024-01': 'active', '2024-02': 'active'})
        }
    ],
    
    income: [
        {
            ID: '1',
            Date: '2024-02-01',
            PlayerId: '1',
            PlayerName: 'John Doe',
            Amount: 100,
            Description: 'Monthly fee',
            CreatedAt: '2024-02-01',
            Month: '2024-02'
        },
        {
            ID: '2',
            Date: '2024-02-01',
            PlayerId: '2',
            PlayerName: 'Jane Smith',
            Amount: 100,
            Description: 'Monthly fee',
            CreatedAt: '2024-02-01',
            Month: '2024-02'
        }
    ],
    
    expenses: [
        {
            ID: '1',
            Date: '2024-02-05',
            Category: 'Equipment',
            Amount: 50,
            Description: 'Shuttlecocks',
            CreatedAt: '2024-02-05',
            Month: '2024-02'
        }
    ],
    
    logs: [
        {
            timestamp: new Date().toISOString(),
            user: 'admin@racketwarrior.com',
            role: 'admin',
            action: 'LOGIN',
            details: 'User logged in'
        }
    ],
    
    // Mock API methods
    makeRequest: async function(endpoint, data = {}) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        Logger.debug(`Mock API Request: ${endpoint}`, data);
        
        try {
            switch (endpoint) {
                case CONFIG.ENDPOINTS.LOGIN:
                    return this.mockLogin(data);
                case CONFIG.ENDPOINTS.GET_PLAYERS:
                    return this.mockGetPlayers(data);
                case CONFIG.ENDPOINTS.ADD_PLAYER:
                    return this.mockAddPlayer(data);
                case CONFIG.ENDPOINTS.GET_INCOME:
                    return this.mockGetIncome(data);
                case CONFIG.ENDPOINTS.GET_EXPENSES:
                    return this.mockGetExpenses(data);
                case CONFIG.ENDPOINTS.GET_DASHBOARD_STATS:
                    return this.mockGetDashboardStats(data);
                case CONFIG.ENDPOINTS.GET_USERS:
                    return this.mockGetUsers(data);
                case CONFIG.ENDPOINTS.GET_LOGS:
                    return this.mockGetLogs(data);
                case CONFIG.ENDPOINTS.ADD_LOG:
                    return this.mockAddLog(data);
                default:
                    return { success: true, message: 'Mock API response' };
            }
        } catch (error) {
            Logger.error('Mock API Error', error);
            return { success: false, message: error.message };
        }
    },
    
    mockLogin: function(data) {
        const user = this.users.find(u => 
            u.email === data.username && u.password === data.password
        );
        
        if (user) {
            return {
                success: true,
                user: { ...user, password: undefined },
                token: 'mock_token_' + Date.now()
            };
        } else {
            return {
                success: false,
                message: 'Invalid credentials'
            };
        }
    },
    
    mockGetPlayers: function(data) {
        return {
            success: true,
            data: this.players
        };
    },
    
    mockAddPlayer: function(data) {
        const newPlayer = {
            ID: (this.players.length + 1).toString(),
            ...data,
            CreatedAt: new Date().toISOString()
        };
        this.players.push(newPlayer);
        
        return {
            success: true,
            data: newPlayer,
            message: 'Player added successfully'
        };
    },
    
    mockGetIncome: function(data) {
        return {
            success: true,
            data: this.income
        };
    },
    
    mockGetExpenses: function(data) {
        return {
            success: true,
            data: this.expenses
        };
    },
    
    mockGetDashboardStats: function(data) {
        const totalPlayers = this.players.filter(p => p.Status === 'active').length;
        const totalIncome = this.income.reduce((sum, item) => sum + item.Amount, 0);
        const totalExpenses = this.expenses.reduce((sum, item) => sum + item.Amount, 0);
        
        return {
            success: true,
            data: {
                totalPlayers: totalPlayers,
                totalIncome: totalIncome,
                totalExpenses: totalExpenses,
                balance: totalIncome - totalExpenses
            }
        };
    },
    
    mockGetUsers: function(data) {
        return {
            success: true,
            data: this.users.map(u => ({ ...u, password: undefined }))
        };
    },
    
    mockGetLogs: function(data) {
        return {
            success: true,
            data: this.logs
        };
    },
    
    mockAddLog: function(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            user: Auth.currentUser?.email || 'system',
            role: Auth.currentUser?.role || 'system',
            action: data.action,
            details: data.details
        };
        
        this.logs.unshift(logEntry);
        
        return {
            success: true,
            data: logEntry
        };
    }
};

// Use mock API in development mode
if (CONFIG.DEBUG && CONFIG.API_BASE_URL.includes('YOUR_SCRIPT_ID')) {
    Logger.info('Using Mock API for development');
    Object.setPrototypeOf(API, MockAPI);
}

// Export API module
window.API = API;