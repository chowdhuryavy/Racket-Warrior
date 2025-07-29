// Logs Page Module for Racket Warrior

const Logs = {
    logs: [],
    currentFilter: 'all',
    
    // Render logs page
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    // Initialize logs page
    init: function() {
        this.setupMonthFilter();
        this.setupEventListeners();
        this.loadLogs();
    },
    
    // Get logs HTML with unified styling
    getHTML: function() {
        return `
            <div class="logs-page">
                <!-- Logs Header -->
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-history"></i> System Logs</h1>
                        <p>Monitor system activities and user actions</p>
                    </div>
                    <div class="header-actions">
                        <button id="refreshLogs" class="btn-unified btn-unified-secondary">
                            <i class="fas fa-sync"></i>
                            Refresh
                        </button>
                        <button id="exportLogs" class="btn-unified btn-unified-primary">
                            <i class="fas fa-download"></i>
                            Export
                        </button>
                    </div>
                </div>

                <!-- Logs Stats -->
                <div class="logs-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-list"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalLogs">0</h3>
                            <p>Total Logs</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="userLogs">0</h3>
                            <p>User Actions</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="systemLogs">0</h3>
                            <p>System Events</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="errorLogs">0</h3>
                            <p>Errors</p>
                        </div>
                    </div>
                </div>

                <!-- Logs Filters -->
                <div class="unified-table-container">
                    <div class="table-header">
                        <div class="table-title">
                            <h3><i class="fas fa-filter"></i> Activity Logs</h3>
                            <p>Filter and monitor system activities</p>
                        </div>
                        <div class="table-actions">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="logsSearch" placeholder="Search logs...">
                            </div>
                            <select id="logsTypeFilter" class="filter-select">
                                <option value="">All Types</option>
                                <option value="user">User Actions</option>
                                <option value="system">System Events</option>
                                <option value="error">Errors</option>
                                <option value="auth">Authentication</option>
                            </select>
                            <select id="logsDateFilter" class="filter-select">
                                <option value="">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                            <select id="logsMonthFilter" class="filter-select">
                                <option value="">All Months</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="logsContainer" class="table-responsive">
                        <div class="loading-placeholder">Loading logs...</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Setup month filter
    setupMonthFilter: function() {
        const monthFilter = document.getElementById('logsMonthFilter');
        if (!monthFilter) return;

        const months = DateUtils.generateMonthOptions();
        monthFilter.innerHTML = '<option value="">All Months</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.label;
            monthFilter.appendChild(option);
        });
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshLogs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadLogs());
        }
        
        // Export button
        const exportBtn = document.getElementById('exportLogs');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLogs());
        }
        
        // Search functionality
        const logsSearch = document.getElementById('logsSearch');
        if (logsSearch) {
            logsSearch.addEventListener('input', () => this.filterLogs());
        }
        
        // Type filter
        const typeFilter = document.getElementById('logsTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterLogs());
        }
        
        // Date filter
        const dateFilter = document.getElementById('logsDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterLogs());
        }
        
        // Month filter
        const monthFilter = document.getElementById('logsMonthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => this.filterLogs());
        }
    },
    
    // Load logs from API
    loadLogs: async function() {
        try {
            UIUtils.showLoading();
            const response = await API.makeRequest('get_logs');
            
            if (response.success) {
                this.logs = response.data || [];
                this.renderLogs();
                this.updateStats();
            } else {
                UIUtils.showNotification('Failed to load logs: ' + response.message, 'error');
                this.showTestLogs(); // Fallback to test data
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            UIUtils.showNotification('Error loading logs', 'error');
            this.showTestLogs(); // Fallback to test data
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Show test logs as fallback
    showTestLogs: function() {
        this.logs = [
            {
                id: 1,
                timestamp: '2024-01-20 10:30:15',
                type: 'auth',
                action: 'User Login',
                user: 'admin@racketwarrior.com',
                details: 'Successful login from 192.168.1.100',
                status: 'success'
            },
            {
                id: 2,
                timestamp: '2024-01-20 10:25:32',
                type: 'user',
                action: 'Add Player',
                user: 'john@example.com',
                details: 'Added new player: John Smith',
                status: 'success'
            },
            {
                id: 3,
                timestamp: '2024-01-20 10:20:45',
                type: 'user',
                action: 'Add Collection',
                user: 'john@example.com',
                details: 'Added collection: QAR 50.00 for January 2024',
                status: 'success'
            },
            {
                id: 4,
                timestamp: '2024-01-20 10:15:23',
                type: 'system',
                action: 'Database Backup',
                user: 'System',
                details: 'Automatic backup completed successfully',
                status: 'success'
            },
            {
                id: 5,
                timestamp: '2024-01-20 10:10:11',
                type: 'auth',
                action: 'Failed Login',
                user: 'unknown@example.com',
                details: 'Invalid credentials from 192.168.1.200',
                status: 'error'
            },
            {
                id: 6,
                timestamp: '2024-01-20 10:05:55',
                type: 'user',
                action: 'Edit User',
                user: 'admin@racketwarrior.com',
                details: 'Updated role for jane@example.com to view_edit',
                status: 'success'
            },
            {
                id: 7,
                timestamp: '2024-01-20 10:00:33',
                type: 'error',
                action: 'API Error',
                user: 'System',
                details: 'Failed to send email notification',
                status: 'error'
            },
            {
                id: 8,
                timestamp: '2024-01-20 09:55:12',
                type: 'user',
                action: 'Delete Expense',
                user: 'admin@racketwarrior.com',
                details: 'Deleted expense: Court rental - QAR 100.00',
                status: 'success'
            }
        ];
        this.renderLogs();
        this.updateStats();
    },
    
    // Render logs table
    renderLogs: function() {
        const container = document.getElementById('logsContainer');
        if (!container) return;
        
        if (this.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Logs Found</h3>
                    <p>System activity logs will appear here as actions are performed.</p>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="table logs-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Type</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Details</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.logs.map(log => `
                        <tr data-log-id="${log.id}" class="log-row-${log.status}">
                            <td class="log-timestamp">
                                <div class="timestamp-info">
                                    <span class="date">${this.formatDate(log.timestamp)}</span>
                                    <span class="time">${this.formatTime(log.timestamp)}</span>
                                </div>
                            </td>
                            <td>
                                <span class="type-badge type-${log.type}">
                                    ${this.getTypeIcon(log.type)} ${this.getTypeLabel(log.type)}
                                </span>
                            </td>
                            <td class="log-action">${log.action}</td>
                            <td class="log-user">
                                <div class="user-info">
                                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(log.user)}&background=667eea&color=fff&size=32" 
                                         alt="${log.user}" class="user-avatar-xs">
                                    <span>${log.user}</span>
                                </div>
                            </td>
                            <td class="log-details">${log.details}</td>
                            <td>
                                <span class="status-badge status-${log.status}">
                                    ${log.status === 'success' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                                    ${log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    // Update statistics
    updateStats: function() {
        const totalLogs = this.logs.length;
        const userLogs = this.logs.filter(l => l.type === 'user').length;
        const systemLogs = this.logs.filter(l => l.type === 'system').length;
        const errorLogs = this.logs.filter(l => l.status === 'error').length;
        
        const totalEl = document.getElementById('totalLogs');
        const userEl = document.getElementById('userLogs');
        const systemEl = document.getElementById('systemLogs');
        const errorEl = document.getElementById('errorLogs');
        
        if (totalEl) totalEl.textContent = totalLogs;
        if (userEl) userEl.textContent = userLogs;
        if (systemEl) systemEl.textContent = systemLogs;
        if (errorEl) errorEl.textContent = errorLogs;
    },
    
    // Get type icon
    getTypeIcon: function(type) {
        const icons = {
            'user': '<i class="fas fa-user"></i>',
            'system': '<i class="fas fa-cog"></i>',
            'auth': '<i class="fas fa-key"></i>',
            'error': '<i class="fas fa-exclamation-triangle"></i>'
        };
        return icons[type] || '<i class="fas fa-info"></i>';
    },
    
    // Get type label
    getTypeLabel: function(type) {
        const labels = {
            'user': 'User',
            'system': 'System',
            'auth': 'Auth',
            'error': 'Error'
        };
        return labels[type] || type;
    },
    
    // Format date
    formatDate: function(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    },
    
    // Format time
    formatTime: function(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    },
    
    // Filter logs
    filterLogs: function() {
        const searchTerm = document.getElementById('logsSearch').value.toLowerCase();
        const typeFilter = document.getElementById('logsTypeFilter').value;
        const dateFilter = document.getElementById('logsDateFilter').value;
        const monthFilter = document.getElementById('logsMonthFilter')?.value || '';
        
        const filteredLogs = this.logs.filter(log => {
            // Search filter
            const matchesSearch = !searchTerm || 
                                log.action.toLowerCase().includes(searchTerm) ||
                                log.user.toLowerCase().includes(searchTerm) ||
                                log.details.toLowerCase().includes(searchTerm);
            
            // Type filter
            const matchesType = !typeFilter || log.type === typeFilter;
            
            // Month filter (specific month)
            let matchesMonth = true;
            if (monthFilter) {
                const logDate = new Date(log.timestamp);
                const logMonthKey = DateUtils.getMonthKey(logDate);
                matchesMonth = logMonthKey === monthFilter;
            }
            
            // Date filter (relative dates)
            let matchesDate = true;
            if (dateFilter) {
                const logDate = new Date(log.timestamp);
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        matchesDate = logDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = logDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        matchesDate = logDate >= monthAgo;
                        break;
                }
            }
            
            return matchesSearch && matchesType && matchesDate && matchesMonth;
        });
        
        // Temporarily replace logs array for rendering
        const originalLogs = this.logs;
        this.logs = filteredLogs;
        this.renderLogs();
        this.logs = originalLogs;
    },
    
    // Export logs
    exportLogs: function() {
        try {
            const csvContent = this.convertToCSV(this.logs);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `racket-warrior-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            UIUtils.showNotification('Logs exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting logs:', error);
            UIUtils.showNotification('Failed to export logs', 'error');
        }
    },
    
    // Convert logs to CSV
    convertToCSV: function(logs) {
        const headers = ['Timestamp', 'Type', 'Action', 'User', 'Details', 'Status'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.type,
                `"${log.action}"`,
                log.user,
                `"${log.details}"`,
                log.status
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }
};

// Export Logs module
window.Logs = Logs;