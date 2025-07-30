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
                
                <form id="addPlayerForm" class="unified-form">
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
                            <div class="input-wrapper">
                                <i class="fas fa-toggle-on"></i>
                                <select id="playerStatus" name="status" required>
                                    <option value="">Select Status</option>
                                    <option value="active">🟢 Active</option>
                                    <option value="inactive">🔴 Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-unified btn-unified-secondary" onclick="showPage('players-view')">
                            <i class="fas fa-arrow-left"></i>
                            Back to Players
                        </button>
                        <button type="submit" class="btn-unified btn-unified-primary">
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
                        <button class="btn-unified btn-unified-primary" onclick="showPage('players-add')">
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
                        <button id="refreshPlayers" class="btn-unified btn-unified-secondary">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>
                
                <div class="unified-table-container" id="playersTableContainer">
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
        
        // Listen for global month changes
        window.addEventListener('monthFilterChanged', (event) => {
            const globalMonth = event.detail;
            if (monthFilter && monthFilter.value !== globalMonth) {
                monthFilter.value = globalMonth || '';
                this.currentMonth = globalMonth;
                this.filterAndRenderTable();
            }
        });
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
        
        // Get form values directly from inputs
        const nameInput = document.getElementById('playerName');
        const phoneInput = document.getElementById('playerPhone');
        const emailInput = document.getElementById('playerEmail');
        const joinDateInput = document.getElementById('playerJoinDate');
        const statusInput = document.getElementById('playerStatus');
        
        const playerData = {
            name: nameInput ? nameInput.value.trim() : '', // Fixed: lowercase for backend
            phone: phoneInput ? phoneInput.value.trim() : '', // Fixed: lowercase for backend
            email: emailInput ? emailInput.value.trim() || '' : '', // Fixed: lowercase for backend
            status: statusInput ? statusInput.value : '', // Fixed: lowercase for backend
            joinDate: joinDateInput ? joinDateInput.value : '',
            token: StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN) // Added missing token
        };
        
        // Manual validation with better error messages
        if (!playerData.name || playerData.name.trim() === '') {
            UIUtils.showNotification('Player name is required', 'error');
            return;
        }
        
        if (!playerData.phone || playerData.phone.trim() === '') {
            UIUtils.showNotification('Phone number is required', 'error');
            return;
        }
        
        if (!playerData.joinDate) {
            UIUtils.showNotification('Join date is required', 'error');
            return;
        }
        
        if (!playerData.status) {
            UIUtils.showNotification('Status is required', 'error');
            return;
        }
        
        // Validate email if provided
        if (playerData.email && !ValidationUtils.isValidEmail(playerData.email)) {
            UIUtils.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Validate phone
        if (!ValidationUtils.isValidPhone(playerData.phone)) {
            UIUtils.showNotification('Please enter a valid phone number', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Saving...');
        
        try {
            const response = await API.addPlayer(playerData);
            
            if (response.success) {
                UIUtils.showNotification('Player added successfully!', 'success');
                
                // Clear API cache to ensure fresh data
                API.clearCache('players');
                API.clearCache('dashboard');
                
                // Log the action
                await API.addLog('PLAYER_ADD', `Added new player: ${playerData.name}`);
                
                // Reset form
                event.target.reset();
                document.getElementById('playerJoinDate').value = DateUtils.getCurrentDate();
                
                // Force refresh players data when navigating to view
                this.currentData = null;
                
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
                await this.setupMonthFilter();
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
    setupMonthFilter: async function() {
        try {
            const availableMonths = await DateUtils.setupAvailableMonthsFilter('playersMonthFilter', {
                allTimeLabel: 'All Months'
            });
            
            console.log('📅 Players month filter setup complete with', availableMonths.length, 'months');
        } catch (error) {
            console.error('📅 Failed to setup players month filter:', error);
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
        
        // Apply month filter - show only players who have activity in selected month
        const monthFilter = document.getElementById('playersMonthFilter')?.value;
        if (monthFilter && monthFilter !== 'all') {
            console.log('🔍 Filtering players for month:', monthFilter);
            
            filteredData = filteredData.filter(player => {
                if (player.MonthlyStatus) {
                    try {
                        const monthlyStatus = JSON.parse(player.MonthlyStatus);
                        // Check if player has any activity (active or inactive) in this month
                        const hasActivityInMonth = monthlyStatus.hasOwnProperty(monthFilter);
                        console.log(`👤 Player ${player.Name}: Month ${monthFilter} activity:`, hasActivityInMonth, monthlyStatus[monthFilter]);
                        return hasActivityInMonth;
                    } catch (e) {
                        console.warn('👤 Failed to parse MonthlyStatus for player:', player.Name, e);
                        return false;
                    }
                }
                console.log(`👤 Player ${player.Name}: No MonthlyStatus data`);
                return false;
            });
            
            console.log(`🔍 Filtered to ${filteredData.length} players for month ${monthFilter}`);
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
                                ${this.getMonthlyStatusHTML(player)}
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
                    <label for="editPlayerStatus">Overall Status <span class="required">*</span></label>
                    <select id="editPlayerStatus" name="status" required>
                        <option value="active" ${player.Status === 'active' ? 'selected' : ''}>🟢 Active</option>
                        <option value="inactive" ${player.Status === 'inactive' ? 'selected' : ''}>🔴 Inactive</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Monthly Status Management</label>
                    <div class="monthly-status-manager">
                        ${this.getMonthlyStatusManagerHTML(player)}
                    </div>
                    <small class="form-help">Set active/inactive status for specific months</small>
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
    
    // Get monthly status HTML for current month
    getMonthlyStatusHTML: function(player) {
        const currentMonth = document.getElementById('playersMonthFilter')?.value;
        if (!currentMonth) return '';
        
        let monthlyStatus = {};
        if (player.MonthlyStatus) {
            try {
                monthlyStatus = JSON.parse(player.MonthlyStatus);
            } catch (e) {
                monthlyStatus = {};
            }
        }
        
        const isActiveThisMonth = monthlyStatus[currentMonth] === 'active';
        const user = Auth.getCurrentUser();
        const canEdit = user && PermissionUtils.canPerformAction(user.role, 'edit');
        
        if (!canEdit) return '';
        
        return `
            <div class="monthly-status-control">
                <small>${currentMonth}:</small>
                <button class="btn btn-xs monthly-status-btn ${isActiveThisMonth ? 'active' : 'inactive'}" 
                        onclick="Players.toggleMonthlyStatus('${player.ID}', '${currentMonth}', ${!isActiveThisMonth})"
                        title="Toggle status for ${currentMonth}">
                    ${isActiveThisMonth ? '✅' : '❌'}
                </button>
            </div>
        `;
    },

    // Toggle monthly status for a player
    toggleMonthlyStatus: async function(playerId, month, makeActive) {
        try {
            const status = makeActive ? 'active' : 'inactive';
            const response = await API.updatePlayerMonthlyStatus(playerId, month, status);
            
            if (response.success) {
                UIUtils.showNotification(`Player status updated for ${month}`, 'success');
                // Refresh the current data
                this.loadPlayersData();
            } else {
                UIUtils.showNotification(response.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            Logger.error('Error updating monthly status', error);
            UIUtils.showNotification('Error updating player status', 'error');
        }
    },

    // Get monthly status manager HTML for edit modal - CONTEXT-AWARE (only selected month)
    getMonthlyStatusManagerHTML: function(player) {
        let monthlyStatus = {};
        if (player.MonthlyStatus) {
            try {
                monthlyStatus = JSON.parse(player.MonthlyStatus);
            } catch (e) {
                monthlyStatus = {};
            }
        }
        
        // Get the currently selected month from the page filter
        const selectedMonth = document.getElementById('playersMonthFilter')?.value;
        
        // If no specific month is selected, show current month only
        const targetMonth = selectedMonth || DateUtils.getMonthKey(new Date());
        
        console.log('🗓️ Monthly status edit for month:', targetMonth);
        
        // Create single month object for the selected month
        const targetDate = targetMonth === DateUtils.getMonthKey(new Date()) ? 
            new Date() : 
            new Date(targetMonth + '-01');
            
        const month = {
            key: targetMonth,
            name: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            isCurrent: targetMonth === DateUtils.getMonthKey(new Date())
        };
        
        const months = [month]; // Only one month to edit
        
        const month = months[0]; // Single month
        const status = monthlyStatus[month.key]; // 'active', 'inactive', or undefined
        
        return `
            <div class="monthly-status-manager-container single-month">
                <div class="month-info">
                    <h4>
                        <i class="fas fa-calendar-alt"></i>
                        Status for ${month.name}
                        ${month.isCurrent ? '<span class="current-badge">Current Month</span>' : ''}
                    </h4>
                    <p class="month-description">Set the player's participation status for this month</p>
                </div>
                
                <div class="single-month-status">
                    <div class="status-options-inline">
                        <label class="status-option-inline ${status === 'active' ? 'selected' : ''}">
                            <input type="radio" 
                                   name="status_${player.ID}_${month.key}" 
                                   value="active" 
                                   ${status === 'active' ? 'checked' : ''}
                                   onchange="Players.updateTempMonthlyStatus('${player.ID}', '${month.key}', 'active')">
                            <span class="radio-custom active"></span>
                            <div class="status-info">
                                <span class="status-label">Active</span>
                                <span class="status-desc">Player is participating this month</span>
                            </div>
                        </label>
                        
                        <label class="status-option-inline ${status === 'inactive' ? 'selected' : ''}">
                            <input type="radio" 
                                   name="status_${player.ID}_${month.key}" 
                                   value="inactive" 
                                   ${status === 'inactive' ? 'checked' : ''}
                                   onchange="Players.updateTempMonthlyStatus('${player.ID}', '${month.key}', 'inactive')">
                            <span class="radio-custom inactive"></span>
                            <div class="status-info">
                                <span class="status-label">Inactive</span>
                                <span class="status-desc">Player is not participating this month</span>
                            </div>
                        </label>
                        
                        <label class="status-option-inline ${!status ? 'selected' : ''}">
                            <input type="radio" 
                                   name="status_${player.ID}_${month.key}" 
                                   value="" 
                                   ${!status ? 'checked' : ''}
                                   onchange="Players.updateTempMonthlyStatus('${player.ID}', '${month.key}', null)">
                            <span class="radio-custom unset"></span>
                            <div class="status-info">
                                <span class="status-label">No Status</span>
                                <span class="status-desc">Status not set for this month</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="save-info">
                    <small><i class="fas fa-info-circle"></i> Changes are saved immediately when you select a status</small>
                </div>
            </div>
        `;
    },

    // Update temporary monthly status (new improved system)
    updateTempMonthlyStatus: async function(playerId, month, status) {
        try {
            console.log(`🗓️ Updating status for player ${playerId}, month ${month}, status: ${status}`);
            
            // Update immediately with improved API call
            const response = await API.updatePlayerMonthlyStatus(playerId, month, status);
            
            if (response.success) {
                // Update UI to show immediate feedback
                const monthCard = document.querySelector(`[data-month="${month}"]`);
                if (monthCard) {
                    // Update visual state
                    const statusOptions = monthCard.querySelectorAll('.status-option');
                    statusOptions.forEach(option => option.classList.remove('selected'));
                    
                    const activeOption = monthCard.querySelector(`input[value="${status || ''}"]`)?.closest('.status-option');
                    if (activeOption) {
                        activeOption.classList.add('selected');
                    }
                }
                
                // Show success with month name
                const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                UIUtils.showNotification(`✅ ${monthName}: ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status cleared'}`, 'success');
                
                // Refresh the view table if on view tab
                if (this.currentView === 'view') {
                    this.loadPlayers();
                }
            } else {
                UIUtils.showNotification(`❌ Failed to update status: ${response.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            Logger.error('Error updating monthly status', error);
            UIUtils.showNotification('❌ Error updating status. Please try again.', 'error');
        }
    },
    
    // Set all months to same status
    setAllMonthsStatus: async function(playerId, status) {
        try {
            console.log(`🗓️ Setting ALL months to ${status} for player ${playerId}`);
            
            const monthCards = document.querySelectorAll('.month-card');
            const months = Array.from(monthCards).map(card => card.dataset.month);
            
            UIUtils.showLoading('Updating all months...');
            
            // Update all months in parallel
            const promises = months.map(month => API.updatePlayerMonthlyStatus(playerId, month, status));
            const responses = await Promise.all(promises);
            
            const successCount = responses.filter(r => r.success).length;
            
            if (successCount === months.length) {
                // Update UI for all months
                monthCards.forEach(card => {
                    const statusOptions = card.querySelectorAll('.status-option');
                    statusOptions.forEach(option => option.classList.remove('selected'));
                    
                    const activeOption = card.querySelector(`input[value="${status}"]`)?.closest('.status-option');
                    if (activeOption) {
                        activeOption.classList.add('selected');
                        activeOption.querySelector('input').checked = true;
                    }
                });
                
                UIUtils.showNotification(`✅ All months set to ${status.charAt(0).toUpperCase() + status.slice(1)}`, 'success');
                
                // Refresh the view table
                if (this.currentView === 'view') {
                    this.loadPlayers();
                }
            } else {
                UIUtils.showNotification(`⚠️ Updated ${successCount}/${months.length} months`, 'warning');
            }
        } catch (error) {
            Logger.error('Error setting all months status', error);
            UIUtils.showNotification('❌ Error updating all months', 'error');
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Clear all status
    clearAllStatus: async function(playerId) {
        try {
            console.log(`🗓️ Clearing ALL status for player ${playerId}`);
            
            const monthCards = document.querySelectorAll('.month-card');
            const months = Array.from(monthCards).map(card => card.dataset.month);
            
            UIUtils.showLoading('Clearing all status...');
            
            // Clear all months in parallel  
            const promises = months.map(month => API.updatePlayerMonthlyStatus(playerId, month, null));
            const responses = await Promise.all(promises);
            
            const successCount = responses.filter(r => r.success).length;
            
            if (successCount === months.length) {
                // Update UI for all months
                monthCards.forEach(card => {
                    const statusOptions = card.querySelectorAll('.status-option');
                    statusOptions.forEach(option => option.classList.remove('selected'));
                    
                    const noStatusOption = card.querySelector(`input[value=""]`)?.closest('.status-option');
                    if (noStatusOption) {
                        noStatusOption.classList.add('selected');
                        noStatusOption.querySelector('input').checked = true;
                    }
                });
                
                UIUtils.showNotification(`✅ All month status cleared`, 'success');
                
                // Refresh the view table
                if (this.currentView === 'view') {
                    this.loadPlayers();
                }
            } else {
                UIUtils.showNotification(`⚠️ Cleared ${successCount}/${months.length} months`, 'warning');
            }
        } catch (error) {
            Logger.error('Error clearing all status', error);
            UIUtils.showNotification('❌ Error clearing all status', 'error');
        } finally {
            UIUtils.hideLoading();
        }
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