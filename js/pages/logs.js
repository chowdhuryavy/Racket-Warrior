// Logs Page Module for Racket Warrior

const Logs = {
    currentPage: 1,
    itemsPerPage: 20,
    allLogs: [],
    filteredLogs: [],
    
    // Render logs page
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    // Initialize logs page
    init: function() {
        this.setupEventListeners();
        
        // Show test data immediately
        this.showTestData();
        
        // Then try to load real data
        setTimeout(() => {
            this.loadLogs();
        }, 100);
    },
    
    // Show test data immediately
    showTestData: function() {
        
        // Update stats
        const totalLogsEl = document.getElementById('totalLogs');
        const todayLogsEl = document.getElementById('todayLogs');
        const errorLogsEl = document.getElementById('errorLogs');
        
        if (totalLogsEl) totalLogsEl.textContent = '156';
        if (todayLogsEl) todayLogsEl.textContent = '12';
        if (errorLogsEl) errorLogsEl.textContent = '2';
        
        // Show test logs
        const logsContainer = document.getElementById('logsContainer');
        if (logsContainer) {
            logsContainer.innerHTML = `
                <table class="table logs-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2024-01-20 10:30:15</td>
                            <td><span class="action-badge action-login">LOGIN</span></td>
                            <td>john.doe@example.com</td>
                            <td>User logged in successfully</td>
                        </tr>
                        <tr>
                            <td>2024-01-20 10:25:30</td>
                            <td><span class="action-badge action-add">ADD_PLAYER</span></td>
                            <td>admin@example.com</td>
                            <td>Added new player: Jane Smith</td>
                        </tr>
                        <tr>
                            <td>2024-01-20 10:20:45</td>
                            <td><span class="action-badge action-update">UPDATE_COLLECTION</span></td>
                            <td>jane.smith@example.com</td>
                            <td>Updated collection amount: QAR 100.00</td>
                        </tr>
                        <tr>
                            <td>2024-01-20 10:15:20</td>
                            <td><span class="action-badge action-delete">DELETE_EXPENSE</span></td>
                            <td>admin@example.com</td>
                            <td>Deleted expense: Office supplies</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    },
    
    // Get logs HTML
    getHTML: function() {
        return `
            <div class="logs-page">
                <!-- Logs Header -->
                <div class="page-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1><i class="fas fa-history"></i> System Logs</h1>
                            <p>Track all system activities and user actions</p>
                        </div>
                        <div class="header-actions">
                            <button id="refreshLogs" class="btn btn-secondary">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                            <button id="clearLogs" class="btn btn-danger">
                                <i class="fas fa-trash"></i> Clear All
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Logs Filters -->
                <div class="logs-filters">
                    <div class="filter-group">
                        <label for="logSearch">Search:</label>
                        <input type="text" id="logSearch" placeholder="Search logs..." class="form-control">
                    </div>
                    <div class="filter-group">
                        <label for="logAction">Action:</label>
                        <select id="logAction" class="form-control">
                            <option value="">All Actions</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="PASSWORD_CHANGE">Password Change</option>
                            <option value="PASSWORD_RESET">Password Reset</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="logUser">User:</label>
                        <select id="logUser" class="form-control">
                            <option value="">All Users</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="logDate">Date:</label>
                        <input type="date" id="logDate" class="form-control">
                    </div>
                    <button id="applyFilters" class="btn btn-info">
                        <i class="fas fa-filter"></i> Apply Filters
                    </button>
                    <button id="clearFilters" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
                
                <!-- Logs Stats -->
                <div class="logs-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Logs:</span>
                        <span class="stat-value" id="totalLogsCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Filtered:</span>
                        <span class="stat-value" id="filteredLogsCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Page:</span>
                        <span class="stat-value" id="currentPageDisplay">1</span>
                    </div>
                </div>
                
                <!-- Logs Table -->
                <div class="logs-content">
                    <div class="table-container">
                        <table class="logs-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody id="logsTableBody">
                                <tr>
                                    <td colspan="5" class="text-center">Loading logs...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="pagination-container">
                        <button id="prevPage" class="btn btn-outline-primary" disabled>
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <span class="pagination-info" id="paginationInfo">
                            Page 1 of 1
                        </span>
                        <button id="nextPage" class="btn btn-outline-primary" disabled>
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Refresh logs
        const refreshBtn = document.getElementById('refreshLogs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadLogs());
        }
        
        // Clear logs
        const clearBtn = document.getElementById('clearLogs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllLogs());
        }
        
        // Search input
        const searchInput = document.getElementById('logSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        
        // Filter controls
        const actionFilter = document.getElementById('logAction');
        const userFilter = document.getElementById('logUser');
        const dateFilter = document.getElementById('logDate');
        
        if (actionFilter) actionFilter.addEventListener('change', () => this.applyFilters());
        if (userFilter) userFilter.addEventListener('change', () => this.applyFilters());
        if (dateFilter) dateFilter.addEventListener('change', () => this.applyFilters());
        
        // Apply/Clear filters
        const applyBtn = document.getElementById('applyFilters');
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        if (applyBtn) applyBtn.addEventListener('click', () => this.applyFilters());
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        
        // Pagination
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
    },
    
    // Load logs from API
    loadLogs: async function() {
        try {
            Logger.info('Loading system logs');
            
            this.showLoadingState();
            
            const response = await API.getLogs();
            
            if (response.success) {
                this.allLogs = response.data || [];
                this.populateUserFilter();
                this.applyFilters();
                UIUtils.showNotification('Logs loaded successfully', 'success');
            } else {
                throw new Error(response.message || 'Failed to load logs');
            }
            
        } catch (error) {
            Logger.error('Failed to load logs', error);
            UIUtils.showNotification('Failed to load logs', 'error');
            this.showErrorState();
        }
    },
    
    // Show loading state
    showLoadingState: function() {
        const tbody = document.getElementById('logsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading logs...</td></tr>';
        }
    },
    
    // Show error state
    showErrorState: function() {
        const tbody = document.getElementById('logsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load logs</td></tr>';
        }
    },
    
    // Populate user filter dropdown
    populateUserFilter: function() {
        const userSelect = document.getElementById('logUser');
        if (!userSelect) return;
        
        // Get unique users from logs
        const uniqueUsers = [...new Set(this.allLogs.map(log => log.user).filter(user => user))];
        
        // Clear existing options (except "All Users")
        userSelect.innerHTML = '<option value="">All Users</option>';
        
        // Add user options
        uniqueUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userSelect.appendChild(option);
        });
    },
    
    // Apply filters
    applyFilters: function() {
        const searchTerm = document.getElementById('logSearch')?.value.toLowerCase() || '';
        const actionFilter = document.getElementById('logAction')?.value || '';
        const userFilter = document.getElementById('logUser')?.value || '';
        const dateFilter = document.getElementById('logDate')?.value || '';
        
        this.filteredLogs = this.allLogs.filter(log => {
            // Search filter
            if (searchTerm) {
                const searchableText = `${log.user} ${log.action} ${log.details}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            // Action filter
            if (actionFilter && log.action !== actionFilter) return false;
            
            // User filter
            if (userFilter && log.user !== userFilter) return false;
            
            // Date filter
            if (dateFilter) {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                if (logDate !== dateFilter) return false;
            }
            
            return true;
        });
        
        this.currentPage = 1;
        this.updateStats();
        this.renderLogs();
        this.updatePagination();
    },
    
    // Clear filters
    clearFilters: function() {
        document.getElementById('logSearch').value = '';
        document.getElementById('logAction').value = '';
        document.getElementById('logUser').value = '';
        document.getElementById('logDate').value = '';
        
        this.applyFilters();
    },
    
    // Update stats display
    updateStats: function() {
        const totalElement = document.getElementById('totalLogsCount');
        const filteredElement = document.getElementById('filteredLogsCount');
        const pageElement = document.getElementById('currentPageDisplay');
        
        if (totalElement) totalElement.textContent = this.allLogs.length;
        if (filteredElement) filteredElement.textContent = this.filteredLogs.length;
        if (pageElement) pageElement.textContent = this.currentPage;
    },
    
    // Render logs table
    renderLogs: function() {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;
        
        if (this.filteredLogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No logs found</td></tr>';
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredLogs.slice(startIndex, endIndex);
        
        tbody.innerHTML = pageData.map(log => `
            <tr>
                <td>${this.formatTimestamp(log.timestamp)}</td>
                <td>
                    <span class="user-badge">${log.user || 'System'}</span>
                </td>
                <td>
                    <span class="role-badge role-${(log.role || 'system').toLowerCase()}">${log.role || 'System'}</span>
                </td>
                <td>
                    <span class="action-badge action-${this.getActionType(log.action)}">${log.action}</span>
                </td>
                <td class="details-cell">${log.details || 'N/A'}</td>
            </tr>
        `).join('');
    },
    
    // Format timestamp
    formatTimestamp: function(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    
    // Get action type for styling
    getActionType: function(action) {
        if (!action) return 'default';
        
        const actionLower = action.toLowerCase();
        if (actionLower.includes('login')) return 'success';
        if (actionLower.includes('logout')) return 'info';
        if (actionLower.includes('delete') || actionLower.includes('remove')) return 'danger';
        if (actionLower.includes('create') || actionLower.includes('add')) return 'primary';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'warning';
        
        return 'secondary';
    },
    
    // Update pagination
    updatePagination: function() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const paginationInfo = document.getElementById('paginationInfo');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }
        
        if (paginationInfo) {
            paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
    },
    
    // Previous page
    previousPage: function() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderLogs();
            this.updatePagination();
            this.updateStats();
        }
    },
    
    // Next page
    nextPage: function() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderLogs();
            this.updatePagination();
            this.updateStats();
        }
    },
    
    // Clear all logs
    clearAllLogs: function() {
        if (!confirm('Are you sure you want to clear all system logs? This action cannot be undone.')) {
            return;
        }
        
        // This would call an API to clear logs
        UIUtils.showNotification('Log clearing functionality will be implemented', 'info');
    }
};

// Export Logs module
window.Logs = Logs;