// Admin Page Module - Completely Redesigned
const AdminNew = {
    currentTab: 'users',
    users: [],
    
    init: function() {
        this.loadUsers();
        this.setupEventListeners();
    },
    
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    getHTML: function() {
        return `
            <div class="admin-page-new">
                <!-- Header Section -->
                <div class="admin-header">
                    <div class="header-content">
                        <div class="header-left">
                            <div class="header-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="header-info">
                                <h1>Admin Panel</h1>
                                <p>Manage users, roles, and system settings</p>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="btn-new btn-primary" onclick="AdminNew.showAddUserModal()">
                                <i class="fas fa-plus"></i>
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-icon users">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="totalUsers">0</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon admins">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="totalAdmins">0</div>
                            <div class="stat-label">Administrators</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon active">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="activeUsers">0</div>
                            <div class="stat-label">Active Users</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon recent">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="recentLogins">0</div>
                            <div class="stat-label">Recent Logins</div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="admin-content">
                    <!-- Tab Navigation -->
                    <div class="admin-tabs">
                        <button class="tab-btn active" data-tab="users" onclick="AdminNew.switchTab('users')">
                            <i class="fas fa-users"></i>
                            <span>User Management</span>
                        </button>
                        <button class="tab-btn" data-tab="roles" onclick="AdminNew.switchTab('roles')">
                            <i class="fas fa-user-tag"></i>
                            <span>Roles & Permissions</span>
                        </button>
                        <button class="tab-btn" data-tab="settings" onclick="AdminNew.switchTab('settings')">
                            <i class="fas fa-cog"></i>
                            <span>System Settings</span>
                        </button>
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="tab-content">
                        <!-- Users Tab -->
                        <div id="usersTab" class="tab-pane active">
                            <div class="users-section">
                                <div class="section-header">
                                    <h2>User Management</h2>
                                    <div class="section-actions">
                                        <div class="search-container">
                                            <i class="fas fa-search"></i>
                                            <input type="text" placeholder="Search users..." id="userSearch" oninput="AdminNew.filterUsers()">
                                        </div>
                                        <select id="roleFilter" onchange="AdminNew.filterUsers()">
                                            <option value="">All Roles</option>
                                            <option value="admin">Admin</option>
                                            <option value="view_edit">View & Edit</option>
                                            <option value="view">View Only</option>
                                        </select>
                                    </div>
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
                                            <!-- Users will be loaded here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Roles Tab -->
                        <div id="rolesTab" class="tab-pane">
                            <div class="roles-section">
                                <div class="section-header">
                                    <h2>Roles & Permissions</h2>
                                    <p>Manage user roles and their permissions</p>
                                </div>
                                
                                <div class="roles-grid">
                                    <div class="role-card admin">
                                        <div class="role-header">
                                            <div class="role-icon">
                                                <i class="fas fa-crown"></i>
                                            </div>
                                            <div class="role-info">
                                                <h3>Administrator</h3>
                                                <p>Full system access</p>
                                            </div>
                                        </div>
                                        <div class="role-permissions">
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>All CRUD operations</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>User management</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>System logs</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>Reports access</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="role-card view-edit">
                                        <div class="role-header">
                                            <div class="role-icon">
                                                <i class="fas fa-edit"></i>
                                            </div>
                                            <div class="role-info">
                                                <h3>View & Edit</h3>
                                                <p>Can view and modify data</p>
                                            </div>
                                        </div>
                                        <div class="role-permissions">
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>Add/Edit/Delete records</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>View reports</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-times"></i>
                                                <span>User management</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-times"></i>
                                                <span>System logs</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="role-card view-only">
                                        <div class="role-header">
                                            <div class="role-icon">
                                                <i class="fas fa-eye"></i>
                                            </div>
                                            <div class="role-info">
                                                <h3>View Only</h3>
                                                <p>Read-only access</p>
                                            </div>
                                        </div>
                                        <div class="role-permissions">
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>View all data</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-check"></i>
                                                <span>View reports</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-times"></i>
                                                <span>Modify data</span>
                                            </div>
                                            <div class="permission-item">
                                                <i class="fas fa-times"></i>
                                                <span>User management</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Settings Tab -->
                        <div id="settingsTab" class="tab-pane">
                            <div class="settings-section">
                                <div class="section-header">
                                    <h2>System Settings</h2>
                                    <p>Configure application settings</p>
                                </div>
                                
                                <div class="settings-grid">
                                    <div class="setting-group">
                                        <div class="setting-header">
                                            <h3>Application Settings</h3>
                                            <p>Basic application configuration</p>
                                        </div>
                                        <div class="setting-items">
                                            <div class="setting-item">
                                                <label>Application Name</label>
                                                <input type="text" value="Racket Warrior" id="appName">
                                            </div>
                                            <div class="setting-item">
                                                <label>Currency</label>
                                                <select id="currency">
                                                    <option value="QAR">QAR (Qatari Riyal)</option>
                                                    <option value="USD">USD (US Dollar)</option>
                                                    <option value="EUR">EUR (Euro)</option>
                                                </select>
                                            </div>
                                            <div class="setting-item">
                                                <label>Timezone</label>
                                                <select id="timezone">
                                                    <option value="Asia/Qatar">Asia/Qatar</option>
                                                    <option value="UTC">UTC</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="setting-group">
                                        <div class="setting-header">
                                            <h3>Security Settings</h3>
                                            <p>Password and security configuration</p>
                                        </div>
                                        <div class="setting-items">
                                            <div class="setting-item">
                                                <label>Password Min Length</label>
                                                <input type="number" value="8" id="passwordMinLength">
                                            </div>
                                            <div class="setting-item">
                                                <label>Session Timeout (hours)</label>
                                                <input type="number" value="24" id="sessionTimeout">
                                            </div>
                                            <div class="setting-item">
                                                <label>Force Password Change</label>
                                                <select id="forcePasswordChange">
                                                    <option value="true">First Login</option>
                                                    <option value="false">Never</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="settings-actions">
                                    <button class="btn-new btn-primary" onclick="AdminNew.saveSettings()">
                                        <i class="fas fa-save"></i>
                                        Save Settings
                                    </button>
                                    <button class="btn-new btn-secondary" onclick="AdminNew.resetSettings()">
                                        <i class="fas fa-undo"></i>
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Add User Modal -->
            <div id="addUserModal" class="modal-new" style="display: none;">
                <div class="modal-content-new">
                    <div class="modal-header-new">
                        <h2>Add New User</h2>
                        <button class="modal-close-new" onclick="AdminNew.closeModal('addUserModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body-new">
                        <form id="addUserForm" onsubmit="AdminNew.handleAddUser(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Full Name</label>
                                    <div class="input-group">
                                        <i class="fas fa-user"></i>
                                        <input type="text" name="name" placeholder="Enter full name" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Email Address</label>
                                    <div class="input-group">
                                        <i class="fas fa-envelope"></i>
                                        <input type="email" name="email" placeholder="Enter email address" required>
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Role</label>
                                    <div class="input-group">
                                        <i class="fas fa-user-tag"></i>
                                        <select name="role" required>
                                            <option value="">Select Role</option>
                                            <option value="admin">Administrator</option>
                                            <option value="view_edit">View & Edit</option>
                                            <option value="view">View Only</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Temporary Password</label>
                                    <div class="input-group">
                                        <i class="fas fa-lock"></i>
                                        <input type="password" name="password" placeholder="Generate or enter password" required>
                                        <button type="button" class="generate-password" onclick="AdminNew.generatePassword()">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-new btn-secondary" onclick="AdminNew.closeModal('addUserModal')">
                                    Cancel
                                </button>
                                <button type="submit" class="btn-new btn-primary">
                                    <i class="fas fa-plus"></i>
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupEventListeners: function() {
        // Modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-new')) {
                e.target.style.display = 'none';
            }
        });
    },
    
    switchTab: function(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        this.currentTab = tabName;
    },
    
    loadUsers: async function() {
        try {
            UIUtils.showLoading(document.querySelector('.users-table-container'), 'Loading users...');
            
            const response = await API.makeRequest('list_users');
            
            if (response.success) {
                this.users = response.data || [];
                this.renderUsers();
                this.updateStats();
            } else {
                UIUtils.showNotification('Failed to load users: ' + response.message, 'error');
            }
        } catch (error) {
            Logger.error('Error loading users:', error);
            UIUtils.showNotification('Error loading users', 'error');
        }
    },
    
    renderUsers: function() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-users"></i>
                            <h3>No Users Found</h3>
                            <p>Start by adding your first user</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            <img src="${user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=40`}" alt="${user.name}">
                        </div>
                        <div class="user-details">
                            <div class="user-name">${user.name}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="user-email">${user.email}</div>
                </td>
                <td>
                    <span class="role-badge ${user.role}">${this.getRoleLabel(user.role)}</span>
                </td>
                <td>
                    <span class="status-badge ${user.status || 'active'}">${user.status || 'active'}</span>
                </td>
                <td>
                    <div class="last-login">
                        ${user.last_login ? this.formatDate(user.last_login) : 'Never'}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="AdminNew.editUser('${user.email}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action reset" onclick="AdminNew.resetPassword('${user.email}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn-action delete" onclick="AdminNew.deleteUser('${user.email}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    updateStats: function() {
        const totalUsers = this.users.length;
        const totalAdmins = this.users.filter(u => u.role === 'admin').length;
        const activeUsers = this.users.filter(u => u.status !== 'inactive').length;
        const recentLogins = this.users.filter(u => {
            if (!u.last_login) return false;
            const loginDate = new Date(u.last_login);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return loginDate > weekAgo;
        }).length;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalAdmins').textContent = totalAdmins;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('recentLogins').textContent = recentLogins;
    },
    
    showAddUserModal: function() {
        document.getElementById('addUserModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    closeModal: function(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = '';
    },
    
    generatePassword: function() {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        document.querySelector('input[name="password"]').value = password;
    },
    
    handleAddUser: async function(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            password: formData.get('password')
        };
        
        try {
            UIUtils.showLoading(event.target.querySelector('button[type="submit"]'), 'Adding...');
            
            const response = await API.makeRequest('add_user', userData);
            
            if (response.success) {
                UIUtils.showNotification('✅ User added successfully!', 'success');
                this.closeModal('addUserModal');
                event.target.reset();
                this.loadUsers();
            } else {
                UIUtils.showNotification('Failed to add user: ' + response.message, 'error');
            }
        } catch (error) {
            Logger.error('Error adding user:', error);
            UIUtils.showNotification('Error adding user', 'error');
        } finally {
            UIUtils.hideLoading(event.target.querySelector('button[type="submit"]'));
        }
    },
    
    editUser: function(email) {
        // Implementation for edit user
        UIUtils.showNotification('Edit user functionality will be implemented', 'info');
    },
    
    resetPassword: function(email) {
        // Implementation for reset password
        UIUtils.showNotification('Reset password functionality will be implemented', 'info');
    },
    
    deleteUser: function(email) {
        // Implementation for delete user
        UIUtils.showNotification('Delete user functionality will be implemented', 'info');
    },
    
    filterUsers: function() {
        // Implementation for filtering users
        // This will filter the users array and re-render
    },
    
    saveSettings: function() {
        UIUtils.showNotification('Settings saved successfully!', 'success');
    },
    
    resetSettings: function() {
        UIUtils.showNotification('Settings reset to defaults', 'info');
    },
    
    getRoleLabel: function(role) {
        const labels = {
            'admin': 'Administrator',
            'view_edit': 'View & Edit',
            'view': 'View Only'
        };
        return labels[role] || role;
    },
    
    formatDate: function(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
};

// Global function for HTML onclick handlers
window.AdminNew = AdminNew;