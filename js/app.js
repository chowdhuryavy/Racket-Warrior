// Configuration
const CONFIG = {
    // Replace with your actual Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyXcvA0LNt_ZWxGgx3dgJK9U5hVIrZg7ovzKOkt8M8kxbMrbdbiG5mBgPP-yqaYNOHtVA/exec',
    MONTHS: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
};

// Global state
let currentUser = null;
let currentPage = 'dashboard';
let cachedData = {
    players: [],
    income: [],
    expenses: [],
    users: [],
    logs: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for existing session
    checkSession();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize date inputs with today's date
    initializeDateInputs();
    
    // Set up mobile responsiveness
    setupMobileHandlers();
    
    console.log('Gym Management System initialized');
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Forgot password forms
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    const otpVerificationForm = document.getElementById('otpVerificationForm');
    if (otpVerificationForm) {
        otpVerificationForm.addEventListener('submit', handleOTPVerification);
    }
    
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
    
    // Data forms
    const playerForm = document.getElementById('playerForm');
    if (playerForm) {
        playerForm.addEventListener('submit', handlePlayerSubmit);
    }
    
    const collectionForm = document.getElementById('collectionForm');
    if (collectionForm) {
        collectionForm.addEventListener('submit', handleCollectionSubmit);
    }
    
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }
    
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Filter change events
    setupFilterEventListeners();
    
    // Password validation
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function(e) {
            validatePassword(e.target.value);
        });
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

function setupFilterEventListeners() {
    const filters = [
        'dashboardMonthFilter',
        'playersMonthFilter', 
        'playersStatusFilter',
        'collectionsMonthFilter',
        'collectionsPlayerFilter',
        'expensesMonthFilter',
        'logsSearch'
    ];
    
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            const eventType = element.tagName === 'INPUT' ? 'input' : 'change';
            element.addEventListener(eventType, debounce(function() {
                handleFilterChange(filterId);
            }, 300));
        }
    });
}

function setupMobileHandlers() {
    // Handle mobile sidebar toggle
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartY - touchEndY;
        
        if (window.innerWidth <= 768) {
            // Swipe up to show sidebar, down to hide
            if (Math.abs(diff) > swipeThreshold) {
                const sidebar = document.getElementById('sidebar');
                if (diff > 0) {
                    // Swipe up - show sidebar
                    sidebar.style.transform = 'translateY(0)';
                } else {
                    // Swipe down - hide sidebar
                    sidebar.style.transform = 'translateY(-100%)';
                }
            }
        }
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            adjustForMobile();
        }, 500);
    });
    
    // Initial mobile adjustment
    adjustForMobile();
}

function adjustForMobile() {
    if (window.innerWidth <= 768) {
        // Adjust viewport for mobile
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Adjust main content padding
        const mainContent = document.querySelector('.main-content');
        if (mainContent && document.getElementById('appContainer').style.display !== 'none') {
            const sidebarHeight = document.getElementById('sidebar').offsetHeight;
            mainContent.style.paddingTop = `${sidebarHeight + 20}px`;
        }
    }
}

function initializeDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = [
        'playerJoinDate',
        'collectionDate', 
        'expenseDate'
    ];
    
    dateInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && !input.value) {
            input.value = today;
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-IN');
}

function getMonthYear(date) {
    const d = new Date(date);
    return `${CONFIG.MONTHS[d.getMonth()]}'${d.getFullYear().toString().slice(-2)}`;
}

function getCurrentMonthYear() {
    const now = new Date();
    return getMonthYear(now);
}

function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

let notificationTimeout = null;

function showNotification(message, type = 'info') {
    console.log('Showing notification:', message, type);
    
    // Clear any existing timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => {
        if (n && n.parentElement) {
            n.remove();
        }
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; padding: 0 5px;">&times;</button>
    `;
    
    // Ensure proper styling
    notification.style.cssText = `
        display: flex !important;
        align-items: center;
        gap: 10px;
        position: fixed;
        z-index: 99999;
        visibility: visible;
        opacity: 1;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Force reflow
    notification.offsetHeight;
    
    console.log('Notification added to DOM, computed style:', window.getComputedStyle(notification).display);
    
    // Auto remove after 6 seconds
    notificationTimeout = setTimeout(() => {
        if (notification && notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification && notification.parentElement) {
                    notification.remove();
                }
                notificationTimeout = null;
            }, 300);
        }
    }, 6000);
}

function showButtonLoading(button) {
    if (button) {
        button.classList.add('loading');
        button.disabled = true;
    }
}

function hideButtonLoading(button) {
    if (button) {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// JSONP API call function to bypass CORS completely
function apiCall(action, data = {}) {
    showLoading();
    
    return new Promise((resolve, reject) => {
        // Create unique callback name
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        
        // Create script element
        const script = document.createElement('script');
        
        // Set up callback function
        window[callbackName] = function(response) {
            console.log('JSONP Response received:', response);
            
            // Clean up
            document.head.removeChild(script);
            delete window[callbackName];
            hideLoading();
            
            if (response && response.success) {
                console.log('JSONP Success, data:', response.data);
                resolve(response.data);
            } else {
                console.error('JSONP Error:', response);
                const errorMsg = response ? (response.message || 'Request failed') : 'Request failed';
                reject(new Error(errorMsg));
            }
        };
        
        // Handle script load errors
        script.onerror = function() {
            document.head.removeChild(script);
            delete window[callbackName];
            hideLoading();
            reject(new Error('Network error or script load failed'));
        };
        
        // Build URL with parameters
        const params = new URLSearchParams();
        params.append('callback', callbackName);
        params.append('action', action);
        
        // Add all data as URL parameters
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (typeof data[key] === 'object') {
                    params.append(key, JSON.stringify(data[key]));
                } else {
                    params.append(key, data[key]);
                }
            }
        });
        
        // Set script source
        script.src = `${CONFIG.SCRIPT_URL}?${params.toString()}`;
        
        // Add script to head
        document.head.appendChild(script);
        
        // Set timeout
        setTimeout(() => {
            if (window[callbackName]) {
                document.head.removeChild(script);
                delete window[callbackName];
                hideLoading();
                reject(new Error('Request timeout - please check your internet connection'));
            }
        }, 30000); // 30 second timeout
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!emailInput || !passwordInput) {
            throw new Error('Login form elements not found');
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        console.log('Attempting login with email:', email);
        
        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }
        
        // Test backend connectivity first
        console.log('Testing backend connectivity...');
        try {
            const testResult = await apiCall('test');
            console.log('Backend test result:', testResult);
        } catch (testError) {
            console.error('Backend connectivity test failed:', testError);
            throw new Error('Cannot connect to server. Please check your internet connection.');
        }
        
        console.log('Making API call to login...');
        const result = await apiCall('login', { email, password });
        console.log('API call result:', result);
        
        // Handle different response formats
        if (result && (result.user || result.email)) {
            currentUser = result.user || result;
            console.log('Login successful, user:', currentUser);
        } else {
            throw new Error('Invalid response format from server');
        }
        
        // Store user session
        localStorage.setItem('gymUser', JSON.stringify(currentUser));
        
        // Show app and hide login
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        // Use robust transition function
        if (!transitionToApp()) {
            console.error('Failed to transition to app');
            return;
        }
        
        // Set user info
        const userNameEl = document.getElementById('currentUserName');
        const userRoleEl = document.getElementById('currentUserRole');
        
        if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.email;
        if (userRoleEl) userRoleEl.textContent = currentUser.role || 'User';
        
        // Show/hide admin sections
        setupUserPermissions();
        
        // Log the login action
        await logUserAction('LOGIN', 'User logged in successfully', { email: currentUser.email });
        
        // Load initial data
        await loadDashboardData();
        showNotification(`Welcome back, ${currentUser.name || currentUser.email}!`, 'success');
        
        // Initialize sidebar and mobile setup
        initializeSidebar();
        adjustForMobile();
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout. Please try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

function setupUserPermissions() {
    if (!currentUser) return;
    
    console.log('Setting up permissions for user:', currentUser.role);
    
    // Show/hide admin-only items
    const adminItems = document.querySelectorAll('.admin-only');
    adminItems.forEach(item => {
        item.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    });
    
    // Update user info in sidebar
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-details">
                <span class="user-name">${escapeHtml(currentUser.name || currentUser.email)}</span>
                <span class="user-role">${escapeHtml(currentUser.role || 'User')}</span>
            </div>
        `;
    }
    
    // Set view-only restrictions
    if (currentUser.role === 'view') {
        const addButtons = document.querySelectorAll('#addPlayerBtn, #addCollectionBtn, #addExpenseBtn');
        addButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
        
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
    }
}

async function logout() {
    if (currentUser) {
        // Log the logout action
        await logUserAction('LOGOUT', 'User logged out', { email: currentUser.email });
    }
    
    localStorage.removeItem('gymUser');
    currentUser = null;
    
    // Reset UI using robust transition
    transitionToLogin();
    
    // Clear forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
    
    // Reset cached data
    cachedData = {
        players: [],
        income: [],
        expenses: [],
        users: [],
        logs: []
    };
    
    showNotification('Logged out successfully', 'info');
}

// Logging function
async function logUserAction(action, description, data = {}) {
    try {
        if (!currentUser) return;
        
        await apiCall('logAction', {
            user: JSON.stringify(currentUser),
            action: action,
            description: description,
            data: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Failed to log action:', error);
    }
}

function checkSession() {
    try {
        const stored = localStorage.getItem('gymUser');
        if (stored) {
            currentUser = JSON.parse(stored);
            console.log('Session found for user:', currentUser);
            
            // Auto-login if session exists
            const loginPage = document.getElementById('loginPage');
            const appContainer = document.getElementById('appContainer');
            
            // Use robust transition function
            if (!transitionToApp()) {
                console.error('Session check: Failed to transition to app');
                return;
            }
            
            // Set user info
            const userNameEl = document.getElementById('currentUserName');
            const userRoleEl = document.getElementById('currentUserRole');
            
            if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.email;
            if (userRoleEl) userRoleEl.textContent = currentUser.role || 'User';
            
            setupUserPermissions();
            initializeSidebar();
            loadDashboardData();
            adjustForMobile();
        } else {
            console.log('No session found, staying on login page');
        }
    } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('gymUser');
    }
}

// Password validation
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update UI if elements exist
    const reqElements = {
        'req-length': requirements.length,
        'req-uppercase': requirements.uppercase,
        'req-lowercase': requirements.lowercase,
        'req-number': requirements.number,
        'req-special': requirements.special
    };
    
    Object.keys(reqElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle('valid', reqElements[id]);
        }
    });
    
    return Object.values(requirements).every(req => req);
}

// Forgot password functions
function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('active');
        // Reset steps
        document.getElementById('forgotStep1').style.display = 'block';
        document.getElementById('forgotStep2').style.display = 'none';
        document.getElementById('forgotStep3').style.display = 'none';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const email = document.getElementById('forgotEmail').value;
        await apiCall('sendOTP', { email });
        
        // Log OTP request (no user context since not logged in)
        try {
            await apiCall('logAction', {
                user: JSON.stringify({ email: email }),
                action: 'OTP_REQUEST',
                description: 'User requested password reset OTP',
                data: JSON.stringify({ email: email })
            });
        } catch (logError) {
            console.error('Failed to log OTP request:', logError);
        }
        
        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
        
        showNotification('OTP sent to your email', 'success');
    } catch (error) {
        showNotification('Failed to send OTP. Please check your email.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleOTPVerification(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const email = document.getElementById('forgotEmail').value;
        const otp = document.getElementById('otpCode').value;
        await apiCall('verifyOTP', { email, otp });
        
        // Log OTP verification
        try {
            await apiCall('logAction', {
                user: JSON.stringify({ email: email }),
                action: 'OTP_VERIFY',
                description: 'User verified OTP successfully',
                data: JSON.stringify({ email: email })
            });
        } catch (logError) {
            console.error('Failed to log OTP verification:', logError);
        }
        
        document.getElementById('forgotStep2').style.display = 'none';
        document.getElementById('forgotStep3').style.display = 'block';
        
        showNotification('OTP verified successfully', 'success');
    } catch (error) {
        showNotification('Invalid OTP. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const email = document.getElementById('forgotEmail').value;
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        // Validate password requirements
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            const requirements = Object.entries(passwordValidation.requirements)
                .filter(([key, value]) => !value)
                .map(([key, value]) => {
                    switch(key) {
                        case 'length': return 'At least 8 characters';
                        case 'uppercase': return 'One uppercase letter';
                        case 'lowercase': return 'One lowercase letter';
                        case 'number': return 'One number';
                        case 'special': return 'One special character';
                        default: return key;
                    }
                });
            throw new Error(`Password requirements:\n• ${requirements.join('\n• ')}`);
        }
        
        await apiCall('resetPassword', { email, password });
        
        // Log password reset
        try {
            await apiCall('logAction', {
                user: JSON.stringify({ email: email }),
                action: 'PASSWORD_RESET',
                description: 'User reset password successfully',
                data: JSON.stringify({ email: email })
            });
        } catch (logError) {
            console.error('Failed to log password reset:', logError);
        }
        
        closeForgotPassword();
        showNotification('Password reset successfully', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

function validatePasswordStrength(password) {
    if (!password) {
        return { isValid: false, requirements: { error: 'Password is required' } };
    }
    
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const isValid = Object.values(requirements).every(req => req);
    return { isValid, requirements };
}

// Navigation functions
function showPage(pageName) {
    try {
        console.log('Navigating to page:', pageName);
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
        
        // Hide all pages
        const pages = document.querySelectorAll('.content-page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`[onclick*="'${pageName}'"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        currentPage = pageName;
        
        // Log page view
        logUserAction('PAGE_VIEW', `Viewed ${pageName} page`, { page: pageName });
        
        // Load page data
        switch (pageName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'players':
                loadPlayersData();
                break;
            case 'collections':
                loadCollectionsData();
                break;
            case 'expenses':
                loadExpensesData();
                break;
            case 'logs':
                loadLogsData();
                break;
            case 'admin':
                loadUsersData();
                break;
        }
    } catch (error) {
        console.error('Error in showPage:', error);
        showNotification('Error loading page', 'error');
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const dashboardData = await apiCall('getDashboardData');
        
        // Update dashboard cards with real data
        renderDashboardCards(dashboardData || {
            activePlayersCount: 0,
            totalCollection: 0,
            totalExpenses: 0,
            totalBalance: 0,
            recentPlayers: [],
            recentTransactions: []
        });
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Show empty dashboard if API fails
        renderDashboardCards({
            activePlayersCount: 0,
            totalCollection: 0,
            totalExpenses: 0,
            totalBalance: 0,
            recentPlayers: [],
            recentTransactions: []
        });
    }
}

function renderDashboardCards(data) {
    // Update dashboard cards
    const cardsContainer = document.querySelector('.dashboard-cards');
    if (cardsContainer) {
        cardsContainer.innerHTML = `
            <div class="dashboard-card">
                <div class="card-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${data.activePlayersCount || 0}</div>
                    <div class="card-label">Active Players</div>
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${formatCurrency(data.totalCollection || 0)}</div>
                    <div class="card-label">Total Collection</div>
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${formatCurrency(data.totalExpenses || 0)}</div>
                    <div class="card-label">Total Expense</div>
                </div>
            </div>
            
            <div class="dashboard-card">
                <div class="card-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="card-content">
                    <div class="card-value">${formatCurrency(data.totalBalance || 0)}</div>
                    <div class="card-label">Total Balance</div>
                </div>
            </div>
        `;
    }
    
    // Update recent players
    const recentPlayersContainer = document.querySelector('.recent-players');
    if (recentPlayersContainer && data.recentPlayers) {
        recentPlayersContainer.innerHTML = data.recentPlayers.length > 0 
            ? data.recentPlayers.map(player => `
                <div class="recent-item">
                    <div class="item-info">
                        <span class="item-name">${escapeHtml(player.name)}</span>
                        <span class="item-date">${formatDate(player.joinDate)}</span>
                    </div>
                    <span class="item-status status-${player.status}">${escapeHtml(player.status)}</span>
                </div>
            `).join('')
            : '<div class="no-data">No recent players</div>';
    }
}

function showDemoData() {
    cachedData.players = [
        { ID: '1', Name: 'John Doe', Status: 'active', MonthlyStatus: '{"Jan\'25": true}' },
        { ID: '2', Name: 'Jane Smith', Status: 'active', MonthlyStatus: '{"Jan\'25": true}' }
    ];
    cachedData.income = [
        { ID: '1', Date: '2025-01-01', Amount: 5000, PlayerName: 'John Doe' }
    ];
    cachedData.expenses = [
        { ID: '1', Date: '2025-01-01', Amount: 1000, Category: 'Equipment' }
    ];
    
    updateDashboardFilters();
    updateDashboardCards();
    showNotification('Using demo data - configure backend for real data', 'warning');
}

function updateDashboardFilters() {
    const monthFilter = document.getElementById('dashboardMonthFilter');
    if (!monthFilter) return;
    
    const months = new Set();
    
    // Get months from all data sources
    [...cachedData.income, ...cachedData.expenses].forEach(item => {
        if (item.Date) {
            months.add(getMonthYear(item.Date));
        }
    });
    
    cachedData.players.forEach(player => {
        if (player.MonthlyStatus) {
            try {
                const monthlyStatus = JSON.parse(player.MonthlyStatus);
                Object.keys(monthlyStatus).forEach(month => months.add(month));
            } catch (e) {
                console.error('Error parsing monthly status:', e);
            }
        }
    });
    
    // Clear and populate filter
    monthFilter.innerHTML = '<option value="">Select Month</option>';
    Array.from(months).sort().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthFilter.appendChild(option);
    });
    
    // Set current month as default
    const currentMonth = getCurrentMonthYear();
    if (Array.from(months).includes(currentMonth)) {
        monthFilter.value = currentMonth;
    } else if (months.size > 0) {
        monthFilter.value = Array.from(months).sort().pop(); // Latest month
    }
    
    updateDashboardCards();
}

function updateDashboardCards() {
    const selectedMonth = document.getElementById('dashboardMonthFilter')?.value;
    
    if (!selectedMonth) return;
    
    try {
        // Active players for selected month
        let activePlayersCount = 0;
        cachedData.players.forEach(player => {
            if (player.MonthlyStatus) {
                try {
                    const monthlyStatus = JSON.parse(player.MonthlyStatus);
                    if (monthlyStatus[selectedMonth] === true) {
                        activePlayersCount++;
                    }
                } catch (e) {
                    console.error('Error parsing monthly status:', e);
                }
            }
        });
        
        // Total collection for selected month
        const totalCollection = cachedData.income
            .filter(item => getMonthYear(item.Date) === selectedMonth)
            .reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0);
        
        // Total expense for selected month
        const totalExpense = cachedData.expenses
            .filter(item => getMonthYear(item.Date) === selectedMonth)
            .reduce((sum, item) => sum + parseFloat(item.Amount || 0), 0);
        
        // Calculate balance
        const totalBalance = totalCollection - totalExpense;
        
        // Update UI
        updateElementText('activePlayersCount', activePlayersCount);
        updateElementText('totalCollection', formatCurrency(totalCollection));
        updateElementText('totalExpense', formatCurrency(totalExpense));
        updateElementText('totalBalance', formatCurrency(totalBalance));
        
    } catch (error) {
        console.error('Error updating dashboard cards:', error);
    }
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Filter handling
function handleFilterChange(filterId) {
    switch (filterId) {
        case 'dashboardMonthFilter':
            updateDashboardCards();
            break;
        case 'playersMonthFilter':
        case 'playersStatusFilter':
            renderPlayersTable();
            break;
        case 'collectionsMonthFilter':
        case 'collectionsPlayerFilter':
            renderCollectionsTable();
            break;
        case 'expensesMonthFilter':
            renderExpensesTable();
            break;
        case 'logsSearch':
            renderLogsTable();
            break;
    }
}

// Players functions
async function loadPlayersData() {
    try {
        const players = await apiCall('getPlayers');
        cachedData.players = players || [];
        
        updatePlayersFilters();
        renderPlayersTable();
        generateMonthlyStatusOptions();
        
    } catch (error) {
        console.error('Failed to load players data:', error);
        showNotification('Failed to load players data', 'error');
    }
}

function updatePlayersFilters() {
    const monthFilter = document.getElementById('playersMonthFilter');
    if (!monthFilter) return;
    
    const months = new Set();
    
    // Get months from players' monthly status
    cachedData.players.forEach(player => {
        if (player.MonthlyStatus) {
            try {
                const monthlyStatus = JSON.parse(player.MonthlyStatus);
                Object.keys(monthlyStatus).forEach(month => months.add(month));
            } catch (e) {
                console.error('Error parsing monthly status:', e);
            }
        }
    });
    
    // Clear and populate filter
    monthFilter.innerHTML = '<option value="">All Months</option>';
    Array.from(months).sort().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthFilter.appendChild(option);
    });
}

function renderPlayersTable() {
    const tbody = document.querySelector('#playersTable tbody');
    if (!tbody) return;
    
    const monthFilter = document.getElementById('playersMonthFilter')?.value;
    const statusFilter = document.getElementById('playersStatusFilter')?.value;
    
    let filteredPlayers = cachedData.players;
    
    // Apply status filter
    if (statusFilter) {
        filteredPlayers = filteredPlayers.filter(player => player.Status === statusFilter);
    }
    
    // Apply month filter
    if (monthFilter) {
        filteredPlayers = filteredPlayers.filter(player => {
            if (player.MonthlyStatus) {
                try {
                    const monthlyStatus = JSON.parse(player.MonthlyStatus);
                    return monthlyStatus[monthFilter] === true;
                } catch (e) {
                    return false;
                }
            }
            return false;
        });
    }
    
    tbody.innerHTML = '';
    
    if (filteredPlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No players found</td></tr>';
        return;
    }
    
    filteredPlayers.forEach(player => {
        const row = document.createElement('tr');
        const isReadOnly = currentUser?.role === 'view';
        
        row.innerHTML = `
            <td>${escapeHtml(player.Name)}</td>
            <td>${escapeHtml(player.Phone)}</td>
            <td>${escapeHtml(player.Email)}</td>
            <td><span class="status-badge ${player.Status}">${player.Status}</span></td>
            <td>${formatDate(player.JoinDate)}</td>
            <td>
                ${!isReadOnly ? `
                    <button class="action-btn edit" onclick="editPlayer('${player.ID}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deletePlayer('${player.ID}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : '<span class="status-badge view">View Only</span>'}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility functions for password toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input?.nextElementSibling?.querySelector('i');
    
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }
}

// Modal functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showAddPlayerModal() {
    const modal = document.getElementById('addPlayerModal');
    const form = document.getElementById('playerForm');
    const title = document.getElementById('playerModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add Player';
        form.reset();
        document.getElementById('playerId').value = '';
        
        // Set default join date to today
        const joinDateInput = document.getElementById('playerJoinDate');
        if (joinDateInput) {
            joinDateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Clear monthly status checkboxes
        document.querySelectorAll('input[name="monthlyStatus"]').forEach(cb => {
            cb.checked = false;
        });
        
        modal.classList.add('active');
    }
}

function showAddCollectionModal() {
    const modal = document.getElementById('addCollectionModal');
    const form = document.getElementById('collectionForm');
    const title = document.getElementById('collectionModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add Collection';
        form.reset();
        document.getElementById('collectionId').value = '';
        
        // Set default date to today
        const dateInput = document.getElementById('collectionDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }
}

function showAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    const form = document.getElementById('expenseForm');
    const title = document.getElementById('expenseModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add Expense';
        form.reset();
        document.getElementById('expenseId').value = '';
        
        // Set default date to today
        const dateInput = document.getElementById('expenseDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }
}

function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Add User';
        form.reset();
        document.getElementById('userId').value = '';
        
        modal.classList.add('active');
    }
}

// Form submission handlers
async function handlePlayerSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const formData = new FormData(e.target);
        
        // Get monthly status
        const monthlyStatus = {};
        document.querySelectorAll('input[name="monthlyStatus"]:checked').forEach(cb => {
            monthlyStatus[cb.value] = true;
        });
        
        const playerData = {
            id: formData.get('playerId') || undefined,
            name: formData.get('playerName'),
            phone: formData.get('playerPhone'),
            email: formData.get('playerEmail'),
            joinDate: formData.get('playerJoinDate'),
            status: formData.get('playerStatus'),
            monthlyStatus: JSON.stringify(monthlyStatus)
        };
        
        if (playerData.id) {
            await apiCall('updatePlayer', playerData);
            await logUserAction('PLAYER_UPDATE', `Updated player: ${playerData.name}`, playerData);
            showNotification('Player updated successfully', 'success');
        } else {
            await apiCall('addPlayer', playerData);
            await logUserAction('PLAYER_ADD', `Added new player: ${playerData.name}`, playerData);
            showNotification('Player added successfully', 'success');
        }
        
        closeModal('addPlayerModal');
        loadPlayersData();
    } catch (error) {
        showNotification('Failed to save player', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleCollectionSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const formData = new FormData(e.target);
        
        const player = cachedData.players.find(p => p.ID === formData.get('collectionPlayer'));
        
        const collectionData = {
            id: formData.get('collectionId') || undefined,
            date: formData.get('collectionDate'),
            playerId: formData.get('collectionPlayer'),
            playerName: player ? player.Name : '',
            amount: parseFloat(formData.get('collectionAmount')),
            description: formData.get('collectionDescription')
        };
        
        if (collectionData.id) {
            await apiCall('updateIncome', collectionData);
            await logUserAction('COLLECTION_UPDATE', `Updated collection: ${collectionData.amount} from ${collectionData.player}`, collectionData);
            showNotification('Collection updated successfully', 'success');
        } else {
            await apiCall('addIncome', collectionData);
            await logUserAction('COLLECTION_ADD', `Added collection: ${collectionData.amount} from ${collectionData.player}`, collectionData);
            showNotification('Collection added successfully', 'success');
        }
        
        closeModal('addCollectionModal');
        loadCollectionsData();
        
        // Refresh dashboard if it's the current page
        if (currentPage === 'dashboard') {
            loadDashboardData();
        }
    } catch (error) {
        showNotification('Failed to save collection', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const formData = new FormData(e.target);
        
        const expenseData = {
            id: formData.get('expenseId') || undefined,
            date: formData.get('expenseDate'),
            category: formData.get('expenseCategory'),
            amount: parseFloat(formData.get('expenseAmount')),
            description: formData.get('expenseDescription')
        };
        
        if (expenseData.id) {
            await apiCall('updateExpense', expenseData);
            await logUserAction('EXPENSE_UPDATE', `Updated expense: ${expenseData.amount} - ${expenseData.description}`, expenseData);
            showNotification('Expense updated successfully', 'success');
        } else {
            await apiCall('addExpense', expenseData);
            await logUserAction('EXPENSE_ADD', `Added expense: ${expenseData.amount} - ${expenseData.description}`, expenseData);
            showNotification('Expense added successfully', 'success');
        }
        
        closeModal('addExpenseModal');
        loadExpensesData();
        
        // Refresh dashboard if it's the current page
        if (currentPage === 'dashboard') {
            loadDashboardData();
        }
    } catch (error) {
        showNotification('Failed to save expense', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const formData = new FormData(e.target);
        
        const userData = {
            id: formData.get('userId') || undefined,
            name: formData.get('userName'),
            email: formData.get('userEmail'),
            role: formData.get('userRole'),
            status: formData.get('userStatus')
        };
        
        if (userData.id) {
            await apiCall('updateUser', userData);
            showNotification('User updated successfully', 'success');
        } else {
            await apiCall('addUser', userData);
            showNotification('User added successfully. Welcome email sent.', 'success');
        }
        
        closeModal('addUserModal');
        
        // Re-enable email field
        const emailField = document.getElementById('userEmail');
        if (emailField) emailField.disabled = false;
        
        loadUsersData();
    } catch (error) {
        showNotification('Failed to save user', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

// Collections/Income functions
async function loadCollectionsData() {
    try {
        const [income, players] = await Promise.all([
            apiCall('getIncome'),
            apiCall('getPlayers')
        ]);
        
        cachedData.income = income || [];
        cachedData.players = players || [];
        
        updateCollectionsFilters();
        renderCollectionsTable();
        
    } catch (error) {
        console.error('Failed to load collections data:', error);
        showNotification('Failed to load collections data', 'error');
        
        // Set empty data on error
        cachedData.income = [];
        cachedData.players = [];
        renderCollectionsTable();
    }
}

async function loadExpensesData() {
    try {
        const expenses = await apiCall('getExpenses');
        cachedData.expenses = expenses || [];
        
        updateExpensesFilters();
        renderExpensesTable();
        
    } catch (error) {
        console.error('Failed to load expenses data:', error);
        showNotification('Failed to load expenses data', 'error');
        
        // Set empty data on error
        cachedData.expenses = [];
        renderExpensesTable();
    }
}

async function loadLogsData() {
    if (currentUser?.role !== 'admin') return;
    
    try {
        const logs = await apiCall('getLogs');
        cachedData.logs = logs || [];
        renderLogsTable();
    } catch (error) {
        console.error('Failed to load logs data:', error);
        showNotification('Failed to load logs data', 'error');
    }
}

async function loadUsersData() {
    if (currentUser?.role !== 'admin') return;
    
    try {
        const users = await apiCall('getUsers');
        cachedData.users = users || [];
        renderUsersTable();
    } catch (error) {
        console.error('Failed to load users data:', error);
        showNotification('Failed to load users data', 'error');
    }
}

// Placeholder render functions
function updateCollectionsFilters() {
    // Implementation for collections filters
}

function renderCollectionsTable() {
    // Implementation for collections table
}

function updateExpensesFilters() {
    // Implementation for expenses filters
}

function renderExpensesTable() {
    // Implementation for expenses table
}

function renderLogsTable() {
    // Implementation for logs table
}

function renderUsersTable() {
    // Implementation for users table
}

function generateMonthlyStatusOptions() {
    const container = document.getElementById('monthlyStatusContainer');
    if (!container) return;
    
    const currentYear = new Date().getFullYear();
    const months = [];
    
    // Generate options for current year and next year
    for (let year of [currentYear, currentYear + 1]) {
        for (let month = 0; month < 12; month++) {
            const monthYear = `${CONFIG.MONTHS[month]}'${year.toString().slice(-2)}`;
            months.push(monthYear);
        }
    }
    
    container.innerHTML = '';
    
    months.forEach(month => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'month-checkbox';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="month_${month}" name="monthlyStatus" value="${month}">
            <label for="month_${month}">${month}</label>
        `;
        container.appendChild(checkboxDiv);
    });
}

// Sidebar toggle functions
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.style.transform = 'translateY(-100%)';
    }
}

// Placeholder functions for edit/delete operations
async function editPlayer(playerId) {
    const player = cachedData.players.find(p => p.ID === playerId);
    if (!player) return;
    
    // Populate form and show modal
    showNotification('Edit player functionality ready', 'info');
}

async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
        // Get player name before deletion for logging
        const player = cachedData.players.find(p => p.ID === playerId);
        const playerName = player ? player.Name : `ID: ${playerId}`;
        
        await apiCall('deletePlayer', { id: playerId });
        await logUserAction('PLAYER_DELETE', `Deleted player: ${playerName}`, { id: playerId, name: playerName });
        showNotification('Player deleted successfully', 'success');
        loadPlayersData();
    } catch (error) {
        showNotification('Failed to delete player', 'error');
    }
}

// Robust page transition function
function transitionToApp() {
    console.log('Starting transition to app...');
    
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    
    if (!loginPage || !appContainer) {
        console.error('Missing required elements for transition');
        return false;
    }
    
    // Method 1: Direct style manipulation
    loginPage.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
    appContainer.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
    
    // Method 2: Class manipulation
    document.body.classList.add('app-mode');
    document.body.classList.remove('login-mode');
    loginPage.classList.add('hidden');
    loginPage.classList.remove('active');
    appContainer.classList.add('visible');
    
    // Method 3: Force DOM update and mobile adjustments
    requestAnimationFrame(() => {
        loginPage.style.pointerEvents = 'none';
        appContainer.style.pointerEvents = 'auto';
        
        // Mobile responsive adjustments
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-view');
            // Ensure mobile sidebar is hidden initially
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
            }
            if (overlay) {
                overlay.classList.remove('active');
            }
        } else {
            document.body.classList.add('desktop-view');
        }
        
        // Final verification
        const loginDisplay = window.getComputedStyle(loginPage).display;
        const appDisplay = window.getComputedStyle(appContainer).display;
        
        console.log('Final states - Login:', loginDisplay, 'App:', appDisplay);
        console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
        
        if (loginDisplay !== 'none' || appDisplay === 'none') {
            console.warn('Transition may have failed, applying fallback');
            // Fallback method - use transforms instead of display
            loginPage.style.transform = 'translateX(-100vw)';
            loginPage.style.visibility = 'hidden';
            appContainer.style.transform = 'translateX(0)';
            appContainer.style.visibility = 'visible';
        }
    });
    
    return true;
}

function transitionToLogin() {
    console.log('Starting transition to login...');
    
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    
    if (!loginPage || !appContainer) {
        console.error('Missing required elements for transition');
        return false;
    }
    
    // Reset any transformations
    loginPage.style.transform = 'translateX(0)';
    appContainer.style.transform = 'translateX(100vw)';
    
    // Show login, hide app
    loginPage.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
    appContainer.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
    
    document.body.classList.add('login-mode');
    document.body.classList.remove('app-mode');
    loginPage.classList.remove('hidden');
    loginPage.classList.add('active');
    appContainer.classList.remove('visible');
    
    return true;
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred', 'error');
});

// Service worker removed - not needed for this application

// Mobile sidebar functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('sidebar-open');
        
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
}

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('sidebar-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

// Close sidebar when clicking on a nav item (mobile)
function handleNavClick(pageName) {
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
    showPage(pageName);
}

// Handle window resize for mobile/desktop transitions
function handleResize() {
    // Re-initialize sidebar for new screen size
    initializeSidebar();
}

// Add resize listener
window.addEventListener('resize', debounce(handleResize, 250));

// Initialize sidebar based on screen size
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }
    
    console.log('Initializing sidebar for screen width:', window.innerWidth);
    
    if (window.innerWidth <= 768) {
        // Mobile setup
        document.body.classList.add('mobile-view');
        document.body.classList.remove('desktop-view');
        
        // Hide sidebar initially on mobile
        sidebar.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        
        // Show mobile menu button
        if (mobileBtn) mobileBtn.style.display = 'flex';
        
        console.log('Sidebar initialized for mobile');
    } else {
        // Desktop setup
        document.body.classList.add('desktop-view');
        document.body.classList.remove('mobile-view');
        
        // Ensure sidebar is visible on desktop
        sidebar.classList.remove('sidebar-open');
        sidebar.style.transform = 'translateX(0)';
        
        // Hide mobile elements
        if (overlay) overlay.classList.remove('active');
        if (mobileBtn) mobileBtn.style.display = 'none';
        
        console.log('Sidebar initialized for desktop');
    }
    
    // Reset body overflow
    document.body.style.overflow = '';
}