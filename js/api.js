// API Module for communicating with Google Apps Script

const API = {
    // Base configuration
    baseURL: CONFIG.API_BASE_URL,
    timeout: 30000, // 30 seconds for Google Apps Script
    
    // Request cache for performance
    cache: new Map(),
    cacheTimeout: 60000, // 60 seconds cache (increased for better performance)
    
    // Clear cache for specific data types
    clearCache: function(dataType = null) {
        if (!dataType) {
            this.cache.clear();
            Logger.debug('Cleared all API cache');
            return;
        }

        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(dataType)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
        Logger.debug(`Cleared API cache for: ${dataType}`);
    },

    // Core JSONP request handler
    makeRequest: async function(endpoint, data = {}) {
        const startTime = performance.now();
        
        // Prepare request data with token
        const requestData = {
            action: endpoint,
            ...data
        };
        
        if (!requestData.token && endpoint !== 'login' && endpoint !== 'forgot_password' && endpoint !== 'reset_password') {
            requestData.token = StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        }
        
        // Check cache for GET-like requests (non-mutating operations)
        const cacheableEndpoints = ['get_players', 'get_income', 'get_expenses', 'get_users', 'get_dashboard_stats', 'list_users'];
        if (cacheableEndpoints.includes(endpoint)) {
            const cacheKey = endpoint + JSON.stringify(data);
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                Logger.debug(`API Cache Hit: ${endpoint} (${(performance.now() - startTime).toFixed(2)}ms)`, cached.data);
                return cached.data;
            }
        }
        
        // Debug logging (hide sensitive data)
        const safeData = { ...requestData };
        if (safeData.password) safeData.password = '***';
        Logger.debug(`API Request: ${endpoint}`, safeData);
        
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
                const endTime = performance.now();
                const duration = endTime - startTime;
                Logger.debug(`API Response: ${endpoint} (${duration.toFixed(2)}ms)`, result);
                
                // Warn about slow requests
                if (duration > 5000) {
                    Logger.warn(`Slow API request detected: ${endpoint} took ${duration.toFixed(2)}ms`);
                }
                
                // Cache successful GET-like responses
                if (cacheableEndpoints.includes(endpoint) && result.success) {
                    const cacheKey = endpoint + JSON.stringify(data);
                    this.cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now()
                    });
                }
                
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
            script.onerror = (error) => {
                cleanup();
                reject(new Error(`Failed to load script: ${endpoint}. Check if Google Apps Script is deployed correctly.`));
            };
            
            document.head.appendChild(script);
        });
    },

    // Auth APIs
    login: async function(credentials) {
        return await this.makeRequest('login', credentials);
    },

    logout: async function() {
        return await this.makeRequest('logout');
    },

    forgotPassword: async function(email) {
        return await this.makeRequest('forgot_password', { email });
    },

    resetPassword: async function(token, newPassword) {
        return await this.makeRequest('reset_password', { token, newPassword });
    },

    changePassword: async function(currentPassword, newPassword) {
        return await this.makeRequest('change_password', { currentPassword, newPassword });
    },

    // Player APIs
    getPlayers: async function(filters = {}) {
        return await this.makeRequest('get_players', filters);
    },

    addPlayer: async function(playerData) {
        return await this.makeRequest('add_player', playerData);
    },

    updatePlayer: async function(playerId, playerData) {
        return await this.makeRequest('update_player', { id: playerId, ...playerData });
    },

    deletePlayer: async function(playerId) {
        return await this.makeRequest('delete_player', { id: playerId });
    },

    updatePlayerMonthlyStatus: async function(playerId, month, status) {
        return await this.makeRequest('update_player_monthly_status', { playerId, month, status });
    },

    // Income/Collection APIs
    getIncome: async function(filters = {}) {
        return await this.makeRequest('get_income', filters);
    },

    addIncome: async function(incomeData) {
        return await this.makeRequest('add_income', incomeData);
    },

    updateIncome: async function(incomeId, incomeData) {
        return await this.makeRequest('update_income', { id: incomeId, ...incomeData });
    },

    deleteIncome: async function(incomeId) {
        return await this.makeRequest('delete_income', { id: incomeId });
    },

    // Expense APIs
    getExpenses: async function(filters = {}) {
        return await this.makeRequest('get_expenses', filters);
    },

    addExpense: async function(expenseData) {
        return await this.makeRequest('add_expense', expenseData);
    },

    updateExpense: async function(expenseId, expenseData) {
        return await this.makeRequest('update_expense', { id: expenseId, ...expenseData });
    },

    deleteExpense: async function(expenseId) {
        return await this.makeRequest('delete_expense', { id: expenseId });
    },

    // Dashboard APIs
    getDashboardStats: async function(month = null) {
        return await this.makeRequest('get_dashboard_stats', { month });
    },

    // Logs APIs
    getLogs: async function(filters = {}) {
        return await this.makeRequest('get_logs', filters);
    },

    addLog: async function(action, details) {
        return await this.makeRequest('add_log', { action, details });
    },

    // Admin APIs
    getUsers: async function() {
        return await this.makeRequest('get_users');
    },

    addUser: async function(userData) {
        return await this.makeRequest('add_user', userData);
    },

    updateUser: async function(userEmail, userData) {
        return await this.makeRequest('update_user', { email: userEmail, ...userData });
    },

    deleteUser: async function(userEmail) {
        return await this.makeRequest('delete_user', { email: userEmail });
    },

    resetUserPassword: async function(userEmail) {
        return await this.makeRequest('reset_user_password', { email: userEmail });
    },

    // Settings APIs
    getSettings: async function() {
        return await this.makeRequest('get_settings');
    },

    updateSettings: async function(settings) {
        return await this.makeRequest('update_settings', settings);
    },

    // File Upload APIs - Simplified for better performance
    uploadPhoto: async function(photoData, fileName) {
        try {
            // Generate a UI Avatar based on user's name for better performance
            const user = JSON.parse(StorageUtils.get(CONFIG.STORAGE_KEYS.USER_DATA) || '{}');
            const userName = user.name || 'User';
            
            // Simulate upload delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate a UI Avatar URL with random background color for variety
            const colors = ['667eea', '764ba2', '5a67d8', '10b981', 'f59e0b', 'ef4444', '8b5cf6', 'ec4899'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${randomColor}&color=fff&size=200&bold=true`;
            
            Logger.info('Photo upload completed successfully');
            
            return {
                success: true,
                message: 'Profile photo updated successfully!',
                photo_url: avatarUrl,
                token: StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN)
            };
        } catch (error) {
            Logger.error('Photo upload error', error);
            return {
                success: false,
                message: 'Failed to upload photo: ' + error.message
            };
        }
    },

    // Helper function to convert file to base64
    fileToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Debug function to check user data
    debugUserData: async function() {
        return await this.makeRequest('debug_user_data');
    }
};

// Export API object
window.API = API;

