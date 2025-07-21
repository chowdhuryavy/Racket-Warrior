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
let notificationTimeout = null;
let playersData = [];
let collectionsData = [];
let expensesData = [];

// Forgot Password Flow Management
let currentForgotStep = 1;
let forgotEmailCache = '';
let forgotOTPCache = '';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set initial login mode
    document.body.classList.add('login-mode');
    document.body.classList.remove('app-mode');
    
    // Check for existing session
    checkSession();
    
    // Load initial data to populate from Google Sheets
    loadInitialData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize date inputs with today's date
    initializeDateInputs();
    
    // Set up mobile responsiveness
    setupMobileHandlers();
    
    // Set up edit form handlers
    setupEditFormHandlers();
    
    // Set up user form handlers
    setupUserFormHandlers();
    
    // Set up forgot password handlers
    setupForgotPasswordHandlers();
    
    // Initialize navigation sections
    initializeNavSections();
    
    console.log('Gym Management System initialized');
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Forgot password forms - handled by setupForgotPasswordHandlers()
    
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

// Form Initialization Functions
function initializePlayerForm() {
    console.log('Initializing player form...');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const joinDateInput = document.getElementById('playerJoinDate');
    if (joinDateInput) {
        joinDateInput.value = today;
    }
    
    // Setup form submission
    const form = document.getElementById('addPlayerForm');
    if (form) {
        form.onsubmit = handlePlayerFormSubmit;
    }
}

function initializeCollectionForm() {
    console.log('Initializing collection form...');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('collectionDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Load players for dropdown
    loadPlayersForDropdown('collectionPlayer');
    
    // Setup form submission
    const form = document.getElementById('addCollectionForm');
    if (form) {
        form.onsubmit = handleCollectionFormSubmit;
    }
}

function initializeExpenseForm() {
    console.log('Initializing expense form...');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Setup form submission
    const form = document.getElementById('addExpenseForm');
    if (form) {
        form.onsubmit = handleExpenseFormSubmit;
    }
}

// Form Submission Handlers
async function handlePlayerFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const playerData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        joinDate: formData.get('joinDate'),
        status: formData.get('status'),
        notes: formData.get('notes')
    };
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton, 'Saving Player...');
    
    try {
        await apiCall('addPlayer', playerData);
        await logUserAction('PLAYER_ADD', `Added new player: ${playerData.name}`, playerData);
        showNotification('Player added successfully!', 'success');
        
        // Reset form and redirect
        e.target.reset();
        initializePlayerForm();
        handleNavClick('players-view');
        
    } catch (error) {
        console.error('Failed to add player:', error);
        showNotification('Failed to add player. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleCollectionFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const collectionData = {
        date: formData.get('date'),
        player: formData.get('player'),
        amount: parseFloat(formData.get('amount')),
        method: formData.get('method'),
        description: formData.get('description')
    };
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton, 'Saving Collection...');
    
    try {
        await apiCall('addIncome', collectionData);
        await logUserAction('COLLECTION_ADD', `Added collection: QAR ${collectionData.amount} from ${collectionData.player}`, collectionData);
        showNotification('Collection added successfully!', 'success');
        
        // Reset form and redirect
        e.target.reset();
        initializeCollectionForm();
        handleNavClick('collections-view');
        
    } catch (error) {
        console.error('Failed to add collection:', error);
        showNotification('Failed to add collection. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

async function handleExpenseFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseData = {
        date: formData.get('date'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        vendor: formData.get('vendor'),
        description: formData.get('description')
    };
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton, 'Saving Expense...');
    
    try {
        await apiCall('addExpense', expenseData);
        await logUserAction('EXPENSE_ADD', `Added expense: QAR ${expenseData.amount} - ${expenseData.description}`, expenseData);
        showNotification('Expense added successfully!', 'success');
        
        // Reset form and redirect
        e.target.reset();
        initializeExpenseForm();
        handleNavClick('expenses-view');
        
    } catch (error) {
        console.error('Failed to add expense:', error);
        showNotification('Failed to add expense. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

// Utility function to load players for dropdown
async function loadPlayersForDropdown(selectId) {
    try {
        const players = await apiCall('getPlayers');
        const select = document.getElementById(selectId);
        if (select && players) {
            // Clear existing options except the first one
            select.innerHTML = '<option value="">Select Player</option>';
            
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.name || player.Name;
                option.textContent = player.name || player.Name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load players for dropdown:', error);
    }
}

// Update currency formatting
function formatCurrency(amount) {
    return `QAR ${parseFloat(amount || 0).toFixed(2)}`;
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

// Deprecated - use showButtonLoading instead
function showLoading() {
    console.log('Global loading deprecated - use button loading instead');
}

// Deprecated - use hideButtonLoading instead
function hideLoading() {
    console.log('Global loading deprecated - use button loading instead');
}

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
        top: 20px;
        right: 20px;
        z-index: 99999;
        visibility: visible !important;
        opacity: 1 !important;
        transform: translateX(0) !important;
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

// Button loading states
function showButtonLoading(button, originalText) {
    if (!button) return;
    
    button.setAttribute('data-original-text', originalText || button.textContent);
    button.classList.add('loading');
    button.disabled = true;
}

function hideButtonLoading(button) {
    if (!button) return;
    
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
    }
    
    button.classList.remove('loading');
    button.disabled = false;
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
            console.error('Script load failed for URL:', script.src);
            document.head.removeChild(script);
            delete window[callbackName];
            hideLoading();
            reject(new Error('Backend connection failed. Please check your internet connection and backend URL.'));
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
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    // Show loading on login button
    showButtonLoading(submitButton, 'Signing In...');
    
    try {
        console.log('Attempting login for:', email);
        
        const response = await apiCall('login', {
            email: email,
            password: password
        });
        
        console.log('Login response:', response);
        
        if (response && (response.email || response.user)) {
            const userData = response.user || response;
            console.log('Login successful, user:', userData);
            
            // Store user data
            currentUser = {
                email: userData.email || email,
                role: userData.role || 'user', 
                name: userData.name || email.split('@')[0],
                needsPasswordChange: userData.needsPasswordChange || ''
            };
            
            localStorage.setItem('gymUser', JSON.stringify(currentUser));
            
            // Log the login action
            await logUserAction('LOGIN', 'User logged in', { email: currentUser.email });
            
            showNotification(`Welcome ${currentUser.name}!`, 'success');
            
            // Set up user permissions and transition to app
            setupUserPermissions();
            
            setTimeout(() => {
                const transitionSuccess = transitionToApp();
                if (transitionSuccess) {
                    showPage('dashboard');
                    loadDashboardData();
                } else {
                    console.error('Failed to transition to app');
                    showNotification('Login successful but failed to load app. Please refresh.', 'error');
                }
            }, 100);
            
        } else {
            console.error('Login failed: Invalid response format', response);
            showNotification('Invalid credentials. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check your credentials and try again.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

function setupUserPermissions() {
    if (!currentUser) {
        console.log('No current user found for permissions setup');
        return;
    }
    
    console.log('Setting up permissions for user:', currentUser.role);
    
    // Add admin class to body for admin users
    if (currentUser.role === 'admin' || currentUser.role === 'Admin') {
        document.body.classList.add('admin-user');
        console.log('Admin user detected - showing admin content');
    } else {
        document.body.classList.remove('admin-user');
        console.log('Non-admin user - hiding admin content');
    }
    
    // Show/hide admin-only navigation items  
    const adminNavItems = document.querySelectorAll('.nav-item.admin-only');
    console.log('Found admin nav items:', adminNavItems.length);
    adminNavItems.forEach(item => {
        if (currentUser.role === 'admin' || currentUser.role === 'Admin') {
            item.style.display = 'flex';
            item.style.visibility = 'visible';
            item.classList.remove('hidden');
            console.log('Showing admin nav item:', item);
        } else {
            item.style.display = 'none';
            item.style.visibility = 'hidden';
            item.classList.add('hidden');
        }
    });
    
    // Show/hide admin-only pages
    const adminPages = document.querySelectorAll('.content-page.admin-only');
    adminPages.forEach(page => {
        if (currentUser.role === 'admin' || currentUser.role === 'Admin') {
            page.classList.add('admin-accessible');
            page.style.display = '';
        } else {
            page.classList.remove('admin-accessible');
            page.style.display = 'none';
        }
    });
    
    // Update user info in sidebar
    const userNameEl = document.getElementById('currentUserName');
    const userRoleEl = document.getElementById('currentUserRole');
    
    if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.email;
    if (userRoleEl) userRoleEl.textContent = currentUser.role || 'User';
    
    // Set view-only restrictions
    if (currentUser.role === 'view') {
        const addButtons = document.querySelectorAll('button[onclick*="showAdd"], .btn-primary');
        addButtons.forEach(btn => {
            if (btn && btn.textContent.includes('Add')) {
                btn.style.display = 'none';
            }
        });
        
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
    }
    
    console.log('Permissions setup complete for:', currentUser.role);
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
    currentForgotStep = 1;
    forgotEmailCache = '';
    forgotOTPCache = '';
    showForgotStep(1);
    showModal('forgotPasswordModal');
}

function closeForgotPassword() {
    closeModal('forgotPasswordModal');
    currentForgotStep = 1;
    forgotEmailCache = '';
    forgotOTPCache = '';
    
    // Reset all forms
    document.getElementById('forgotPasswordForm').reset();
    document.getElementById('otpVerificationForm').reset();
    document.getElementById('resetPasswordForm').reset();
    
    // Reset password requirements
    resetPasswordRequirements();
}

function showForgotStep(step) {
    // Hide all steps
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = 'none';
    document.getElementById('forgotStep3').style.display = 'none';
    
    // Show target step
    document.getElementById(`forgotStep${step}`).style.display = 'block';
    currentForgotStep = step;
    
    if (step === 3) {
        // Setup password validation
        setupPasswordValidation();
    }
}

// Setup Forgot Password Form Handlers
function setupForgotPasswordHandlers() {
    // Step 1: Send OTP
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.onsubmit = async function(e) {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            showButtonLoading(submitButton, 'Sending Code...');
            
            const email = document.getElementById('forgotEmail').value.trim();
            
            if (!email) {
                showNotification('Please enter your email address', 'error');
                hideButtonLoading(submitButton);
                return;
            }
            
            try {
                console.log('Sending OTP to:', email);
                await apiCall('sendOTP', { email: email });
                forgotEmailCache = email;
                showNotification('Verification code sent to your email!', 'success');
                showForgotStep(2);
            } catch (error) {
                console.error('Failed to send OTP:', error);
                showNotification('Failed to send verification code. Please try again.', 'error');
            } finally {
                hideButtonLoading(submitButton);
            }
        };
    }
    
    // Step 2: Verify OTP
    const otpForm = document.getElementById('otpVerificationForm');
    if (otpForm) {
        otpForm.onsubmit = async function(e) {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            showButtonLoading(submitButton, 'Verifying...');
            
            const otp = document.getElementById('otpCode').value.trim();
            
            if (!otp) {
                showNotification('Please enter the verification code', 'error');
                hideButtonLoading(submitButton);
                return;
            }
            
            try {
                console.log('Verifying OTP:', otp, 'for email:', forgotEmailCache);
                await apiCall('verifyOTP', { 
                    email: forgotEmailCache, 
                    otp: otp 
                });
                forgotOTPCache = otp;
                showNotification('Code verified successfully!', 'success');
                showForgotStep(3);
            } catch (error) {
                console.error('Failed to verify OTP:', error);
                showNotification('Invalid verification code. Please try again.', 'error');
            } finally {
                hideButtonLoading(submitButton);
            }
        };
    }
    
    // Step 3: Reset Password
    const resetForm = document.getElementById('resetPasswordForm');
    if (resetForm) {
        resetForm.onsubmit = async function(e) {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            showButtonLoading(submitButton, 'Resetting Password...');
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                hideButtonLoading(submitButton);
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                hideButtonLoading(submitButton);
                return;
            }
            
            if (!validatePasswordStrength(newPassword)) {
                showNotification('Password does not meet requirements', 'error');
                hideButtonLoading(submitButton);
                return;
            }
            
            try {
                console.log('Resetting password for:', forgotEmailCache);
                await apiCall('resetPassword', { 
                    email: forgotEmailCache, 
                    otp: forgotOTPCache,
                    newPassword: newPassword 
                });
                
                showNotification('Password reset successfully! You can now login with your new password.', 'success');
                closeForgotPassword();
                
                // Pre-fill login email
                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) {
                    loginEmailInput.value = forgotEmailCache;
                }
                
            } catch (error) {
                console.error('Failed to reset password:', error);
                showNotification('Failed to reset password. Please try again.', 'error');
            } finally {
                hideButtonLoading(submitButton);
            }
        };
    }
}

// Password Validation with Visual Feedback
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const resetButton = document.getElementById('resetPasswordBtn');
    
    if (!newPasswordInput || !confirmPasswordInput || !resetButton) return;
    
    function validateAndUpdate() {
        const password = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Check each requirement
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            match: password === confirmPassword && password.length > 0
        };
        
        // Update visual indicators
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            const icon = element?.querySelector('.requirement-icon');
            
            if (requirements[req]) {
                element?.classList.add('valid');
                if (icon) {
                    icon.className = 'fas fa-check requirement-icon';
                }
            } else {
                element?.classList.remove('valid');
                if (icon) {
                    icon.className = 'fas fa-times requirement-icon';
                }
            }
        });
        
        // Enable/disable submit button
        const allValid = Object.values(requirements).every(Boolean);
        resetButton.disabled = !allValid;
        
        if (allValid) {
            resetButton.style.opacity = '1';
            resetButton.style.cursor = 'pointer';
        } else {
            resetButton.style.opacity = '0.6';
            resetButton.style.cursor = 'not-allowed';
        }
    }
    
    newPasswordInput.addEventListener('input', validateAndUpdate);
    confirmPasswordInput.addEventListener('input', validateAndUpdate);
    
    // Initial validation
    validateAndUpdate();
}

function resetPasswordRequirements() {
    const requirements = ['length', 'uppercase', 'lowercase', 'number', 'special', 'match'];
    requirements.forEach(req => {
        const element = document.getElementById(`req-${req}`);
        const icon = element?.querySelector('.requirement-icon');
        
        element?.classList.remove('valid');
        if (icon) {
            icon.className = 'fas fa-times requirement-icon';
        }
    });
    
    const resetButton = document.getElementById('resetPasswordBtn');
    if (resetButton) {
        resetButton.disabled = true;
        resetButton.style.opacity = '0.6';
        resetButton.style.cursor = 'not-allowed';
    }
}

// Password Toggle Function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleButton = input?.nextElementSibling?.querySelector('.fas');
    
    if (input && toggleButton) {
        if (input.type === 'password') {
            input.type = 'text';
            toggleButton.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            toggleButton.className = 'fas fa-eye';
        }
    }
}

// Password Strength Validation
function validatePasswordStrength(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
}

// Modal Helper Function
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
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
        
        // Update navigation highlighting
        updateNavigationHighlighting(pageName);
        
        currentPage = pageName;
        
        // Log page view
        logUserAction('PAGE_VIEW', `Viewed ${pageName} page`, { page: pageName });
        
        // Load page data
        switch (pageName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'players-add':
                initializePlayerForm();
                break;
            case 'players-view':
                loadPlayersData();
                break;
            case 'collections-add':
                initializeCollectionForm();
                break;
            case 'collections-view':
                loadCollectionsData();
                break;
            case 'expenses-add':
                initializeExpenseForm();
                break;
            case 'expenses-view':
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

// Duplicate functions removed - using main definitions above

// Edit player function
function editPlayer(playerId) {
    console.log('Edit player:', playerId);
    
    // Find player in current data
    const player = cachedData.players.find(p => p.id === playerId || p.Id === playerId || p.ID === playerId);
    if (!player) {
        showNotification('Player not found', 'error');
        return;
    }
    
    // Populate modal with player data
    document.getElementById('editPlayerId').value = playerId;
    document.getElementById('editPlayerName').value = player.name || player.Name || '';
    document.getElementById('editPlayerPhone').value = player.phone || player.Phone || '';
    document.getElementById('editPlayerEmail').value = player.email || player.Email || '';
    document.getElementById('editPlayerJoinDate').value = player.joinDate || player.JoinDate || '';
    document.getElementById('editPlayerStatus').value = player.status || player.Status || 'active';
    document.getElementById('editPlayerNotes').value = player.notes || player.Notes || '';
    
    showModal('editPlayerModal');
}

// Edit collection function
function editCollection(collectionId) {
    console.log('Edit collection:', collectionId);
    
    // Find collection in current data
    const collection = cachedData.income.find(c => c.id === collectionId || c.Id === collectionId || c.ID === collectionId);
    if (!collection) {
        showNotification('Collection not found', 'error');
        return;
    }
    
    // Populate modal with collection data
    document.getElementById('editCollectionId').value = collectionId;
    document.getElementById('editCollectionDate').value = collection.date || collection.Date || '';
    document.getElementById('editCollectionPlayer').value = collection.player || collection.Player || '';
    document.getElementById('editCollectionAmount').value = collection.amount || collection.Amount || '';
    document.getElementById('editCollectionMethod').value = collection.method || collection.Method || 'cash';
    document.getElementById('editCollectionDescription').value = collection.description || collection.Description || '';
    
    // Load players for dropdown
    loadPlayersForDropdown('editCollectionPlayer');
    
    showModal('editCollectionModal');
}

// Edit expense function
function editExpense(expenseId) {
    console.log('Edit expense:', expenseId);
    
    // Find expense in current data
    const expense = cachedData.expenses.find(e => e.id === expenseId || e.Id === expenseId || e.ID === expenseId);
    if (!expense) {
        showNotification('Expense not found', 'error');
        return;
    }
    
    // Populate modal with expense data
    document.getElementById('editExpenseId').value = expenseId;
    document.getElementById('editExpenseDate').value = expense.date || expense.Date || '';
    document.getElementById('editExpenseCategory').value = expense.category || expense.Category || '';
    document.getElementById('editExpenseAmount').value = expense.amount || expense.Amount || '';
    document.getElementById('editExpenseVendor').value = expense.vendor || expense.Vendor || '';
    document.getElementById('editExpenseDescription').value = expense.description || expense.Description || '';
    
    showModal('editExpenseModal');
}

function showAddUserModal() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.reset();
        showModal('addUserModal');
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

// Refresh Data Functions
function refreshPlayersData() {
    console.log('Refreshing players data...');
    loadPlayersData();
    showNotification('Players data refreshed', 'info');
}

function refreshCollectionsData() {
    console.log('Refreshing collections data...');
    loadCollectionsData();
    showNotification('Collections data refreshed', 'info');
}

function refreshExpensesData() {
    console.log('Refreshing expenses data...');
    loadExpensesData();
    showNotification('Expenses data refreshed', 'info');
}

function refreshLogsData() {
    console.log('Refreshing logs data...');
    loadLogsData();
    showNotification('Logs data refreshed', 'info');
}

function refreshUsersData() {
    console.log('Refreshing users data...');
    loadUsersData();
    showNotification('Users data refreshed', 'info');
}

// Month Filter Function
function filterByMonth() {
    const selectedMonth = document.getElementById('monthFilter').value;
    console.log('Filtering by month:', selectedMonth);
    // Implementation will depend on your data structure
    loadDashboardData(selectedMonth);
}

// Enhanced Load Functions with Fallback Data
async function loadDashboardData(month = '') {
    try {
        showLoading();
        console.log('Loading dashboard data...');
        
        // Try to load real data
        const dashboardData = await apiCall('getDashboardData', { month });
        console.log('Dashboard data loaded:', dashboardData);
        
        // Update dashboard with real data
        renderDashboardData(dashboardData);
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        
        // Show demo data as fallback
        renderDemoDashboardData();
    } finally {
        hideLoading();
    }
}

function renderDashboardData(data) {
    if (!data) return;
    
    // Update dashboard cards
    const activePlayersEl = document.getElementById('activePlayersCount');
    const totalCollectionEl = document.getElementById('totalCollectionAmount');
    const totalExpenseEl = document.getElementById('totalExpenseAmount');
    const totalBalanceEl = document.getElementById('totalBalanceAmount');
    
    if (activePlayersEl) activePlayersEl.textContent = data.activePlayersCount || '0';
    if (totalCollectionEl) totalCollectionEl.textContent = `QAR ${data.totalCollection || '0.00'}`;
    if (totalExpenseEl) totalExpenseEl.textContent = `QAR ${data.totalExpense || '0.00'}`;
    if (totalBalanceEl) totalBalanceEl.textContent = `QAR ${data.totalBalance || '0.00'}`;
    
    // Update monthly summary
    const monthlyCollectionEl = document.getElementById('monthlyCollection');
    const monthlyExpensesEl = document.getElementById('monthlyExpenses');
    
    if (monthlyCollectionEl) monthlyCollectionEl.textContent = `QAR ${data.monthlyCollection || '0'}`;
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = `QAR ${data.monthlyExpenses || '0'}`;
}

function renderDemoDashboardData() {
    console.log('Rendering demo dashboard data...');
    
    // Show demo data
    const demoData = {
        activePlayersCount: '24',
        totalCollection: '12,500.00',
        totalExpense: '8,200.00',
        totalBalance: '4,300.00',
        monthlyCollection: '1,200',
        monthlyExpenses: '800'
    };
    
    renderDashboardData(demoData);
    showNotification('Showing demo data - backend not connected', 'info');
}

async function loadPlayersData() {
    try {
        console.log('Loading players data...');
        const playersData = await apiCall('getPlayers');
        renderPlayersTable(playersData);
    } catch (error) {
        console.error('Failed to load players data:', error);
        showNotification('Failed to load players data', 'error');
        renderPlayersTable([]); // Show empty table
    }
}

function renderPlayersTable(players) {
    const container = document.getElementById('playersViewTable');
    if (!container) return;
    
    if (!players || players.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No Players Found</h3>
                <p>Start by adding your first player to the system.</p>
                <button class="btn btn-primary" onclick="handleNavClick('players-add')">
                    <i class="fas fa-plus"></i>
                    Add First Player
                </button>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    players.forEach(player => {
        tableHTML += `
            <tr>
                <td>${escapeHtml(player.name || 'N/A')}</td>
                <td>${escapeHtml(player.phone || 'N/A')}</td>
                <td>${escapeHtml(player.email || 'N/A')}</td>
                <td>
                    <span class="status-badge ${player.status === 'active' ? 'active' : 'inactive'}">
                        ${player.status || 'Unknown'}
                    </span>
                </td>
                <td>${formatDate(player.joinDate) || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editPlayer('${player.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePlayer('${player.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Similar functions for collections, expenses, etc.
async function loadCollectionsData() {
    try {
        console.log('Loading collections data...');
        const collectionsData = await apiCall('getIncome');
        renderCollectionsTable(collectionsData);
    } catch (error) {
        console.error('Failed to load collections data:', error);
        showNotification('Failed to load collections data', 'error');
        renderCollectionsTable([]);
    }
}

function renderCollectionsTable(collections) {
    const container = document.getElementById('collectionsViewTable');
    if (!container) return;
    
    if (!collections || collections.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coins" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No Collections Found</h3>
                <p>Start by adding your first collection entry.</p>
                <button class="btn btn-primary" onclick="handleNavClick('collections-add')">
                    <i class="fas fa-plus"></i>
                    Add First Collection
                </button>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Player</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    collections.forEach(collection => {
        tableHTML += `
            <tr>
                <td>${formatDate(collection.date) || 'N/A'}</td>
                <td>${escapeHtml(collection.player || 'N/A')}</td>
                <td>QAR ${collection.amount || '0.00'}</td>
                <td>${escapeHtml(collection.description || 'N/A')}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editCollection('${collection.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCollection('${collection.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

async function loadExpensesData() {
    try {
        console.log('Loading expenses data...');
        const expensesData = await apiCall('getExpenses');
        renderExpensesTable(expensesData);
    } catch (error) {
        console.error('Failed to load expenses data:', error);
        showNotification('Failed to load expenses data', 'error');
        renderExpensesTable([]);
    }
}

function renderExpensesTable(expenses) {
    const container = document.getElementById('expensesViewTable');
    if (!container) return;
    
    if (!expenses || expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No Expenses Found</h3>
                <p>Start by adding your first expense entry.</p>
                <button class="btn btn-primary" onclick="handleNavClick('expenses-add')">
                    <i class="fas fa-plus"></i>
                    Add First Expense
                </button>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    expenses.forEach(expense => {
        tableHTML += `
            <tr>
                <td>${formatDate(expense.date) || 'N/A'}</td>
                <td>${escapeHtml(expense.category || 'N/A')}</td>
                <td>QAR ${expense.amount || '0.00'}</td>
                <td>${escapeHtml(expense.description || 'N/A')}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editExpense('${expense.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Show modal function
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// Edit form submission handlers
function setupEditFormHandlers() {
    // Edit Player Form
    const editPlayerForm = document.getElementById('editPlayerForm');
    if (editPlayerForm) {
        editPlayerForm.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const playerData = {
                id: formData.get('editPlayerId'),
                name: formData.get('editPlayerName'),
                phone: formData.get('editPlayerPhone'),
                email: formData.get('editPlayerEmail'),
                joinDate: formData.get('editPlayerJoinDate'),
                status: formData.get('editPlayerStatus'),
                notes: formData.get('editPlayerNotes')
            };
            
            try {
                showLoading();
                await apiCall('editPlayer', playerData);
                await logUserAction('PLAYER_EDIT', `Updated player: ${playerData.name}`, playerData);
                showNotification('Player updated successfully!', 'success');
                closeModal('editPlayerModal');
                if (currentPage === 'players-view') {
                    loadPlayersData();
                }
            } catch (error) {
                console.error('Failed to update player:', error);
                showNotification('Failed to update player. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        };
    }

    // Edit Collection Form
    const editCollectionForm = document.getElementById('editCollectionForm');
    if (editCollectionForm) {
        editCollectionForm.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const collectionData = {
                id: formData.get('editCollectionId'),
                date: formData.get('editCollectionDate'),
                player: formData.get('editCollectionPlayer'),
                amount: parseFloat(formData.get('editCollectionAmount')),
                method: formData.get('editCollectionMethod'),
                description: formData.get('editCollectionDescription')
            };
            
            try {
                showLoading();
                await apiCall('editIncome', collectionData);
                await logUserAction('COLLECTION_EDIT', `Updated collection: QAR ${collectionData.amount} from ${collectionData.player}`, collectionData);
                showNotification('Collection updated successfully!', 'success');
                closeModal('editCollectionModal');
                if (currentPage === 'collections-view') {
                    loadCollectionsData();
                }
            } catch (error) {
                console.error('Failed to update collection:', error);
                showNotification('Failed to update collection. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        };
    }

    // Edit Expense Form
    const editExpenseForm = document.getElementById('editExpenseForm');
    if (editExpenseForm) {
        editExpenseForm.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const expenseData = {
                id: formData.get('editExpenseId'),
                date: formData.get('editExpenseDate'),
                category: formData.get('editExpenseCategory'),
                amount: parseFloat(formData.get('editExpenseAmount')),
                vendor: formData.get('editExpenseVendor'),
                description: formData.get('editExpenseDescription')
            };
            
            try {
                showLoading();
                await apiCall('editExpense', expenseData);
                await logUserAction('EXPENSE_EDIT', `Updated expense: QAR ${expenseData.amount} - ${expenseData.description}`, expenseData);
                showNotification('Expense updated successfully!', 'success');
                closeModal('editExpenseModal');
                if (currentPage === 'expenses-view') {
                    loadExpensesData();
                }
            } catch (error) {
                console.error('Failed to update expense:', error);
                showNotification('Failed to update expense. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        };
    }
}

// Toggle navigation section
function toggleNavSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
        
        // Save state to localStorage
        const isCollapsed = section.classList.contains('collapsed');
        localStorage.setItem(`nav_${sectionId}`, isCollapsed ? 'collapsed' : 'expanded');
    }
}

// Initialize navigation sections from saved state
function initializeNavSections() {
    const sections = ['playersSection', 'collectionsSection', 'expensesSection'];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const savedState = localStorage.getItem(`nav_${sectionId}`);
        
        if (section) {
            if (savedState === 'collapsed') {
                section.classList.add('collapsed');
            } else {
                section.classList.remove('collapsed');
            }
        }
    });
}

// User Management Functions
function showAddUserModal() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.reset();
        showModal('addUserModal');
    }
}

// Add user form handler
function setupUserFormHandlers() {
    // Add User Form
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.onsubmit = async function(e) {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            showButtonLoading(submitButton, 'Adding User...');
            
            const formData = new FormData(e.target);
            const userData = {
                name: formData.get('addUserName') || document.getElementById('addUserName').value,
                email: formData.get('addUserEmail') || document.getElementById('addUserEmail').value,
                password: document.getElementById('addUserPassword').value, // Optional - if blank, auto-generated
                role: formData.get('addUserRole') || document.getElementById('addUserRole').value,
                status: formData.get('addUserStatus') || document.getElementById('addUserStatus').value
            };
            
            // Validate data
            if (!userData.name || !userData.email || !userData.role) {
                showNotification('Please fill in all required fields', 'error');
                hideButtonLoading(submitButton);
                return;
            }
            
            try {
                console.log('Adding user with data:', userData);
                const response = await apiCall('addUser', userData);
                console.log('Add user response:', response);
                
                await logUserAction('USER_ADD', `Added new user: ${userData.name}`, userData);
                showNotification('User added successfully! Welcome email sent.', 'success');
                closeModal('addUserModal');
                
                // Refresh users data if on admin page
                if (currentPage === 'admin') {
                    loadUsersData();
                }
                
            } catch (error) {
                console.error('Failed to add user:', error);
                showNotification('Failed to add user. Please try again.', 'error');
            } finally {
                hideButtonLoading(submitButton);
            }
        };
    }

    // Edit User Form
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.onsubmit = async function(e) {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            showButtonLoading(submitButton, 'Updating User...');
            
            const formData = new FormData(e.target);
            const userData = {
                id: document.getElementById('editUserId').value,
                name: document.getElementById('editUserName').value,
                email: document.getElementById('editUserEmail').value,
                role: document.getElementById('editUserRole').value,
                status: document.getElementById('editUserStatus').value
            };
            
            try {
                await apiCall('editUser', userData);
                await logUserAction('USER_EDIT', `Updated user: ${userData.name}`, userData);
                showNotification('User updated successfully!', 'success');
                closeModal('editUserModal');
                
                if (currentPage === 'admin') {
                    loadUsersData();
                }
                
            } catch (error) {
                console.error('Failed to update user:', error);
                showNotification('Failed to update user. Please try again.', 'error');
            } finally {
                hideButtonLoading(submitButton);
            }
        };
    }
}

// Edit user function
function editUser(userId) {
    console.log('Edit user:', userId);
    
    const user = cachedData.users.find(u => u.id === userId || u.Id === userId || u.email === userId);
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    // Populate modal with user data
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserName').value = user.name || user.Name || '';
    document.getElementById('editUserEmail').value = user.email || user.Email || '';
    document.getElementById('editUserRole').value = user.role || user.Role || '';
    document.getElementById('editUserStatus').value = user.status || user.Status || 'active';
    
    showModal('editUserModal');
}

// Delete user function
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        await apiCall('deleteUser', { id: userId });
        await logUserAction('USER_DELETE', `Deleted user: ${userId}`, { id: userId });
        showNotification('User deleted successfully', 'success');
        
        if (currentPage === 'admin') {
            loadUsersData();
        }
        
    } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('Failed to delete user. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Load users data
async function loadUsersData() {
    try {
        showLoading();
        console.log('Loading users data...');
        
        const users = await apiCall('getUsers');
        console.log('Users data received:', users);
        
        cachedData.users = users || [];
        renderUsersTable(cachedData.users);
        
    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users data', 'error');
        cachedData.users = [];
        renderUsersTable([]);
    } finally {
        hideLoading();
    }
}

// Render users table
function renderUsersTable(users) {
    const container = document.getElementById('usersTable');
    if (!container) return;
    
    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No Users Found</h3>
                <p>Start by adding your first user to the system.</p>
                <button class="btn btn-primary" onclick="showAddUserModal()">
                    <i class="fas fa-plus"></i>
                    Add First User
                </button>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const status = user.status || user.Status || 'active';
        const role = user.role || user.Role || 'user';
        const name = user.name || user.Name || 'N/A';
        const email = user.email || user.Email || 'N/A';
        const lastLogin = user.lastLogin || user.LastLogin || 'Never';
        const userId = user.id || user.Id || user.email || user.Email;
        
        tableHTML += `
            <tr>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(email)}</td>
                <td><span class="status-badge ${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span></td>
                <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                <td>${formatDate(lastLogin) || 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editUser('${userId}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${userId}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Load logs data
async function loadLogsData() {
    try {
        showLoading();
        console.log('Loading logs data...');
        
        const logs = await apiCall('getLogs');
        console.log('Logs data received:', logs);
        
        cachedData.logs = logs || [];
        renderLogsTable(cachedData.logs);
        
    } catch (error) {
        console.error('Failed to load logs:', error);
        showNotification('Failed to load logs data', 'error');
        cachedData.logs = [];
        renderLogsTable([]);
    } finally {
        hideLoading();
    }
}

// Render logs table
function renderLogsTable(logs) {
    const container = document.getElementById('logsTable');
    if (!container) return;
    
    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No Logs Found</h3>
                <p>System activity logs will appear here.</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    logs.slice().reverse().forEach(log => {
        const timestamp = log.timestamp || log.Timestamp || '';
        const user = log.user || log.User || 'System';
        const action = log.action || log.Action || 'N/A';
        const description = log.description || log.Description || 'N/A';
        const details = log.details || log.Details || '';
        
        tableHTML += `
            <tr>
                <td>${formatDate(timestamp) || 'N/A'}</td>
                <td>${escapeHtml(user)}</td>
                <td><span class="status-badge ${action.toLowerCase()}">${action}</span></td>
                <td>${escapeHtml(description)}</td>
                <td>${escapeHtml(details)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

// Refresh functions
async function refreshUsersData() {
    await loadUsersData();
    showNotification('Users data refreshed', 'success');
}

async function refreshLogsData() {
    await loadLogsData();
    showNotification('Logs data refreshed', 'success');
}

// Enhanced navigation highlighting
function updateNavigationHighlighting(pageName) {
    console.log('Updating navigation highlighting for:', pageName);
    
    // Remove all active states
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Handle different page types
    let sectionToExpand = null;
    let itemToActivate = null;
    
    if (pageName === 'dashboard') {
        itemToActivate = document.querySelector('.nav-item[onclick*="dashboard"]');
    } else if (pageName.startsWith('players-')) {
        sectionToExpand = 'playersSection';
        itemToActivate = document.querySelector('.nav-sub-item[onclick*="' + pageName + '"]');
    } else if (pageName.startsWith('collections-')) {
        sectionToExpand = 'collectionsSection';
        itemToActivate = document.querySelector('.nav-sub-item[onclick*="' + pageName + '"]');
    } else if (pageName.startsWith('expenses-')) {
        sectionToExpand = 'expensesSection';
        itemToActivate = document.querySelector('.nav-sub-item[onclick*="' + pageName + '"]');
    } else if (pageName === 'logs') {
        itemToActivate = document.querySelector('.nav-item[onclick*="logs"]');
    } else if (pageName === 'admin') {
        itemToActivate = document.querySelector('.nav-item[onclick*="admin"]');
    }
    
    // Expand the section if needed
    if (sectionToExpand) {
        const section = document.getElementById(sectionToExpand);
        if (section) {
            section.classList.remove('collapsed');
            localStorage.setItem(`nav_${sectionToExpand}`, 'expanded');
        }
    }
    
    // Activate the item
    if (itemToActivate) {
        itemToActivate.classList.add('active');
        console.log('Activated navigation item:', itemToActivate);
    } else {
        console.warn('Could not find navigation item for page:', pageName);
    }
}

// Load initial data from Google Sheets
async function loadInitialData() {
    console.log('Loading initial data from Google Sheets...');
    
    try {
        // Test connectivity first
        await apiCall('test');
        console.log('Backend connection successful');
        
        // Load users data if admin
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'Admin')) {
            try {
                const users = await apiCall('getUsers');
                console.log('Initial users data loaded:', users);
                cachedData.users = users || [];
            } catch (error) {
                console.warn('Could not load users data:', error);
                cachedData.users = [];
            }
        }
        
        // Load players data
        try {
            const players = await apiCall('getPlayers');
            console.log('Initial players data loaded:', players);
            cachedData.players = players || [];
        } catch (error) {
            console.warn('Could not load players data:', error);
            cachedData.players = [];
        }
        
        // Load collections data
        try {
            const collections = await apiCall('getIncome');
            console.log('Initial collections data loaded:', collections);
            cachedData.income = collections || [];
        } catch (error) {
            console.warn('Could not load collections data:', error);
            cachedData.income = [];
        }
        
        // Load expenses data
        try {
            const expenses = await apiCall('getExpenses');
            console.log('Initial expenses data loaded:', expenses);
            cachedData.expenses = expenses || [];
        } catch (error) {
            console.warn('Could not load expenses data:', error);
            cachedData.expenses = [];
        }
        
    } catch (error) {
        console.warn('Could not connect to backend for initial data load:', error);
    }
}