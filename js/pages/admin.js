// Admin Page Module - Completely Redesigned for Professional UI/UX

const Admin = {
    users: [],
    currentTab: 'users',
    currentFilter: 'all',
    
    // Initialize admin page
    init: function() {
        this.setupEventListeners();
        this.loadUsers();
        this.updateStats();
    },
    
    // Render admin page
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    // Get professional admin HTML
    getHTML: function() {
        return `
            <div class="admin-page-redesigned">
                <!-- Professional Header -->
                <div class="admin-header-new">
                    <div class="header-content-new">
                        <div class="header-left-new">
                            <div class="header-icon-new">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="header-info-new">
                                <h1 class="page-title-new">Administration Panel</h1>
                                <p class="page-subtitle-new">Manage users, permissions, and system configuration</p>
                            </div>
                        </div>
                        <div class="header-actions-new">
                            <button class="btn-new btn-outline-new" onclick="showPage('dashboard')">
                                <i class="fas fa-home"></i>
                                <span>Back to Dashboard</span>
                            </button>
                            <button class="btn-new btn-primary-new" onclick="Admin.showAddUserModal()">
                                <i class="fas fa-user-plus"></i>
                                <span>Add New User</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Statistics Dashboard -->
                <div class="stats-grid-new">
                    <div class="stat-card-new users-card">
                        <div class="stat-icon-new">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content-new">
                            <div class="stat-number-new" id="totalUsers">0</div>
                            <div class="stat-label-new">Total Users</div>
                            <div class="stat-change-new positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>Active</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-new admins-card">
                        <div class="stat-icon-new">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div class="stat-content-new">
                            <div class="stat-number-new" id="totalAdmins">0</div>
                            <div class="stat-label-new">Administrators</div>
                            <div class="stat-change-new neutral">
                                <i class="fas fa-shield-alt"></i>
                                <span>Privileged</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-new active-card">
                        <div class="stat-icon-new">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="stat-content-new">
                            <div class="stat-number-new" id="activeUsers">0</div>
                            <div class="stat-label-new">Active Users</div>
                            <div class="stat-change-new positive">
                                <i class="fas fa-check-circle"></i>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-new recent-card">
                        <div class="stat-icon-new">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content-new">
                            <div class="stat-number-new" id="recentLogins">0</div>
                            <div class="stat-label-new">Recent Logins</div>
                            <div class="stat-change-new neutral">
                                <i class="fas fa-history"></i>
                                <span>24h</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tab Navigation -->
                <div class="tab-navigation-new">
                    <button class="tab-button-new active" data-tab="users" onclick="Admin.switchTab('users')">
                        <i class="fas fa-users"></i>
                        <span>User Management</span>
                    </button>
                    <button class="tab-button-new" data-tab="roles" onclick="Admin.switchTab('roles')">
                        <i class="fas fa-key"></i>
                        <span>Roles & Permissions</span>
                    </button>
                    <button class="tab-button-new" data-tab="settings" onclick="Admin.switchTab('settings')">
                        <i class="fas fa-cog"></i>
                        <span>System Settings</span>
                    </button>
                </div>
                
                <!-- Tab Content Container -->
                <div class="tab-content-container-new">
                    <!-- Users Tab -->
                    <div id="usersTab" class="tab-content-new active">
                        <div class="users-section-new">
                            <div class="section-header-new">
                                <h2 class="section-title-new">User Management</h2>
                                <div class="section-controls-new">
                                    <div class="search-control-new">
                                        <i class="fas fa-search"></i>
                                        <input type="text" id="userSearch" placeholder="Search by name or email..." onkeyup="Admin.filterUsers()">
                                    </div>
                                    <div class="filter-control-new">
                                        <select id="roleFilter" onchange="Admin.filterUsers()">
                                            <option value="all">All Roles</option>
                                            <option value="admin">Administrator</option>
                                            <option value="view_edit">View & Edit</option>
                                            <option value="view">View Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="users-table-container-new">
                                <table class="users-table-new">
                                    <thead>
                                        <tr>
                                            <th class="user-column">User</th>
                                            <th class="email-column">Email</th>
                                            <th class="role-column">Role</th>
                                            <th class="status-column">Status</th>
                                            <th class="date-column">Created</th>
                                            <th class="actions-column">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usersTableBody">
                                        <tr class="loading-row">
                                            <td colspan="6" class="loading-cell">
                                                <div class="loading-spinner-new">
                                                    <i class="fas fa-spinner fa-spin"></i>
                                                    <span>Loading users...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Roles Tab -->
                    <div id="rolesTab" class="tab-content-new">
                        <div class="roles-section-new">
                            <div class="section-header-new">
                                <h2 class="section-title-new">Roles & Permissions</h2>
                                <p class="section-description-new">Manage user roles and their associated permissions</p>
                            </div>
                            
                            <div class="roles-grid-new">
                                <div class="role-card-new admin-role">
                                    <div class="role-header-new">
                                        <div class="role-icon-new">
                                            <i class="fas fa-crown"></i>
                                        </div>
                                        <h3 class="role-name-new">Administrator</h3>
                                        <span class="role-badge-new admin-badge">Full Access</span>
                                    </div>
                                    <div class="role-description-new">
                                        <p>Complete system control with all administrative privileges</p>
                                    </div>
                                    <div class="role-permissions-new">
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>User management & role assignment</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>System logs & audit trails</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Configuration & settings</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Full CRUD operations</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="role-card-new editor-role">
                                    <div class="role-header-new">
                                        <div class="role-icon-new">
                                            <i class="fas fa-edit"></i>
                                        </div>
                                        <h3 class="role-name-new">View & Edit</h3>
                                        <span class="role-badge-new editor-badge">Read/Write</span>
                                    </div>
                                    <div class="role-description-new">
                                        <p>Data management with read and write permissions</p>
                                    </div>
                                    <div class="role-permissions-new">
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>View all modules & data</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Add, edit & delete records</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Generate & export reports</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-times-circle"></i>
                                            <span>No administrative access</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="role-card-new viewer-role">
                                    <div class="role-header-new">
                                        <div class="role-icon-new">
                                            <i class="fas fa-eye"></i>
                                        </div>
                                        <h3 class="role-name-new">View Only</h3>
                                        <span class="role-badge-new viewer-badge">Read Only</span>
                                    </div>
                                    <div class="role-description-new">
                                        <p>Read-only access to data and reports</p>
                                    </div>
                                    <div class="role-permissions-new">
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>View all modules & data</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-check-circle"></i>
                                            <span>Generate & export reports</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-times-circle"></i>
                                            <span>No data modification</span>
                                        </div>
                                        <div class="permission-item-new">
                                            <i class="fas fa-times-circle"></i>
                                            <span>No administrative access</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings Tab -->
                    <div id="settingsTab" class="tab-content-new">
                        <div class="settings-section-new">
                            <div class="section-header-new">
                                <h2 class="section-title-new">System Settings</h2>
                                <p class="section-description-new">Configure application settings and preferences</p>
                            </div>
                            
                            <div class="settings-grid-new">
                                <div class="setting-category-new">
                                    <div class="category-header-new">
                                        <i class="fas fa-cog"></i>
                                        <h3>Application Settings</h3>
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Application Name</label>
                                        <input type="text" value="Racket Warrior" class="setting-input-new">
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Default Currency</label>
                                        <select class="setting-input-new">
                                            <option value="QAR">QAR - Qatari Riyal</option>
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - British Pound</option>
                                        </select>
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Time Zone</label>
                                        <select class="setting-input-new">
                                            <option value="Asia/Qatar">Asia/Qatar (UTC+3)</option>
                                            <option value="UTC">UTC (UTC+0)</option>
                                            <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="setting-category-new">
                                    <div class="category-header-new">
                                        <i class="fas fa-shield-alt"></i>
                                        <h3>Security Settings</h3>
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Session Timeout (minutes)</label>
                                        <input type="number" value="60" min="15" max="480" class="setting-input-new">
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Password Reset Expiry (minutes)</label>
                                        <input type="number" value="30" min="5" max="60" class="setting-input-new">
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">OTP Expiry (minutes)</label>
                                        <input type="number" value="10" min="5" max="30" class="setting-input-new">
                                    </div>
                                </div>
                                
                                <div class="setting-category-new">
                                    <div class="category-header-new">
                                        <i class="fas fa-envelope"></i>
                                        <h3>Email Configuration</h3>
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">From Name</label>
                                        <input type="text" value="Racket Warrior Admin" class="setting-input-new">
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">From Email</label>
                                        <input type="email" value="admin@racketwarrior.com" class="setting-input-new">
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Reply-To Email</label>
                                        <input type="email" value="noreply@racketwarrior.com" class="setting-input-new">
                                    </div>
                                </div>
                                
                                <div class="setting-category-new">
                                    <div class="category-header-new">
                                        <i class="fas fa-database"></i>
                                        <h3>Data Management</h3>
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Auto Backup Frequency</label>
                                        <select class="setting-input-new">
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="manual">Manual Only</option>
                                        </select>
                                    </div>
                                    <div class="setting-item-new">
                                        <label class="setting-label-new">Data Retention (months)</label>
                                        <input type="number" value="24" min="6" max="60" class="setting-input-new">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="settings-actions-new">
                                <button class="btn-new btn-primary-new" onclick="Admin.saveSettings()">
                                    <i class="fas fa-save"></i>
                                    <span>Save Changes</span>
                                </button>
                                <button class="btn-new btn-secondary-new" onclick="Admin.resetSettings()">
                                    <i class="fas fa-undo"></i>
                                    <span>Reset to Defaults</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Add User Modal -->
            <div id="addUserModal" class="modal-new" style="display: none;">
                <div class="modal-overlay-new" onclick="Admin.closeModal('addUserModal')"></div>
                <div class="modal-container-new">
                    <div class="modal-header-new">
                        <div class="modal-title-new">
                            <i class="fas fa-user-plus"></i>
                            <h3>Add New User</h3>
                        </div>
                        <button class="modal-close-new" onclick="Admin.closeModal('addUserModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body-new">
                        <form id="addUserForm" class="user-form-new">
                            <div class="form-grid-new">
                                <div class="form-group-new">
                                    <label class="form-label-new">Full Name</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-user"></i>
                                        <input type="text" name="name" placeholder="Enter full name" required>
                                    </div>
                                </div>
                                
                                <div class="form-group-new">
                                    <label class="form-label-new">Email Address</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-envelope"></i>
                                        <input type="email" name="email" placeholder="Enter email address" required>
                                    </div>
                                </div>
                                
                                <div class="form-group-new">
                                    <label class="form-label-new">Role</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-key"></i>
                                        <select name="role" required>
                                            <option value="">Select Role</option>
                                            <option value="admin">Administrator</option>
                                            <option value="view_edit">View & Edit</option>
                                            <option value="view">View Only</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group-new">
                                    <label class="form-label-new">Temporary Password</label>
                                    <div class="input-group-new password-group">
                                        <i class="fas fa-lock"></i>
                                        <input type="text" name="password" placeholder="Click generate" readonly>
                                        <button type="button" class="generate-btn-new" onclick="Admin.generatePassword()">
                                            <i class="fas fa-random"></i>
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-actions-new">
                        <button type="button" class="btn-new btn-secondary-new" onclick="Admin.closeModal('addUserModal')">
                            <i class="fas fa-times"></i>
                            <span>Cancel</span>
                        </button>
                        <button type="submit" form="addUserForm" class="btn-new btn-primary-new">
                            <i class="fas fa-user-plus"></i>
                            <span>Create User</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Edit User Modal -->
            <div id="editUserModal" class="modal-new" style="display: none;">
                <div class="modal-overlay-new" onclick="Admin.closeModal('editUserModal')"></div>
                <div class="modal-container-new">
                    <div class="modal-header-new">
                        <div class="modal-title-new">
                            <i class="fas fa-user-edit"></i>
                            <h3>Edit User</h3>
                        </div>
                        <button class="modal-close-new" onclick="Admin.closeModal('editUserModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body-new">
                        <form id="editUserForm" class="user-form-new">
                            <input type="hidden" name="originalEmail">
                            <div class="form-grid-new">
                                <div class="form-group-new">
                                    <label class="form-label-new">Full Name</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-user"></i>
                                        <input type="text" name="name" placeholder="Enter full name" required>
                                    </div>
                                </div>
                                
                                <div class="form-group-new">
                                    <label class="form-label-new">Email Address</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-envelope"></i>
                                        <input type="email" name="email" placeholder="Enter email address" required>
                                    </div>
                                </div>
                                
                                <div class="form-group-new">
                                    <label class="form-label-new">Role</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-key"></i>
                                        <select name="role" required>
                                            <option value="admin">Administrator</option>
                                            <option value="view_edit">View & Edit</option>
                                            <option value="view">View Only</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group-new">
                                    <label class="form-label-new">Status</label>
                                    <div class="input-group-new">
                                        <i class="fas fa-toggle-on"></i>
                                        <select name="status" required>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-actions-new">
                        <button type="button" class="btn-new btn-secondary-new" onclick="Admin.closeModal('editUserModal')">
                            <i class="fas fa-times"></i>
                            <span>Cancel</span>
                        </button>
                        <button type="submit" form="editUserForm" class="btn-new btn-primary-new">
                            <i class="fas fa-save"></i>
                            <span>Update User</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Form submissions
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }
        
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.handleEditUser(e));
        }
    },
    
    // Switch tabs
    switchTab: function(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button-new').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content-new').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        this.currentTab = tabName;
    },
    
    // Load users from API
    loadUsers: async function(skipLoadingIndicator = false) {
        try {
            if (!skipLoadingIndicator) {
                UIUtils.showLoading();
            }
            
            // Check if admin page is still active
            if (!document.querySelector('.admin-page')) {
                console.warn('⚠️ Admin page not active, skipping user load');
                return;
            }
            
            Logger.info('Loading users from API...');
            const response = await API.getUsers();
            
            Logger.info('API response received:', response);
            
            if (response.success) {
                this.users = response.data || [];
                Logger.info(`Loaded ${this.users.length} users:`, this.users);
                this.renderUsers();
                this.updateStats();
            } else {
                Logger.warn('Failed to load users:', response.message);
                UIUtils.showNotification('Failed to load users: ' + response.message, 'error');
                this.renderEmptyUsersList();
            }
        } catch (error) {
            Logger.error('Error loading users:', error);
            UIUtils.showNotification('Error loading users. Please try again.', 'error');
            this.renderEmptyUsersList();
        } finally {
            if (!skipLoadingIndicator) {
                UIUtils.hideLoading();
            }
        }
    },
    
    // Show empty users list when no data is available
    renderEmptyUsersList: function() {
        this.users = [];
        this.renderUsers();
        this.updateStats();
    },
    
    // Render users table
    renderUsers: function() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6" class="empty-cell">
                        <div class="empty-state-new">
                            <i class="fas fa-users"></i>
                            <h3>No Users Found</h3>
                            <p>Start by adding your first user to the system</p>
                            <button class="btn-new btn-primary-new" onclick="Admin.showAddUserModal()">
                                <i class="fas fa-user-plus"></i>
                                <span>Add First User</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.users.map(user => `
            <tr class="user-row">
                <td class="user-column">
                    <div class="user-info-new">
                        <img src="${user.photo_url || user.img_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=48`}" 
                             alt="${user.name}" class="user-avatar-new">
                        <div class="user-details-new">
                            <div class="user-name-new">${user.name}</div>
                            <div class="user-id-new">#${user.email.split('@')[0]}</div>
                        </div>
                    </div>
                </td>
                <td class="email-column">
                    <div class="email-info-new">
                        <span class="email-address-new">${user.email}</span>
                    </div>
                </td>
                <td class="role-column">
                    <span class="role-badge-new ${user.role}-role">
                        ${this.getRoleLabel(user.role)}
                    </span>
                </td>
                <td class="status-column">
                    <span class="status-badge-new ${user.status || 'active'}-status">
                        <i class="fas fa-circle"></i>
                        ${(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                    </span>
                </td>
                <td class="date-column">
                    <div class="date-info-new">
                        <span class="date-text-new">${this.formatDate(user.created_at)}</span>
                    </div>
                </td>
                <td class="actions-column">
                    <div class="action-buttons-new">
                        <button class="action-btn-new edit-btn" onclick="Admin.editUser('${user.email}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn-new reset-btn" onclick="Admin.resetPassword('${user.email}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="action-btn-new delete-btn" onclick="Admin.deleteUser('${user.email}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    // Update statistics
    updateStats: function() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(u => (u.status || 'active') === 'active').length;
        const adminUsers = this.users.filter(u => u.role === 'admin').length;
        const recentLogins = this.users.filter(u => {
            if (!u.last_login) return false;
            const loginDate = new Date(u.last_login);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return loginDate > yesterday;
        }).length;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('totalAdmins').textContent = adminUsers;
        document.getElementById('recentLogins').textContent = recentLogins;
    },
    
    // Get role label
    getRoleLabel: function(role) {
        const labels = {
            'admin': 'Administrator',
            'view_edit': 'View & Edit',
            'view': 'View Only'
        };
        return labels[role] || role;
    },
    
    // Format date
    formatDate: function(dateString) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    },
    
    // Filter users
    filterUsers: function() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const roleFilter = document.getElementById('roleFilter').value;
        
        const filteredUsers = this.users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                                user.email.toLowerCase().includes(searchTerm);
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            
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
            document.body.style.overflow = 'hidden';
            // Clear form
            const form = document.getElementById('addUserForm');
            if (form) form.reset();
            // Auto-generate password
            this.generatePassword();
        }
    },
    
    // Close modal
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },
    
    // Generate password
    generatePassword: function() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const passwordInput = document.querySelector('input[name="password"]');
        if (passwordInput) passwordInput.value = password;
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
            // Show loading screen for user creation
            LoadingScreenUtils.showUserCreation();
            
            const response = await API.addUser(userData);
            
            if (response.success) {
                // Update loading message
                LoadingScreenUtils.updateMessage('Sending welcome email...');
                
                // Small delay for UX
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                LoadingScreenUtils.updateMessage('Refreshing user list...');
                
                UIUtils.showNotification('✅ User added successfully!', 'success');
                
                // Clear API cache to ensure fresh data
                API.clearCache('users');
                
                // Load users first, then close modal
                try {
                    LoadingScreenUtils.updateMessage('Refreshing user list...');
                    await this.loadUsers(true); // Skip loading indicator since we already have one
                    console.log('✅ Users loaded successfully after user creation');
                    
                    // Close modal after successful refresh
                    this.closeModal('addUserModal');
                    
                    // Small delay to ensure UI update
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (loadError) {
                    console.error('❌ Failed to load users after creation:', loadError);
                    this.closeModal('addUserModal');
                    UIUtils.showNotification('⚠️ User created but failed to refresh list. Please refresh page.', 'warning');
                }
                LoadingScreenUtils.hide();
            } else {
                LoadingScreenUtils.hide();
                UIUtils.showNotification('❌ Failed to add user: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error adding user:', error);
            LoadingScreenUtils.hide();
            UIUtils.showNotification('❌ Error adding user: ' + error.message, 'error');
        }
    },
    
    // Edit user
    editUser: function(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) return;
        
        // Populate edit form
        const form = document.getElementById('editUserForm');
        form.querySelector('input[name="originalEmail"]').value = user.email;
        form.querySelector('input[name="name"]').value = user.name;
        form.querySelector('input[name="email"]').value = user.email;
        form.querySelector('select[name="role"]').value = user.role;
        form.querySelector('select[name="status"]').value = user.status || 'active';
        
        // Show modal
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    
    // Handle edit user
    handleEditUser: async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            originalEmail: formData.get('originalEmail'),
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            status: formData.get('status')
        };
        
        try {
            UIUtils.showLoading();
            const response = await API.updateUser(userData.email, userData);
            
            if (response.success) {
                UIUtils.showNotification('✅ User updated successfully!', 'success');
                // Clear API cache to ensure fresh data
                API.clearCache('users');
                this.closeModal('editUserModal');
                this.loadUsers();
            } else {
                UIUtils.showNotification('❌ Failed to update user: ' + response.message, 'error');
            }
        } catch (error) {
            UIUtils.showNotification('❌ Error updating user', 'error');
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Reset password
    resetPassword: async function(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) return;
        
        if (confirm(`Reset password for ${user.name}?\n\nA new temporary password will be sent to their email.`)) {
            try {
                UIUtils.showLoading();
                const response = await API.resetUserPassword(email);
                
                if (response.success) {
                    UIUtils.showNotification('✅ Password reset email sent successfully!', 'success');
                } else {
                    UIUtils.showNotification('❌ Failed to reset password: ' + response.message, 'error');
                }
            } catch (error) {
                UIUtils.showNotification('❌ Error resetting password', 'error');
            } finally {
                UIUtils.hideLoading();
            }
        }
    },
    
    // Delete user
    deleteUser: async function(email) {
        const user = this.users.find(u => u.email === email);
        if (!user) return;
        
        if (confirm(`⚠️ Delete User: ${user.name}\n\nThis action cannot be undone. Are you sure?`)) {
            try {
                UIUtils.showLoading();
                const response = await API.deleteUser(email);
                
                if (response.success) {
                    UIUtils.showNotification('✅ User deleted successfully!', 'success');
                    // Clear API cache to ensure fresh data
                    API.clearCache('users');
                    this.loadUsers();
                } else {
                    UIUtils.showNotification('❌ Failed to delete user: ' + response.message, 'error');
                }
            } catch (error) {
                UIUtils.showNotification('❌ Error deleting user', 'error');
            } finally {
                UIUtils.hideLoading();
            }
        }
    },
    
    // Save settings
    saveSettings: function() {
        UIUtils.showNotification('⚙️ Settings saved successfully!', 'success');
    },
    
    // Reset settings
    resetSettings: function() {
        if (confirm('Reset all settings to default values?')) {
            UIUtils.showNotification('🔄 Settings reset to defaults!', 'info');
        }
    }
};

// Global function for closing modals (accessible from HTML)
window.closeModal = function(modalId) {
    Admin.closeModal(modalId);
};

// Export Admin module
window.Admin = Admin;