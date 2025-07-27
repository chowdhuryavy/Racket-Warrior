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
        this.loadUsers();
        this.showTab('users');
    },
    
    // Get admin HTML with unified styling
    getHTML: function() {
        return `
            <div class="admin-page">
                <!-- Admin Header -->
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-cog"></i> Admin Panel</h1>
                        <p>Manage users, roles, and system settings</p>
                    </div>
                    <div class="header-actions">
                        <button id="addNewUser" class="btn-unified btn-unified-primary">
                            <i class="fas fa-user-plus"></i>
                            Add User
                        </button>
                        <button id="refreshAdmin" class="btn-unified btn-unified-secondary">
                            <i class="fas fa-sync"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                <!-- Admin Stats -->
                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalUsers">0</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="activeUsers">0</h3>
                            <p>Active Users</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="adminUsers">0</h3>
                            <p>Admin Users</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="viewUsers">0</h3>
                            <p>View Only</p>
                        </div>
                    </div>
                </div>

                <!-- Admin Navigation Tabs -->
                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="users">
                        <i class="fas fa-users"></i>
                        <span>User Management</span>
                    </button>
                    <button class="tab-btn" data-tab="roles">
                        <i class="fas fa-user-tag"></i>
                        <span>Role Management</span>
                    </button>
                    <button class="tab-btn" data-tab="settings">
                        <i class="fas fa-cog"></i>
                        <span>System Settings</span>
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="tab-content-container">
                    <!-- Users Tab -->
                    <div id="usersTab" class="tab-content active">
                        <div class="unified-table-container">
                            <div class="table-header">
                                <div class="table-title">
                                    <h3><i class="fas fa-users"></i> User Management</h3>
                                    <p>Manage user accounts, roles, and permissions</p>
                                </div>
                                <div class="table-actions">
                                    <div class="search-box">
                                        <i class="fas fa-search"></i>
                                        <input type="text" id="userSearch" placeholder="Search users...">
                                    </div>
                                    <select id="roleFilter" class="filter-select">
                                        <option value="">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="view_edit">View & Edit</option>
                                        <option value="view">View Only</option>
                                    </select>
                                </div>
                            </div>
                            <div id="usersContainer" class="table-responsive">
                                <div class="loading-placeholder">Loading users...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Roles Tab -->
                    <div id="rolesTab" class="tab-content">
                        <div class="unified-form">
                            <h3><i class="fas fa-user-tag"></i> Role Management</h3>
                            <p class="form-description">Configure user roles and their permissions</p>
                            
                            <div class="roles-grid">
                                <div class="role-card">
                                    <div class="role-header">
                                        <i class="fas fa-user-shield"></i>
                                        <h4>Admin</h4>
                                    </div>
                                    <div class="role-permissions">
                                        <p><i class="fas fa-check"></i> Full system access</p>
                                        <p><i class="fas fa-check"></i> User management</p>
                                        <p><i class="fas fa-check"></i> All CRUD operations</p>
                                        <p><i class="fas fa-check"></i> System logs</p>
                                        <p><i class="fas fa-check"></i> Reports & Analytics</p>
                                    </div>
                                </div>
                                
                                <div class="role-card">
                                    <div class="role-header">
                                        <i class="fas fa-user-edit"></i>
                                        <h4>View & Edit</h4>
                                    </div>
                                    <div class="role-permissions">
                                        <p><i class="fas fa-check"></i> View all data</p>
                                        <p><i class="fas fa-check"></i> Add/Edit/Delete records</p>
                                        <p><i class="fas fa-check"></i> Generate reports</p>
                                        <p><i class="fas fa-times"></i> User management</p>
                                        <p><i class="fas fa-times"></i> System logs</p>
                                    </div>
                                </div>
                                
                                <div class="role-card">
                                    <div class="role-header">
                                        <i class="fas fa-eye"></i>
                                        <h4>View Only</h4>
                                    </div>
                                    <div class="role-permissions">
                                        <p><i class="fas fa-check"></i> View all data</p>
                                        <p><i class="fas fa-check"></i> Generate reports</p>
                                        <p><i class="fas fa-times"></i> Add/Edit/Delete</p>
                                        <p><i class="fas fa-times"></i> User management</p>
                                        <p><i class="fas fa-times"></i> System logs</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Tab -->
                    <div id="settingsTab" class="tab-content">
                        <div class="unified-form">
                            <h3><i class="fas fa-cog"></i> System Settings</h3>
                            <p class="form-description">Configure system-wide settings and preferences</p>
                            
                            <div class="settings-grid">
                                <div class="setting-group">
                                    <h4><i class="fas fa-envelope"></i> Email Settings</h4>
                                    <div class="form-group">
                                        <label>Admin Email</label>
                                        <div class="input-wrapper">
                                            <i class="fas fa-envelope"></i>
                                            <input type="email" id="adminEmail" value="admin@racketwarrior.com" readonly>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>OTP Expiry (minutes)</label>
                                        <div class="input-wrapper">
                                            <i class="fas fa-clock"></i>
                                            <input type="number" id="otpExpiry" value="10" readonly>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-database"></i> Database Info</h4>
                                    <div class="form-group">
                                        <label>Google Sheets ID</label>
                                        <div class="input-wrapper">
                                            <i class="fas fa-table"></i>
                                            <input type="text" id="sheetId" placeholder="Sheet ID" readonly>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Last Backup</label>
                                        <div class="input-wrapper">
                                            <i class="fas fa-backup"></i>
                                            <input type="text" value="Never" readonly>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-shield-alt"></i> Security</h4>
                                    <div class="form-group">
                                        <label>Force Password Change</label>
                                        <div class="input-wrapper">
                                            <i class="fas fa-key"></i>
                                            <select id="forcePasswordChange">
                                                <option value="true">Enabled</option>
                                                <option value="false">Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Session Timeout (hours)</label>
                                        <div class="input-wrapper">
                                            <i class="fas fa-hourglass"></i>
                                            <input type="number" value="24" readonly>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add User Modal -->
            <div id="addUserModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Add New User</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="addUserForm" class="modal-body">
                        <div class="form-group">
                            <label for="newUserName">Full Name *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-user"></i>
                                <input type="text" id="newUserName" name="name" required placeholder="Enter full name">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUserEmail">Email Address *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-envelope"></i>
                                <input type="email" id="newUserEmail" name="email" required placeholder="Enter email address">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUserRole">Role *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-user-tag"></i>
                                <select id="newUserRole" name="role" required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="view_edit">View & Edit</option>
                                    <option value="view">View Only</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="newUserPassword">Temporary Password *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-lock"></i>
                                <input type="password" id="newUserPassword" name="password" required placeholder="Enter temporary password">
                                <span class="password-toggle" onclick="togglePassword('newUserPassword')">
                                    <i class="fas fa-eye"></i>
                                </span>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-unified btn-unified-secondary" onclick="closeModal('addUserModal')">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                            <button type="submit" class="btn-unified btn-unified-primary">
                                <i class="fas fa-user-plus"></i>
                                Add User
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit User Modal -->
            <div id="editUserModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-edit"></i> Edit User</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="editUserForm" class="modal-body">
                        <input type="hidden" id="editUserId" name="userId">
                        
                        <div class="form-group">
                            <label for="editUserName">Full Name *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-user"></i>
                                <input type="text" id="editUserName" name="name" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserEmail">Email Address *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-envelope"></i>
                                <input type="email" id="editUserEmail" name="email" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserRole">Role *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-user-tag"></i>
                                <select id="editUserRole" name="role" required>
                                    <option value="admin">Admin</option>
                                    <option value="view_edit">View & Edit</option>
                                    <option value="view">View Only</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-unified btn-unified-secondary" onclick="closeModal('editUserModal')">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                            <button type="submit" class="btn-unified btn-unified-primary">
                                <i class="fas fa-save"></i>
                                Update User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTab(tab);
            });
        });
        
        // Add user button
        const addUserBtn = document.getElementById('addNewUser');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshAdmin');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }
        
        // Add user form
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }
        
        // Edit user form
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.handleEditUser(e));
        }
        
        // Search functionality
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => this.filterUsers());
        }
        
        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => this.filterUsers());
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });
        
        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
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
    
    // Load users from API
    loadUsers: async function() {
        try {
            UIUtils.showLoading();
            const response = await API.makeRequest('list_users');
            
            if (response.success) {
                this.users = response.users || [];
                this.renderUsers();
                this.updateStats();
            } else {
                UIUtils.showNotification('Failed to load users: ' + response.message, 'error');
                this.showTestUsers(); // Fallback to test data
            }
        } catch (error) {
            console.error('Error loading users:', error);
            UIUtils.showNotification('Error loading users', 'error');
            this.showTestUsers(); // Fallback to test data
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Show test users as fallback
    showTestUsers: function() {
        this.users = [
            {
                id: 1,
                name: 'Admin User',
                email: 'admin@racketwarrior.com',
                role: 'admin',
                status: 'active',
                last_login: '2024-01-20 10:30:00',
                photo_url: 'https://ui-avatars.com/api/?name=Admin+User&background=667eea&color=fff&size=40'
            },
            {
                id: 2,
                name: 'John Manager',
                email: 'john@example.com',
                role: 'view_edit',
                status: 'active',
                last_login: '2024-01-19 15:45:00',
                photo_url: 'https://ui-avatars.com/api/?name=John+Manager&background=10b981&color=fff&size=40'
            },
            {
                id: 3,
                name: 'Jane Viewer',
                email: 'jane@example.com',
                role: 'view',
                status: 'active',
                last_login: '2024-01-18 09:12:00',
                photo_url: 'https://ui-avatars.com/api/?name=Jane+Viewer&background=f59e0b&color=fff&size=40'
            }
        ];
        this.renderUsers();
        this.updateStats();
    },
    
    // Render users table
    renderUsers: function() {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Users Found</h3>
                    <p>Start by adding your first user to the system.</p>
                    <button class="btn-unified btn-unified-primary" onclick="Admin.showAddUserModal()">
                        <i class="fas fa-user-plus"></i>
                        Add First User
                    </button>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
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
                    ${this.users.map(user => `
                        <tr data-user-id="${user.id}">
                            <td>
                                <div class="user-info">
                                    <img src="${user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=40`}" 
                                         alt="${user.name}" class="user-avatar-sm">
                                    <span class="user-name">${user.name}</span>
                                </div>
                            </td>
                            <td class="user-email">${user.email}</td>
                            <td>
                                <span class="role-badge role-${user.role}">
                                    ${this.getRoleLabel(user.role)}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge status-${user.status || 'active'}">
                                    ${(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                                </span>
                            </td>
                            <td class="last-login">${user.last_login || 'Never'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-sm btn-unified-primary" onclick="Admin.editUser(${user.id})" title="Edit User">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-sm btn-unified-secondary" onclick="Admin.resetPassword(${user.id})" title="Reset Password">
                                        <i class="fas fa-key"></i>
                                    </button>
                                    <button class="btn-sm btn-unified-danger" onclick="Admin.deleteUser(${user.id})" title="Delete User">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
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
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(u => (u.status || 'active') === 'active').length;
        const adminUsers = this.users.filter(u => u.role === 'admin').length;
        const viewUsers = this.users.filter(u => u.role === 'view').length;
        
        const totalEl = document.getElementById('totalUsers');
        const activeEl = document.getElementById('activeUsers');
        const adminEl = document.getElementById('adminUsers');
        const viewEl = document.getElementById('viewUsers');
        
        if (totalEl) totalEl.textContent = totalUsers;
        if (activeEl) activeEl.textContent = activeUsers;
        if (adminEl) adminEl.textContent = adminUsers;
        if (viewEl) viewEl.textContent = viewUsers;
    },
    
    // Get role label
    getRoleLabel: function(role) {
        const labels = {
            'admin': 'Admin',
            'view_edit': 'View & Edit',
            'view': 'View Only'
        };
        return labels[role] || role;
    },
    
    // Filter users
    filterUsers: function() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const roleFilter = document.getElementById('roleFilter').value;
        
        const filteredUsers = this.users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                                user.email.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || user.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
        
        // Temporarily replace users array for rendering
        const originalUsers = this.users;
        this.users = filteredUsers;
        this.renderUsers();
        this.users = originalUsers;
    },
    
    // Show add user modal
    showAddUserModal: function() {
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.style.display = 'flex';
            // Clear form
            document.getElementById('addUserForm').reset();
        }
    },
    
    // Close modal
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    // Handle add user
    handleAddUser: async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            password: formData.get('password')
        };
        
        try {
            UIUtils.showLoading();
            const response = await API.makeRequest('add_user', userData);
            
            if (response.success) {
                UIUtils.showNotification('User added successfully!', 'success');
                this.closeModal('addUserModal');
                this.loadUsers();
            } else {
                UIUtils.showNotification('Failed to add user: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            UIUtils.showNotification('Error adding user', 'error');
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Edit user
    editUser: function(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;
        
        // Populate edit form
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        
        // Show modal
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    // Handle edit user
    handleEditUser: async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            userId: formData.get('userId'),
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role')
        };
        
        try {
            UIUtils.showLoading();
            const response = await API.makeRequest('update_user', userData);
            
            if (response.success) {
                UIUtils.showNotification('User updated successfully!', 'success');
                this.closeModal('editUserModal');
                this.loadUsers();
            } else {
                UIUtils.showNotification('Failed to update user: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            UIUtils.showNotification('Error updating user', 'error');
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Reset password
    resetPassword: async function(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;
        
        if (confirm(`Reset password for ${user.name}?`)) {
            try {
                UIUtils.showLoading();
                const response = await API.makeRequest('reset_user_password', { userId: userId });
                
                if (response.success) {
                    UIUtils.showNotification('Password reset successfully!', 'success');
                } else {
                    UIUtils.showNotification('Failed to reset password: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                UIUtils.showNotification('Error resetting password', 'error');
            } finally {
                UIUtils.hideLoading();
            }
        }
    },
    
    // Delete user
    deleteUser: async function(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;
        
        if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            try {
                UIUtils.showLoading();
                const response = await API.makeRequest('delete_user', { userId: userId });
                
                if (response.success) {
                    UIUtils.showNotification('User deleted successfully!', 'success');
                    this.loadUsers();
                } else {
                    UIUtils.showNotification('Failed to delete user: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                UIUtils.showNotification('Error deleting user', 'error');
            } finally {
                UIUtils.hideLoading();
            }
        }
    }
};

// Export Admin module
window.Admin = Admin;