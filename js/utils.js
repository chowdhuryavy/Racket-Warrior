// Utility Functions for Racket Warrior App

// Comprehensive Activity Logger
const ActivityLogger = {
    // Log page visits
    logPageVisit: async function(page) {
        try {
            console.log(`📋 Logging page visit: ${page}`);
            await API.logPageVisit(page);
        } catch (error) {
            console.warn('📋 Failed to log page visit:', error);
        }
    },
    
    // Log button clicks
    logClick: async function(element, details = '') {
        try {
            console.log(`📋 Logging click: ${element}`);
            await API.logClick(element, details);
        } catch (error) {
            console.warn('📋 Failed to log click:', error);
        }
    },
    
    // Log user actions
    logAction: async function(action, details = '', type = 'user', status = 'success') {
        try {
            console.log(`📋 Logging action: ${action}`);
            await API.logAction(action, details, type, status);
        } catch (error) {
            console.warn('📋 Failed to log action:', error);
        }
    },
    
    // Auto-log common UI interactions
    setupAutoLogging: function() {
        console.log('📋 Setting up automatic activity logging...');
        
        // Log all button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button) {
                const buttonText = button.textContent?.trim() || button.getAttribute('aria-label') || 'Unknown Button';
                const buttonId = button.id || 'no-id';
                this.logClick(`Button: ${buttonText} (${buttonId})`);
            }
            
            // Log navigation link clicks
            const link = e.target.closest('a[href], .nav-link');
            if (link) {
                const linkText = link.textContent?.trim() || link.getAttribute('aria-label') || 'Unknown Link';
                this.logClick(`Navigation: ${linkText}`);
            }
        });
        
        // Log form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formId = form.id || 'unknown-form';
            this.logAction('FORM_SUBMIT', `Form submitted: ${formId}`, 'interaction');
        });
        
        console.log('✅ Auto-logging setup complete');
    }
};

// Logger utility
const Logger = {
    debug: function(message, data = null) {
        if (CONFIG.DEBUG && CONFIG.LOG_LEVEL === 'debug') {
        }
    },
    info: function(message, data = null) {
        if (CONFIG.DEBUG && ['debug', 'info'].includes(CONFIG.LOG_LEVEL)) {
            console.info(`[INFO] ${message}`, data);
        }
    },
    warn: function(message, data = null) {
        if (CONFIG.DEBUG && ['debug', 'info', 'warn'].includes(CONFIG.LOG_LEVEL)) {
            console.warn(`[WARN] ${message}`, data);
        }
    },
    error: function(message, data = null) {
        console.error(`[ERROR] ${message}`, data);
    }
};

// Loading Screen Utilities
const LoadingScreenUtils = {
    // Show loading screen with custom message
    show: function(title = 'Racket Warrior', message = 'Please wait...') {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingTitle = loadingScreen.querySelector('.loading-text h2');
        const loadingMessage = loadingScreen.querySelector('.loading-text p');
        
        if (loadingTitle) loadingTitle.textContent = title;
        if (loadingMessage) loadingMessage.textContent = message;
        
        // Show loading screen and hide others
        loadingScreen.style.display = 'flex';
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'none';
        
        // Add fade-in animation
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.opacity = '1';
        }, 50);
    },
    
    // Hide loading screen
    hide: function() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'none';
    },
    
    // Update loading message without hiding/showing
    updateMessage: function(message) {
        const loadingMessage = document.querySelector('#loadingScreen .loading-text p');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    },
    
    // Show loading for login process
    showLogin: function() {
        this.show('Racket Warrior', 'Signing you in...');
    },
    
    // Show loading for logout process
    showLogout: function() {
        this.show('Racket Warrior', 'Signing you out...');
    },
    
    // Show loading for user creation
    showUserCreation: function() {
        this.show('Racket Warrior', 'Creating new user...');
    },
    
    // Show loading for password change
    showPasswordChange: function() {
        this.show('Racket Warrior', 'Updating your password...');
    }
};

// Date and Time Utilities
const DateUtils = {
    // Global month filter state
    _globalMonth: null,
    
    setGlobalMonth: function(month) {
        this._globalMonth = month;
        // Notify all pages of month change
        window.dispatchEvent(new CustomEvent('monthFilterChanged', { detail: month }));
    },
    
    getGlobalMonth: function() {
        return this._globalMonth;
    },

    // Format date to display string
    formatDate: function(date, format = 'DD/MM/YYYY') {
        if (!date) return '';
        
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default:
                return d.toLocaleDateString();
        }
    },
    
    // Get current date in YYYY-MM-DD format
    getCurrentDate: function() {
        return new Date().toISOString().split('T')[0];
    },
    
    // Get month name from date
    getMonthName: function(date) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const d = new Date(date);
        return months[d.getMonth()];
    },
    
    // Get month-year string for filtering
    getMonthYear: function(date) {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}`;
    },
    
    // Parse month-year string to readable format
    parseMonthYear: function(monthYear) {
        if (!monthYear) return '';
        const [year, month] = monthYear.split('-');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    },

    // Format month key for display (alias for parseMonthYear)
    formatMonthForDisplay: function(monthKey) {
        return this.parseMonthYear(monthKey);
    },

    // Centralized month filter setup for all pages
    setupAvailableMonthsFilter: async function(filterId, options = {}) {
        const filter = document.getElementById(filterId);
        if (!filter) {
            console.warn(`Month filter element '${filterId}' not found`);
            return [];
        }

        try {
            console.log(`📅 Setting up month filter: ${filterId}`);
            
            // Get available months from API
            const response = await API.getAvailableMonths();
            
            let availableMonths = [];
            
            if (response && response.success && Array.isArray(response.data)) {
                availableMonths = response.data;
                console.log(`📅 Available months from API:`, availableMonths);
            } else {
                console.warn(`📅 API failed, using fallback months`);
                // Fallback to generated months if API fails
                const fallbackMonths = this.generateMonthOptions();
                availableMonths = fallbackMonths.map(m => m.value);
            }

            // Clear existing options
            filter.innerHTML = '';
            
            // Add "All Time" option unless explicitly disabled
            if (options.includeAll !== false) {
                const allTimeLabel = options.allTimeLabel || 'All Time';
                filter.innerHTML = `<option value="">${allTimeLabel}</option>`;
            }

            // Add available months
            availableMonths.forEach(monthKey => {
                const option = document.createElement('option');
                option.value = monthKey;
                option.textContent = this.formatMonthForDisplay(monthKey);
                filter.appendChild(option);
            });

            // Set default value - prioritize current month if available
            if (options.defaultValue !== undefined) {
                filter.value = options.defaultValue;
            } else if (availableMonths.length > 0) {
                // Try to find current month in available months
                const currentMonth = this.getMonthKey(new Date());
                const hasCurrentMonth = availableMonths.includes(currentMonth);
                
                if (hasCurrentMonth) {
                    // Use current month if it has data
                    filter.value = currentMonth;
                    console.log(`📅 Set default to current month: ${currentMonth}`);
                } else {
                    // Use latest month with data (first in array since they're sorted desc)
                    const latestMonth = availableMonths[0];
                    filter.value = latestMonth;
                    console.log(`📅 Set default to latest month: ${latestMonth}`);
                }
            }

            console.log(`✅ Month filter '${filterId}' setup complete with ${availableMonths.length} months`);
            return availableMonths;

        } catch (error) {
            console.error(`❌ Error setting up month filter '${filterId}':`, error);
            
            // Fallback setup
            const fallbackMonths = this.generateMonthOptions();
            const allTimeLabel = options.allTimeLabel || 'All Time';
            filter.innerHTML = `<option value="">${allTimeLabel}</option>`;
            
            fallbackMonths.forEach(month => {
                const option = document.createElement('option');
                option.value = month.value;
                option.textContent = month.label;
                filter.appendChild(option);
            });
            
            return fallbackMonths.map(m => m.value);
        }
    },

    // Format date for input elements (YYYY-MM-DD)
    formatDateForInput: function(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    },

    // Get month key from date (YYYY-MM format)
    getMonthKey: function(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            return `${year}-${month}`;
        } catch (error) {
            return '';
        }
    },

    // Format month key to readable format
    formatMonth: function(monthKey) {
        if (!monthKey) return 'N/A';
        try {
            const [year, month] = monthKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } catch (error) {
            return monthKey;
        }
    },

    // Generate month options for dropdowns
    generateMonthOptions: function() {
        const options = [];
        const currentDate = new Date();
        
        // Generate last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const value = `${year}-${month}`;
            const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        
        // Add next 3 months
        for (let i = 1; i <= 3; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const value = `${year}-${month}`;
            const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        
        return options;
    }
};

// Validation Utilities
const ValidationUtils = {
    // Validate email
    isValidEmail: function(email) {
        return CONFIG.VALIDATION.EMAIL.test(email);
    },
    
    // Validate phone number
    isValidPhone: function(phone) {
        return CONFIG.VALIDATION.PHONE.test(phone);
    },
    
    // Validate password strength
    validatePassword: function(password) {
        const rules = CONFIG.VALIDATION.PASSWORD;
        const result = {
            isValid: true,
            errors: [],
            requirements: {
                length: password.length >= rules.MIN_LENGTH,
                uppercase: rules.REQUIRE_UPPERCASE ? /[A-Z]/.test(password) : true,
                lowercase: rules.REQUIRE_LOWERCASE ? /[a-z]/.test(password) : true,
                number: rules.REQUIRE_NUMBER ? /\d/.test(password) : true,
                special: rules.REQUIRE_SPECIAL ? new RegExp(`[${rules.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password) : true
            }
        };
        
        if (!result.requirements.length) {
            result.errors.push(`Password must be at least ${rules.MIN_LENGTH} characters long`);
        }
        if (!result.requirements.uppercase) {
            result.errors.push('Password must contain at least one uppercase letter');
        }
        if (!result.requirements.lowercase) {
            result.errors.push('Password must contain at least one lowercase letter');
        }
        if (!result.requirements.number) {
            result.errors.push('Password must contain at least one number');
        }
        if (!result.requirements.special) {
            result.errors.push('Password must contain at least one special character');
        }
        
        result.isValid = Object.values(result.requirements).every(req => req === true);
        
        return result;
    },
    
    // Check if passwords match
    passwordsMatch: function(password1, password2) {
        return password1 === password2;
    },
    
    // Validate required fields
    validateRequired: function(fields) {
        const errors = [];
        
        for (const [fieldName, value] of Object.entries(fields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(`${fieldName} is required`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// UI Utilities
const UIUtils = {
    // Show notification
    showNotification: function(message, type = 'info', duration = 5000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto hide notification
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    },
    
    getNotificationIcon: function(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    // Show loading state
    showLoading: function(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (element) {
            element.disabled = true;
            element.classList.add('loading');
            const originalContent = element.innerHTML;
            element.setAttribute('data-original-content', originalContent);
            
            if (element.tagName === 'BUTTON') {
                element.innerHTML = `
                    <div class="d-flex align-center justify-center gap-2">
                        <div class="spinner-border"></div>
                        <span>${text}</span>
                    </div>
                `;
            } else {
                element.innerHTML = `
                    <div class="loading-placeholder">
                        <div class="spinner-border"></div>
                        <span>${text}</span>
                    </div>
                `;
            }
        }
    },
    
    // Hide loading state
    hideLoading: function(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (element && element.classList.contains('loading')) {
            element.disabled = false;
            element.classList.remove('loading');
            const originalContent = element.getAttribute('data-original-content');
            if (originalContent) {
                element.innerHTML = originalContent;
                element.removeAttribute('data-original-content');
            }
        }
    },
    
    // Confirm dialog
    confirm: function(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title: title,
                content: `
                    <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">${message}</p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="resolveConfirm(false)">Cancel</button>
                        <button type="button" class="btn btn-danger" onclick="resolveConfirm(true)">Confirm</button>
                    </div>
                `,
                showCloseButton: false
            });
            
            // Add resolver to global scope temporarily
            window.resolveConfirm = (result) => {
                modal.hide();
                resolve(result);
                delete window.resolveConfirm;
            };
        });
    },
    
    // Create modal
    createModal: function(options = {}) {
        const modalId = 'modal_' + Date.now();
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${options.title || 'Modal'}</h3>
                    ${options.showCloseButton !== false ? '<button class="modal-close" onclick="this.closest(\'.modal\').remove()"><i class="fas fa-times"></i></button>' : ''}
                </div>
                <div class="modal-body">
                    ${options.content || ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 100);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return {
            element: modal,
            show: () => modal.classList.add('show'),
            hide: () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        };
    }
};

// Currency Utilities
const CurrencyUtils = {
    // Format amount with currency (bulletproof)
    format: function(amount, currency = 'QAR') {
        // Ensure currency is defined
        if (!currency || currency === undefined) {
            currency = 'QAR';
        }
        
        // Ensure amount is a valid number
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || amount === null || amount === undefined) {
            return `${currency} 0.00`;
        }
        
        return `${currency} ${numAmount.toFixed(2)}`;
    },
    
    // Parse currency string to number
    parse: function(currencyString) {
        if (typeof currencyString === 'number') return currencyString;
        return parseFloat(currencyString.replace(/[^0-9.-]+/g, '')) || 0;
    }
};

// Local Storage Utilities
const StorageUtils = {
    // Get item from localStorage
    get: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            Logger.error('Error reading from localStorage', error);
            return null;
        }
    },
    
    // Set item in localStorage
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            Logger.error('Error writing to localStorage', error);
            return false;
        }
    },
    
    // Remove item from localStorage
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            Logger.error('Error removing from localStorage', error);
            return false;
        }
    },
    
    // Clear all app data from localStorage
    clearAppData: function() {
        const keys = Object.values(CONFIG.STORAGE_KEYS);
        keys.forEach(key => this.remove(key));
    }
};

// Permission Utilities
const PermissionUtils = {
    // Check if user has permission
    hasPermission: function(userRole, permission) {
        if (!userRole || !CONFIG.ROLES[userRole]) return false;
        return CONFIG.ROLES[userRole].permissions.includes(permission);
    },
    
    // Check if user can perform action
    canPerformAction: function(userRole, action) {
        const actionPermissions = {
            view: 'view',
            add: 'add',
            edit: 'edit',
            delete: 'delete',
            admin: 'admin',
            logs: 'logs'
        };
        
        return this.hasPermission(userRole, actionPermissions[action]);
    },
    
    // Get user role display info
    getRoleInfo: function(role) {
        return CONFIG.ROLES[role] || { name: 'Unknown', icon: '❓' };
    }
};

// Data Utilities
const DataUtils = {
    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Sort array of objects by property
    sortBy: function(array, property, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (direction === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            } else {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
        });
    },
    
    // Filter array by search term
    filterBySearch: function(array, searchTerm, searchFields) {
        if (!searchTerm) return array;
        
        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    },
    
    // Group array by property
    groupBy: function(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },
    
    // Calculate sum of property values
    sumBy: function(array, property) {
        return array.reduce((sum, item) => sum + (parseFloat(item[property]) || 0), 0);
    }
};

// DOM Utilities
const DOMUtils = {
    // Create element with attributes and content
    createElement: function(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },
    
    // Toggle class on element
    toggleClass: function(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            element.classList.toggle(className);
        }
    },
    
    // Show/hide element
    toggle: function(element, show = null) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            if (show === null) {
                element.style.display = element.style.display === 'none' ? '' : 'none';
            } else {
                element.style.display = show ? '' : 'none';
            }
        }
    }
};

// File Utilities
const FileUtils = {
    // Convert file to base64
    toBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    
    // Validate file type and size
    validateFile: function(file, options = {}) {
        const { 
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
        } = options;
        
        const errors = [];
        
        if (file.size > maxSize) {
            errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        }
        
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Export utilities to global scope
window.Logger = Logger;
window.ActivityLogger = ActivityLogger;
window.DateUtils = DateUtils;
window.ValidationUtils = ValidationUtils;
window.UIUtils = UIUtils;
window.CurrencyUtils = CurrencyUtils;
window.StorageUtils = StorageUtils;
window.PermissionUtils = PermissionUtils;
window.DataUtils = DataUtils;
window.DOMUtils = DOMUtils;
window.FileUtils = FileUtils;