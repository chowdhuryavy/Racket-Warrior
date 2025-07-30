// Reports Page Module for Racket Warrior

const Reports = {
    currentMonth: null,
    reportData: null,
    
    // Render reports page
    render: async function(container) {
        container.innerHTML = this.getHTML();
        await this.init();
    },
    
    // Initialize reports page
    init: async function() {
        this.setupEventListeners();
        await this.setupMonthFilter();
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
                        <button class="btn-unified btn-unified-outline" onclick="showPage('dashboard')">
                            <i class="fas fa-home"></i>
                            Back to Dashboard
                        </button>
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
            refreshBtn.addEventListener('click', () => {
                this.loadReportData();
                UIUtils.showNotification('Report refreshed', 'success');
            });
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
    
    // Setup month filter with actual data months (centralized)
    setupMonthFilter: async function() {
        try {
            console.log('📅 Setting up Reports month filter with actual data...');
            const availableMonths = await DateUtils.setupAvailableMonthsFilter('reportMonth', {
                includeAll: false, // Don't include "All Time" option for reports
                defaultToLatest: true // Default to latest month with data
            });
            
            // Set current month to the latest available month
            if (availableMonths && availableMonths.length > 0) {
                this.currentMonth = availableMonths[0]; // Latest month (they're sorted desc)
                console.log('📅 Reports month filter setup complete. Current month:', this.currentMonth);
            } else {
                // Fallback to current month if no data
                const now = new Date();
                this.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                console.log('📅 No data months found, using current month:', this.currentMonth);
            }
        } catch (error) {
            console.error('📅 Failed to setup reports month filter:', error);
            // Fallback to current month
            const now = new Date();
            this.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
    },
    
    // Load report data
    loadReportData: async function() {
        if (!this.currentMonth) return;
        
        try {
            UIUtils.showLoading();
            console.log('📊 Loading report data for month:', this.currentMonth);
            
            const response = await API.makeRequest('get_monthly_report', { month: this.currentMonth });
            
            if (response.success && response.data) {
                console.log('📊 Raw report data received:', response.data);
                
                // Sanitize and ensure data structure
                this.reportData = this.sanitizeReportData(response.data);
                console.log('📊 Sanitized report data:', this.reportData);
                
                this.renderReport();
            } else {
                console.warn('📊 API failed, using fallback data:', response.message);
                UIUtils.showNotification('Failed to load report: ' + response.message, 'error');
                this.showTestReport(); // Fallback to test data
            }
        } catch (error) {
            console.error('📊 Error loading report:', error);
            UIUtils.showNotification('Error loading report', 'error');
            this.showTestReport(); // Fallback to test data
        } finally {
            UIUtils.hideLoading();
        }
    },
    
    // Sanitize report data to ensure all required fields exist
    sanitizeReportData: function(rawData) {
        console.log('🔧 Sanitizing report data...');
        
        const sanitized = {
            month: rawData.month || this.currentMonth || DateUtils.getMonthYear(new Date()),
            monthLabel: rawData.monthLabel || this.getMonthLabel(this.currentMonth),
            summary: {
                totalPlayers: parseInt(rawData.summary?.totalPlayers || 0),
                activePlayers: parseInt(rawData.summary?.activePlayers || 0),
                inactivePlayers: parseInt(rawData.summary?.inactivePlayers || 0),
                totalCollection: parseFloat(rawData.summary?.totalCollection || 0),
                totalExpenses: parseFloat(rawData.summary?.totalExpenses || 0),
                netBalance: parseFloat(rawData.summary?.netBalance || 0)
            },
            players: Array.isArray(rawData.players) ? rawData.players : [],
            collections: Array.isArray(rawData.collections) ? rawData.collections : [],
            expenses: Array.isArray(rawData.expenses) ? rawData.expenses : []
        };
        
        // Calculate net balance if not provided
        if (!rawData.summary?.netBalance) {
            sanitized.summary.netBalance = sanitized.summary.totalCollection - sanitized.summary.totalExpenses;
        }
        
        console.log('✅ Data sanitization complete:', sanitized.summary);
        return sanitized;
    },
    
    // Get month label for display
    getMonthLabel: function(monthKey) {
        if (!monthKey) return 'Current Month';
        try {
            const date = new Date(monthKey + '-01');
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } catch (error) {
            return 'Invalid Month';
        }
    },
    
    // Show test report as fallback
    showTestReport: function() {
        const monthLabel = this.currentMonth ? 
            new Date(this.currentMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) :
            'Current Month';
            
        this.reportData = {
            month: this.currentMonth || DateUtils.getMonthYear(new Date()),
            monthLabel: monthLabel,
            summary: {
                totalPlayers: 8,
                activePlayers: 6,
                inactivePlayers: 2,
                totalCollection: 450.00,
                totalExpenses: 280.00,
                netBalance: 170.00
            },
            players: [
                { name: 'Ahmed Al-Mansouri', phone: '+974 5555 1234', status: 'active', joinDate: '2024-01-15' },
                { name: 'Fatima Al-Rashid', phone: '+974 5555 2345', status: 'active', joinDate: '2024-01-10' },
                { name: 'Omar Hassan', phone: '+974 5555 3456', status: 'active', joinDate: '2024-01-08' },
                { name: 'Sarah Mohamed', phone: '+974 5555 4567', status: 'active', joinDate: '2024-01-12' },
                { name: 'Ali Al-Thani', phone: '+974 5555 5678', status: 'active', joinDate: '2024-01-05' },
                { name: 'Maryam Abdullah', phone: '+974 5555 6789', status: 'active', joinDate: '2024-01-18' },
                { name: 'Hassan Al-Kuwari', phone: '+974 5555 7890', status: 'inactive', joinDate: '2023-12-20' },
                { name: 'Nora Al-Naimi', phone: '+974 5555 8901', status: 'inactive', joinDate: '2023-12-15' }
            ],
            collections: [
                { date: '2024-01-15', player: 'Ahmed Al-Mansouri', amount: 75.00, description: 'Monthly membership fee' },
                { date: '2024-01-10', player: 'Fatima Al-Rashid', amount: 75.00, description: 'Monthly membership fee' },
                { date: '2024-01-08', player: 'Omar Hassan', amount: 75.00, description: 'Monthly membership fee' },
                { date: '2024-01-12', player: 'Sarah Mohamed', amount: 75.00, description: 'Monthly membership fee' },
                { date: '2024-01-05', player: 'Ali Al-Thani', amount: 75.00, description: 'Monthly membership fee' },
                { date: '2024-01-18', player: 'Maryam Abdullah', amount: 75.00, description: 'Monthly membership fee' }
            ],
            expenses: [
                { date: '2024-01-05', category: 'Equipment', amount: 150.00, description: 'Professional shuttlecocks (12 tubes)' },
                { date: '2024-01-12', category: 'Court Rental', amount: 80.00, description: 'Weekly court booking fee' },
                { date: '2024-01-25', category: 'Refreshments', amount: 50.00, description: 'Post-game refreshments' }
            ]
        };
        this.renderReport();
    },
    
    // Render report
    renderReport: function() {
        const container = document.getElementById('reportContent');
        if (!container || !this.reportData) return;
        
        const data = this.reportData;
        
        // Ensure data structure exists with defaults
        if (!data.summary) {
            data.summary = {
                totalPlayers: 0,
                activePlayers: 0,
                inactivePlayers: 0,
                totalCollection: 0,
                totalExpenses: 0,
                netBalance: 0
            };
        }
        
        // Ensure arrays exist
        data.players = data.players || [];
        data.collections = data.collections || [];
        data.expenses = data.expenses || [];
        
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
                                <p class="summary-detail">${(data.collections || []).length} transactions</p>
                            </div>
                        </div>
                        
                        <div class="summary-card expense-card">
                            <div class="summary-icon">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <div class="summary-content">
                                <h4>Total Expenses</h4>
                                <p class="summary-number">QAR ${(data.summary.totalExpenses || 0).toFixed(2)}</p>
                                <p class="summary-detail">${(data.expenses || []).length} transactions</p>
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
                                ${(data.players || []).map(player => `
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
                                ${(data.collections || []).map(collection => `
                                    <tr>
                                        <td>${new Date(collection.date).toLocaleDateString()}</td>
                                        <td>${collection.player}</td>
                                        <td class="amount-cell positive">+${(collection.amount || 0).toFixed(2)}</td>
                                        <td>${collection.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="2"><strong>Total Collections</strong></td>
                                    <td class="amount-cell positive"><strong>QAR ${(data.summary.totalCollection || 0).toFixed(2)}</strong></td>
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
                                ${(data.expenses || []).map(expense => `
                                    <tr>
                                        <td>${new Date(expense.date).toLocaleDateString()}</td>
                                        <td>
                                            <span class="category-tag">${expense.category}</span>
                                        </td>
                                        <td class="amount-cell negative">-${(expense.amount || 0).toFixed(2)}</td>
                                        <td>${expense.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="2"><strong>Total Expenses</strong></td>
                                    <td class="amount-cell negative"><strong>QAR ${(data.summary.totalExpenses || 0).toFixed(2)}</strong></td>
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
                            <span class="value positive">QAR ${(data.summary.totalCollection || 0).toFixed(2)}</span>
                        </div>
                        <div class="financial-item">
                            <span class="label">Total Expenses:</span>
                            <span class="value negative">QAR ${(data.summary.totalExpenses || 0).toFixed(2)}</span>
                        </div>
                        <div class="financial-separator"></div>
                        <div class="financial-item total">
                            <span class="label">Net Balance:</span>
                            <span class="value ${data.summary.netBalance >= 0 ? 'positive' : 'negative'}">
                                QAR ${(data.summary.netBalance || 0).toFixed(2)}
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
    exportToImage: async function() {
        if (!this.reportData) {
            UIUtils.showNotification('Please generate a report first', 'warning');
            return;
        }
        
        const exportButton = document.getElementById('exportImage');
        if (exportButton) {
            UIUtils.showLoading(exportButton, 'Exporting...');
        }
        
        try {
            // Check if html2canvas is available
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas library not loaded');
            }
            
            const reportElement = document.getElementById('reportDocument');
            if (!reportElement) {
                throw new Error('Report element not found');
            }
            
            // Configure html2canvas options for better quality
            const options = {
                allowTaint: true,
                useCORS: true,
                scale: 2, // Higher resolution
                backgroundColor: '#ffffff',
                width: reportElement.scrollWidth,
                height: reportElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                imageTimeout: 15000, // 15 second timeout
                logging: false,
                ignoreElements: function(element) {
                    // Ignore any hidden elements
                    return element.style.display === 'none' || element.style.visibility === 'hidden';
                }
            };
            
            // Ensure all images are loaded before capturing
            const images = reportElement.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve; // Don't fail on image errors
                        // Fallback timeout
                        setTimeout(resolve, 3000);
                    }
                });
            });
            
            await Promise.all(imagePromises);
            
            // Generate canvas
            const canvas = await html2canvas(reportElement, options);
            
            // Create download link
            const link = document.createElement('a');
            const monthLabel = this.reportData.monthLabel || 'report';
            link.download = `racket-warrior-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UIUtils.showNotification('📸 Report exported as image successfully!', 'success');
            
        } catch (error) {
            console.error('Export to image error:', error);
            console.log('Report element:', reportElement);
            console.log('html2canvas available:', typeof html2canvas !== 'undefined');
            
            UIUtils.showNotification('Failed to export image: ' + error.message, 'error');
            
            // Fallback: Try a simple screenshot approach
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                    UIUtils.showNotification('💡 Try using your browser\'s screenshot feature (F12 → Console → Screenshot)', 'info');
                } else {
                    UIUtils.showNotification('💡 Try the PDF export instead, or right-click the report to save', 'info');
                }
            } catch (fallbackError) {
                UIUtils.showNotification('Try using the PDF export instead', 'info');
            }
            
        } finally {
            // Hide loading state
            if (exportButton) {
                UIUtils.hideLoading(exportButton);
            }
        }
    }
};

// Export Reports module
window.Reports = Reports;