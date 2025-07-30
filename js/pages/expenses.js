// Expenses Management Module
const Expenses = {
    currentData: [],
    filteredData: [],

    // Render Add Expense Form
    renderAddForm: async function(container) {
        container.innerHTML = `
            <div class="expenses-add-page">
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-receipt"></i> Add Expense</h1>
                        <p>Record a new expense for the badminton group</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-unified btn-unified-secondary" onclick="showPage('dashboard')">
                            <i class="fas fa-home"></i>
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                <div class="form-container">
                    <form id="addExpenseForm" class="unified-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expenseDate">Date <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-calendar"></i>
                                    <input type="date" id="expenseDate" name="date" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="expenseCategory">Category <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-tags"></i>
                                    <select id="expenseCategory" name="category" required>
                                        <option value="">Select Category</option>
                                        <option value="Equipment">🏸 Equipment</option>
                                        <option value="Court Rental">🏢 Court Rental</option>
                                        <option value="Tournament">🏆 Tournament</option>
                                        <option value="Refreshments">🥤 Refreshments</option>
                                        <option value="Transport">🚗 Transport</option>
                                        <option value="Other">📋 Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="expenseAmount">Amount (QAR) <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-money-bill"></i>
                                    <input type="number" id="expenseAmount" name="amount" min="0" step="0.01" placeholder="Enter amount" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="expenseMonth">Month <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-calendar-month"></i>
                                    <select id="expenseMonth" name="month" required>
                                        <option value="">Select Month</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group full-width">
                                <label for="expenseDescription">Description <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <i class="fas fa-file-text"></i>
                                    <input type="text" id="expenseDescription" name="description" placeholder="Describe the expense" required>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-unified btn-unified-secondary" onclick="showPage('expenses-view')">
                                <i class="fas fa-arrow-left"></i>
                                Back to Expenses
                            </button>
                            <button type="submit" class="btn-unified btn-unified-primary">
                                <i class="fas fa-save"></i>
                                Save Expense
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        await this.init();
    },

    // Render View Expenses Table
    renderViewTable: async function(container) {
        container.innerHTML = `
            <div class="expenses-view-page">
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-receipt"></i> Expenses</h1>
                        <p>View and manage all group expenses</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-unified btn-unified-secondary" onclick="showPage('dashboard')">
                            <i class="fas fa-home"></i>
                            Back to Dashboard
                        </button>
                        <button class="btn-unified btn-unified-primary" onclick="showPage('expenses-add')" data-role="admin,view_edit">
                            <i class="fas fa-plus"></i>
                            Add Expense
                        </button>
                    </div>
                </div>

                <div class="filters-section">
                    <div class="filter-group">
                        <div class="filter-item">
                            <label for="expenseSearch">Search Expenses:</label>
                            <input type="text" id="expenseSearch" placeholder="Search by category, amount, or description...">
                        </div>
                        <div class="filter-item">
                            <label for="expenseMonthFilter">Month:</label>
                            <select id="expenseMonthFilter">
                                <option value="">All Months</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label for="expenseCategoryFilter">Category:</label>
                            <select id="expenseCategoryFilter">
                                <option value="">All Categories</option>
                                <option value="Equipment">🏸 Equipment</option>
                                <option value="Court Rental">🏢 Court Rental</option>
                                <option value="Tournament">🏆 Tournament</option>
                                <option value="Refreshments">🥤 Refreshments</option>
                                <option value="Transport">🚗 Transport</option>
                                <option value="Other">📋 Other</option>
                            </select>
                        </div>
                        <button id="refreshExpenses" class="btn-unified btn-unified-secondary">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                <div class="unified-table-container">
                    <div id="expensesTableContainer">
                        <div class="loading-placeholder">Loading expenses...</div>
                    </div>
                </div>
            </div>
        `;
        await this.init();
    },

    // Initialize the expense forms and tables
    init: async function() {
        if (document.getElementById('addExpenseForm')) {
            this.initializeAddForm();
        }
        
        if (document.getElementById('expensesTableContainer')) {
                            await this.initializeViewTable();
        }
    },

    // Initialize Add Form
    initializeAddForm: function() {
        // Set default date to today
        document.getElementById('expenseDate').value = DateUtils.formatDateForInput(new Date());
        
        // Initialize month dropdown
        this.initializeMonthDropdown('expenseMonth');
        
        // Setup form submission
        document.getElementById('addExpenseForm').addEventListener('submit', (e) => {
            this.handleAddExpense(e);
        });
    },

        // Initialize View Table
    initializeViewTable: async function() {
        await this.setupMonthFilter();
        this.loadExpensesData();
        
        // Setup event listeners
        document.getElementById('expenseSearch').addEventListener('input', () => {
            this.filterAndRenderTable();
        });
        
        document.getElementById('expenseMonthFilter').addEventListener('change', () => {
            this.filterAndRenderTable();
        });
        
        document.getElementById('expenseCategoryFilter').addEventListener('change', () => {
            this.filterAndRenderTable();
        });
        
        document.getElementById('refreshExpenses').addEventListener('click', () => {
            this.loadExpensesData();
            UIUtils.showNotification('Expenses data refreshed', 'success');
        });
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
            const availableMonths = await DateUtils.setupAvailableMonthsFilter('expenseMonthFilter', {
                allTimeLabel: 'All Months'
            });
            
            console.log('📅 Expenses month filter setup complete with', availableMonths.length, 'months');
        } catch (error) {
            console.error('📅 Failed to setup expenses month filter:', error);
        }
    },

    // Handle Add Expense Form Submission
    handleAddExpense: async function(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const expenseData = {
            date: formData.get('date'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            month: formData.get('month'),
            description: formData.get('description').trim()
        };
        
        // Validation
        if (!expenseData.date || !expenseData.category || !expenseData.amount || !expenseData.month || !expenseData.description) {
            UIUtils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (expenseData.amount <= 0) {
            UIUtils.showNotification('Amount must be greater than 0', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Adding...');
        
        try {
            const response = await API.addExpense(expenseData);
            
            if (response.success) {
                UIUtils.showNotification('Expense added successfully!', 'success');
                event.target.reset();
                document.getElementById('expenseDate').value = DateUtils.formatDateForInput(new Date());
                
                // Re-select current month
                const currentMonth = DateUtils.getMonthKey(new Date());
                document.getElementById('expenseMonth').value = currentMonth;
                
                await API.addLog('ADD_EXPENSE', `Added expense: ${expenseData.category} - ${CurrencyUtils.format(expenseData.amount)}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to add expense', 'error');
            }
        } catch (error) {
            Logger.error('Error adding expense:', error);
            UIUtils.showNotification('Error adding expense. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },

    // Load expenses data
    loadExpensesData: async function() {
        const container = document.getElementById('expensesTableContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-placeholder">Loading expenses...</div>';
        
        try {
            const response = await API.getExpenses();
            
            if (response.success && response.data) {
                this.currentData = response.data;
                this.filterAndRenderTable();
            } else {
                this.renderEmptyState('Failed to load expenses');
            }
        } catch (error) {
            Logger.error('Error loading expenses:', error);
            this.renderEmptyState('Error loading expenses');
        }
    },

    // Filter and render table
    filterAndRenderTable: function() {
        const searchTerm = document.getElementById('expenseSearch')?.value.toLowerCase() || '';
        const monthFilter = document.getElementById('expenseMonthFilter')?.value || '';
        const categoryFilter = document.getElementById('expenseCategoryFilter')?.value || '';
        
        this.filteredData = this.currentData.filter(expense => {
            const matchesSearch = !searchTerm || 
                expense.Category?.toLowerCase().includes(searchTerm) ||
                expense.Description?.toLowerCase().includes(searchTerm) ||
                expense.Amount?.toString().includes(searchTerm);
            
            const matchesMonth = !monthFilter || expense.Month === monthFilter;
            const matchesCategory = !categoryFilter || expense.Category === categoryFilter;
            
            return matchesSearch && matchesMonth && matchesCategory;
        });
        
        this.renderTable(this.filteredData);
    },

    // Render table
    renderTable: function(expenses) {
        const container = document.getElementById('expensesTableContainer');
        if (!container) return;
        
        if (!expenses || expenses.length === 0) {
            this.renderEmptyState('No expenses found');
            return;
        }
        
        const user = Auth.getCurrentUser();
        const canEdit = user && PermissionUtils.canPerformAction(user.role, 'edit');
        const canDelete = user && PermissionUtils.canPerformAction(user.role, 'delete');
        
        // Calculate total for displayed expenses
        const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.Amount || 0), 0);
        
        const tableHTML = `
            <div class="table-summary">
                <span class="summary-text">Showing ${expenses.length} expense${expenses.length !== 1 ? 's' : ''}</span>
                <span class="summary-total">Total: ${CurrencyUtils.format(total)}</span>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Month</th>
                        <th>Description</th>
                        ${(canEdit || canDelete) ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${expenses.map(expense => `
                        <tr>
                            <td data-label="Date">${DateUtils.formatDate(expense.Date)}</td>
                            <td data-label="Category">
                                <span class="category-badge category-${expense.Category?.toLowerCase().replace(/\s+/g, '-')}">
                                    ${this.getCategoryIcon(expense.Category)} ${this.escapeHtml(expense.Category)}
                                </span>
                            </td>
                            <td data-label="Amount" class="amount-cell">${CurrencyUtils.format(expense.Amount)}</td>
                            <td data-label="Month">${DateUtils.formatMonth(expense.Month)}</td>
                            <td data-label="Description">${this.escapeHtml(expense.Description)}</td>
                            ${(canEdit || canDelete) ? `
                                <td data-label="Actions">
                                    <div class="action-buttons">
                                        ${canEdit ? `<button class="btn btn-sm btn-edit" onclick="Expenses.editExpense('${expense.ID}')"><i class="fas fa-edit"></i></button>` : ''}
                                        ${canDelete ? `<button class="btn btn-sm btn-delete" onclick="Expenses.deleteExpense('${expense.ID}')"><i class="fas fa-trash"></i></button>` : ''}
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

    // Get category icon
    getCategoryIcon: function(category) {
        const icons = {
            'Equipment': '<i class="fas fa-table-tennis"></i>',
            'Court Rental': '<i class="fas fa-building"></i>',
            'Tournament': '<i class="fas fa-trophy"></i>',
            'Refreshments': '<i class="fas fa-coffee"></i>',
            'Transport': '<i class="fas fa-bus"></i>',
            'Other': '<i class="fas fa-ellipsis-h"></i>'
        };
        return icons[category] || '<i class="fas fa-receipt"></i>';
    },

    // Render empty state
    renderEmptyState: function(message) {
        const container = document.getElementById('expensesTableContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>${message}</h3>
                <p>No expenses to display</p>
            </div>
        `;
    },

    // Edit expense
    editExpense: async function(expenseId) {
        const expense = this.currentData.find(e => e.ID === expenseId);
        if (!expense) {
            UIUtils.showNotification('Expense not found', 'error');
            return;
        }
        
        const modal = UIUtils.createModal({
            title: 'Edit Expense',
            content: `
                <form id="editExpenseForm" class="unified-form">
                    <input type="hidden" id="editExpenseId" value="${expense.ID}">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editExpenseDate">Date <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-calendar"></i>
                                <input type="date" id="editExpenseDate" value="${expense.Date}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editExpenseAmount">Amount <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-coins"></i>
                                <input type="number" id="editExpenseAmount" value="${expense.Amount}" min="0" step="0.01" required placeholder="0.00">
                                <span class="input-suffix">QAR</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editExpenseCategory">Category <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-tags"></i>
                                <select id="editExpenseCategory" required>
                                    <option value="">Select Category</option>
                                    <option value="Equipment" ${expense.Category === 'Equipment' ? 'selected' : ''}>Equipment</option>
                                    <option value="Court Rental" ${expense.Category === 'Court Rental' ? 'selected' : ''}>Court Rental</option>
                                    <option value="Tournament" ${expense.Category === 'Tournament' ? 'selected' : ''}>Tournament</option>
                                    <option value="Refreshments" ${expense.Category === 'Refreshments' ? 'selected' : ''}>Refreshments</option>
                                    <option value="Transport" ${expense.Category === 'Transport' ? 'selected' : ''}>Transport</option>
                                    <option value="Other" ${expense.Category === 'Other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editExpenseMonth">Month <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <i class="fas fa-calendar-alt"></i>
                                <select id="editExpenseMonth" required>
                                    <option value="">Select Month</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editExpenseDescription">Description <span class="required">*</span></label>
                        <div class="input-wrapper">
                            <i class="fas fa-comment"></i>
                            <input type="text" id="editExpenseDescription" value="${expense.Description || ''}" placeholder="Describe the expense" required>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-unified btn-unified-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn-unified btn-unified-primary">
                            <i class="fas fa-save"></i>
                            Update Expense
                        </button>
                    </div>
                </form>
            `
        });
        
        // Load months for edit form
        await this.loadMonthsForEditForm(expense.Month);
        
        // Setup form submission
        document.getElementById('editExpenseForm').addEventListener('submit', (e) => {
            this.handleEditExpense(e);
        });
    },

    // Load months for edit form
    loadMonthsForEditForm: async function(selectedMonth) {
        const monthSelect = document.getElementById('editExpenseMonth');
        if (!monthSelect) return;
        
        try {
            // Use available months instead of all months
            await DateUtils.setupAvailableMonthsFilter('editExpenseMonth', {
                includeAll: false,
                defaultValue: selectedMonth
            });
        } catch (error) {
            // Fallback to current month + selected month if API fails
            monthSelect.innerHTML = '<option value="">Select Month</option>';
            const currentMonth = DateUtils.getMonthKey(new Date());
            
            // Add current month
            const currentOption = document.createElement('option');
            currentOption.value = currentMonth;
            currentOption.textContent = DateUtils.formatMonthForDisplay(currentMonth);
            monthSelect.appendChild(currentOption);
            
            // Add selected month if different
            if (selectedMonth && selectedMonth !== currentMonth) {
                const selectedOption = document.createElement('option');
                selectedOption.value = selectedMonth;
                selectedOption.textContent = DateUtils.formatMonthForDisplay(selectedMonth);
                selectedOption.selected = true;
                monthSelect.appendChild(selectedOption);
            } else if (selectedMonth === currentMonth) {
                currentOption.selected = true;
            }
        }
    },

    // Handle edit expense form submission
    handleEditExpense: async function(event) {
        event.preventDefault();
        
        const expenseId = document.getElementById('editExpenseId').value;
        const expenseData = {
            id: expenseId,
            date: document.getElementById('editExpenseDate').value,
            category: document.getElementById('editExpenseCategory').value,
            amount: parseFloat(document.getElementById('editExpenseAmount').value),
            month: document.getElementById('editExpenseMonth').value,
            description: document.getElementById('editExpenseDescription').value.trim()
        };
        
        // Validation
        if (!expenseData.date || !expenseData.category || !expenseData.amount || !expenseData.month || !expenseData.description) {
            UIUtils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (expenseData.amount <= 0) {
            UIUtils.showNotification('Amount must be greater than 0', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Updating...');
        
        try {
            const response = await API.updateExpense(expenseData);
            
            if (response.success) {
                UIUtils.showNotification('Expense updated successfully!', 'success');
                event.target.closest('.modal').remove();
                this.loadExpensesData();
                
                await API.addLog('UPDATE_EXPENSE', `Updated expense: ${expenseId} - ${expenseData.category} - ${CurrencyUtils.format(expenseData.amount)}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to update expense', 'error');
            }
        } catch (error) {
            Logger.error('Error updating expense:', error);
            UIUtils.showNotification('Error updating expense. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },

    // Delete expense
    deleteExpense: async function(expenseId) {
        const expense = this.currentData.find(e => e.ID === expenseId);
        if (!expense) {
            UIUtils.showNotification('Expense not found', 'error');
            return;
        }
        
        const confirmed = await UIUtils.confirm(
            'Delete Expense',
            `Are you sure you want to delete this ${expense.Category} expense of ${CurrencyUtils.format(expense.Amount)}?`,
            'Yes, Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await API.deleteExpense(expenseId);
            
            if (response.success) {
                UIUtils.showNotification('Expense deleted successfully!', 'success');
                this.loadExpensesData();
                
                await API.addLog('DELETE_EXPENSE', `Deleted expense: ${expenseId} - ${expense.Category} - ${CurrencyUtils.format(expense.Amount)}`);
            } else {
                UIUtils.showNotification(response.message || 'Failed to delete expense', 'error');
            }
        } catch (error) {
            Logger.error('Error deleting expense:', error);
            UIUtils.showNotification('Error deleting expense. Please try again.', 'error');
        }
    },

    // Escape HTML to prevent XSS
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Expose to global scope
window.Expenses = Expenses;