// Application Configuration
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbxWKdyeJrjCi6TURKMyVDsYFlkeEpo7ErDDw22DHLrpfUdC7HytmjqjqNaDnFvbcM6C/exec', // Replace with your actual Apps Script URL
    
    // Application Info
    APP_NAME: 'Racket Warrior',
    VERSION: '1.0.0',
    
        // Sheet configurations (matching backend structure)
    SHEETS: {
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
    },
    
    // User Roles and Permissions
    ROLES: {
        admin: {
            name: 'Admin',
            permissions: ['view', 'add', 'edit', 'delete', 'admin', 'logs'],
            icon: '👑'
        },
        view_edit: {
            name: 'View & Edit',
            permissions: ['view', 'add', 'edit', 'delete'],
            icon: '✏️'
        },
        view: {
            name: 'View Only',
            permissions: ['view'],
            icon: '👁️'
        }
    },
    
    // Default Settings
    DEFAULTS: {
        USER_PHOTO: 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=128',
        LOGO: 'https://i.imgur.com/04MGPFl.png',
        CURRENCY: 'QAR',
        DATE_FORMAT: 'DD/MM/YYYY',
        PAGE_SIZE: 10
    },
    
    // Validation Rules
    VALIDATION: {
        PASSWORD: {
            MIN_LENGTH: 8,
            REQUIRE_UPPERCASE: true,
            REQUIRE_LOWERCASE: true,
            REQUIRE_NUMBER: true,
            REQUIRE_SPECIAL: true,
            SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^[\+]?[1-9][\d]{0,15}$/
    },
    
    // API Endpoints
    ENDPOINTS: {
        // Authentication
        LOGIN: 'login',
        LOGOUT: 'logout',
        FORGOT_PASSWORD: 'forgot_password',
        VERIFY_OTP: 'verify_otp',
        RESET_PASSWORD: 'reset_password',
        CHANGE_PASSWORD: 'change_password',
        
        // Users
        GET_USERS: 'get_users',
        ADD_USER: 'add_user',
        UPDATE_USER: 'update_user',
        DELETE_USER: 'delete_user',
        
        // Players
        GET_PLAYERS: 'get_players',
        ADD_PLAYER: 'add_player',
        UPDATE_PLAYER: 'update_player',
        DELETE_PLAYER: 'delete_player',
        
        // Income/Collection
        GET_INCOME: 'get_income',
        ADD_INCOME: 'add_income',
        UPDATE_INCOME: 'update_income',
        DELETE_INCOME: 'delete_income',
        
        // Expenses
        GET_EXPENSES: 'get_expenses',
        ADD_EXPENSE: 'add_expense',
        UPDATE_EXPENSE: 'update_expense',
        DELETE_EXPENSE: 'delete_expense',
        
        // Dashboard
        GET_DASHBOARD_STATS: 'get_dashboard_stats',
        
        // Reports
        GET_MONTHLY_REPORT: 'get_monthly_report',
        
        // Logs
        GET_LOGS: 'get_logs',
        ADD_LOG: 'add_log',
        
        // Settings
        GET_SETTINGS: 'get_settings',
        UPDATE_SETTINGS: 'update_settings',
        
        // File Upload
        UPLOAD_PHOTO: 'upload_photo'
    },
    
    // Status Types
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive'
    },
    
    // Expense Categories
    EXPENSE_CATEGORIES: [
        'Equipment',
        'Court Rental',
        'Shuttlecocks',
        'Maintenance',
        'Refreshments',
        'Tournament',
        'Transportation',
        'Other'
    ],
    
    // Payment Methods
    PAYMENT_METHODS: [
        'Cash',
        'Bank Transfer',
        'Credit Card',
        'Digital Wallet',
        'Other'
    ],
    
    // Notification Types
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        USER_DATA: 'racket_warrior_user',
        AUTH_TOKEN: 'racket_warrior_token',
        THEME: 'racket_warrior_theme',
        LAST_PAGE: 'racket_warrior_last_page'
    },
    
    // Animation Durations
    ANIMATION: {
        FAST: 200,
        NORMAL: 300,
        SLOW: 500
    },
    
    // Development/Debug Settings
    DEBUG: true,
    LOG_LEVEL: 'debug' // debug, info, warn, error
};

// Utility function to get configuration values
window.getConfig = function(key) {
    const keys = key.split('.');
    let value = CONFIG;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return undefined;
        }
    }
    
    return value;
};

// Environment-specific configuration
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development environment
    CONFIG.DEBUG = true;
    CONFIG.LOG_LEVEL = 'debug';
    // You can override API_BASE_URL for local testing
    // CONFIG.API_BASE_URL = 'http://localhost:3000/api';
}

// Export for modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}