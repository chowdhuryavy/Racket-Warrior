// Configuration
const CONFIG = {
    // Replace with your actual Google Apps Script Web App URL
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyXcvA0LNt_ZWxGgx3dgJK9U5hVIrZg7ovzKOkt8M8kxbMrbdbiG5mBgPP-yqaYNOHtVA/exec',
    MONTHS: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
};

// Global state
let currentUser = null;
let currentPage = 'dashboard';
let cachedData = {
    players: [],
    income: [],
    expenses: [],
    users: [],
    logs: []
};
let notificationTimeout = null;
let playersData = [];
let collectionsData = [];
let expensesData = [];

// Forgot Password Flow Management
let currentForgotStep = 1;
let forgotEmailCache = '';
let forgotOTPCache = '';

// Main Application Controller for Racket Warrior

const App = {
    currentPage: 'dashboard',
    currentUser: null,
    
    // Initialize the application
    init: function() {
        Logger.info('Initializing Racket Warrior App');
        
        // Initialize authentication first
        Auth.init();
        
        // Setup global event listeners
        this.setupEventListeners();
        
        // Setup mobile navigation
        this.setupMobileNavigation();
        
        // Load default page if authenticated
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
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    },
    
    // Close mobile menu
    closeMobileMenu: function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
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
        
        // Admin pages
        if ((page === 'admin' || page === 'logs') && !Auth.hasPermission('admin')) {
            return false;
        }
        
        // Add/Edit pages
        if (page.includes('-add') || page.includes('-edit')) {
            if (!Auth.hasPermission('add') && !Auth.hasPermission('edit')) {
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
        
        // Show loading state
        UIUtils.showLoading(contentArea, 'Loading page...');
        
        // Load page-specific content
        setTimeout(() => {
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
        }, 300);
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
            <form id="changePhotoForm">
                <div class="form-group">
                    <label for="photoFile">Select Photo</label>
                    <input type="file" id="photoFile" accept="image/*" required style="width: 100%; padding: 12px; border: 2px dashed var(--border-color); border-radius: var(--border-radius); background: var(--bg-secondary);">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">
                        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                    </small>
                </div>
                
                <div id="photoPreview" style="display: none; text-align: center; margin: 1rem 0;">
                    <img id="previewImage" style="max-width: 200px; max-height: 200px; border-radius: 50%; border: 3px solid var(--border-color);">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" disabled id="uploadPhotoBtn">
                        <i class="fas fa-upload"></i>
                        Upload Photo
                    </button>
                </div>
            </form>
        `;
    },
    
    // Setup change photo form handlers
    setupChangePhotoHandlers: function() {
        const photoFile = document.getElementById('photoFile');
        const photoPreview = document.getElementById('photoPreview');
        const previewImage = document.getElementById('previewImage');
        const uploadButton = document.getElementById('uploadPhotoBtn');
        const changePhotoForm = document.getElementById('changePhotoForm');
        
        if (photoFile) {
            photoFile.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    // Validate file
                    const validation = FileUtils.validateFile(file);
                    if (!validation.isValid) {
                        UIUtils.showNotification(validation.errors.join(', '), 'error');
                        photoFile.value = '';
                        photoPreview.style.display = 'none';
                        uploadButton.disabled = true;
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
                    photoPreview.style.display = 'none';
                    uploadButton.disabled = true;
                }
            });
        }
        
        if (changePhotoForm) {
            changePhotoForm.addEventListener('submit', this.handlePhotoUpload.bind(this));
        }
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
            // Convert file to base64
            const photoData = await FileUtils.toBase64(photoFile);
            const fileName = `profile_${Auth.getCurrentUser().id}_${Date.now()}.${photoFile.name.split('.').pop()}`;
            
            const response = await API.uploadPhoto(photoData, fileName);
            
            if (response.success) {
                // Update user profile photo
                const currentUser = Auth.getCurrentUser();
                currentUser.photo_url = response.photoUrl;
                StorageUtils.set(CONFIG.STORAGE_KEYS.USER_DATA, currentUser);
                
                // Update UI
                Auth.updateUserProfile();
                
                UIUtils.showNotification('Profile photo updated successfully!', 'success');
                
                // Close modal
                event.target.closest('.modal').remove();
            } else {
                UIUtils.showNotification(response.message || 'Failed to upload photo', 'error');
            }
        } catch (error) {
            Logger.error('Photo upload error', error);
            UIUtils.showNotification('Failed to upload photo. Please try again.', 'error');
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