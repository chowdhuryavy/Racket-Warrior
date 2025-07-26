// Collection Module
const Collection = {
    currentData: [],
    filteredData: [],
    selectedMonth: '',

    renderAddForm: function() {
        return `
            <div class="collection-add-page">
                <div class="page-header">
                    <h1>Add Collection</h1>
                    <p class="page-description">Record a new payment collection from players</p>
                </div>

                <div class="form-container">
                    <form id="addCollectionForm" class="form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="collectionDate">Date <span class="required">*</span></label>
                                <input type="date" id="collectionDate" name="date" required>
                            </div>

                            <div class="form-group">
                                <label for="collectionPlayer">Player <span class="required">*</span></label>
                                <select id="collectionPlayer" name="playerId" required>
                                    <option value="">Select Player</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="collectionAmount">Amount (QAR) <span class="required">*</span></label>
                                <input type="number" id="collectionAmount" name="amount" step="0.01" min="0" required>
                            </div>

                            <div class="form-group">
                                <label for="collectionMonth">Month <span class="required">*</span></label>
                                <select id="collectionMonth" name="month" required>
                                    <option value="">Select Month</option>
                                </select>
                            </div>

                            <div class="form-group full-width">
                                <label for="collectionDescription">Description</label>
                                <textarea id="collectionDescription" name="description" rows="3" placeholder="Additional notes about this collection"></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary ripple">
                                <i class="fas fa-plus"></i>
                                Add Collection
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="showPage('collection-view')">
                                <i class="fas fa-list"></i>
                                View Collections
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderViewTable: function() {
        return `
            <div class="collection-view-page">
                <div class="page-header">
                    <h1>Collections</h1>
                    <p class="page-description">View and manage payment collections</p>
                </div>

                <div class="page-controls">
                    <div class="filters">
                        <div class="filter-group">
                            <label for="collectionSearchFilter">Search:</label>
                            <input type="text" id="collectionSearchFilter" placeholder="Search by player or description...">
                        </div>

                        <div class="filter-group">
                            <label for="collectionMonthFilter">Month:</label>
                            <select id="collectionMonthFilter">
                                <option value="">All Months</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="collectionPlayerFilter">Player:</label>
                            <select id="collectionPlayerFilter">
                                <option value="">All Players</option>
                            </select>
                        </div>

                        <button id="refreshCollections" class="btn btn-secondary">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>

                    <div class="page-actions" data-role="admin,view_edit">
                        <button class="btn btn-primary" onclick="showPage('collection-add')">
                            <i class="fas fa-plus"></i>
                            Add Collection
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <div id="collectionsTableContainer">
                        <div class="loading-placeholder">Loading collections...</div>
                    </div>
                </div>

                <div id="collectionsPagination" class="pagination">
                    <!-- Pagination will be added here -->
                </div>
            </div>
        `;
    },

    async init() {
        if (App.currentPage === 'collection-add') {
            await this.initAddForm();
        } else if (App.currentPage === 'collection-view') {
            await this.initViewTable();
        }
    },

    async initAddForm() {
        // Set today as default date
        const dateInput = document.getElementById('collectionDate');
        if (dateInput) {
            dateInput.value = DateUtils.formatDateForInput(new Date());
        }

        // Load players for dropdown
        await this.loadPlayersForDropdown();

        // Setup month dropdown
        this.setupMonthDropdown('collectionMonth');

        // Setup form submission
        const form = document.getElementById('addCollectionForm');
        if (form) {
            form.addEventListener('submit', this.handleAddCollection.bind(this));
        }
    },

    async initViewTable() {
        // Setup filters
        this.setupFilters();

        // Load initial data
        await this.loadCollectionsData();

        // Setup event listeners
        this.setupEventListeners();
    },

    async loadPlayersForDropdown() {
        try {
            const response = await API.getPlayers();
            if (response.success) {
                const playerSelect = document.getElementById('collectionPlayer');
                const playerFilter = document.getElementById('collectionPlayerFilter');
                
                if (playerSelect) {
                    playerSelect.innerHTML = '<option value="">Select Player</option>';
                    response.data.forEach(player => {
                        if (player.Status === 'active') {
                            playerSelect.innerHTML += `<option value="${player.ID}">${this.escapeHtml(player.Name)}</option>`;
                        }
                    });
                }

                if (playerFilter) {
                    playerFilter.innerHTML = '<option value="">All Players</option>';
                    response.data.forEach(player => {
                        playerFilter.innerHTML += `<option value="${player.ID}">${this.escapeHtml(player.Name)}</option>`;
                    });
                }
            }
        } catch (error) {
            Logger.error('Error loading players', error);
        }
    },

    setupMonthDropdown(elementId) {
        const monthSelect = document.getElementById(elementId);
        if (!monthSelect) return;

        const months = DateUtils.getMonthOptions();
        monthSelect.innerHTML = elementId === 'collectionMonth' ? '<option value="">Select Month</option>' : '<option value="">All Months</option>';
        
        months.forEach(month => {
            monthSelect.innerHTML += `<option value="${month.value}">${month.label}</option>`;
        });

        // Set current month as default for add form
        if (elementId === 'collectionMonth') {
            const currentMonth = DateUtils.getCurrentMonth();
            monthSelect.value = currentMonth;
        }
    },

    async handleAddCollection(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        if (!this.validateCollectionData(data)) {
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Adding...');

        try {
            // Get player name
            const playerSelect = document.getElementById('collectionPlayer');
            const playerName = playerSelect.options[playerSelect.selectedIndex].text;
            
            const response = await API.addIncome({
                date: data.date,
                playerId: data.playerId,
                playerName: playerName,
                amount: parseFloat(data.amount),
                description: data.description || '',
                month: data.month
            });

            if (response.success) {
                UIUtils.showNotification('Collection added successfully!', 'success');
                
                // Reset form
                event.target.reset();
                document.getElementById('collectionDate').value = DateUtils.formatDateForInput(new Date());
                document.getElementById('collectionMonth').value = DateUtils.getCurrentMonth();
                
                // Log action
                await API.addLog('ADD_COLLECTION', `Added collection: ${playerName} - QAR ${data.amount}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to add collection', 'error');
            }
        } catch (error) {
            Logger.error('Error adding collection', error);
            UIUtils.showNotification('Error adding collection. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },

    validateCollectionData(data) {
        if (!data.date) {
            UIUtils.showNotification('Please select a date', 'error');
            return false;
        }

        if (!data.playerId) {
            UIUtils.showNotification('Please select a player', 'error');
            return false;
        }

        if (!data.amount || parseFloat(data.amount) <= 0) {
            UIUtils.showNotification('Please enter a valid amount', 'error');
            return false;
        }

        if (!data.month) {
            UIUtils.showNotification('Please select a month', 'error');
            return false;
        }

        return true;
    },

    setupFilters() {
        this.setupMonthDropdown('collectionMonthFilter');
    },

    setupEventListeners() {
        // Search filter
        const searchFilter = document.getElementById('collectionSearchFilter');
        if (searchFilter) {
            searchFilter.addEventListener('input', () => {
                this.filterAndRenderTable();
            });
        }

        // Month filter
        const monthFilter = document.getElementById('collectionMonthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => {
                this.filterAndRenderTable();
            });
        }

        // Player filter
        const playerFilter = document.getElementById('collectionPlayerFilter');
        if (playerFilter) {
            playerFilter.addEventListener('change', () => {
                this.filterAndRenderTable();
            });
        }

        // Refresh button
        const refreshButton = document.getElementById('refreshCollections');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadCollectionsData();
            });
        }
    },

    async loadCollectionsData() {
        try {
            const container = document.getElementById('collectionsTableContainer');
            if (container) {
                container.innerHTML = '<div class="loading-placeholder">Loading collections...</div>';
            }

            const response = await API.getIncome();
            if (response.success) {
                this.currentData = response.data || [];
                await this.loadPlayersForDropdown();
                this.filterAndRenderTable();
            } else {
                this.renderEmptyState('Failed to load collections');
            }
        } catch (error) {
            Logger.error('Error loading collections', error);
            this.renderEmptyState('Error loading collections');
        }
    },

    filterAndRenderTable() {
        const searchTerm = document.getElementById('collectionSearchFilter')?.value.toLowerCase() || '';
        const monthFilter = document.getElementById('collectionMonthFilter')?.value || '';
        const playerFilter = document.getElementById('collectionPlayerFilter')?.value || '';

        this.filteredData = this.currentData.filter(collection => {
            const matchesSearch = !searchTerm || 
                collection.PlayerName.toLowerCase().includes(searchTerm) ||
                (collection.Description && collection.Description.toLowerCase().includes(searchTerm));
            
            const matchesMonth = !monthFilter || collection.Month === monthFilter;
            const matchesPlayer = !playerFilter || collection.PlayerId === playerFilter;

            return matchesSearch && matchesMonth && matchesPlayer;
        });

        this.renderTable(this.filteredData);
    },

    renderTable(collections) {
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
                            <td data-label="Month">${collection.Month}</td>
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

    renderEmptyState(message = 'No collections found') {
        const container = document.getElementById('collectionsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coins"></i>
                    <h3>${message}</h3>
                    <p>Collections will appear here once they are added.</p>
                </div>
            `;
        }
    },

    async editCollection(id) {
        const collection = this.currentData.find(p => p.ID === id);
        if (!collection) {
            UIUtils.showNotification('Collection not found', 'error');
            return;
        }

        const modal = UIUtils.createModal({
            title: 'Edit Collection',
            content: `
                <form id="editCollectionForm">
                    <div class="form-group">
                        <label for="editCollectionDate">Date</label>
                        <input type="date" id="editCollectionDate" value="${collection.Date}" required>
                    </div>
                    <div class="form-group">
                        <label for="editCollectionPlayer">Player</label>
                        <select id="editCollectionPlayer" required>
                            <option value="">Select Player</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editCollectionAmount">Amount (QAR)</label>
                        <input type="number" id="editCollectionAmount" value="${collection.Amount}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="editCollectionMonth">Month</label>
                        <select id="editCollectionMonth" required>
                            <option value="">Select Month</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editCollectionDescription">Description</label>
                        <textarea id="editCollectionDescription" rows="3">${collection.Description || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Update Collection</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            `
        });

        // Load players and setup dropdowns
        const response = await API.getPlayers();
        if (response.success) {
            const playerSelect = document.getElementById('editCollectionPlayer');
            playerSelect.innerHTML = '<option value="">Select Player</option>';
            response.data.forEach(player => {
                const selected = player.ID === collection.PlayerId ? 'selected' : '';
                playerSelect.innerHTML += `<option value="${player.ID}" ${selected}>${this.escapeHtml(player.Name)}</option>`;
            });
        }

        // Setup month dropdown
        const monthSelect = document.getElementById('editCollectionMonth');
        const months = DateUtils.getMonthOptions();
        monthSelect.innerHTML = '<option value="">Select Month</option>';
        months.forEach(month => {
            const selected = month.value === collection.Month ? 'selected' : '';
            monthSelect.innerHTML += `<option value="${month.value}" ${selected}>${month.label}</option>`;
        });

        // Handle form submission
        document.getElementById('editCollectionForm').addEventListener('submit', (e) => {
            this.handleEditCollection(e, id, modal);
        });
    },

    async handleEditCollection(event, id, modal) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        if (!this.validateCollectionData(data)) {
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Updating...');

        try {
            // Get player name
            const playerSelect = document.getElementById('editCollectionPlayer');
            const playerName = playerSelect.options[playerSelect.selectedIndex].text;

            const response = await API.updateIncome(id, {
                date: data.date,
                playerId: data.playerId,
                playerName: playerName,
                amount: parseFloat(data.amount),
                description: data.description || '',
                month: data.month
            });

            if (response.success) {
                UIUtils.showNotification('Collection updated successfully!', 'success');
                modal.hide();
                await this.loadCollectionsData();
                await API.addLog('UPDATE_COLLECTION', `Updated collection: ${playerName} - QAR ${data.amount}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to update collection', 'error');
            }
        } catch (error) {
            Logger.error('Error updating collection', error);
            UIUtils.showNotification('Error updating collection. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },

    async deleteCollection(id) {
        const collection = this.currentData.find(p => p.ID === id);
        if (!collection) {
            UIUtils.showNotification('Collection not found', 'error');
            return;
        }

        const confirmed = await UIUtils.confirm(
            'Delete Collection',
            `Are you sure you want to delete this collection from ${collection.PlayerName} for ${CurrencyUtils.format(collection.Amount)}?`,
            'This action cannot be undone.'
        );

        if (!confirmed) return;

        try {
            const response = await API.deleteIncome(id);
            if (response.success) {
                UIUtils.showNotification('Collection deleted successfully!', 'success');
                await this.loadCollectionsData();
                await API.addLog('DELETE_COLLECTION', `Deleted collection: ${collection.PlayerName} - QAR ${collection.Amount}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to delete collection', 'error');
            }
        } catch (error) {
            Logger.error('Error deleting collection', error);
            UIUtils.showNotification('Error deleting collection. Please try again.', 'error');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Make Collection available globally
window.Collection = Collection;