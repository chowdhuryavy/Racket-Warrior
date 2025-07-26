// Reports Page Module for Racket Warrior

const Reports = {
    currentMonth: null,
    
    // Render reports page
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    // Initialize reports page
    init: function() {
        this.setupMonthFilter();
        this.setupEventListeners();
        this.loadReportData();
    },
    
    // Get reports HTML
    getHTML: function() {
        return `
            <div class="reports-page">
                <!-- Reports Header -->
                <div class="page-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1><i class="fas fa-chart-line"></i> Financial Reports</h1>
                            <p>Comprehensive financial analysis and reporting for Racket Warrior</p>
                        </div>
                        <div class="header-actions">
                            <button id="printReport" class="btn btn-secondary">
                                <i class="fas fa-print"></i> Print Report
                            </button>
                            <button id="exportPDF" class="btn btn-primary">
                                <i class="fas fa-file-pdf"></i> Export PDF
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Report Controls -->
                <div class="report-controls">
                    <div class="control-group">
                        <label for="reportMonth">Report Period:</label>
                        <select id="reportMonth" class="form-control">
                            <option value="">All Time</option>
                        </select>
                    </div>
                    <button id="generateReport" class="btn btn-info">
                        <i class="fas fa-sync"></i> Generate Report
                    </button>
                </div>
                
                <!-- Report Content -->
                <div class="report-content" id="reportContent">
                    <!-- Report Header -->
                    <div class="report-header">
                        <div class="logo-section">
                            <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior" class="report-logo">
                            <div class="report-title">
                                <h2>Racket Warrior</h2>
                                <p>Badminton Group Financial Report</p>
                                <p class="report-period" id="reportPeriod">Period: All Time</p>
                                <p class="report-date">Generated: ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Financial Summary Cards -->
                    <div class="report-summary">
                        <h3>Financial Summary</h3>
                        <div class="summary-cards">
                            <div class="summary-card income">
                                <div class="card-icon">
                                    <i class="fas fa-arrow-down"></i>
                                </div>
                                <div class="card-content">
                                    <div class="card-value" id="reportTotalIncome">QAR 0.00</div>
                                    <div class="card-label">Total Income</div>
                                </div>
                            </div>
                            <div class="summary-card expense">
                                <div class="card-icon">
                                    <i class="fas fa-arrow-up"></i>
                                </div>
                                <div class="card-content">
                                    <div class="card-value" id="reportTotalExpense">QAR 0.00</div>
                                    <div class="card-label">Total Expenses</div>
                                </div>
                            </div>
                            <div class="summary-card balance">
                                <div class="card-icon">
                                    <i class="fas fa-balance-scale"></i>
                                </div>
                                <div class="card-content">
                                    <div class="card-value" id="reportNetBalance">QAR 0.00</div>
                                    <div class="card-label">Net Balance</div>
                                </div>
                            </div>
                            <div class="summary-card players">
                                <div class="card-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="card-content">
                                    <div class="card-value" id="reportActivePlayersCount">0</div>
                                    <div class="card-label">Active Players</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Detailed Tables -->
                    <div class="report-details">
                        <!-- Income Details -->
                        <div class="report-section">
                            <h3>Income Details</h3>
                            <div class="table-container">
                                <table class="report-table" id="incomeTable">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Player Name</th>
                                            <th>Description</th>
                                            <th>Amount (QAR)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="incomeTableBody">
                                        <tr>
                                            <td colspan="4" class="text-center">Loading income data...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Expense Details -->
                        <div class="report-section">
                            <h3>Expense Details</h3>
                            <div class="table-container">
                                <table class="report-table" id="expenseTable">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Amount (QAR)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="expenseTableBody">
                                        <tr>
                                            <td colspan="4" class="text-center">Loading expense data...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Report Footer -->
                    <div class="report-footer">
                        <p>This report was generated automatically by the Racket Warrior management system.</p>
                        <p>For any questions or clarifications, please contact the group administrator.</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Setup month filter
    setupMonthFilter: function() {
        const monthSelect = document.getElementById('reportMonth');
        if (!monthSelect) return;
        
        // Generate month options for the last 12 months
        const months = DateUtils.generateMonthOptions(12);
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.label;
            monthSelect.appendChild(option);
        });
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Month filter change
        const monthSelect = document.getElementById('reportMonth');
        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                this.currentMonth = e.target.value;
                this.updatePeriodDisplay();
            });
        }
        
        // Generate report button
        const generateBtn = document.getElementById('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.loadReportData());
        }
        
        // Print report button
        const printBtn = document.getElementById('printReport');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printReport());
        }
        
        // Export PDF button
        const exportBtn = document.getElementById('exportPDF');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToPDF());
        }
    },
    
    // Update period display
    updatePeriodDisplay: function() {
        const periodElement = document.getElementById('reportPeriod');
        if (!periodElement) return;
        
        if (this.currentMonth) {
            const monthLabel = DateUtils.formatMonth(this.currentMonth);
            periodElement.textContent = `Period: ${monthLabel}`;
        } else {
            periodElement.textContent = 'Period: All Time';
        }
    },
    
    // Load report data
    loadReportData: async function() {
        try {
            Logger.info('Loading report data', { month: this.currentMonth });
            
            // Show loading state
            this.showLoadingState();
            
            // Load dashboard stats (income, expenses, balance)
            const statsResponse = await API.getDashboardStats(this.currentMonth);
            if (statsResponse.success) {
                this.updateSummaryCards(statsResponse.data);
            }
            
            // Load detailed income data
            const incomeResponse = await API.getIncome(this.currentMonth ? { month: this.currentMonth } : {});
            if (incomeResponse.success) {
                this.populateIncomeTable(incomeResponse.data);
            }
            
            // Load detailed expense data
            const expenseResponse = await API.getExpenses(this.currentMonth ? { month: this.currentMonth } : {});
            if (expenseResponse.success) {
                this.populateExpenseTable(expenseResponse.data);
            }
            
        } catch (error) {
            Logger.error('Failed to load report data', error);
            UIUtils.showNotification('Failed to load report data', 'error');
            this.showErrorState();
        }
    },
    
    // Show loading state
    showLoadingState: function() {
        const summaryValues = ['reportTotalIncome', 'reportTotalExpense', 'reportNetBalance', 'reportActivePlayersCount'];
        summaryValues.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="spinner-border"></div>';
            }
        });
        
        // Show loading in tables
        const incomeBody = document.getElementById('incomeTableBody');
        const expenseBody = document.getElementById('expenseTableBody');
        
        if (incomeBody) {
            incomeBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading income data...</td></tr>';
        }
        if (expenseBody) {
            expenseBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading expense data...</td></tr>';
        }
    },
    
    // Show error state
    showErrorState: function() {
        const summaryValues = ['reportTotalIncome', 'reportTotalExpense', 'reportNetBalance', 'reportActivePlayersCount'];
        summaryValues.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Error';
            }
        });
    },
    
    // Update summary cards
    updateSummaryCards: function(data) {
        const totalIncomeEl = document.getElementById('reportTotalIncome');
        const totalExpenseEl = document.getElementById('reportTotalExpense');
        const netBalanceEl = document.getElementById('reportNetBalance');
        const activePlayersEl = document.getElementById('reportActivePlayersCount');
        
        if (totalIncomeEl) totalIncomeEl.textContent = `QAR ${(data.totalIncome || 0).toFixed(2)}`;
        if (totalExpenseEl) totalExpenseEl.textContent = `QAR ${(data.totalExpenses || 0).toFixed(2)}`;
        if (netBalanceEl) netBalanceEl.textContent = `QAR ${(data.balance || 0).toFixed(2)}`;
        if (activePlayersEl) activePlayersEl.textContent = data.activePlayers || 0;
    },
    
    // Populate income table
    populateIncomeTable: function(incomeData) {
        const tbody = document.getElementById('incomeTableBody');
        if (!tbody) return;
        
        if (!incomeData || incomeData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No income records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = incomeData.map(income => `
            <tr>
                <td>${DateUtils.formatDateForInput(income.Date)}</td>
                <td>${income.PlayerName || 'N/A'}</td>
                <td>${income.Description || 'N/A'}</td>
                <td>QAR ${parseFloat(income.Amount || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    },
    
    // Populate expense table
    populateExpenseTable: function(expenseData) {
        const tbody = document.getElementById('expenseTableBody');
        if (!tbody) return;
        
        if (!expenseData || expenseData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No expense records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = expenseData.map(expense => `
            <tr>
                <td>${DateUtils.formatDateForInput(expense.Date)}</td>
                <td>${expense.Category || 'N/A'}</td>
                <td>${expense.Description || 'N/A'}</td>
                <td>QAR ${parseFloat(expense.Amount || 0).toFixed(2)}</td>
            </tr>
        `).join('');
    },
    
    // Print report
    printReport: function() {
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) return;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Racket Warrior - Financial Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .report-logo { width: 80px; height: 80px; }
                    .summary-cards { display: flex; justify-content: space-around; margin: 20px 0; }
                    .summary-card { text-align: center; padding: 10px; border: 1px solid #ddd; }
                    .card-value { font-size: 24px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    .report-footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                ${reportContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    },
    
    // Export to PDF (placeholder - would need a PDF library)
    exportToPDF: function() {
        UIUtils.showNotification('PDF export feature will be implemented with a PDF library', 'info');
    }
};

// Export Reports module
window.Reports = Reports;