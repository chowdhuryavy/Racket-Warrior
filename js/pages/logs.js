// Logs Page Module for Racket Warrior

const Logs = {
    logs: [],
    currentFilter: 'all',
    
    // Render logs page
    render: async function(container) {
        container.innerHTML = this.getHTML();
        await this.init();
    },
    
    // Initialize logs page
    init: async function() {
        await this.setupMonthFilter();
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
                        <button class="btn-unified btn-unified-outline" onclick="showPage('dashboard')">
                            <i class="fas fa-home"></i>
                            Back to Dashboard
                        </button>
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
    setupMonthFilter: async function() {
        try {
            const availableMonths = await DateUtils.setupAvailableMonthsFilter('logsMonthFilter', {
                allTimeLabel: 'All Months'
            });
            
            console.log('📅 Logs month filter setup complete with', availableMonths.length, 'months');
        } catch (error) {
            console.error('📅 Failed to setup logs month filter:', error);
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshLogs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadLogs();
                UIUtils.showNotification('Logs refreshed', 'success');
            });
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
            const response = await API.getLogs();
            
            console.log('📋 Raw logs response:', response);
            
            if (response.success) {
                // Process and validate log data
                this.logs = this.processLogData(response.data || []);
                console.log('📋 Processed logs:', this.logs);
                this.renderLogs();
                this.updateStats();
            } else {
                console.error('📋 Failed to load logs:', response.message);
                UIUtils.showNotification('Failed to load logs: ' + response.message, 'error');
                this.renderEmptyLogs(); // Show empty logs instead of dummy data
            }
        } catch (error) {
            console.error('📋 Error loading logs:', error);
            UIUtils.showNotification('Error loading logs', 'error');
            this.renderEmptyLogs(); // Show empty logs instead of dummy data
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Process and validate log data
    processLogData: function(rawLogs) {
        if (!Array.isArray(rawLogs)) {
            console.warn('📋 Invalid logs data format, expected array:', typeof rawLogs);
            return [];
        }
        
        return rawLogs.map((log, index) => {
            // Ensure log is an object
            if (!log || typeof log !== 'object') {
                console.warn('📋 Invalid log entry at index', index, ':', log);
                return null;
            }
            
            // Create a standardized log object with enhanced fields
            const processedLog = {
                id: log.id || log.ID || index + 1,
                timestamp: log.timestamp || log.Timestamp || log.created_at || new Date().toISOString(),
                type: log.type || log.Type || 'system',
                action: log.action || log.Action || 'Unknown Action',
                user: log.user || log.User || log.email || 'System',
                role: log.role || log.Role || 'unknown',
                details: log.details || log.Details || log.description || 'No details available',
                status: log.status || log.Status || 'unknown',
                ip: log.ip || log.IP || 'N/A',
                userAgent: log.userAgent || log.UserAgent || 'N/A',
                month: log.month || log.Month || null
            };
            
            // Validate required fields
            if (!processedLog.timestamp || !processedLog.action) {
                console.warn('📋 Log missing required fields:', processedLog);
            }
            
            return processedLog;
        }).filter(log => log !== null); // Remove invalid entries
    },
    
    // Show empty logs when no data is available
    renderEmptyLogs: function() {
        this.logs = [];
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
                    ${this.logs.filter(log => log && typeof log === 'object').map(log => `
                        <tr data-log-id="${log.id || 'unknown'}" class="log-row-${log.status || 'unknown'}">
                            <td class="log-timestamp">
                                <div class="timestamp-info">
                                    <span class="date">${this.formatDate(log.timestamp)}</span>
                                    <span class="time">${this.formatTime(log.timestamp)}</span>
                                </div>
                            </td>
                            <td>
                                <span class="type-badge type-${log.type || 'unknown'}">
                                    ${this.getTypeIcon(log.type || 'unknown')} ${this.getTypeLabel(log.type || 'unknown')}
                                </span>
                            </td>
                            <td class="log-action">${log.action || 'Unknown Action'}</td>
                            <td class="log-user">
                                <div class="user-info">
                                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(log.user || 'Unknown')}&background=667eea&color=fff&size=32" 
                                         alt="${log.user || 'Unknown'}" class="user-avatar-xs">
                                    <span>${log.user || 'Unknown User'}</span>
                                </div>
                            </td>
                            <td class="log-details">${log.details || 'No details available'}</td>
                            <td>
                                <span class="status-badge status-${log.status || 'unknown'}">
                                    ${(log.status === 'success') ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                                    ${log.status ? log.status.charAt(0).toUpperCase() + log.status.slice(1) : 'Unknown'}
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
        if (!timestamp) return 'N/A';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                // Try parsing different formats
                const parsedDate = this.parseTimestamp(timestamp);
                return parsedDate ? parsedDate.toLocaleDateString() : 'Invalid Date';
            }
            return date.toLocaleDateString();
        } catch (error) {
            console.warn('Error formatting date:', timestamp, error);
            return 'Invalid Date';
        }
    },
    
    // Format time
    formatTime: function(timestamp) {
        if (!timestamp) return 'N/A';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                // Try parsing different formats
                const parsedDate = this.parseTimestamp(timestamp);
                return parsedDate ? parsedDate.toLocaleTimeString() : 'Invalid Time';
            }
            return date.toLocaleTimeString();
        } catch (error) {
            console.warn('Error formatting time:', timestamp, error);
            return 'Invalid Time';
        }
    },
    
    // Parse various timestamp formats
    parseTimestamp: function(timestamp) {
        if (!timestamp) return null;
        
        // Try different formats
        const formats = [
            timestamp, // As-is
            timestamp.replace(' ', 'T'), // Space to T
            timestamp + 'Z', // Add timezone
            new Date().toISOString(), // Fallback to current time
        ];
        
        for (const format of formats) {
            try {
                const date = new Date(format);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            } catch (e) {
                continue;
            }
        }
        
        return null;
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