// Admin Page Module for Racket Warrior

const Admin = {
    users: [],
    currentTab: 'users',
    
    // Render admin page
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    // Initialize admin page
    init: function() {
        this.setupEventListeners();
        
        // Show test data immediately
        this.showTestData();
        this.showTab('users');
        
        // Then try to load real data
        setTimeout(() => {
            this.loadUsers();
        }, 100);
    },
    
    // Show test data immediately
    showTestData: function() {
        
        // Update user stats
        const totalUsersEl = document.getElementById('totalUsers');
        const activeUsersEl = document.getElementById('activeUsers');
        const adminUsersEl = document.getElementById('adminUsers');
        
        if (totalUsersEl) totalUsersEl.textContent = '8';
        if (activeUsersEl) activeUsersEl.textContent = '7';
        if (adminUsersEl) adminUsersEl.textContent = '2';
        
        // Show test users table
        const usersContainer = document.getElementById('usersContainer');
        if (usersContainer) {
            usersContainer.innerHTML = `
                <table class="table users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=667eea&color=fff&size=32" alt="Admin" class="user-avatar-sm">
                                    <span>Admin User</span>
                                </div>
                            </td>
                            <td>admin@example.com</td>
                            <td><span class="role-badge role-admin">Admin</span></td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>2024-01-20 10:30:15</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-edit" title="Edit User">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-key" title="Reset Password">
                                        <i class="fas fa-key"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <img src="https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=fff&size=32" alt="John" class="user-avatar-sm">
                                    <span>John Doe</span>
                                </div>
                            </td>
                            <td>john.doe@example.com</td>
                            <td><span class="role-badge role-view-edit">View Edit</span></td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>2024-01-19 15:45:22</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-edit" title="Edit User">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-key" title="Reset Password">
                                        <i class="fas fa-key"></i>
                                    </button>
                                    <button class="btn btn-sm btn-delete" title="Delete User">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=f59e0b&color=fff&size=32" alt="Jane" class="user-avatar-sm">
                                    <span>Jane Smith</span>
                                </div>
                            </td>
                            <td>jane.smith@example.com</td>
                            <td><span class="role-badge role-view">View</span></td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>2024-01-18 09:12:45</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-edit" title="Edit User">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-key" title="Reset Password">
                                        <i class="fas fa-key"></i>
                                    </button>
                                    <button class="btn btn-sm btn-delete" title="Delete User">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    },
    
    // Get admin HTML
    getHTML: function() {
        return `
            <div class="admin-page">
                <!-- Admin Header -->
                <div class="page-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1><i class="fas fa-cog"></i> Admin Panel</h1>
                            <p>Manage users, roles, and system settings</p>
                        </div>
                        <div class="header-actions">
                            <button id="addNewUser" class="btn btn-primary">
                                <i class="fas fa-user-plus"></i> Add User
                            </button>
                            <button id="refreshAdmin" class="btn btn-secondary">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Admin Tabs -->
                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="users">
                        <i class="fas fa-users"></i> User Management
                    </button>
                    <button class="tab-btn" data-tab="settings">
                        <i class="fas fa-sliders-h"></i> System Settings
                    </button>
                    <button class="tab-btn" data-tab="backup">
                        <i class="fas fa-download"></i> Backup & Export
                    </button>
                </div>
                
                <!-- Users Tab -->
                <div id="usersTab" class="tab-content active">
                    <div class="users-section">
                        <div class="section-header">
                            <h3>User Management</h3>
                            <div class="user-stats">
                                <span class="stat-item">
                                    Total Users: <strong id="totalUsersCount">0</strong>
                                </span>
                                <span class="stat-item">
                                    Active: <strong id="activeUsersCount">0</strong>
                                </span>
                                <span class="stat-item">
                                    Admins: <strong id="adminUsersCount">0</strong>
                                </span>
                            </div>
                        </div>
                        
                        <div class="users-filters">
                            <input type="text" id="userSearch" placeholder="Search users..." class="form-control">
                            <select id="roleFilter" class="form-control">
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="view_edit">View & Edit</option>
                                <option value="view">View Only</option>
                            </select>
                            <select id="statusFilter" class="form-control">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        
                        <div class="users-table-container">
                            <table class="users-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Last Login</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center">Loading users...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Settings Tab -->
                <div id="settingsTab" class="tab-content">
                    <div class="settings-section">
                        <h3>System Settings</h3>
                        
                        <div class="settings-grid">
                            <div class="setting-card">
                                <div class="setting-header">
                                    <h4><i class="fas fa-envelope"></i> Email Settings</h4>
                                </div>
                                <div class="setting-content">
                                    <div class="form-group">
                                        <label>From Email:</label>
                                        <input type="email" id="emailFrom" class="form-control" value="chowdhuryavy@gmail.com">
                                    </div>
                                    <div class="form-group">
                                        <label>OTP Expiry (minutes):</label>
                                        <input type="number" id="otpExpiry" class="form-control" value="10" min="5" max="60">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="setting-card">
                                <div class="setting-header">
                                    <h4><i class="fas fa-shield-alt"></i> Security Settings</h4>
                                </div>
                                <div class="setting-content">
                                    <div class="form-group">
                                        <label>Session Timeout (hours):</label>
                                        <input type="number" id="sessionTimeout" class="form-control" value="24" min="1" max="168">
                                    </div>
                                    <div class="form-group">
                                        <label>Force Password Change:</label>
                                        <select id="forcePasswordChange" class="form-control">
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="setting-card">
                                <div class="setting-header">
                                    <h4><i class="fas fa-palette"></i> App Settings</h4>
                                </div>
                                <div class="setting-content">
                                    <div class="form-group">
                                        <label>App Name:</label>
                                        <input type="text" id="appName" class="form-control" value="Racket Warrior">
                                    </div>
                                    <div class="form-group">
                                        <label>Default Currency:</label>
                                        <input type="text" id="defaultCurrency" class="form-control" value="QAR">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-actions">
                            <button id="saveSettings" class="btn btn-primary">
                                <i class="fas fa-save"></i> Save Settings
                            </button>
                            <button id="resetSettings" class="btn btn-secondary">
                                <i class="fas fa-undo"></i> Reset to Default
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Backup Tab -->
                <div id="backupTab" class="tab-content">
                    <div class="backup-section">
                        <h3>Backup & Export</h3>
                        
                        <div class="backup-grid">
                            <div class="backup-card">
                                <div class="backup-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <h4>Export Users</h4>
                                <p>Download user data as CSV file</p>
                                <button class="btn btn-outline-primary" onclick="Admin.exportData('users')">
                                    <i class="fas fa-download"></i> Export Users
                                </button>
                            </div>
                            
                            <div class="backup-card">
                                <div class="backup-icon">
                                    <i class="fas fa-money-bill"></i>
                                </div>
                                <h4>Export Financial Data</h4>
                                <p>Download income and expense data</p>
                                <button class="btn btn-outline-primary" onclick="Admin.exportData('financial')">
                                    <i class="fas fa-download"></i> Export Financial
                                </button>
                            </div>
                            
                            <div class="backup-card">
                                <div class="backup-icon">
                                    <i class="fas fa-history"></i>
                                </div>
                                <h4>Export Logs</h4>
                                <p>Download system activity logs</p>
                                <button class="btn btn-outline-primary" onclick="Admin.exportData('logs')">
                                    <i class="fas fa-download"></i> Export Logs
                                </button>
                            </div>
                            
                            <div class="backup-card">
                                <div class="backup-icon">
                                    <i class="fas fa-database"></i>
                                </div>
                                <h4>Full Backup</h4>
                                <p>Download complete system backup</p>
                                <button class="btn btn-primary" onclick="Admin.exportData('full')">
                                    <i class="fas fa-download"></i> Full Backup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Add/Edit User Modal -->
            <div id="userModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="userModalTitle">Add New User</h3>
                        <button class="modal-close" onclick="Admin.closeUserModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="userForm">
                            <input type="hidden" id="userId" name="userId">
                            <div class="form-group">
                                <label for="userName">Full Name:</label>
                                <input type="text" id="userName" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="userEmail">Email:</label>
                                <input type="email" id="userEmail" name="email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="userRole">Role:</label>
                                <select id="userRole" name="role" class="form-control" required>
                                    <option value="view">View Only</option>
                                    <option value="view_edit">View & Edit</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="userPassword">Password:</label>
                                <input type="password" id="userPassword" name="password" class="form-control">
                                <small class="form-text">Leave blank to keep current password (for edits)</small>
                            </div>
                            <div class="form-group">
                                <label for="userStatus">Status:</label>
                                <select id="userStatus" name="status" class="form-control">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="Admin.closeUserModal()">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="Admin.saveUser()">Save User</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });
        
        // Add new user
        const addUserBtn = document.getElementById('addNewUser');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showUserModal());
        }
        
        // Refresh
        const refreshBtn = document.getElementById('refreshAdmin');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }
        
        // User filters
        const userSearch = document.getElementById('userSearch');
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (userSearch) userSearch.addEventListener('input', () => this.filterUsers());
        if (roleFilter) roleFilter.addEventListener('change', () => this.filterUsers());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterUsers());
        
        // Settings
        const saveSettingsBtn = document.getElementById('saveSettings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
    },
    
    // Show tab
    showTab: function(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        this.currentTab = tabName;
    },
    
    // Load users
    loadUsers: async function() {
        try {
            Logger.info('Loading users for admin panel');
            
            this.showUsersLoadingState();
            
            const response = await API.getUsers();
            
            if (response.success) {
                this.users = response.data || [];
                this.updateUserStats();
                this.filterUsers();
                UIUtils.showNotification('Users loaded successfully', 'success');
            } else {
                throw new Error(response.message || 'Failed to load users');
            }
            
        } catch (error) {
            Logger.error('Failed to load users', error);
            UIUtils.showNotification('Failed to load users', 'error');
            this.showUsersErrorState();
        }
    },
    
    // Show users loading state
    showUsersLoadingState: function() {
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
        }
    },
    
    // Show users error state
    showUsersErrorState: function() {
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load users</td></tr>';
        }
    },
    
    // Update user statistics
    updateUserStats: function() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(u => u.status === 'active').length;
        const adminUsers = this.users.filter(u => u.role === 'admin').length;
        
        const totalEl = document.getElementById('totalUsersCount');
        const activeEl = document.getElementById('activeUsersCount');
        const adminEl = document.getElementById('adminUsersCount');
        
        if (totalEl) totalEl.textContent = totalUsers;
        if (activeEl) activeEl.textContent = activeUsers;
        if (adminEl) adminEl.textContent = adminUsers;
    },
    
    // Filter users
    filterUsers: function() {
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('roleFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        
        const filteredUsers = this.users.filter(user => {
            // Search filter
            if (searchTerm) {
                const searchableText = `${user.name} ${user.email}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            // Role filter
            if (roleFilter && user.role !== roleFilter) return false;
            
            // Status filter
            if (statusFilter && user.status !== statusFilter) return false;
            
            return true;
        });
        
        this.renderUsersTable(filteredUsers);
    },
    
    // Render users table
    renderUsersTable: function(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${user.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=667eea&color=fff&size=40'}" 
                             alt="${user.name}" class="user-avatar">
                        <span class="user-name">${user.name}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">${this.formatRole(user.role)}</span>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">${this.formatStatus(user.status)}</span>
                </td>
                <td>${this.formatLastLogin(user.last_login)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="Admin.editUser('${user.email}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="Admin.resetPassword('${user.email}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        ${user.email !== 'chowdhuryavy@gmail.com' ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="Admin.deleteUser('${user.email}')" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    // Format role for display
    formatRole: function(role) {
        const roleMap = {
            'admin': 'Admin',
            'view_edit': 'View & Edit',
            'view': 'View Only'
        };
        return roleMap[role] || role;
    },
    
    // Format status for display
    formatStatus: function(status) {
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    },
    
    // Format last login
    formatLastLogin: function(lastLogin) {
        if (!lastLogin) return 'Never';
        return new Date(lastLogin).toLocaleDateString();
    },
    
    // Show user modal
    showUserModal: function(user = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        
        if (user) {
            title.textContent = 'Edit User';
            this.populateUserForm(user);
        } else {
            title.textContent = 'Add New User';
            form.reset();
            document.getElementById('userId').value = '';
        }
        
        modal.style.display = 'block';
    },
    
    // Close user modal
    closeUserModal: function() {
        const modal = document.getElementById('userModal');
        modal.style.display = 'none';
    },
    
    // Populate user form
    populateUserForm: function(user) {
        document.getElementById('userId').value = user.email;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userStatus').value = user.status;
        document.getElementById('userPassword').value = '';
    },
    
    // Edit user
    editUser: function(email) {
        const user = this.users.find(u => u.email === email);
        if (user) {
            this.showUserModal(user);
        }
    },
    
    // Save user
    saveUser: function() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData);
        
        // Validate form
        if (!userData.name || !userData.email || !userData.role) {
            UIUtils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // For new users, password is required
        if (!userData.userId && !userData.password) {
            UIUtils.showNotification('Password is required for new users', 'error');
            return;
        }
        
        // This would call the API to save the user
        UIUtils.showNotification('User save functionality will be implemented', 'info');
        this.closeUserModal();
    },
    
    // Reset user password
    resetPassword: function(email) {
        if (!confirm(`Reset password for user: ${email}?`)) return;
        
        // This would call the API to reset password
        UIUtils.showNotification('Password reset functionality will be implemented', 'info');
    },
    
    // Delete user
    deleteUser: function(email) {
        if (!confirm(`Delete user: ${email}? This action cannot be undone.`)) return;
        
        // This would call the API to delete user
        UIUtils.showNotification('User deletion functionality will be implemented', 'info');
    },
    
    // Save settings
    saveSettings: function() {
        const settings = {
            emailFrom: document.getElementById('emailFrom').value,
            otpExpiry: document.getElementById('otpExpiry').value,
            sessionTimeout: document.getElementById('sessionTimeout').value,
            forcePasswordChange: document.getElementById('forcePasswordChange').value,
            appName: document.getElementById('appName').value,
            defaultCurrency: document.getElementById('defaultCurrency').value
        };
        
        // This would call the API to save settings
        UIUtils.showNotification('Settings save functionality will be implemented', 'info');
    },
    
    // Export data
    exportData: function(type) {
        UIUtils.showNotification(`Export ${type} functionality will be implemented`, 'info');
    }
};

// Export Admin module
window.Admin = Admin;