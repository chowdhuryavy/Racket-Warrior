// Configuration
const CONFIG = {
    // Replace with your actual Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyv8UCgWkR_TL7H3ChH2ku76bk9NzfhyvfR79WD2Q28uImnzbhOSWlpzHvY9-mfCX35IQ/exec',
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

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
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

// API functions
async function apiCall(action, data = {}) {
    showLoading();
    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...data
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Request failed');
        }
    } catch (error) {
        console.error('API call failed:', error);
        
        // Detailed CORS debugging
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            console.error('🚨 CORS Issue Detected:');
            console.error('📍 Your Google Apps Script URL:', CONFIG.SCRIPT_URL);
            console.error('❌ This means your Google Apps Script does NOT have CORS headers');
            console.error('🔧 Solution: Redeploy your Google Apps Script with the updated gas-backend.gs code');
            console.error('📖 Follow: GOOGLE_APPS_SCRIPT_DEPLOYMENT.md');
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('Network error. Please check your connection.', 'error');
        } else {
            showNotification(error.message || 'Something went wrong', 'error');
        }
        throw error;
    } finally {
        hideLoading();
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    showButtonLoading(submitButton);
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }
        
        const result = await apiCall('login', { email, password });
        currentUser = result;
        
        // Store user session
        localStorage.setItem('gymUser', JSON.stringify(currentUser));
        
        // Show app and hide login
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Set user info
        document.getElementById('currentUserName').textContent = currentUser.name;
        document.getElementById('currentUserRole').textContent = currentUser.role;
        
        // Show/hide admin sections
        setupUserPermissions();
        
        // Load initial data
        await loadDashboardData();
        showNotification(`Welcome back, ${currentUser.name}!`, 'success');
        
        // Adjust for mobile
        adjustForMobile();
        
    } catch (error) {
        showNotification('Invalid credentials. Please try again.', 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

function setupUserPermissions() {
    const adminItems = document.querySelectorAll('.admin-only');
    adminItems.forEach(item => {
        item.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    });
    
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

function logout() {
    localStorage.removeItem('gymUser');
    currentUser = null;
    
    // Reset UI
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    
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

function checkSession() {
    try {
        const stored = localStorage.getItem('gymUser');
        if (stored) {
            currentUser = JSON.parse(stored);
            
            // Auto-login if session exists
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';
            
            // Set user info
            document.getElementById('currentUserName').textContent = currentUser.name;
            document.getElementById('currentUserRole').textContent = currentUser.role;
            
            setupUserPermissions();
            loadDashboardData();
            adjustForMobile();
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
        
        if (!validatePassword(password)) {
            throw new Error('Password does not meet requirements');
        }
        
        await apiCall('resetPassword', { email, password });
        
        closeForgotPassword();
        showNotification('Password reset successfully', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideButtonLoading(submitButton);
    }
}

// Navigation functions
function showPage(pageName) {
    try {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNav = document.querySelector(`[onclick="showPage('${pageName}')"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Update content
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
        });
        const activePage = document.getElementById(`${pageName}Page`);
        if (activePage) {
            activePage.classList.add('active');
        }
        
        currentPage = pageName;
        
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
        
        // Adjust for mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.style.transform = 'translateY(-100%)';
            }
        }
        
    } catch (error) {
        console.error('Error showing page:', error);
        showNotification('Error loading page', 'error');
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const [players, income, expenses] = await Promise.all([
            apiCall('getPlayers'),
            apiCall('getIncome'),
            apiCall('getExpenses')
        ]);
        
        cachedData.players = players || [];
        cachedData.income = income || [];
        cachedData.expenses = expenses || [];
        
        updateDashboardFilters();
        updateDashboardCards();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Show demo data if API fails
        showDemoData();
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
            showNotification('Player updated successfully', 'success');
        } else {
            await apiCall('addPlayer', playerData);
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
            showNotification('Collection updated successfully', 'success');
        } else {
            await apiCall('addIncome', collectionData);
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
            showNotification('Expense updated successfully', 'success');
        } else {
            await apiCall('addExpense', expenseData);
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

// Placeholder functions for other features
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
        await apiCall('deletePlayer', { id: playerId });
        showNotification('Player deleted successfully', 'success');
        loadPlayersData();
    } catch (error) {
        showNotification('Failed to delete player', 'error');
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred', 'error');
});

// Service worker removed - not needed for this application