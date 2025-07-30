// Collection Management Module
const Collection = {
    currentData: [],
    filteredData: [],

    // Render Add Collection Form
    renderAddForm: async function(container) {
        container.innerHTML = `
            <div class="collection-add-page">
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-coins"></i> Add Collection</h1>
                        <p>Record a new payment collection from players</p>
                    </div>
                </div>

                <div class="form-container">
                    <form id="addCollectionForm" class="unified-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="collectionDate">Date <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-calendar"></i>
                                    <input type="date" id="collectionDate" name="date" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="collectionPlayer">Player <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-user"></i>
                                    <select id="collectionPlayer" name="playerId" required>
                                        <option value="">Select Player</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="collectionAmount">Amount (QAR) <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-coins"></i>
                                    <input type="number" id="collectionAmount" name="amount" min="0" step="0.01" placeholder="Enter amount" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="collectionMonth">Month <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-calendar-month"></i>
                                    <select id="collectionMonth" name="month" required>
                                        <option value="">Select Month</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group full-width">
                                <label for="collectionDescription">Description</label>
                                <div class="input-wrapper">
                                    <i class="fas fa-sticky-note"></i>
                                    <input type="text" id="collectionDescription" name="description" placeholder="Optional description">
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-unified btn-unified-secondary" onclick="showPage('collection-view')">
                                <i class="fas fa-arrow-left"></i>
                                Back to Collections
                            </button>
                            <button type="submit" class="btn-unified btn-unified-primary">
                                <i class="fas fa-save"></i>
                                Save Collection
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        await this.init();
    },

    // Render View Collections Table
    renderViewTable: async function(container) {
        container.innerHTML = `
            <div class="collection-view-page">
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-coins"></i> Collections</h1>
                        <p>View and manage all payment collections</p>
                    </div>
                    <div class="header-actions" data-role="admin,view_edit">
                        <button class="btn-unified btn-unified-primary" onclick="showPage('collection-add')">
                            <i class="fas fa-plus"></i>
                            Add Collection
                        </button>
                    </div>
                </div>

                <div class="filters-section">
                    <div class="filter-group">
                        <div class="filter-item">
                            <label for="collectionSearch">Search Collections:</label>
                            <input type="text" id="collectionSearch" placeholder="Search by player, amount, or description...">
                        </div>
                        <div class="filter-item">
                            <label for="collectionMonthFilter">Month:</label>
                            <select id="collectionMonthFilter">
                                <option value="">All Months</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label for="collectionPlayerFilter">Player:</label>
                            <select id="collectionPlayerFilter">
                                <option value="">All Players</option>
                            </select>
                        </div>
                        <button id="refreshCollections" class="btn-unified btn-unified-secondary">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                <div class="unified-table-container">
                    <div id="collectionsTableContainer">
                        <div class="loading-placeholder">Loading collections...</div>
                    </div>
                </div>
            </div>
        `;
        await this.init();
    },

    // Initialize the collection forms and tables
    init: async function() {
        if (document.getElementById('addCollectionForm')) {
            this.initializeAddForm();
        }
        
        if (document.getElementById('collectionsTableContainer')) {
                            await this.initializeViewTable();
        }
    },

    // Initialize Add Form
    initializeAddForm: function() {
        // Set default date to today
        document.getElementById('collectionDate').value = DateUtils.formatDateForInput(new Date());
        
        // Load players for dropdown
        this.loadPlayersForDropdown();
        
        // Initialize month dropdown
        this.initializeMonthDropdown('collectionMonth');
        
        // Setup form submission
        document.getElementById('addCollectionForm').addEventListener('submit', (e) => {
            this.handleAddCollection(e);
        });

        // Reload players when month changes
        document.getElementById('collectionMonth').addEventListener('change', () => {
            this.loadPlayersForDropdown();
        });
        

    },

        // Initialize View Table
    initializeViewTable: async function() {
        await this.setupMonthFilter();
        this.loadCollectionsData();
        
        // Setup event listeners with error handling
        const searchElement = document.getElementById('collectionSearch');
        const monthFilterElement = document.getElementById('collectionMonthFilter');
        const playerFilterElement = document.getElementById('collectionPlayerFilter');
        const refreshElement = document.getElementById('refreshCollections');
        
        if (searchElement) {
            searchElement.addEventListener('input', () => {
                this.filterAndRenderTable();
            });
        }
        
        if (monthFilterElement) {
            monthFilterElement.addEventListener('change', () => {
                this.filterAndRenderTable();
            });
        }
        
        if (playerFilterElement) {
            playerFilterElement.addEventListener('change', () => {
                this.filterAndRenderTable();
            });
        }
        
        if (refreshElement) {
            refreshElement.addEventListener('click', () => {
                this.loadCollectionsData();
            });
        }
    },

    // Load players for dropdown
    loadPlayersForDropdown: async function() {
        try {
            const response = await API.getPlayers();
            const playerSelect = document.getElementById('collectionPlayer');
            const playerFilter = document.getElementById('collectionPlayerFilter');
            
            if (response.success && response.data && Array.isArray(response.data)) {
                // Clear existing options
                if (playerSelect) {
                    playerSelect.innerHTML = '<option value="">Select Player</option>';
                    
                    // Get selected month for filtering
                    const selectedMonth = this.getCurrentSelectedMonth();
                    let activePlayersCount = 0;
                    
                    response.data.forEach(player => {
                        // If no month selected, show all active players
                        // If specific month selected, show only players active for that month
                        const shouldShow = selectedMonth ? 
                            this.isPlayerActiveForMonth(player, selectedMonth) : 
                            player.Status === 'active';
                        
                        if (shouldShow) {
                            const option = document.createElement('option');
                            option.value = player.ID;
                            option.textContent = player.Name;
                            playerSelect.appendChild(option);
                            activePlayersCount++;
                        }
                    });
                    
                    // If no players are active for the selected month, show a clear message
                    if (activePlayersCount === 0 && selectedMonth) {
                        const noPlayersOption = document.createElement('option');
                        noPlayersOption.value = '';
                        noPlayersOption.textContent = 'No players active for selected month';
                        noPlayersOption.disabled = true;
                        playerSelect.appendChild(noPlayersOption);
                    } else if (activePlayersCount === 0) {
                        const noPlayersOption = document.createElement('option');
                        noPlayersOption.value = '';
                        noPlayersOption.textContent = 'No active players found';
                        noPlayersOption.disabled = true;
                        playerSelect.appendChild(noPlayersOption);
                    }
                }
                
                // Update filter dropdown (show all players for filtering)
                if (playerFilter) {
                    const currentValue = playerFilter.value;
                    playerFilter.innerHTML = '<option value="">All Players</option>';
                    response.data.forEach(player => {
                        const option = document.createElement('option');
                        option.value = player.ID;
                        option.textContent = player.Name;
                        playerFilter.appendChild(option);
                    });
                    playerFilter.value = currentValue;
                }
            } else {
                UIUtils.showNotification('No players found', 'warning');
            }
        } catch (error) {
            Logger.error('Error loading players:', error);
            UIUtils.showNotification('Error loading players. Please try again.', 'error');
        }
    },

    // Initialize month dropdown
    initializeMonthDropdown: function(elementId) {
        const monthSelect = document.getElementById(elementId);
        if (!monthSelect) return;

        const currentDate = new Date();
        const currentMonth = DateUtils.getMonthKey(currentDate);
        
        // Generate last 12 months + next 3 months
        const months = DateUtils.generateMonthOptions();
        
        monthSelect.innerHTML = '<option value="">Select Month</option>';
        
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.label;
            monthSelect.appendChild(option);
        });
        
        // Set current month as default
        monthSelect.value = currentMonth;
    },

    // Setup month filter for view table
    setupMonthFilter: async function() {
        try {
            const availableMonths = await DateUtils.setupAvailableMonthsFilter('collectionMonthFilter', {
                allTimeLabel: 'All Months'
            });
            
            console.log('📅 Collection month filter setup complete with', availableMonths.length, 'months');
        } catch (error) {
            console.error('📅 Failed to setup collection month filter:', error);
        }
    },

    // Handle Add Collection Form Submission
    handleAddCollection: async function(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const collectionData = {
            date: formData.get('date'),
            playerId: formData.get('playerId'),
            amount: parseFloat(formData.get('amount')),
            month: formData.get('month'),
            description: formData.get('description') || '',
            token: StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN)
        };
        
        // Validation
        if (!collectionData.date || !collectionData.playerId || !collectionData.amount || !collectionData.month) {
            UIUtils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (collectionData.amount <= 0) {
            UIUtils.showNotification('Amount must be greater than 0', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Adding...');
        
        try {
            const response = await API.addIncome(collectionData);
            
            if (response.success) {
                UIUtils.showNotification('Collection added successfully!', 'success');
                event.target.reset();
                document.getElementById('collectionDate').value = DateUtils.formatDateForInput(new Date());
                
                // Re-select current month
                const currentMonth = DateUtils.getMonthKey(new Date());
                document.getElementById('collectionMonth').value = currentMonth;
                
                await API.addLog('ADD_COLLECTION', `Added collection: ${CurrencyUtils.format(collectionData.amount)} from player ${collectionData.playerId}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to add collection', 'error');
            }
        } catch (error) {
            Logger.error('Error adding collection:', error);
            UIUtils.showNotification('Error adding collection. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },

    // Load collections data
    loadCollectionsData: async function() {
        const container = document.getElementById('collectionsTableContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-placeholder">Loading collections...</div>';
        
        try {
            const response = await API.getIncome();
            
            if (response.success && response.data) {
                this.currentData = response.data;
                this.filterAndRenderTable();
                this.loadPlayersForDropdown(); // Update player filter
            } else {
                this.renderEmptyState('Failed to load collections');
            }
        } catch (error) {
            Logger.error('Error loading collections:', error);
            this.renderEmptyState('Error loading collections');
        }
    },

    // Filter and render table
    filterAndRenderTable: function() {
        const searchTerm = document.getElementById('collectionSearch')?.value.toLowerCase() || '';
        const monthFilter = document.getElementById('collectionMonthFilter')?.value || '';
        const playerFilter = document.getElementById('collectionPlayerFilter')?.value || '';
        
        this.filteredData = this.currentData.filter(collection => {
            const matchesSearch = !searchTerm || 
                collection.PlayerName?.toLowerCase().includes(searchTerm) ||
                collection.Description?.toLowerCase().includes(searchTerm) ||
                collection.Amount?.toString().includes(searchTerm);
            
            const matchesMonth = !monthFilter || collection.Month === monthFilter;
            const matchesPlayer = !playerFilter || collection.PlayerId === playerFilter;
            
            return matchesSearch && matchesMonth && matchesPlayer;
        });
        this.renderTable(this.filteredData);
    },

    // Render table
    renderTable: function(collections) {
        const container = document.getElementById('collectionsTableContainer');
        if (!container) return;
        
        if (!collections || collections.length === 0) {
            this.renderEmptyState('No collections found');
            return;
        }
        
        const user = Auth.getCurrentUser();
        const canEdit = user && PermissionUtils.canPerformAction(user.role, 'edit');
        const canDelete = user && PermissionUtils.canPerformAction(user.role, 'delete');
        
        const tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Player</th>
                        <th>Amount</th>
                        <th>Month</th>
                        <th>Description</th>
                        ${(canEdit || canDelete) ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${collections.map(collection => `
                        <tr>
                            <td data-label="Date">${DateUtils.formatDate(collection.Date)}</td>
                            <td data-label="Player">${this.escapeHtml(collection.PlayerName)}</td>
                            <td data-label="Amount">${CurrencyUtils.format(collection.Amount)}</td>
                            <td data-label="Month">${DateUtils.formatMonth(collection.Month)}</td>
                            <td data-label="Description">${this.escapeHtml(collection.Description || 'N/A')}</td>
                            ${(canEdit || canDelete) ? `
                                <td data-label="Actions">
                                    <div class="action-buttons">
                                        ${canEdit ? `<button class="btn btn-sm btn-edit" onclick="Collection.editCollection('${collection.ID}')"><i class="fas fa-edit"></i></button>` : ''}
                                        ${canDelete ? `<button class="btn btn-sm btn-delete" onclick="Collection.deleteCollection('${collection.ID}')"><i class="fas fa-trash"></i></button>` : ''}
                                    </div>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        App.adjustTablesForMobile();
    },

    // Render empty state
    renderEmptyState: function(message) {
        const container = document.getElementById('collectionsTableContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coins"></i>
                <h3>${message}</h3>
                <p>No collections to display</p>
            </div>
        `;
    },

    // Edit collection
    editCollection: function(collectionId) {
        const collection = this.currentData.find(c => c.ID === collectionId);
        if (!collection) {
            UIUtils.showNotification('Collection not found', 'error');
            return;
        }
        
        const modal = UIUtils.createModal({
            title: 'Edit Collection',
            content: `
                <form id="editCollectionForm">
                    <input type="hidden" id="editCollectionId" value="${collection.ID}">
                    
                    <div class="form-group">
                        <label for="editCollectionDate">Date *</label>
                        <input type="date" id="editCollectionDate" value="${collection.Date}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editCollectionPlayer">Player *</label>
                        <select id="editCollectionPlayer" required>
                            <option value="">Select Player</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editCollectionAmount">Amount (QAR) *</label>
                        <input type="number" id="editCollectionAmount" value="${collection.Amount}" min="0" step="0.01" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editCollectionMonth">Month *</label>
                        <select id="editCollectionMonth" required>
                            <option value="">Select Month</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editCollectionDescription">Description</label>
                        <input type="text" id="editCollectionDescription" value="${collection.Description || ''}" placeholder="Optional description">
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Update Collection</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            `
        });
        
        // Load players and months for edit form
        this.loadPlayersForEditForm(collection.PlayerId);
        this.loadMonthsForEditForm(collection.Month);
        
        // Setup form submission
        document.getElementById('editCollectionForm').addEventListener('submit', (e) => {
            this.handleEditCollection(e);
        });
    },

    // Load players for edit form
    loadPlayersForEditForm: async function(selectedPlayerId) {
        try {
            const response = await API.getPlayers();
            const playerSelect = document.getElementById('editCollectionPlayer');
            
            if (response.success && response.data && playerSelect) {
                playerSelect.innerHTML = '<option value="">Select Player</option>';
                response.data.forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.ID;
                    option.textContent = player.Name;
                    option.selected = player.ID === selectedPlayerId;
                    playerSelect.appendChild(option);
                });
            }
        } catch (error) {
            Logger.error('Error loading players for edit form:', error);
        }
    },

    // Load months for edit form
    loadMonthsForEditForm: function(selectedMonth) {
        const monthSelect = document.getElementById('editCollectionMonth');
        if (!monthSelect) return;
        
        const months = DateUtils.generateMonthOptions();
        monthSelect.innerHTML = '<option value="">Select Month</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.label;
            option.selected = month.value === selectedMonth;
            monthSelect.appendChild(option);
        });
    },

    // Handle edit collection form submission
    handleEditCollection: async function(event) {
        event.preventDefault();
        
        const collectionId = document.getElementById('editCollectionId').value;
        const collectionData = {
            id: collectionId,
            date: document.getElementById('editCollectionDate').value,
            playerId: document.getElementById('editCollectionPlayer').value,
            amount: parseFloat(document.getElementById('editCollectionAmount').value),
            month: document.getElementById('editCollectionMonth').value,
            description: document.getElementById('editCollectionDescription').value || ''
        };
        
        // Validation
        if (!collectionData.date || !collectionData.playerId || !collectionData.amount || !collectionData.month) {
            UIUtils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (collectionData.amount <= 0) {
            UIUtils.showNotification('Amount must be greater than 0', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Updating...');
        
        try {
            const response = await API.updateIncome(collectionData);
            
            if (response.success) {
                UIUtils.showNotification('Collection updated successfully!', 'success');
                event.target.closest('.modal').remove();
                this.loadCollectionsData();
                
                await API.addLog('UPDATE_COLLECTION', `Updated collection: ${collectionId} - ${CurrencyUtils.format(collectionData.amount)}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to update collection', 'error');
            }
        } catch (error) {
            Logger.error('Error updating collection:', error);
            UIUtils.showNotification('Error updating collection. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },

    // Delete collection
    deleteCollection: async function(collectionId) {
        const collection = this.currentData.find(c => c.ID === collectionId);
        if (!collection) {
            UIUtils.showNotification('Collection not found', 'error');
            return;
        }
        
        const confirmed = await UIUtils.confirm(
            'Delete Collection',
            `Are you sure you want to delete this collection of ${CurrencyUtils.format(collection.Amount)} from ${collection.PlayerName}?`,
            'Yes, Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await API.deleteIncome(collectionId);
            
            if (response.success) {
                UIUtils.showNotification('Collection deleted successfully!', 'success');
                this.loadCollectionsData();
                
                await API.addLog('DELETE_COLLECTION', `Deleted collection: ${collectionId} - ${CurrencyUtils.format(collection.Amount)}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to delete collection', 'error');
            }
        } catch (error) {
            Logger.error('Error deleting collection:', error);
            UIUtils.showNotification('Error deleting collection. Please try again.', 'error');
        }
    },

    // Check if player is active for specific month
    isPlayerActiveForMonth: function(player, month) {
        if (!month) {
            // If no month selected, fall back to general status
            return player.Status === 'active';
        }
        
        if (player.MonthlyStatus) {
            try {
                const monthlyStatus = JSON.parse(player.MonthlyStatus);
                return monthlyStatus[month] === 'active';
            } catch (e) {
                // If monthly status is invalid, fall back to general status
                return player.Status === 'active';
            }
        }
        
        // If no monthly status, fall back to general status
        return player.Status === 'active';
    },

    // Get currently selected month from month dropdown (context-aware)
    getCurrentSelectedMonth: function() {
        // Try different month filter elements based on current page context
        const monthSelectors = [
            'collectionMonth',           // Add form month (if exists)
            'collectionMonthFilter',     // View page month filter
            'dashboardMonthFilter'       // Fallback to dashboard filter
        ];
        
        for (const selector of monthSelectors) {
            const monthSelect = document.getElementById(selector);
            if (monthSelect && monthSelect.value) {
                console.log(`📅 Using month from ${selector}: ${monthSelect.value}`);
                return monthSelect.value;
            }
        }
        
        console.log('📅 No month filter found, using current month');
        return DateUtils.getMonthKey(new Date());
    },

    // Escape HTML to prevent XSS
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Expose to global scope
window.Collection = Collection;