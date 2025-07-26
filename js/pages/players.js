// Players Page Module for Racket Warrior

const Players = {
    currentData: [],
    currentMonth: null,
    
    // Render add player form
    renderAddForm: function(container) {
        container.innerHTML = this.getAddFormHTML();
        this.setupAddFormHandlers();
    },
    
    // Render view players table
    renderViewTable: function(container) {
        container.innerHTML = this.getViewTableHTML();
        this.loadPlayersData();
        this.setupViewTableHandlers();
    },
    
    // Get add form HTML
    getAddFormHTML: function() {
        return `
            <div class="add-player-page">
                <div class="page-header">
                    <h1><i class="fas fa-user-plus"></i> Add New Player</h1>
                    <p>Add a new player to the badminton group</p>
                </div>
                
                <form id="addPlayerForm" class="form-container">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="playerName">Full Name <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-user"></i>
                                <input type="text" id="playerName" name="name" required placeholder="Enter player's full name">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="playerPhone">Phone Number <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-phone"></i>
                                <input type="tel" id="playerPhone" name="phone" required placeholder="Enter phone number">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="playerEmail">Email Address</label>
                            <div class="input-wrapper">
                                <i class="fas fa-envelope"></i>
                                <input type="email" id="playerEmail" name="email" placeholder="Enter email address (optional)">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="playerJoinDate">Join Date <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-calendar"></i>
                                <input type="date" id="playerJoinDate" name="joinDate" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="playerStatus">Status <span class="required">*</span></label>
                            <select id="playerStatus" name="status" required>
                                <option value="">Select Status</option>
                                <option value="active">🟢 Active</option>
                                <option value="inactive">🔴 Inactive</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="showPage('players-view')">
                            <i class="fas fa-arrow-left"></i>
                            Back to Players
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Save Player
                        </button>
                    </div>
                </form>
            </div>
        `;
    },
    
    // Get view table HTML
    getViewTableHTML: function() {
        return `
            <div class="view-players-page">
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-users"></i> Players</h1>
                        <p>Manage badminton group players</p>
                    </div>
                    <div class="header-actions" data-role="admin,view_edit">
                        <button class="btn btn-primary" onclick="showPage('players-add')">
                            <i class="fas fa-user-plus"></i>
                            Add Player
                        </button>
                    </div>
                </div>
                
                <div class="filters-section">
                    <div class="filter-group">
                        <div class="filter-item">
                            <label for="playersSearch">Search Players:</label>
                            <input type="text" id="playersSearch" placeholder="Search by name, phone, or email...">
                        </div>
                        <div class="filter-item">
                            <label for="playersMonthFilter">Month:</label>
                            <select id="playersMonthFilter">
                                <option value="">All Months</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label for="playersStatusFilter">Status:</label>
                            <select id="playersStatusFilter">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <button id="refreshPlayers" class="btn btn-secondary">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>
                
                <div class="table-container" id="playersTableContainer">
                    <div class="loading-placeholder">Loading players...</div>
                </div>
            </div>
        `;
    },
    
    // Setup add form handlers
    setupAddFormHandlers: function() {
        // Set default date to today
        const joinDateInput = document.getElementById('playerJoinDate');
        if (joinDateInput) {
            joinDateInput.value = DateUtils.getCurrentDate();
        }
        
        // Setup form submission
        const form = document.getElementById('addPlayerForm');
        if (form) {
            form.addEventListener('submit', this.handleAddPlayer.bind(this));
        }
        
        // Setup role-based visibility
        this.setupRoleBasedVisibility();
    },
    
    // Setup view table handlers
    setupViewTableHandlers: function() {
        // Setup search
        const searchInput = document.getElementById('playersSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterAndRenderTable();
            }, 300));
        }
        
        // Setup month filter
        const monthFilter = document.getElementById('playersMonthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => {
                this.currentMonth = monthFilter.value || null;
                this.filterAndRenderTable();
            });
        }
        
        // Setup status filter
        const statusFilter = document.getElementById('playersStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterAndRenderTable();
            });
        }
        
        // Setup refresh button
        const refreshButton = document.getElementById('refreshPlayers');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadPlayersData();
                UIUtils.showNotification('Players data refreshed', 'success');
            });
        }
        
        // Setup role-based visibility
        this.setupRoleBasedVisibility();
    },
    
    // Setup role-based visibility
    setupRoleBasedVisibility: function() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        
        const elementsWithRole = document.querySelectorAll('[data-role]');
        elementsWithRole.forEach(element => {
            const allowedRoles = element.getAttribute('data-role').split(',');
            const hasAccess = allowedRoles.includes(user.role);
            element.style.display = hasAccess ? '' : 'none';
        });
    },
    
    // Handle add player form submission
    handleAddPlayer: async function(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const playerData = {
            Name: formData.get('name'),
            Phone: formData.get('phone'),
            Email: formData.get('email') || '',
            JoinDate: formData.get('joinDate'),
            Status: formData.get('status'),
            CreatedAt: new Date().toISOString(),
            MonthlyStatus: JSON.stringify({
                [DateUtils.getMonthYear(new Date())]: formData.get('status') === 'active'
            })
        };
        
        // Validate required fields
        const validation = ValidationUtils.validateRequired({
            Name: playerData.Name,
            Phone: playerData.Phone,
            JoinDate: playerData.JoinDate,
            Status: playerData.Status
        });
        
        if (!validation.isValid) {
            UIUtils.showNotification(validation.errors.join(', '), 'error');
            return;
        }
        
        // Validate email if provided
        if (playerData.Email && !ValidationUtils.isValidEmail(playerData.Email)) {
            UIUtils.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Validate phone
        if (!ValidationUtils.isValidPhone(playerData.Phone)) {
            UIUtils.showNotification('Please enter a valid phone number', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Saving...');
        
        try {
            const response = await API.addPlayer(playerData);
            
            if (response.success) {
                UIUtils.showNotification('Player added successfully!', 'success');
                
                // Log the action
                await API.addLog('PLAYER_ADD', `Added new player: ${playerData.Name}`);
                
                // Reset form
                event.target.reset();
                document.getElementById('playerJoinDate').value = DateUtils.getCurrentDate();
                
                // Redirect to view page
                showPage('players-view');
            } else {
                throw new Error(response.message || 'Failed to add player');
            }
        } catch (error) {
            Logger.error('Failed to add player', error);
            UIUtils.showNotification('Failed to add player. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Load players data
    loadPlayersData: async function() {
        try {
            const response = await API.getPlayers(this.currentMonth);
            
            if (response.success) {
                this.currentData = response.data || [];
                this.setupMonthFilter();
                this.filterAndRenderTable();
            } else {
                throw new Error(response.message || 'Failed to load players');
            }
        } catch (error) {
            Logger.error('Failed to load players data', error);
            UIUtils.showNotification('Failed to load players data', 'error');
            this.renderEmptyState('Error loading players');
        }
    },
    
    // Setup month filter
    setupMonthFilter: function() {
        const monthFilter = document.getElementById('playersMonthFilter');
        if (!monthFilter || !this.currentData) return;
        
        const months = new Set();
        
        this.currentData.forEach(player => {
            if (player.MonthlyStatus) {
                try {
                    const monthlyStatus = JSON.parse(player.MonthlyStatus);
                    Object.keys(monthlyStatus).forEach(month => months.add(month));
                } catch (e) {
                    Logger.warn('Invalid monthly status JSON', player.MonthlyStatus);
                }
            }
            
            // Also add join date month
            if (player.JoinDate) {
                const month = DateUtils.getMonthYear(player.JoinDate);
                months.add(month);
            }
        });
        
        // Preserve current selection
        const currentValue = monthFilter.value;
        
        // Clear and rebuild options
        monthFilter.innerHTML = '<option value="">All Months</option>';
        
        Array.from(months).sort().reverse().forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = DateUtils.parseMonthYear(month);
            monthFilter.appendChild(option);
        });
        
        // Restore selection
        if (currentValue) {
            monthFilter.value = currentValue;
        }
    },
    
    // Filter and render table
    filterAndRenderTable: function() {
        let filteredData = [...this.currentData];
        
        // Apply search filter
        const searchTerm = document.getElementById('playersSearch')?.value.trim();
        if (searchTerm) {
            filteredData = DataUtils.filterBySearch(filteredData, searchTerm, ['Name', 'Phone', 'Email']);
        }
        
        // Apply month filter
        const monthFilter = document.getElementById('playersMonthFilter')?.value;
        if (monthFilter) {
            filteredData = filteredData.filter(player => {
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
        
        // Apply status filter
        const statusFilter = document.getElementById('playersStatusFilter')?.value;
        if (statusFilter) {
            filteredData = filteredData.filter(player => player.Status === statusFilter);
        }
        
        this.renderTable(filteredData);
    },
    
    // Render players table
    renderTable: function(players) {
        const container = document.getElementById('playersTableContainer');
        if (!container) return;
        
        if (!players || players.length === 0) {
            this.renderEmptyState('No players found');
            return;
        }
        
        const user = Auth.getCurrentUser();
        const canEdit = user && PermissionUtils.canPerformAction(user.role, 'edit');
        const canDelete = user && PermissionUtils.canPerformAction(user.role, 'delete');
        
        const tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Join Date</th>
                        ${(canEdit || canDelete) ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${players.map(player => `
                        <tr>
                            <td>${this.escapeHtml(player.Name)}</td>
                            <td>${this.escapeHtml(player.Phone)}</td>
                            <td>${this.escapeHtml(player.Email || 'N/A')}</td>
                            <td>
                                <span class="status-badge status-${player.Status}">
                                    ${player.Status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                                </span>
                            </td>
                            <td>${DateUtils.formatDate(player.JoinDate)}</td>
                            ${(canEdit || canDelete) ? `
                                <td>
                                    <div class="action-buttons">
                                        ${canEdit ? `<button class="btn btn-sm btn-edit" onclick="Players.editPlayer('${player.ID}')"><i class="fas fa-edit"></i></button>` : ''}
                                        ${canDelete ? `<button class="btn btn-sm btn-delete" onclick="Players.deletePlayer('${player.ID}')"><i class="fas fa-trash"></i></button>` : ''}
                                    </div>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        // Apply mobile table adjustments
        App.adjustTablesForMobile();
    },
    
    // Render empty state
    renderEmptyState: function(message = 'No players found') {
        const container = document.getElementById('playersTableContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>${message}</h3>
                <p>Start by adding your first player to the system.</p>
                ${Auth.hasPermission('add') ? `
                    <button class="btn btn-primary" onclick="showPage('players-add')">
                        <i class="fas fa-user-plus"></i>
                        Add First Player
                    </button>
                ` : ''}
            </div>
        `;
    },
    
    // Edit player
    editPlayer: function(playerId) {
        const player = this.currentData.find(p => p.ID === playerId);
        if (!player) {
            UIUtils.showNotification('Player not found', 'error');
            return;
        }
        
        // Create and show edit modal
        const modal = UIUtils.createModal({
            title: '✏️ Edit Player',
            content: this.getEditPlayerModalContent(player),
            showCloseButton: true
        });
        
        this.setupEditPlayerHandlers(playerId);
    },
    
    // Get edit player modal content
    getEditPlayerModalContent: function(player) {
        return `
            <form id="editPlayerForm">
                <div class="form-group">
                    <label for="editPlayerName">Full Name <span class="required">*</span></label>
                    <div class="input-wrapper">
                        <i class="fas fa-user"></i>
                        <input type="text" id="editPlayerName" name="name" required value="${this.escapeHtml(player.Name)}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editPlayerPhone">Phone Number <span class="required">*</span></label>
                    <div class="input-wrapper">
                        <i class="fas fa-phone"></i>
                        <input type="tel" id="editPlayerPhone" name="phone" required value="${this.escapeHtml(player.Phone)}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editPlayerEmail">Email Address</label>
                    <div class="input-wrapper">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="editPlayerEmail" name="email" value="${this.escapeHtml(player.Email || '')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editPlayerJoinDate">Join Date <span class="required">*</span></label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar"></i>
                        <input type="date" id="editPlayerJoinDate" name="joinDate" required value="${DateUtils.formatDate(player.JoinDate, 'YYYY-MM-DD')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editPlayerStatus">Status <span class="required">*</span></label>
                    <select id="editPlayerStatus" name="status" required>
                        <option value="active" ${player.Status === 'active' ? 'selected' : ''}>🟢 Active</option>
                        <option value="inactive" ${player.Status === 'inactive' ? 'selected' : ''}>🔴 Inactive</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Update Player
                    </button>
                </div>
            </form>
        `;
    },
    
    // Setup edit player handlers
    setupEditPlayerHandlers: function(playerId) {
        const form = document.getElementById('editPlayerForm');
        if (form) {
            form.addEventListener('submit', async (event) => {
                await this.handleEditPlayer(event, playerId);
            });
        }
    },
    
    // Handle edit player
    handleEditPlayer: async function(event, playerId) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const playerData = {
            Name: formData.get('name'),
            Phone: formData.get('phone'),
            Email: formData.get('email') || '',
            JoinDate: formData.get('joinDate'),
            Status: formData.get('status')
        };
        
        // Validate required fields
        const validation = ValidationUtils.validateRequired({
            Name: playerData.Name,
            Phone: playerData.Phone,
            JoinDate: playerData.JoinDate,
            Status: playerData.Status
        });
        
        if (!validation.isValid) {
            UIUtils.showNotification(validation.errors.join(', '), 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Updating...');
        
        try {
            const response = await API.updatePlayer(playerId, playerData);
            
            if (response.success) {
                UIUtils.showNotification('Player updated successfully!', 'success');
                
                // Log the action
                await API.addLog('PLAYER_UPDATE', `Updated player: ${playerData.Name}`);
                
                // Close modal
                event.target.closest('.modal').remove();
                
                // Refresh data
                this.loadPlayersData();
            } else {
                throw new Error(response.message || 'Failed to update player');
            }
        } catch (error) {
            Logger.error('Failed to update player', error);
            UIUtils.showNotification('Failed to update player. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Delete player
    deletePlayer: async function(playerId) {
        const player = this.currentData.find(p => p.ID === playerId);
        if (!player) {
            UIUtils.showNotification('Player not found', 'error');
            return;
        }
        
        const confirmed = await UIUtils.confirm(
            `Are you sure you want to delete player "${player.Name}"? This action cannot be undone.`,
            'Delete Player'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await API.deletePlayer(playerId);
            
            if (response.success) {
                UIUtils.showNotification('Player deleted successfully!', 'success');
                
                // Log the action
                await API.addLog('PLAYER_DELETE', `Deleted player: ${player.Name}`);
                
                // Refresh data
                this.loadPlayersData();
            } else {
                throw new Error(response.message || 'Failed to delete player');
            }
        } catch (error) {
            Logger.error('Failed to delete player', error);
            UIUtils.showNotification('Failed to delete player. Please try again.', 'error');
        }
    },
    
    // Utility functions
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export Players module
window.Players = Players;