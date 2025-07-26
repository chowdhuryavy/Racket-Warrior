// Dashboard Page Module for Racket Warrior

const Dashboard = {
    currentMonth: null,
    
    // Render dashboard page
    render: async function(container) {
        container.innerHTML = this.getHTML();
        
        // Initialize dashboard
        await this.init();
    },
    
    // Initialize dashboard
    init: async function() {
        // Setup month filter
        await this.setupMonthFilter();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup event listeners
        this.setupEventListeners();
    },
    
    // Get dashboard HTML
    getHTML: function() {
        return `
            <div class="dashboard-page">
                <!-- Dashboard Header -->
                <div class="dashboard-header">
                    <div class="page-info">
                        <h1>Dashboard</h1>
                        <p class="page-description">Welcome to Racket Warrior - Your badminton group management overview</p>
                    </div>
                    
                    <div class="dashboard-controls">
                        <div class="month-filter-section">
                            <label for="dashboardMonthFilter">Filter by Month:</label>
                            <select id="dashboardMonthFilter" class="month-filter">
                                <option value="">All Time</option>
                            </select>
                            <button id="refreshDashboard" class="btn btn-secondary">
                                <i class="fas fa-sync-alt"></i>
                                Refresh
                            </button>
                        </div>
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
                
                <!-- Recent Activities -->
                <div class="dashboard-grid">
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>Recent Players</h2>
                            <a href="#" onclick="showPage('players-view')" class="section-link">
                                View All <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                        <div class="recent-items" id="recentPlayers">
                            <div class="loading-placeholder">Loading recent players...</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>Recent Collections</h2>
                            <a href="#" onclick="showPage('collection-view')" class="section-link">
                                View All <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                        <div class="recent-items" id="recentCollections">
                            <div class="loading-placeholder">Loading recent collections...</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2>Recent Expenses</h2>
                            <a href="#" onclick="showPage('expenses-view')" class="section-link">
                                View All <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                        <div class="recent-items" id="recentExpenses">
                            <div class="loading-placeholder">Loading recent expenses...</div>
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
                
                <!-- Quick Actions -->
                <div class="quick-actions" id="quickActions">
                    <h2>Quick Actions</h2>
                    <div class="action-cards">
                        <div class="action-card" onclick="showPage('players-add')" data-role="admin,view_edit">
                            <div class="action-icon">
                                <i class="fas fa-user-plus"></i>
                            </div>
                            <span>Add Player</span>
                        </div>
                        <div class="action-card" onclick="showPage('collection-add')" data-role="admin,view_edit">
                            <div class="action-icon">
                                <i class="fas fa-plus"></i>
                            </div>
                            <span>Add Collection</span>
                        </div>
                        <div class="action-card" onclick="showPage('expenses-add')" data-role="admin,view_edit">
                            <div class="action-icon">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <span>Add Expense</span>
                        </div>
                        <div class="action-card" onclick="showPage('reports')">
                            <div class="action-icon">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <span>View Reports</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Setup month filter dropdown
    setupMonthFilter: async function() {
        try {
            const months = await API.getAvailableMonths();
            const monthFilter = document.getElementById('dashboardMonthFilter');
            
            if (monthFilter) {
                // Clear existing options except "All Time"
                monthFilter.innerHTML = '<option value="">All Time</option>';
                
                // Add available months
                months.forEach(month => {
                    const option = document.createElement('option');
                    option.value = month;
                    option.textContent = DateUtils.parseMonthYear(month);
                    monthFilter.appendChild(option);
                });
                
                // Set current month as default if available
                const currentMonth = DateUtils.getMonthYear(new Date());
                if (months.includes(currentMonth)) {
                    monthFilter.value = currentMonth;
                    this.currentMonth = currentMonth;
                }
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
    
    // Load dashboard data
    loadDashboardData: async function() {
        try {
            Logger.info('Loading dashboard data', { month: this.currentMonth });
            
            // Show loading state
            this.showLoadingState();
            
            // Get dashboard stats
            const response = await API.getDashboardStats(this.currentMonth);
            
            if (response.success) {
                this.updateStats(response.data);
                await this.loadRecentActivities();
                this.updateCurrentMonthDisplay();
            } else {
                throw new Error(response.message || 'Failed to load dashboard data');
            }
            
        } catch (error) {
            Logger.error('Failed to load dashboard data', error);
            UIUtils.showNotification('Failed to load dashboard data', 'error');
            this.showErrorState();
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
            }
        });
    },
    
    // Update stats cards
    updateStats: function(data) {
        // Update main stats
        const activePlayersElement = document.getElementById('activePlayersCount');
        const totalCollectionElement = document.getElementById('totalCollectionAmount');
        const totalExpenseElement = document.getElementById('totalExpenseAmount');
        const finalBalanceElement = document.getElementById('finalBalanceAmount');
        
        if (activePlayersElement) {
            activePlayersElement.textContent = data.totalPlayers || 0;
        }
        
        if (totalCollectionElement) {
            totalCollectionElement.textContent = CurrencyUtils.format(data.totalIncome || 0);
        }
        
        if (totalExpenseElement) {
            totalExpenseElement.textContent = CurrencyUtils.format(data.totalExpenses || 0);
        }
        
        if (finalBalanceElement) {
            const balance = (data.totalIncome || 0) - (data.totalExpenses || 0);
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
    },
    
    // Update monthly summary
    updateMonthlySummary: function(data) {
        const monthlyIncomeElement = document.getElementById('monthlyIncome');
        const monthlyExpensesElement = document.getElementById('monthlyExpenses');
        const monthlyNetElement = document.getElementById('monthlyNet');
        
        const income = data.totalIncome || 0;
        const expenses = data.totalExpenses || 0;
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
    }
};

// Export Dashboard module
window.Dashboard = Dashboard;