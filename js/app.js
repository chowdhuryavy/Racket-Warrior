// Configuration
const CONFIG = {
    // Replace with your actual Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
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

// Utility functions
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
    document.getElementById('loadingSpinner').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('active');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
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
        
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || 'Request failed');
        }
    } catch (error) {
        console.error('API call failed:', error);
        showNotification(error.message || 'Something went wrong', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// Authentication functions
async function login(email, password) {
    try {
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
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        });
        
        // Set view-only restrictions
        if (currentUser.role === 'view') {
            const addButtons = document.querySelectorAll('#addPlayerBtn, #addCollectionBtn, #addExpenseBtn');
            addButtons.forEach(btn => btn.style.display = 'none');
        }
        
        // Load initial data
        await loadDashboardData();
        showNotification(`Welcome back, ${currentUser.name}!`, 'success');
        
    } catch (error) {
        showNotification('Invalid credentials', 'error');
    }
}

function logout() {
    localStorage.removeItem('gymUser');
    currentUser = null;
    
    // Reset UI
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    
    // Clear forms
    document.getElementById('loginForm').reset();
    
    showNotification('Logged out successfully', 'info');
}

function checkSession() {
    const stored = localStorage.getItem('gymUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        
        // Auto-login if session exists
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Set user info
        document.getElementById('currentUserName').textContent = currentUser.name;
        document.getElementById('currentUserRole').textContent = currentUser.role;
        
        // Show/hide admin sections
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        });
        
        // Set view-only restrictions
        if (currentUser.role === 'view') {
            const addButtons = document.querySelectorAll('#addPlayerBtn, #addCollectionBtn, #addExpenseBtn');
            addButtons.forEach(btn => btn.style.display = 'none');
        }
        
        loadDashboardData();
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
    document.getElementById('forgotPasswordModal').classList.add('active');
}

function closeForgotPassword() {
    document.getElementById('forgotPasswordModal').classList.remove('active');
    // Reset steps
    document.getElementById('forgotStep1').style.display = 'block';
    document.getElementById('forgotStep2').style.display = 'none';
    document.getElementById('forgotStep3').style.display = 'none';
}

async function sendOTP(email) {
    try {
        await apiCall('sendOTP', { email });
        
        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
        
        showNotification('OTP sent to your email', 'success');
    } catch (error) {
        showNotification('Failed to send OTP', 'error');
    }
}

async function verifyOTP(email, otp) {
    try {
        await apiCall('verifyOTP', { email, otp });
        
        document.getElementById('forgotStep2').style.display = 'none';
        document.getElementById('forgotStep3').style.display = 'block';
        
        showNotification('OTP verified successfully', 'success');
    } catch (error) {
        showNotification('Invalid OTP', 'error');
    }
}

async function resetPassword(email, password) {
    try {
        await apiCall('resetPassword', { email, password });
        
        closeForgotPassword();
        showNotification('Password reset successfully', 'success');
    } catch (error) {
        showNotification('Failed to reset password', 'error');
    }
}

// Navigation functions
function showPage(pageName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showPage('${pageName}')"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}Page`).classList.add('active');
    
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
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const [players, income, expenses] = await Promise.all([
            apiCall('getPlayers'),
            apiCall('getIncome'),
            apiCall('getExpenses')
        ]);
        
        cachedData.players = players;
        cachedData.income = income;
        cachedData.expenses = expenses;
        
        updateDashboardFilters();
        updateDashboardCards();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateDashboardFilters() {
    const monthFilter = document.getElementById('dashboardMonthFilter');
    const months = new Set();
    
    // Get months from all data sources
    [...cachedData.income, ...cachedData.expenses].forEach(item => {
        months.add(getMonthYear(item.Date || item.CreatedAt));
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
    const selectedMonth = document.getElementById('dashboardMonthFilter').value;
    
    if (!selectedMonth) return;
    
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
    
    // Calculate balance (simplified - you may want to implement proper balance calculation)
    const totalBalance = totalCollection - totalExpense;
    
    // Update UI
    document.getElementById('activePlayersCount').textContent = activePlayersCount;
    document.getElementById('totalCollection').textContent = formatCurrency(totalCollection);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
}

// Players functions
async function loadPlayersData() {
    try {
        const players = await apiCall('getPlayers');
        cachedData.players = players;
        
        updatePlayersFilters();
        renderPlayersTable();
        generateMonthlyStatusOptions();
        
    } catch (error) {
        console.error('Failed to load players data:', error);
    }
}

function updatePlayersFilters() {
    const monthFilter = document.getElementById('playersMonthFilter');
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
    const monthFilter = document.getElementById('playersMonthFilter').value;
    const statusFilter = document.getElementById('playersStatusFilter').value;
    
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
    
    filteredPlayers.forEach(player => {
        const row = document.createElement('tr');
        const isReadOnly = currentUser.role === 'view';
        
        row.innerHTML = `
            <td>${player.Name}</td>
            <td>${player.Phone}</td>
            <td>${player.Email}</td>
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
                ` : 'View Only'}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function generateMonthlyStatusOptions() {
    const container = document.getElementById('monthlyStatusContainer');
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

function showAddPlayerModal() {
    document.getElementById('playerModalTitle').textContent = 'Add Player';
    document.getElementById('playerForm').reset();
    document.getElementById('playerId').value = '';
    
    // Set default join date to today
    document.getElementById('playerJoinDate').value = new Date().toISOString().split('T')[0];
    
    // Clear monthly status checkboxes
    document.querySelectorAll('input[name="monthlyStatus"]').forEach(cb => cb.checked = false);
    
    document.getElementById('addPlayerModal').classList.add('active');
}

async function editPlayer(playerId) {
    const player = cachedData.players.find(p => p.ID === playerId);
    if (!player) return;
    
    document.getElementById('playerModalTitle').textContent = 'Edit Player';
    document.getElementById('playerId').value = player.ID;
    document.getElementById('playerName').value = player.Name;
    document.getElementById('playerPhone').value = player.Phone;
    document.getElementById('playerEmail').value = player.Email;
    document.getElementById('playerJoinDate').value = player.JoinDate;
    document.getElementById('playerStatus').value = player.Status;
    
    // Set monthly status checkboxes
    document.querySelectorAll('input[name="monthlyStatus"]').forEach(cb => cb.checked = false);
    if (player.MonthlyStatus) {
        try {
            const monthlyStatus = JSON.parse(player.MonthlyStatus);
            Object.keys(monthlyStatus).forEach(month => {
                const checkbox = document.getElementById(`month_${month}`);
                if (checkbox && monthlyStatus[month]) {
                    checkbox.checked = true;
                }
            });
        } catch (e) {
            console.error('Error parsing monthly status:', e);
        }
    }
    
    document.getElementById('addPlayerModal').classList.add('active');
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

async function savePlayer() {
    const form = document.getElementById('playerForm');
    const formData = new FormData(form);
    
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
    
    try {
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
    }
}

// Collections functions
async function loadCollectionsData() {
    try {
        const [income, players] = await Promise.all([
            apiCall('getIncome'),
            apiCall('getPlayers')
        ]);
        
        cachedData.income = income;
        cachedData.players = players;
        
        updateCollectionsFilters();
        renderCollectionsTable();
        
    } catch (error) {
        console.error('Failed to load collections data:', error);
    }
}

function updateCollectionsFilters() {
    const monthFilter = document.getElementById('collectionsMonthFilter');
    const playerFilter = document.getElementById('collectionsPlayerFilter');
    
    // Update month filter
    const months = new Set();
    cachedData.income.forEach(item => {
        months.add(getMonthYear(item.Date));
    });
    
    monthFilter.innerHTML = '<option value="">All Months</option>';
    Array.from(months).sort().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthFilter.appendChild(option);
    });
    
    // Update player filter
    playerFilter.innerHTML = '<option value="">All Players</option>';
    cachedData.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.ID;
        option.textContent = player.Name;
        playerFilter.appendChild(option);
    });
    
    // Update collection modal player dropdown
    const collectionPlayerSelect = document.getElementById('collectionPlayer');
    collectionPlayerSelect.innerHTML = '<option value="">Select Player</option>';
    cachedData.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.ID;
        option.textContent = player.Name;
        collectionPlayerSelect.appendChild(option);
    });
}

function renderCollectionsTable() {
    const tbody = document.querySelector('#collectionsTable tbody');
    const monthFilter = document.getElementById('collectionsMonthFilter').value;
    const playerFilter = document.getElementById('collectionsPlayerFilter').value;
    
    let filteredCollections = cachedData.income;
    
    // Apply filters
    if (monthFilter) {
        filteredCollections = filteredCollections.filter(item => 
            getMonthYear(item.Date) === monthFilter
        );
    }
    
    if (playerFilter) {
        filteredCollections = filteredCollections.filter(item => 
            item.PlayerId === playerFilter
        );
    }
    
    tbody.innerHTML = '';
    
    filteredCollections.forEach(collection => {
        const row = document.createElement('tr');
        const isReadOnly = currentUser.role === 'view';
        
        row.innerHTML = `
            <td>${formatDate(collection.Date)}</td>
            <td>${collection.PlayerName}</td>
            <td>${formatCurrency(parseFloat(collection.Amount))}</td>
            <td>${collection.Description || '-'}</td>
            <td>
                ${!isReadOnly ? `
                    <button class="action-btn edit" onclick="editCollection('${collection.ID}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteCollection('${collection.ID}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : 'View Only'}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function showAddCollectionModal() {
    document.getElementById('collectionModalTitle').textContent = 'Add Collection';
    document.getElementById('collectionForm').reset();
    document.getElementById('collectionId').value = '';
    
    // Set default date to today
    document.getElementById('collectionDate').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('addCollectionModal').classList.add('active');
}

async function editCollection(collectionId) {
    const collection = cachedData.income.find(c => c.ID === collectionId);
    if (!collection) return;
    
    document.getElementById('collectionModalTitle').textContent = 'Edit Collection';
    document.getElementById('collectionId').value = collection.ID;
    document.getElementById('collectionDate').value = collection.Date;
    document.getElementById('collectionPlayer').value = collection.PlayerId;
    document.getElementById('collectionAmount').value = collection.Amount;
    document.getElementById('collectionDescription').value = collection.Description || '';
    
    document.getElementById('addCollectionModal').classList.add('active');
}

async function deleteCollection(collectionId) {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    
    try {
        await apiCall('deleteIncome', { id: collectionId });
        showNotification('Collection deleted successfully', 'success');
        loadCollectionsData();
    } catch (error) {
        showNotification('Failed to delete collection', 'error');
    }
}

async function saveCollection() {
    const form = document.getElementById('collectionForm');
    const formData = new FormData(form);
    
    const player = cachedData.players.find(p => p.ID === formData.get('collectionPlayer'));
    
    const collectionData = {
        id: formData.get('collectionId') || undefined,
        date: formData.get('collectionDate'),
        playerId: formData.get('collectionPlayer'),
        playerName: player ? player.Name : '',
        amount: parseFloat(formData.get('collectionAmount')),
        description: formData.get('collectionDescription')
    };
    
    try {
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
    }
}

// Expenses functions
async function loadExpensesData() {
    try {
        const expenses = await apiCall('getExpenses');
        cachedData.expenses = expenses;
        
        updateExpensesFilters();
        renderExpensesTable();
        
    } catch (error) {
        console.error('Failed to load expenses data:', error);
    }
}

function updateExpensesFilters() {
    const monthFilter = document.getElementById('expensesMonthFilter');
    
    // Update month filter
    const months = new Set();
    cachedData.expenses.forEach(item => {
        months.add(getMonthYear(item.Date));
    });
    
    monthFilter.innerHTML = '<option value="">All Months</option>';
    Array.from(months).sort().forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthFilter.appendChild(option);
    });
}

function renderExpensesTable() {
    const tbody = document.querySelector('#expensesTable tbody');
    const monthFilter = document.getElementById('expensesMonthFilter').value;
    
    let filteredExpenses = cachedData.expenses;
    
    // Apply month filter
    if (monthFilter) {
        filteredExpenses = filteredExpenses.filter(item => 
            getMonthYear(item.Date) === monthFilter
        );
    }
    
    tbody.innerHTML = '';
    
    filteredExpenses.forEach(expense => {
        const row = document.createElement('tr');
        const isReadOnly = currentUser.role === 'view';
        
        row.innerHTML = `
            <td>${formatDate(expense.Date)}</td>
            <td>${expense.Category}</td>
            <td>${formatCurrency(parseFloat(expense.Amount))}</td>
            <td>${expense.Description || '-'}</td>
            <td>
                ${!isReadOnly ? `
                    <button class="action-btn edit" onclick="editExpense('${expense.ID}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteExpense('${expense.ID}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : 'View Only'}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function showAddExpenseModal() {
    document.getElementById('expenseModalTitle').textContent = 'Add Expense';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    
    // Set default date to today
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('addExpenseModal').classList.add('active');
}

async function editExpense(expenseId) {
    const expense = cachedData.expenses.find(e => e.ID === expenseId);
    if (!expense) return;
    
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    document.getElementById('expenseId').value = expense.ID;
    document.getElementById('expenseDate').value = expense.Date;
    document.getElementById('expenseCategory').value = expense.Category;
    document.getElementById('expenseAmount').value = expense.Amount;
    document.getElementById('expenseDescription').value = expense.Description || '';
    
    document.getElementById('addExpenseModal').classList.add('active');
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        await apiCall('deleteExpense', { id: expenseId });
        showNotification('Expense deleted successfully', 'success');
        loadExpensesData();
    } catch (error) {
        showNotification('Failed to delete expense', 'error');
    }
}

async function saveExpense() {
    const form = document.getElementById('expenseForm');
    const formData = new FormData(form);
    
    const expenseData = {
        id: formData.get('expenseId') || undefined,
        date: formData.get('expenseDate'),
        category: formData.get('expenseCategory'),
        amount: parseFloat(formData.get('expenseAmount')),
        description: formData.get('expenseDescription')
    };
    
    try {
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
    }
}

// Logs functions (Admin only)
async function loadLogsData() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const logs = await apiCall('getLogs');
        cachedData.logs = logs;
        renderLogsTable();
    } catch (error) {
        console.error('Failed to load logs data:', error);
    }
}

function renderLogsTable() {
    const tbody = document.querySelector('#logsTable tbody');
    const searchTerm = document.getElementById('logsSearch').value.toLowerCase();
    
    let filteredLogs = cachedData.logs;
    
    // Apply search filter
    if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
            log.user.toLowerCase().includes(searchTerm) ||
            log.action.toLowerCase().includes(searchTerm) ||
            log.details.toLowerCase().includes(searchTerm)
        );
    }
    
    tbody.innerHTML = '';
    
    filteredLogs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.user}</td>
            <td><span class="status-badge ${log.role}">${log.role}</span></td>
            <td>${log.action}</td>
            <td>${log.details}</td>
        `;
        tbody.appendChild(row);
    });
}

// Users/Admin functions
async function loadUsersData() {
    if (currentUser.role !== 'admin') return;
    
    try {
        const users = await apiCall('getUsers');
        cachedData.users = users;
        renderUsersTable();
    } catch (error) {
        console.error('Failed to load users data:', error);
    }
}

function renderUsersTable() {
    const tbody = document.querySelector('#usersTable tbody');
    
    tbody.innerHTML = '';
    
    cachedData.users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.status}">${user.status}</span></td>
            <td>${formatDateTime(user.created_at)}</td>
            <td>${user.last_login ? formatDateTime(user.last_login) : 'Never'}</td>
            <td>
                <button class="action-btn edit" onclick="editUser('${user.email}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete" onclick="deleteUser('${user.email}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    
    document.getElementById('addUserModal').classList.add('active');
}

async function editUser(userEmail) {
    const user = cachedData.users.find(u => u.email === userEmail);
    if (!user) return;
    
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.email;
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userStatus').value = user.status;
    
    // Disable email editing for existing users
    document.getElementById('userEmail').disabled = true;
    
    document.getElementById('addUserModal').classList.add('active');
}

async function deleteUser(userEmail) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        await apiCall('deleteUser', { email: userEmail });
        showNotification('User deleted successfully', 'success');
        loadUsersData();
    } catch (error) {
        showNotification('Failed to delete user', 'error');
    }
}

async function saveUser() {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);
    
    const userData = {
        id: formData.get('userId') || undefined,
        name: formData.get('userName'),
        email: formData.get('userEmail'),
        role: formData.get('userRole'),
        status: formData.get('userStatus')
    };
    
    try {
        if (userData.id) {
            await apiCall('updateUser', userData);
            showNotification('User updated successfully', 'success');
        } else {
            await apiCall('addUser', userData);
            showNotification('User added successfully. Welcome email sent.', 'success');
        }
        
        closeModal('addUserModal');
        
        // Re-enable email field
        document.getElementById('userEmail').disabled = false;
        
        loadUsersData();
    } catch (error) {
        showNotification('Failed to save user', 'error');
    }
}

// Utility functions
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    checkSession();
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });
    
    // Forgot password forms
    document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        await sendOTP(email);
    });
    
    document.getElementById('otpVerificationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const otp = document.getElementById('otpCode').value;
        await verifyOTP(email, otp);
    });
    
    document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (!validatePassword(password)) {
            showNotification('Password does not meet requirements', 'error');
            return;
        }
        
        await resetPassword(email, password);
    });
    
    // Password validation
    document.getElementById('newPassword')?.addEventListener('input', function(e) {
        validatePassword(e.target.value);
    });
    
    // Player form
    document.getElementById('playerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await savePlayer();
    });
    
    // Collection form
    document.getElementById('collectionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveCollection();
    });
    
    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveExpense();
    });
    
    // User form
    document.getElementById('userForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveUser();
    });
    
    // Filter change events
    document.getElementById('dashboardMonthFilter')?.addEventListener('change', updateDashboardCards);
    document.getElementById('playersMonthFilter')?.addEventListener('change', renderPlayersTable);
    document.getElementById('playersStatusFilter')?.addEventListener('change', renderPlayersTable);
    document.getElementById('collectionsMonthFilter')?.addEventListener('change', renderCollectionsTable);
    document.getElementById('collectionsPlayerFilter')?.addEventListener('change', renderCollectionsTable);
    document.getElementById('expensesMonthFilter')?.addEventListener('change', renderExpensesTable);
    document.getElementById('logsSearch')?.addEventListener('input', renderLogsTable);
    
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
});