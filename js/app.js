// Main Application Controller for Racket Warrior

const App = {
    currentPage: 'dashboard',
    currentUser: null,
    
    // Initialize the application
    init: function() {
        Logger.info('Initializing Racket Warrior App');
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 500);
        
        // Initialize authentication
        Auth.init();
        
        // Setup global event listeners
        this.setupEventListeners();
        
        // Force setup mobile menu (crucial fix)
        this.forceMobileMenuSetup();
        
        // Debug commands for troubleshooting
        window.debugApp = {
            clearCache: () => {
                if (API.cache) {
                    API.cache.clear();
                    console.log('✅ Cache cleared');
                }
            },
            logout: () => Auth.logout(),
            
            // NEW: Comprehensive debug commands
            testAuth: () => {
                const token = StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
                const user = Auth.getCurrentUser();
                console.log('🔐 Auth Status:', {
                    hasToken: !!token,
                    hasUser: !!user,
                    tokenLength: token?.length || 0,
                    user: user
                });
            },
            
            testMobile: () => App.testMobileMenu(),
            testDashboard: () => {
                if (window.debugDashboard && window.debugDashboard.manual) {
                    window.debugDashboard.manual();
                } else {
                    console.error('❌ Dashboard debug not available - loading dashboard page first...');
                    // Force load dashboard page to make debug functions available
                    if (window.showPage) {
                        showPage('dashboard');
                        setTimeout(() => {
                            if (window.debugDashboard && window.debugDashboard.manual) {
                                window.debugDashboard.manual();
                            } else {
                                console.error('❌ Dashboard debug still not available after loading page');
                            }
                        }, 1000);
                    }
                }
            },
            
            // NEW: Test available months API
            testMonths: async () => {
                console.log('📅 Testing Available Months API...');
                try {
                    const response = await API.getAvailableMonths();
                    console.log('📅 API Response:', response);
                    
                    if (response && response.success && Array.isArray(response.data)) {
                        console.log('✅ Available months:', response.data);
                        console.log('✅ Total months with data:', response.data.length);
                        
                        if (response.data.length > 0) {
                            console.log('📈 Months breakdown:');
                            response.data.forEach((month, index) => {
                                console.log(`   ${index + 1}. ${month} (${DateUtils.formatMonthForDisplay(month)})`);
                            });
                        } else {
                            console.log('ℹ️ No months with data found');
                        }
                    } else {
                        console.error('❌ Invalid response from API:', response);
                    }
                } catch (error) {
                    console.error('❌ Error testing months API:', error);
                }
            },
            
            // NEW: Ultimate dashboard test that works from anywhere
            ultimateDashboard: async () => {
                console.log('🔧 ULTIMATE DASHBOARD DEBUG (Global Version)');
                
                // Step 1: Check authentication
                const token = StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
                const user = Auth.getCurrentUser();
                console.log('1. 🔐 Auth Status:', {
                    hasToken: !!token,
                    tokenLength: token?.length || 0,
                    hasUser: !!user,
                    userRole: user?.role || 'none',
                    tokenPreview: token ? token.substring(0, 15) + '...' : 'none'
                });
                
                if (!token || !user) {
                    console.error('❌ Authentication missing');
                    console.log('💡 Suggestion: Make sure you are logged in first');
                    return;
                }
                
                // Step 2: Direct API test using low-level JSONP
                console.log('2. 📡 Testing dashboard API directly...');
                
                const params = {
                    action: 'get_dashboard_stats',
                    token: token,
                    month: null
                };
                
                const baseUrl = CONFIG.API_BASE_URL;
                const urlParams = new URLSearchParams();
                Object.keys(params).forEach(key => {
                    if (params[key] !== null && params[key] !== undefined) {
                        urlParams.append(key, params[key]);
                    }
                });
                
                const fullUrl = `${baseUrl}?${urlParams.toString()}`;
                console.log('🌐 API URL:', fullUrl.replace(/token=[^&]+/, 'token=***'));
                
                return new Promise((resolve) => {
                    const callbackName = 'global_dashboard_test_' + Date.now();
                    const script = document.createElement('script');
                    
                    window[callbackName] = function(response) {
                        console.log('3. 📥 Raw API Response:', response);
                        
                        // Clean up
                        document.head.removeChild(script);
                        delete window[callbackName];
                        
                        if (response && response.success && response.data) {
                            console.log('4. ✅ API SUCCESS! Data received:');
                            console.log('   - activePlayersCount:', response.data.activePlayersCount, typeof response.data.activePlayersCount);
                            console.log('   - totalCollection:', response.data.totalCollection, typeof response.data.totalCollection);
                            console.log('   - totalExpenses:', response.data.totalExpenses, typeof response.data.totalExpenses);
                            console.log('   - finalBalance:', response.data.finalBalance, typeof response.data.finalBalance);
                            
                            console.log('5. 🎯 Testing manual dashboard update...');
                            // Manually update dashboard elements
                            App.updateDashboardManually(response.data);
                            
                        } else {
                            console.error('4. ❌ API call failed:', response);
                            if (response && response.message) {
                                console.error('   Error message:', response.message);
                            }
                        }
                        
                        resolve(response);
                    };
                    
                    script.onerror = function() {
                        console.error('❌ JSONP request failed');
                        document.head.removeChild(script);
                        delete window[callbackName];
                        resolve(null);
                    };
                    
                    script.src = `${fullUrl}&callback=${callbackName}`;
                    document.head.appendChild(script);
                });
            },
            getUser: () => Auth.getCurrentUser(),
            fixDashboard: async () => {
                console.log('🔧 Force fixing dashboard...');
                try {
                    if (window.Dashboard) {
                        Dashboard.cachedData = null;
                        Dashboard.lastLoadTime = null;
                        if (API.cache) API.cache.clear();
                        await Dashboard.loadDashboardData();
                        console.log('✅ Dashboard fixed');
                    } else {
                        console.error('❌ Dashboard module not available');
                    }
                } catch (error) {
                    console.error('❌ Dashboard fix failed:', error);
                }
            },
            testDashboardAPI: async () => {
                console.log('🧪 Testing dashboard API...');
                try {
                    const response = await API.getDashboardStats();
                    console.log('📊 API Response:', response);
                    if (response.success && response.data && window.Dashboard) {
                        Dashboard.updateStats(response.data);
                        console.log('✅ Manual stats update completed');
                    }
                    return response;
                } catch (error) {
                    console.error('❌ API test failed:', error);
                    return error;
                }
            }
        };
        
        // Setup mobile navigation
        this.setupMobileNavigation();
        if (Auth.isAuthenticated()) {
            this.showPage('dashboard');
        }
    },
    
    // Setup global event listeners
    setupEventListeners: function() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.showPage(event.state.page, false);
            }
        });
        
        // Handle window resize for responsive adjustments
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle clicks outside dropdowns to close them
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    },
    
    // Setup mobile navigation
    setupMobileNavigation: function() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        // Create overlay for mobile
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
        document.body.appendChild(overlay);
    },
    
    // Toggle mobile menu
    toggleMobileMenu: function() {
        console.log('🔄 toggleMobileMenu called');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        console.log('📱 Mobile menu elements:', {
            sidebar: !!sidebar,
            overlay: !!overlay,
            sidebarClasses: sidebar?.className || 'not found',
            overlayClasses: overlay?.className || 'not found',
            windowWidth: window.innerWidth
        });
        
        if (sidebar) {
            const isShowing = sidebar.classList.contains('show');
            if (isShowing) {
                sidebar.classList.remove('show');
                console.log('📱 Closing sidebar');
            } else {
                sidebar.classList.add('show');
                console.log('📱 Opening sidebar');
            }
            console.log('📱 Sidebar now has classes:', sidebar.className);
        } else {
            console.error('❌ Sidebar element not found!');
        }
        
        if (overlay) {
            const isShowing = overlay.classList.contains('show');
            if (isShowing) {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            } else {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
            console.log('📱 Overlay now has classes:', overlay.className);
        } else {
            console.error('❌ Overlay element not found!');
        }
    },
    
    // Close mobile menu
    closeMobileMenu: function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.remove('show');
        }
        if (overlay) {
            overlay.classList.remove('show');
        }
    },
    
    // Test function for mobile menu debugging
    testMobileMenu: function() {
        console.log('🧪 Testing Mobile Menu...');
        
        // Check if elements exist
        const button = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        console.log('📱 Elements check:', {
            button: !!button,
            sidebar: !!sidebar,
            overlay: !!overlay,
            windowWidth: window.innerWidth,
            isMobile: window.innerWidth <= 768
        });
        
        if (button) {
            console.log('📱 Button styles:', {
                display: getComputedStyle(button).display,
                visibility: getComputedStyle(button).visibility,
                pointerEvents: getComputedStyle(button).pointerEvents
            });
        }
        
        if (sidebar) {
            console.log('📱 Sidebar styles:', {
                transform: getComputedStyle(sidebar).transform,
                position: getComputedStyle(sidebar).position,
                zIndex: getComputedStyle(sidebar).zIndex,
                classes: sidebar.className
            });
        }
        
        // Try to trigger manually
        if (button) {
            console.log('📱 Triggering button click manually...');
            button.click();
        }
    },
    
    // Force mobile menu setup (new function)
    forceMobileMenuSetup: function() {
        console.log('📱 Setting up mobile menu...');
        
        setTimeout(() => {
            const mobileToggle = document.getElementById('mobileMenuToggle');
            if (mobileToggle) {
                console.log('📱 Force setting up mobile menu button...');
                
                // Remove any existing listeners
                const newToggle = mobileToggle.cloneNode(true);
                mobileToggle.parentNode.replaceChild(newToggle, mobileToggle);
                
                // Add fresh listener
                newToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📱 Mobile menu button clicked!');
                    this.toggleMobileMenu();
                });
                
                console.log('✅ Mobile menu button setup complete');
            } else {
                console.error('❌ Mobile menu button not found during force setup');
            }
        }, 1000); // Wait 1 second for DOM to be ready
    },
    
    // Manual dashboard update function (works without dashboard page loaded)
    updateDashboardManually: function(data) {
        console.log('🎯 Manually updating dashboard elements with data:', data);
        
        // Find dashboard elements
        const activePlayersElement = document.getElementById('activePlayersCount');
        const totalCollectionElement = document.getElementById('totalCollectionAmount');
        const totalExpenseElement = document.getElementById('totalExpenseAmount');
        const finalBalanceElement = document.getElementById('finalBalanceAmount');
        
        console.log('📍 Dashboard elements found:', {
            activePlayersElement: !!activePlayersElement,
            totalCollectionElement: !!totalCollectionElement,
            totalExpenseElement: !!totalExpenseElement,
            finalBalanceElement: !!finalBalanceElement
        });
        
        if (!activePlayersElement) {
            console.log('❌ Dashboard elements not found - dashboard page not loaded');
            console.log('💡 Suggestion: Navigate to dashboard page first');
            return;
        }
        
        // Update elements manually
        try {
            // Active Players
            const count = data.activePlayersCount !== undefined ? data.activePlayersCount : 0;
            activePlayersElement.textContent = count;
            console.log('✅ Updated activePlayersCount to:', count);
            
            // Total Collection
            const collection = data.totalCollection !== undefined ? data.totalCollection : 0;
            if (totalCollectionElement) {
                totalCollectionElement.textContent = this.formatCurrency(collection);
                console.log('✅ Updated totalCollection to:', collection);
            }
            
            // Total Expenses
            const expenses = data.totalExpenses !== undefined ? data.totalExpenses : 0;
            if (totalExpenseElement) {
                totalExpenseElement.textContent = this.formatCurrency(expenses);
                console.log('✅ Updated totalExpenses to:', expenses);
            }
            
            // Final Balance
            const balance = data.finalBalance !== undefined ? data.finalBalance : 0;
            if (finalBalanceElement) {
                finalBalanceElement.textContent = this.formatCurrency(balance);
                console.log('✅ Updated finalBalance to:', balance);
            }
            
            // Monthly summary elements
            const monthlyIncomeElement = document.getElementById('monthlyIncome');
            const monthlyExpensesElement = document.getElementById('monthlyExpenses');
            const monthlyNetElement = document.getElementById('monthlyNet');
            
            if (monthlyIncomeElement) {
                monthlyIncomeElement.textContent = this.formatCurrency(collection);
                console.log('✅ Updated monthly income');
            }
            
            if (monthlyExpensesElement) {
                monthlyExpensesElement.textContent = this.formatCurrency(expenses);
                console.log('✅ Updated monthly expenses');
            }
            
            if (monthlyNetElement) {
                monthlyNetElement.textContent = this.formatCurrency(balance);
                console.log('✅ Updated monthly net');
            }
            
            console.log('🎉 Manual dashboard update completed!');
            
        } catch (error) {
            console.error('❌ Error updating dashboard elements:', error);
        }
    },
    
    // Helper function to format currency
    formatCurrency: function(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return 'QAR 0.00';
        }
        return `QAR ${parseFloat(amount).toFixed(2)}`;
    },
    
    // Handle window resize
    handleResize: function() {
        // Close mobile menu on desktop
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
        
        // Adjust table layouts for mobile
        this.adjustTablesForMobile();
    },
    
    // Handle global clicks
    handleGlobalClick: function(event) {
        // Close profile dropdown if clicking outside
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileDropdown && profileDropdown.classList.contains('show')) {
            if (!event.target.closest('.user-profile')) {
                profileDropdown.classList.remove('show');
            }
        }
    },
    
    // Handle keyboard shortcuts
    handleKeyboardShortcuts: function(event) {
        // Only handle shortcuts when not typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Alt + D = Dashboard
        if (event.altKey && event.key === 'd') {
            event.preventDefault();
            this.showPage('dashboard');
        }
        
        // Alt + P = Players
        if (event.altKey && event.key === 'p') {
            event.preventDefault();
            this.showPage('players-view');
        }
        
        // Alt + C = Collections
        if (event.altKey && event.key === 'c') {
            event.preventDefault();
            this.showPage('collection-view');
        }
        
        // Alt + E = Expenses
        if (event.altKey && event.key === 'e') {
            event.preventDefault();
            this.showPage('expenses-view');
        }
        
        // Alt + R = Reports
        if (event.altKey && event.key === 'r') {
            event.preventDefault();
            this.showPage('reports');
        }
        
        // Escape = Close modals
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.modal.show');
            if (activeModal) {
                activeModal.classList.remove('show');
                setTimeout(() => activeModal.remove(), 300);
            }
        }
    },
    
    // Show specific page
    showPage: function(page, updateHistory = true) {
        if (!Auth.isAuthenticated()) {
            Logger.warn('User not authenticated, redirecting to login');
            Auth.showLogin();
            return;
        }
        
        Logger.info(`Navigating to page: ${page}`);
        
        // Check permissions
        if (!this.checkPagePermissions(page)) {
            UIUtils.showNotification('You do not have permission to access this page', 'error');
            return;
        }
        
        // Update current page
        this.currentPage = page;
        
        // Update page title
        this.updatePageTitle(page);
        
        // Update navigation active state
        this.updateNavigation(page);
        
        // Load page content
        this.loadPageContent(page);
        
        // Update browser history
        if (updateHistory) {
            history.pushState({ page: page }, '', `#${page}`);
        }
        
        // Close mobile menu if open
        this.closeMobileMenu();
        
        // Store last page
        StorageUtils.set(CONFIG.STORAGE_KEYS.LAST_PAGE, page);
    },
    
    // Check page permissions
    checkPagePermissions: function(page) {
        const user = Auth.getCurrentUser();
        if (!user) return false;
        
        // Admin pages - only admin role can access
        if ((page === 'admin' || page === 'logs') && user.role !== 'admin') {
            return false;
        }
        
        // Add/Edit pages - admin and view_edit roles can access
        if (page.includes('-add') || page.includes('-edit')) {
            if (user.role !== 'admin' && user.role !== 'view_edit') {
                return false;
            }
        }
        
        return true;
    },
    
    // Update page title
    updatePageTitle: function(page) {
        const pageTitles = {
            'dashboard': 'Dashboard',
            'players-add': 'Add Player',
            'players-view': 'Players',
            'collection-add': 'Add Collection',
            'collection-view': 'Collections',
            'expenses-add': 'Add Expense',
            'expenses-view': 'Expenses',
            'reports': 'Reports',
            'logs': 'System Logs',
            'admin': 'Admin Panel'
        };
        
        const title = pageTitles[page] || 'Racket Warrior';
        document.getElementById('pageTitle').textContent = title;
        document.title = `${title} - Racket Warrior`;
    },
    
    // Update navigation active state
    updateNavigation: function(page) {
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.sidebar-nav a');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to current page
        const activeItem = document.querySelector(`[onclick="showPage('${page}')"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    },
    
    // Load page content
    loadPageContent: function(page) {
        const contentArea = document.getElementById('pageContent');
        
        if (!contentArea) {
            Logger.error('Page content area not found');
            return;
        }
        
        // Load page-specific content immediately (UI is local)
        switch (page) {
                case 'dashboard':
                    if (window.Dashboard) {
                        Dashboard.render(contentArea);
                    }
                    break;
                case 'players-add':
                    if (window.Players) {
                        Players.renderAddForm(contentArea);
                    }
                    break;
                case 'players-view':
                    if (window.Players) {
                        Players.renderViewTable(contentArea);
                    }
                    break;
                case 'collection-add':
                    if (window.Collection) {
                        Collection.renderAddForm(contentArea);
                    }
                    break;
                case 'collection-view':
                    if (window.Collection) {
                        Collection.renderViewTable(contentArea);
                    }
                    break;
                case 'expenses-add':
                    if (window.Expenses) {
                        Expenses.renderAddForm(contentArea);
                    }
                    break;
                case 'expenses-view':
                    if (window.Expenses) {
                        Expenses.renderViewTable(contentArea);
                    }
                    break;
                case 'reports':
                    if (window.Reports) {
                        Reports.render(contentArea);
                    }
                    break;
                case 'logs':
                    if (window.Logs) {
                        Logs.render(contentArea);
                    }
                    break;
                case 'admin':
                    if (window.Admin) {
                        Admin.render(contentArea);
                    }
                    break;
                default:
                    contentArea.innerHTML = `
                        <div class="text-center" style="padding: 3rem;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--warning-color); margin-bottom: 1rem;"></i>
                            <h2>Page Not Found</h2>
                            <p style="color: var(--text-secondary); margin-bottom: 2rem;">The page you're looking for doesn't exist.</p>
                            <button class="btn btn-primary" onclick="showPage('dashboard')">
                                <i class="fas fa-home"></i>
                                Go to Dashboard
                            </button>
                        </div>
                    `;
        }
    },
    
    // Adjust tables for mobile view
    adjustTablesForMobile: function() {
        const tables = document.querySelectorAll('.table');
        
        tables.forEach(table => {
            if (window.innerWidth <= 576) {
                table.classList.add('table-mobile');
                
                // Add data labels for mobile view
                const rows = table.querySelectorAll('tbody tr');
                const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    cells.forEach((cell, index) => {
                        if (headers[index]) {
                            cell.setAttribute('data-label', headers[index]);
                        }
                    });
                });
            } else {
                table.classList.remove('table-mobile');
            }
        });
    },
    
    // Show change photo modal
    showChangePhoto: function() {
        const modal = UIUtils.createModal({
            title: '📷 Change Profile Photo',
            content: this.getChangePhotoContent(),
            showCloseButton: true
        });
        
        this.setupChangePhotoHandlers();
    },
    
    // Get change photo modal content
    getChangePhotoContent: function() {
        return `
            <div class="photo-upload-container">
                <div class="current-photo-section">
                    <h4><i class="fas fa-user-circle"></i> Current Photo</h4>
                    <div class="current-photo-display">
                        <img id="currentPhoto" src="${Auth.getCurrentUser().photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(Auth.getCurrentUser().name)}&background=667eea&color=fff&size=200`}" alt="Current Photo" class="current-photo-img">
                    </div>
                </div>
                
                <div class="upload-section">
                    <h4><i class="fas fa-upload"></i> Upload New Photo</h4>
                    <form id="changePhotoForm" class="photo-upload-form">
                        <div class="file-upload-area" id="fileUploadArea">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <p class="upload-text">
                                <strong>Click to select</strong> or drag and drop your photo here
                            </p>
                            <p class="upload-info">
                                Maximum file size: 5MB<br>
                                Supported formats: JPG, PNG, GIF
                            </p>
                            <input type="file" id="photoFile" accept="image/*" required class="file-input">
                        </div>
                        
                        <div id="photoPreview" class="photo-preview" style="display: none;">
                            <h5><i class="fas fa-eye"></i> Preview</h5>
                            <img id="previewImage" class="preview-img">
                            <button type="button" class="btn-remove-preview" onclick="App.removePhotoPreview()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-unified btn-unified-secondary" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                            <button type="submit" class="btn-unified btn-unified-primary" disabled id="uploadPhotoBtn">
                                <i class="fas fa-upload"></i>
                                Upload Photo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },
    
    // Setup change photo form handlers
    setupChangePhotoHandlers: function() {
        const photoFile = document.getElementById('photoFile');
        const photoPreview = document.getElementById('photoPreview');
        const previewImage = document.getElementById('previewImage');
        const uploadButton = document.getElementById('uploadPhotoBtn');
        const changePhotoForm = document.getElementById('changePhotoForm');
        const fileUploadArea = document.getElementById('fileUploadArea');
        
        // Setup drag and drop
        if (fileUploadArea) {
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });
            
            fileUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
            });
            
            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    photoFile.files = files;
                    this.handleFileSelection(files[0]);
                }
            });
            
            fileUploadArea.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📸 File upload area clicked, target:', e.target);
                
                // Find the file input (it might be recreated dynamically)
                const currentPhotoFile = document.getElementById('photoFile');
                if (currentPhotoFile) {
                    console.log('📸 Triggering photo file input...');
                    currentPhotoFile.click();
                } else {
                    console.error('❌ Photo file input not found!');
                    UIUtils.showNotification('❌ Photo upload not available', 'error');
                }
            });
        }
        
        if (photoFile) {
            photoFile.addEventListener('change', (event) => {
                console.log('Photo file input changed, files:', event.target.files);
                const file = event.target.files[0];
                if (file) {
                    console.log('File selected:', file.name, file.size, file.type);
                    this.handleFileSelection(file);
                } else {
                    console.log('No file selected');
                }
            });
        } else {
            console.error('Photo file input not found!');
        }
        
        if (changePhotoForm) {
            changePhotoForm.addEventListener('submit', this.handlePhotoUpload.bind(this));
        }
    },
    
    // Handle file selection
    handleFileSelection: function(file) {
        const photoPreview = document.getElementById('photoPreview');
        const previewImage = document.getElementById('previewImage');
        const uploadButton = document.getElementById('uploadPhotoBtn');
        
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                UIUtils.showNotification('File size must be less than 5MB', 'error');
                this.removePhotoPreview();
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                UIUtils.showNotification('Please select a valid image file', 'error');
                this.removePhotoPreview();
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                photoPreview.style.display = 'block';
                uploadButton.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            this.removePhotoPreview();
        }
    },
    
    // Remove photo preview
    removePhotoPreview: function() {
        const photoFile = document.getElementById('photoFile');
        const photoPreview = document.getElementById('photoPreview');
        const uploadButton = document.getElementById('uploadPhotoBtn');
        
        if (photoFile) photoFile.value = '';
        if (photoPreview) photoPreview.style.display = 'none';
        if (uploadButton) uploadButton.disabled = true;
    },
    
    // Update user photo in UI
    updateUserPhoto: function(photoUrl) {
        // Update profile photo in header
        const userPhoto = document.getElementById('userPhoto');
        if (userPhoto) {
            userPhoto.src = photoUrl;
        }
        
        // Update current photo in modal if open
        const currentPhoto = document.getElementById('currentPhoto');
        if (currentPhoto) {
            currentPhoto.src = photoUrl;
        }
        
        // Update any other photo instances
        const userAvatars = document.querySelectorAll('.user-avatar, .profile-avatar');
        userAvatars.forEach(avatar => {
            if (avatar.tagName === 'IMG') {
                avatar.src = photoUrl;
            }
        });
    },
    
    // Handle photo upload
    handlePhotoUpload: async function(event) {
        event.preventDefault();
        
        const photoFile = document.getElementById('photoFile').files[0];
        if (!photoFile) {
            UIUtils.showNotification('Please select a photo', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Uploading...');
        
        try {
            const fileName = `profile_${Auth.getCurrentUser().email}_${Date.now()}.${photoFile.name.split('.').pop()}`;
            
            const response = await API.uploadPhoto(photoFile, fileName);
            
            if (response.success) {
                // Update user profile photo
                const currentUser = Auth.getCurrentUser();
                currentUser.photo_url = response.data.photo_url; // Fixed to match backend response structure
                Auth.setCurrentUser(currentUser);
                
                // Update auth token if provided
                if (response.data.token) {
                    StorageUtils.set(CONFIG.STORAGE_KEYS.AUTH_TOKEN, response.data.token);
                }
                
                // Update UI
                this.updateUserPhoto(response.data.photo_url);
                Auth.updateUserProfile();
                
                UIUtils.showNotification(response.message || '✅ Profile photo updated successfully!', 'success');
                
                // Close modal
                event.target.closest('.modal').remove();
            } else {
                UIUtils.showNotification(response.message || 'Failed to upload photo', 'error');
            }
        } catch (error) {
            console.error('Photo upload error details:', error);
            Logger.error('Photo upload error', error);
            UIUtils.showNotification('Failed to upload photo: ' + error.message, 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Get current page
    getCurrentPage: function() {
        return this.currentPage;
    },
    
    // Refresh current page
    refreshCurrentPage: function() {
        this.showPage(this.currentPage, false);
    }
};

// Global functions for HTML onclick handlers
window.showPage = function(page) {
    App.showPage(page);
};

window.showChangePhoto = function() {
    App.showChangePhoto();
};

window.removePhotoPreview = function() {
    App.removePhotoPreview();
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after a short delay to show the animation
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Initialize the app
        App.init();
    }, 1000);
});

// Export App module
window.App = App;

// Make mobile menu test available globally
window.testMobileMenu = () => App.testMobileMenu();

// Make ultimate dashboard test available globally
window.testDashboard = () => debugApp.ultimateDashboard();

// Quick dashboard test function (available immediately)
window.quickDashboardTest = async function() {
    console.log('🚀 QUICK DASHBOARD TEST STARTING...');
    
    // Step 1: Check if we're logged in
    const token = localStorage.getItem('racket_warrior_token');
    const userJson = localStorage.getItem('racket_warrior_user');
    
    console.log('1. 🔐 Authentication Check:', {
        hasToken: !!token,
        hasUser: !!userJson,
        tokenLength: token?.length || 0
    });
    
    if (!token || !userJson) {
        console.error('❌ Not logged in! Please login first.');
        return;
    }
    
    // Step 2: Navigate to dashboard if not already there
    if (typeof showPage === 'function') {
        console.log('2. 📍 Navigating to dashboard...');
        showPage('dashboard');
        
        // Wait for page to load
        setTimeout(async () => {
            console.log('3. 📡 Testing API call...');
            await debugApp.ultimateDashboard();
        }, 1500);
    } else {
        console.log('2. 📡 Testing API directly...');
        await debugApp.ultimateDashboard();
    }
};