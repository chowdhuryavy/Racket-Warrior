// Dashboard Page Module for Racket Warrior

const Dashboard = {
    currentMonth: null,
    isLoading: false,
    cachedData: null,
    lastLoadTime: null,
    
    // Render dashboard page
    render: async function(container) {
        container.innerHTML = this.getHTML();
        
        // Initialize dashboard
        await this.init();
    },
    
    // Initialize dashboard
    init: async function() {
        // Setup month filter first
        await this.setupMonthFilter();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Load recent activities
        await this.loadRecentActivities();
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Get dashboard HTML
    getHTML: function() {
        return `
            <div class="dashboard-page">
                <!-- Dashboard Header -->
                <div class="dashboard-header">
                    <div class="header-left">
                        <div class="header-icon">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                        <div class="header-text">
                            <h1>Dashboard</h1>
                            <p>Quick overview of your badminton group</p>
                        </div>
                    </div>
                    
                    <div class="header-controls">
                        <select id="dashboardMonthFilter" class="form-control">
                            <option value="">All Time</option>
                        </select>
                        <button id="refreshDashboard" class="btn btn-white">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>
                
                <!-- Dashboard Stats Cards -->
                <div class="dashboard-stats" id="dashboardStats">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                                <i class="fas fa-users"></i>
                            </div>
                        </div>
                        <div class="stat-card-content">
                            <div class="stat-card-value" id="activePlayersCount">0</div>
                            <div class="stat-card-label">Active Players</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                                <i class="fas fa-coins"></i>
                            </div>
                        </div>
                        <div class="stat-card-content">
                            <div class="stat-card-value" id="totalCollectionAmount">QAR 0.00</div>
                            <div class="stat-card-label">Total Collection</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                                <i class="fas fa-receipt"></i>
                            </div>
                        </div>
                        <div class="stat-card-content">
                            <div class="stat-card-value" id="totalExpenseAmount">QAR 0.00</div>
                            <div class="stat-card-label">Total Expenses</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                                <i class="fas fa-chart-line"></i>
                            </div>
                        </div>
                        <div class="stat-card-content">
                            <div class="stat-card-value" id="finalBalanceAmount">QAR 0.00</div>
                            <div class="stat-card-label">Final Balance</div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <h2>Quick Actions</h2>
                    <div class="action-buttons">
                        <div class="action-btn-group" data-role="admin,view_edit">
                            <button class="action-btn main-btn" onclick="Dashboard.toggleAddMenu()" id="addBtn">
                                <i class="fas fa-plus"></i>
                                <span>Add</span>
                                <i class="fas fa-chevron-down toggle-icon"></i>
                            </button>
                            <div class="action-submenu" id="addMenu" style="display: none;">
                                <button class="submenu-item" onclick="showPage('players-add')">
                                    <i class="fas fa-user-plus"></i>
                                    <span>Add Player</span>
                                </button>
                                <button class="submenu-item" onclick="showPage('collection-add')">
                                    <i class="fas fa-coins"></i>
                                    <span>Record Payment</span>
                                </button>
                                <button class="submenu-item" onclick="showPage('expenses-add')">
                                    <i class="fas fa-receipt"></i>
                                    <span>Add Expense</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="action-btn-group">
                            <button class="action-btn main-btn" onclick="Dashboard.toggleViewMenu()" id="viewBtn">
                                <i class="fas fa-eye"></i>
                                <span>View</span>
                                <i class="fas fa-chevron-down toggle-icon"></i>
                            </button>
                            <div class="action-submenu" id="viewMenu" style="display: none;">
                                <button class="submenu-item" onclick="showPage('players-view')">
                                    <i class="fas fa-users"></i>
                                    <span>View Players</span>
                                </button>
                                <button class="submenu-item" onclick="showPage('collection-view')">
                                    <i class="fas fa-coins"></i>
                                    <span>View Collections</span>
                                </button>
                                <button class="submenu-item" onclick="showPage('expenses-view')">
                                    <i class="fas fa-receipt"></i>
                                    <span>View Expenses</span>
                                </button>
                                <button class="submenu-item" onclick="showPage('reports')">
                                    <i class="fas fa-chart-bar"></i>
                                    <span>Reports</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Activity Summary -->
                <div class="activity-summary">
                    <h2>Recent Activity</h2>
                    <div class="activity-grid">
                        <div class="activity-card">
                            <div class="activity-header">
                                <h3><i class="fas fa-users"></i> Latest Players</h3>
                                <a href="#" onclick="showPage('players-view')" class="view-all-link">View All</a>
                            </div>
                            <div class="activity-content" id="recentPlayers">
                                <div class="loading-item">Loading...</div>
                            </div>
                        </div>
                        
                        <div class="activity-card">
                            <div class="activity-header">
                                <h3><i class="fas fa-coins"></i> Recent Collections</h3>
                                <a href="#" onclick="showPage('collection-view')" class="view-all-link">View All</a>
                            </div>
                            <div class="activity-content" id="recentCollections">
                                <div class="loading-item">Loading...</div>
                            </div>
                        </div>
                        
                        <div class="activity-card">
                            <div class="activity-header">
                                <h3><i class="fas fa-receipt"></i> Recent Expenses</h3>
                                <a href="#" onclick="showPage('expenses-view')" class="view-all-link">View All</a>
                            </div>
                            <div class="activity-content" id="recentExpenses">
                                <div class="loading-item">Loading...</div>
                            </div>
                        </div>
                    </div>
                </div>
                    
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>Monthly Summary</h2>
                            <span class="current-month" id="currentMonthDisplay">Current Month</span>
                        </div>
                        <div class="monthly-summary" id="monthlySummary">
                            <div class="summary-item">
                                <div class="summary-info">
                                    <span class="summary-label">Income</span>
                                    <span class="summary-value positive" id="monthlyIncome">QAR 0.00</span>
                                </div>
                                <div class="summary-icon">
                                    <i class="fas fa-arrow-up"></i>
                                </div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-info">
                                    <span class="summary-label">Expenses</span>
                                    <span class="summary-value negative" id="monthlyExpenses">QAR 0.00</span>
                                </div>
                                <div class="summary-icon">
                                    <i class="fas fa-arrow-down"></i>
                                </div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-info">
                                    <span class="summary-label">Net</span>
                                    <span class="summary-value" id="monthlyNet">QAR 0.00</span>
                                </div>
                                <div class="summary-icon">
                                    <i class="fas fa-balance-scale"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    },
    
    // Setup month filter dropdown
    setupMonthFilter: async function() {
        try {
            const monthFilter = document.getElementById('dashboardMonthFilter');
            
            if (monthFilter) {
                // Clear existing options except "All Time"
                monthFilter.innerHTML = '<option value="">All Time</option>';
                
                // Generate month options using DateUtils
                const months = DateUtils.generateMonthOptions();
                
                // Add available months
                months.forEach(month => {
                    const option = document.createElement('option');
                    option.value = month.value;
                    option.textContent = month.label;
                    monthFilter.appendChild(option);
                });
                
                // Set current month as default
                const currentMonth = DateUtils.getMonthKey(new Date());
                monthFilter.value = currentMonth;
                this.currentMonth = currentMonth;
                
                // Set as global month
                DateUtils.setGlobalMonth(currentMonth);
            }
        } catch (error) {
            Logger.error('Failed to setup month filter', error);
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Month filter change
        const monthFilter = document.getElementById('dashboardMonthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', (event) => {
                this.currentMonth = event.target.value || null;
                
                // Set global month for all pages
                DateUtils.setGlobalMonth(this.currentMonth);
                
                this.loadDashboardData();
                this.updateCurrentMonthDisplay();
            });
        }
        
        // Refresh button
        const refreshButton = document.getElementById('refreshDashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadDashboardData();
                UIUtils.showNotification('Dashboard refreshed', 'success');
            });
        }
        
        // Setup role-based visibility for quick actions
        this.setupRoleBasedVisibility();
    },
    
    // Setup role-based visibility
    setupRoleBasedVisibility: function() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        
        const actionCards = document.querySelectorAll('.action-card[data-role]');
        actionCards.forEach(card => {
            const allowedRoles = card.getAttribute('data-role').split(',');
            const hasAccess = allowedRoles.includes(user.role);
            card.style.display = hasAccess ? 'flex' : 'none';
        });
    },
    
    // Load dashboard data with performance optimization
    loadDashboardData: async function() {
        try {
            // Prevent multiple simultaneous loads
            if (this.isLoading) return;
            
            // Use cache if data is recent (within 30 seconds)
            const now = Date.now();
            if (this.cachedData && this.lastLoadTime && (now - this.lastLoadTime) < 30000) {
                this.updateStats(this.cachedData);
                this.updateCurrentMonthDisplay();
                return;
            }
            
            this.isLoading = true;
            Logger.info('Loading dashboard data', { month: this.currentMonth });
            
            // Show loading state
            this.showLoadingState();
            
            // Get dashboard stats with timeout
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 8000)
            );
            
            const response = await Promise.race([
                API.getDashboardStats(this.currentMonth),
                timeout
            ]);
            
            console.log('Dashboard API Response:', response);
            console.log('Dashboard API Response Data:', response?.data);
            
            if (response && response.success && response.data) {
                // Remove any error banners
                const errorBanner = document.querySelector('.dashboard-error-banner');
                if (errorBanner) {
                    errorBanner.remove();
                }
                
                this.cachedData = response.data;
                this.lastLoadTime = now;
                this.updateStats(response.data);
                await this.loadRecentActivities();
                this.updateCurrentMonthDisplay();
            } else {
                console.error('Dashboard API Error Details:', {
                    response: response,
                    success: response?.success,
                    data: response?.data,
                    message: response?.message
                });
                Logger.error('Dashboard API error:', response);
                throw new Error(response?.message || 'Failed to load dashboard data');
            }
            
        } catch (error) {
            console.error('Dashboard Load Error Details:', {
                error: error,
                message: error.message,
                stack: error.stack,
                currentMonth: this.currentMonth
            });
            Logger.error('Failed to load dashboard data', error);
            if (error.message === 'Request timeout') {
                UIUtils.showNotification('Dashboard loading slowly. Please check your connection.', 'warning');
            } else {
                UIUtils.showNotification('Failed to load dashboard data: ' + error.message, 'error');
            }
            this.showErrorState();
        } finally {
            this.isLoading = false;
        }
    },
    
    // Show loading state
    showLoadingState: function() {
        const statValues = ['activePlayersCount', 'totalCollectionAmount', 'totalExpenseAmount', 'finalBalanceAmount'];
        statValues.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="spinner-border"></div>';
            }
        });
    },
    
    // Show error state
    showErrorState: function() {
        const statValues = ['activePlayersCount', 'totalCollectionAmount', 'totalExpenseAmount', 'finalBalanceAmount'];
        statValues.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '--';
                element.style.color = 'var(--danger-color)';
            }
        });
        
        // Add a more visible error message
        const dashboardStats = document.getElementById('dashboardStats');
        if (dashboardStats && !document.querySelector('.dashboard-error-banner')) {
            const errorBanner = document.createElement('div');
            errorBanner.className = 'dashboard-error-banner';
            errorBanner.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                color: #dc2626;
                text-align: center;
            `;
            errorBanner.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Failed to load dashboard data. Please check your connection and try again.
                <button onclick="Dashboard.loadDashboardData()" style="margin-left: 10px; padding: 4px 8px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            `;
            dashboardStats.insertBefore(errorBanner, dashboardStats.firstChild);
        }
    },
    
    // Update stats cards
    updateStats: function(data) {
        console.log('UpdateStats called with data:', data);
        
        // Ensure data exists and has required properties
        if (!data || typeof data !== 'object') {
            console.error('Invalid dashboard data received:', data);
            Logger.error('Invalid dashboard data received:', data);
            this.showErrorState();
            return;
        }
        
        // Update main stats
        const activePlayersElement = document.getElementById('activePlayersCount');
        const totalCollectionElement = document.getElementById('totalCollectionAmount');
        const totalExpenseElement = document.getElementById('totalExpenseAmount');
        const finalBalanceElement = document.getElementById('finalBalanceAmount');
        
        console.log('Dashboard elements found:', {
            activePlayersElement: !!activePlayersElement,
            totalCollectionElement: !!totalCollectionElement,
            totalExpenseElement: !!totalExpenseElement,
            finalBalanceElement: !!finalBalanceElement
        });
        
        // Active Players Count
        if (activePlayersElement) {
            const count = data.activePlayersCount !== undefined && data.activePlayersCount !== null ? data.activePlayersCount : 0;
            console.log('Setting activePlayersCount to:', count);
            activePlayersElement.textContent = count;
            activePlayersElement.style.color = 'var(--text-primary)';
        }
        
        // Total Collection
        if (totalCollectionElement) {
            const collection = data.totalCollection !== undefined && data.totalCollection !== null ? data.totalCollection : 0;
            console.log('Setting totalCollection to:', collection);
            totalCollectionElement.textContent = CurrencyUtils.format(collection);
            totalCollectionElement.style.color = 'var(--text-primary)';
        }
        
        // Total Expenses
        if (totalExpenseElement) {
            const expenses = data.totalExpenses !== undefined && data.totalExpenses !== null ? data.totalExpenses : 0;
            console.log('Setting totalExpenses to:', expenses);
            totalExpenseElement.textContent = CurrencyUtils.format(expenses);
            totalExpenseElement.style.color = 'var(--text-primary)';
        }
        
        // Final Balance
        if (finalBalanceElement) {
            const balance = data.finalBalance !== undefined && data.finalBalance !== null ? data.finalBalance : 0;
            console.log('Setting finalBalance to:', balance);
            finalBalanceElement.textContent = CurrencyUtils.format(balance);
            
            // Update color based on balance
            finalBalanceElement.className = 'stat-card-value';
            if (balance > 0) {
                finalBalanceElement.style.color = 'var(--success-color)';
            } else if (balance < 0) {
                finalBalanceElement.style.color = 'var(--danger-color)';
            } else {
                finalBalanceElement.style.color = 'var(--text-primary)';
            }
        }
        
        // Update monthly summary
        this.updateMonthlySummary(data);
        
        console.log('Dashboard stats updated successfully');
    },
    
    // Manual test function to debug dashboard data loading
    manualTest: async function() {
        console.log('🧪 Manual Dashboard Test Started...');
        
        try {
            // Step 1: Test API directly
            console.log('1. Testing API.getDashboardStats()...');
            const response = await API.getDashboardStats();
            console.log('2. Raw API Response:', response);
            
            if (response && response.success) {
                console.log('3. ✅ API Success - Data received:', response.data);
                
                // Step 2: Test updateStats directly
                console.log('4. Testing updateStats with received data...');
                this.updateStats(response.data);
                
                console.log('5. ✅ Manual test completed successfully!');
                UIUtils.showNotification('✅ Manual test passed - Dashboard should now show data', 'success');
            } else {
                console.error('6. ❌ API failed:', response);
                UIUtils.showNotification('❌ API test failed: ' + (response?.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Manual test error:', error);
            UIUtils.showNotification('❌ Manual test error: ' + error.message, 'error');
        }
    },
    
    // Debug function to test API directly
    testAPI: async function() {
        console.log('🧪 Testing Dashboard API directly...');
        try {
            console.log('Current month filter:', this.currentMonth);
            
            // Test the API call directly
            const response = await API.getDashboardStats(this.currentMonth);
            console.log('✅ Raw API Response:', response);
            
            if (response && response.success) {
                console.log('✅ API Success - Data:', response.data);
                this.updateStats(response.data);
            } else {
                console.error('❌ API Failed:', response);
            }
        } catch (error) {
            console.error('❌ API Error:', error);
        }
    },
    
    // Force reset dashboard to defaults
    resetToDefaults: function() {
        console.log('🔄 Resetting dashboard to defaults...');
        const defaultData = {
            activePlayersCount: 0,
            totalCollection: 0,
            totalExpenses: 0,
            finalBalance: 0
        };
        this.updateStats(defaultData);
    },
    
    // Update monthly summary
    updateMonthlySummary: function(data) {
        const monthlyIncomeElement = document.getElementById('monthlyIncome');
        const monthlyExpensesElement = document.getElementById('monthlyExpenses');
        const monthlyNetElement = document.getElementById('monthlyNet');
        
        // Use totalCollection instead of totalIncome for consistency
        const income = data.totalCollection !== undefined ? data.totalCollection : 0;
        const expenses = data.totalExpenses !== undefined ? data.totalExpenses : 0;
        const net = income - expenses;
        
        if (monthlyIncomeElement) {
            monthlyIncomeElement.textContent = CurrencyUtils.format(income);
        }
        
        if (monthlyExpensesElement) {
            monthlyExpensesElement.textContent = CurrencyUtils.format(expenses);
        }
        
        if (monthlyNetElement) {
            monthlyNetElement.textContent = CurrencyUtils.format(net);
            monthlyNetElement.className = net >= 0 ? 'summary-value positive' : 'summary-value negative';
        }
    },
    
    // Update current month display
    updateCurrentMonthDisplay: function() {
        const currentMonthElement = document.getElementById('currentMonthDisplay');
        if (currentMonthElement) {
            if (this.currentMonth) {
                currentMonthElement.textContent = DateUtils.parseMonthYear(this.currentMonth);
            } else {
                currentMonthElement.textContent = 'All Time';
            }
        }
    },
    
    // Load recent activities
    loadRecentActivities: async function() {
        try {
            // Load recent players, collections, and expenses in parallel
            const [playersResponse, collectionsResponse, expensesResponse] = await Promise.all([
                API.getPlayers(this.currentMonth),
                API.getIncome(this.currentMonth),
                API.getExpenses(this.currentMonth)
            ]);
            
            if (playersResponse.success) {
                this.updateRecentPlayers(playersResponse.data);
            }
            
            if (collectionsResponse.success) {
                this.updateRecentCollections(collectionsResponse.data);
            }
            
            if (expensesResponse.success) {
                this.updateRecentExpenses(expensesResponse.data);
            }
            
        } catch (error) {
            Logger.error('Failed to load recent activities', error);
        }
    },
    
    // Update recent players
    updateRecentPlayers: function(players) {
        const container = document.getElementById('recentPlayers');
        if (!container) return;
        
        // Get most recent 5 players
        const recentPlayers = players
            .sort((a, b) => new Date(b.CreatedAt || b.JoinDate) - new Date(a.CreatedAt || a.JoinDate))
            .slice(0, 5);
        
        if (recentPlayers.length === 0) {
            container.innerHTML = '<div class="no-data">No recent players</div>';
            return;
        }
        
        container.innerHTML = recentPlayers.map(player => `
            <div class="recent-item">
                <div class="item-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(player.Name)}</div>
                    <div class="item-subtitle">${DateUtils.formatDate(player.JoinDate)}</div>
                </div>
                <div class="item-status">
                    <span class="status-badge status-${player.Status}">${player.Status}</span>
                </div>
            </div>
        `).join('');
    },
    
    // Update recent collections
    updateRecentCollections: function(collections) {
        const container = document.getElementById('recentCollections');
        if (!container) return;
        
        // Get most recent 5 collections
        const recentCollections = collections
            .sort((a, b) => new Date(b.CreatedAt || b.Date) - new Date(a.CreatedAt || a.Date))
            .slice(0, 5);
        
        if (recentCollections.length === 0) {
            container.innerHTML = '<div class="no-data">No recent collections</div>';
            return;
        }
        
        container.innerHTML = recentCollections.map(collection => `
            <div class="recent-item">
                <div class="item-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(collection.PlayerName)}</div>
                    <div class="item-subtitle">${DateUtils.formatDate(collection.Date)}</div>
                </div>
                <div class="item-amount positive">
                    ${CurrencyUtils.format(collection.Amount)}
                </div>
            </div>
        `).join('');
    },
    
    // Update recent expenses
    updateRecentExpenses: function(expenses) {
        const container = document.getElementById('recentExpenses');
        if (!container) return;
        
        // Get most recent 5 expenses
        const recentExpenses = expenses
            .sort((a, b) => new Date(b.CreatedAt || b.Date) - new Date(a.CreatedAt || a.Date))
            .slice(0, 5);
        
        if (recentExpenses.length === 0) {
            container.innerHTML = '<div class="no-data">No recent expenses</div>';
            return;
        }
        
        container.innerHTML = recentExpenses.map(expense => `
            <div class="recent-item">
                <div class="item-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(expense.Category)}</div>
                    <div class="item-subtitle">${DateUtils.formatDate(expense.Date)}</div>
                </div>
                <div class="item-amount negative">
                    ${CurrencyUtils.format(expense.Amount)}
                </div>
            </div>
        `).join('');
    },
    
    // Utility function to escape HTML
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Toggle Add menu
    toggleAddMenu: function() {
        const addMenu = document.getElementById('addMenu');
        const viewMenu = document.getElementById('viewMenu');
        const addBtn = document.getElementById('addBtn');
        const viewBtn = document.getElementById('viewBtn');
        
        if (addMenu.style.display === 'none') {
            addMenu.style.display = 'block';
            addBtn.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
            // Hide view menu
            viewMenu.style.display = 'none';
            viewBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
        } else {
            addMenu.style.display = 'none';
            addBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
        }
    },
    
    // Toggle View menu
    toggleViewMenu: function() {
        const addMenu = document.getElementById('addMenu');
        const viewMenu = document.getElementById('viewMenu');
        const addBtn = document.getElementById('addBtn');
        const viewBtn = document.getElementById('viewBtn');
        
        if (viewMenu.style.display === 'none') {
            viewMenu.style.display = 'block';
            viewBtn.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
            // Hide add menu
            addMenu.style.display = 'none';
            addBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
        } else {
            viewMenu.style.display = 'none';
            viewBtn.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
        }
    },

    // Debug function to check user data and sheet structure
    debugUserData: async function() {
        try {
            const response = await API.debugUserData();
            console.log('🔧 DEBUG: User Data Check', response);
            
            if (response.success) {
                const info = response.debug_info;
                console.log('📋 Sheet Headers:', info.sheet_headers);
                console.log('📋 Expected Columns:', info.expected_columns);
                console.log('📋 img_url Column Index:', info.img_url_column_index);
                console.log('👤 Current User Data:', info.current_user_data);
                console.log('🖼️ Current User img_url:', info.current_user_img_url);
                
                UIUtils.showNotification(`Debug: img_url column index is ${info.img_url_column_index}. Your img_url value: "${info.current_user_img_url}"`, 'info');
            } else {
                console.error('Debug failed:', response.message);
                UIUtils.showNotification('Debug failed: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Debug error:', error);
            UIUtils.showNotification('Debug error: ' + error.message, 'error');
        }
    }
};

// Export Dashboard module
window.Dashboard = Dashboard;

// Make debug functions available globally
window.debugDashboard = {
    test: () => Dashboard.testAPI(),
    reset: () => Dashboard.resetToDefaults(),
    reload: () => Dashboard.loadDashboardData(),
    data: () => Dashboard.cachedData,
    manual: () => Dashboard.manualTest(),
    // Quick test for browser console
    quickTest: async () => {
        console.log('🧪 Quick Dashboard Test...');
        try {
            console.log('1. Testing API directly...');
            const response = await API.getDashboardStats();
            console.log('2. API Response:', response);
            
            if (response && response.success) {
                console.log('✅ API working - updating dashboard...');
                Dashboard.updateStats(response.data);
                console.log('✅ Dashboard updated successfully!');
            } else {
                console.error('❌ API failed:', response?.message);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
};