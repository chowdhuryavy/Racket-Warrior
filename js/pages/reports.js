// Reports Page Module for Racket Warrior

const Reports = {
    currentMonth: null,
    reportData: null,
    
    // Render reports page
    render: function(container) {
        container.innerHTML = this.getHTML();
        this.init();
    },
    
    // Initialize reports page
    init: function() {
        this.setupEventListeners();
        this.setCurrentMonth();
        this.loadReportData();
    },
    
    // Get reports HTML with unified styling
    getHTML: function() {
        return `
            <div class="reports-page">
                <!-- Reports Header -->
                <div class="page-header">
                    <div class="header-content">
                        <h1><i class="fas fa-chart-line"></i> Monthly Reports</h1>
                        <p>Generate comprehensive reports for group activities</p>
                    </div>
                    <div class="header-actions">
                        <button id="refreshReport" class="btn-unified btn-unified-secondary">
                            <i class="fas fa-sync"></i>
                            Refresh
                        </button>
                        <button id="exportPDF" class="btn-unified btn-unified-danger">
                            <i class="fas fa-file-pdf"></i>
                            Export PDF
                        </button>
                        <button id="exportImage" class="btn-unified btn-unified-primary">
                            <i class="fas fa-image"></i>
                            Export Image
                        </button>
                    </div>
                </div>

                <!-- Month Selector -->
                <div class="unified-form" style="margin-bottom: 2rem;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="reportMonth">Select Month for Report</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar"></i>
                            <select id="reportMonth" name="month">
                                <option value="">Select Month</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Report Content Container -->
                <div id="reportContent" class="report-content">
                    <div class="loading-placeholder">Select a month to generate report...</div>
                </div>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Month selector
        const monthSelect = document.getElementById('reportMonth');
        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                this.currentMonth = e.target.value;
                if (this.currentMonth) {
                    this.loadReportData();
                }
            });
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshReport');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadReportData());
        }
        
        // Export PDF button
        const exportPDFBtn = document.getElementById('exportPDF');
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => this.exportToPDF());
        }
        
        // Export Image button
        const exportImageBtn = document.getElementById('exportImage');
        if (exportImageBtn) {
            exportImageBtn.addEventListener('click', () => this.exportToImage());
        }
    },
    
    // Set current month
    setCurrentMonth: function() {
        const monthSelect = document.getElementById('reportMonth');
        if (!monthSelect) return;
        
        // Generate month options for the last 12 months
        const months = [];
        const now = new Date();
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            months.push({ value: monthValue, label: monthLabel });
        }
        
        monthSelect.innerHTML = '<option value="">Select Month</option>' + 
                               months.map(month => `<option value="${month.value}">${month.label}</option>`).join('');
        
        // Set current month as default
        this.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthSelect.value = this.currentMonth;
    },
    
    // Load report data
    loadReportData: async function() {
        if (!this.currentMonth) return;
        
        try {
            UIUtils.showLoading();
            const response = await API.makeRequest('get_monthly_report', { month: this.currentMonth });
            
            if (response.success) {
                this.reportData = response.data;
                this.renderReport();
            } else {
                UIUtils.showNotification('Failed to load report: ' + response.message, 'error');
                this.showTestReport(); // Fallback to test data
            }
        } catch (error) {
            console.error('Error loading report:', error);
            UIUtils.showNotification('Error loading report', 'error');
            this.showTestReport(); // Fallback to test data
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Show test report as fallback
    showTestReport: function() {
        this.reportData = {
            month: this.currentMonth,
            monthLabel: new Date(this.currentMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            summary: {
                totalPlayers: 12,
                activePlayers: 10,
                inactivePlayers: 2,
                totalCollection: 500.00,
                totalExpenses: 320.00,
                netBalance: 180.00
            },
            players: [
                { name: 'John Smith', phone: '+974 1234 5678', status: 'active', joinDate: '2024-01-15' },
                { name: 'Jane Doe', phone: '+974 2345 6789', status: 'active', joinDate: '2024-01-10' },
                { name: 'Mike Johnson', phone: '+974 3456 7890', status: 'inactive', joinDate: '2023-12-20' }
            ],
            collections: [
                { date: '2024-01-15', player: 'John Smith', amount: 50.00, description: 'Monthly fee' },
                { date: '2024-01-10', player: 'Jane Doe', amount: 50.00, description: 'Monthly fee' },
                { date: '2024-01-20', player: 'Mike Johnson', amount: 75.00, description: 'Tournament fee' }
            ],
            expenses: [
                { date: '2024-01-05', category: 'Equipment', amount: 120.00, description: 'New shuttlecocks' },
                { date: '2024-01-12', category: 'Court Rental', amount: 100.00, description: 'Weekly court booking' },
                { date: '2024-01-25', category: 'Refreshments', amount: 50.00, description: 'Post-game drinks' }
            ]
        };
        this.renderReport();
    },
    
    // Render report
    renderReport: function() {
        const container = document.getElementById('reportContent');
        if (!container || !this.reportData) return;
        
        const data = this.reportData;
        
        const reportHTML = `
            <div class="report-document" id="reportDocument">
                <!-- Report Header -->
                <div class="report-header">
                    <div class="report-title-section">
                        <img src="https://i.imgur.com/04MGPFl.png" alt="Racket Warrior" class="report-logo">
                        <div class="report-title-content">
                            <h1>🏸 Racket Warrior</h1>
                            <h2>Monthly Activity Report</h2>
                            <h3>${data.monthLabel}</h3>
                        </div>
                    </div>
                    <div class="report-meta">
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Report Period:</strong> ${data.monthLabel}</p>
                    </div>
                </div>

                <!-- Executive Summary -->
                <div class="report-section">
                    <h3 class="section-title">
                        <i class="fas fa-chart-pie"></i>
                        Executive Summary
                    </h3>
                    <div class="summary-grid">
                        <div class="summary-card players-card">
                            <div class="summary-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Total Players</h4>
                                <p class="summary-number">${data.summary.totalPlayers}</p>
                                <p class="summary-detail">
                                    <span class="active">${data.summary.activePlayers} Active</span> • 
                                    <span class="inactive">${data.summary.inactivePlayers} Inactive</span>
                                </p>
                            </div>
                        </div>
                        
                        <div class="summary-card income-card">
                            <div class="summary-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Total Collection</h4>
                                <p class="summary-number">QAR ${(data.summary.totalCollection || 0).toFixed(2)}</p>
                                <p class="summary-detail">${data.collections.length} transactions</p>
                            </div>
                        </div>
                        
                        <div class="summary-card expense-card">
                            <div class="summary-icon">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Total Expenses</h4>
                                <p class="summary-number">QAR ${(data.summary.totalExpenses || 0).toFixed(2)}</p>
                                <p class="summary-detail">${data.expenses.length} transactions</p>
                            </div>
                        </div>
                        
                        <div class="summary-card balance-card">
                            <div class="summary-icon">
                                <i class="fas fa-balance-scale"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Net Balance</h4>
                                <p class="summary-number ${(data.summary.netBalance || 0) >= 0 ? 'positive' : 'negative'}">
                                    QAR ${(data.summary.netBalance || 0).toFixed(2)}
                                </p>
                                <p class="summary-detail">${data.summary.netBalance >= 0 ? 'Profit' : 'Loss'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Players Report -->
                <div class="report-section">
                    <h3 class="section-title">
                        <i class="fas fa-users"></i>
                        Players Report
                    </h3>
                    <div class="table-wrapper">
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Player Name</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Join Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.players.map(player => `
                                    <tr>
                                        <td>${player.name}</td>
                                        <td>${player.phone}</td>
                                        <td>
                                            <span class="status-indicator ${player.status}">
                                                ${player.status === 'active' ? '🟢' : '🔴'} ${player.status.charAt(0).toUpperCase() + player.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>${new Date(player.joinDate).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Collections Report -->
                <div class="report-section">
                    <h3 class="section-title">
                        <i class="fas fa-coins"></i>
                        Collections Report
                    </h3>
                    <div class="table-wrapper">
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Player</th>
                                    <th>Amount (QAR)</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.collections.map(collection => `
                                    <tr>
                                        <td>${new Date(collection.date).toLocaleDateString()}</td>
                                        <td>${collection.player}</td>
                                        <td class="amount-cell positive">+${collection.amount.toFixed(2)}</td>
                                        <td>${collection.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="2"><strong>Total Collections</strong></td>
                                    <td class="amount-cell positive"><strong>QAR ${data.summary.totalCollection.toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Expenses Report -->
                <div class="report-section">
                    <h3 class="section-title">
                        <i class="fas fa-receipt"></i>
                        Expenses Report
                    </h3>
                    <div class="table-wrapper">
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Amount (QAR)</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.expenses.map(expense => `
                                    <tr>
                                        <td>${new Date(expense.date).toLocaleDateString()}</td>
                                        <td>
                                            <span class="category-tag">${expense.category}</span>
                                        </td>
                                        <td class="amount-cell negative">-${expense.amount.toFixed(2)}</td>
                                        <td>${expense.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="2"><strong>Total Expenses</strong></td>
                                    <td class="amount-cell negative"><strong>QAR ${data.summary.totalExpenses.toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Financial Summary -->
                <div class="report-section">
                    <h3 class="section-title">
                        <i class="fas fa-calculator"></i>
                        Financial Summary
                    </h3>
                    <div class="financial-summary">
                        <div class="financial-item">
                            <span class="label">Total Collections:</span>
                            <span class="value positive">QAR ${data.summary.totalCollection.toFixed(2)}</span>
                        </div>
                        <div class="financial-item">
                            <span class="label">Total Expenses:</span>
                            <span class="value negative">QAR ${data.summary.totalExpenses.toFixed(2)}</span>
                        </div>
                        <div class="financial-separator"></div>
                        <div class="financial-item total">
                            <span class="label">Net Balance:</span>
                            <span class="value ${data.summary.netBalance >= 0 ? 'positive' : 'negative'}">
                                QAR ${data.summary.netBalance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Report Footer -->
                <div class="report-footer">
                    <div class="footer-content">
                        <p><strong>Racket Warrior Badminton Group</strong></p>
                        <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                        <p>This report contains confidential information for internal use only.</p>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = reportHTML;
    },
    
    // Export to PDF
    exportToPDF: function() {
        if (!this.reportData) {
            UIUtils.showNotification('Please generate a report first', 'warning');
            return;
        }
        
        try {
            // Using window.print() for PDF export
            const originalTitle = document.title;
            document.title = `Racket Warrior Report - ${this.reportData.monthLabel}`;
            
            // Hide other elements temporarily
            const elementsToHide = document.querySelectorAll('body > *:not(.app-container)');
            const appContainer = document.querySelector('.app-container');
            const mainContent = document.querySelector('.main-content');
            const reportContent = document.getElementById('reportDocument');
            
            if (reportContent) {
                // Create a print-friendly version
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${document.title}</title>
                        <link rel="stylesheet" href="css/styles.css">
                        <style>
                            @media print {
                                body { margin: 0; padding: 20px; }
                                .report-document { box-shadow: none; }
                                .btn, .header-actions { display: none !important; }
                            }
                        </style>
                    </head>
                    <body>
                        ${reportContent.outerHTML}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
            
            document.title = originalTitle;
            UIUtils.showNotification('PDF export initiated', 'success');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            UIUtils.showNotification('Failed to export PDF', 'error');
        }
    },
    
    // Export to Image
    exportToImage: function() {
        if (!this.reportData) {
            UIUtils.showNotification('Please generate a report first', 'warning');
            return;
        }
        
        try {
            // Using html2canvas library if available, otherwise fallback message
            if (typeof html2canvas !== 'undefined') {
                const reportElement = document.getElementById('reportDocument');
                if (reportElement) {
                    html2canvas(reportElement).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `racket-warrior-report-${this.currentMonth}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                        UIUtils.showNotification('Report exported as image!', 'success');
                    });
                }
            } else {
                // Fallback: Copy report content to clipboard
                const reportElement = document.getElementById('reportDocument');
                if (reportElement) {
                    // Create a canvas manually
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 800;
                    canvas.height = 1000;
                    
                    // Fill with white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Add text content
                    ctx.fillStyle = 'black';
                    ctx.font = '20px Arial';
                    ctx.fillText('Racket Warrior - Monthly Report', 50, 50);
                    ctx.fillText(this.reportData.monthLabel, 50, 80);
                    
                    // Download the canvas
                    const link = document.createElement('a');
                    link.download = `racket-warrior-report-${this.currentMonth}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                    
                    UIUtils.showNotification('Basic report image exported!', 'success');
                }
            }
        } catch (error) {
            console.error('Error exporting image:', error);
            UIUtils.showNotification('Failed to export image', 'error');
        }
    }
};

// Export Reports module
window.Reports = Reports;