// Racket Warrior - Main Application Controller
// Clean version without debug code

const App = {
    currentPage: null,
    
    // Initialize the application
    init: function() {
        // Check authentication
        if (!Auth.isAuthenticated()) {
            Auth.showLogin();
            return;
        }
        
        // Initialize state management
        AppState.init();
        ConnectionMonitor.init();
        
        // Setup mobile menu
        this.setupMobileMenu();
        
        // Setup initial page
        const savedPage = StorageUtils.get(CONFIG.STORAGE_KEYS.LAST_PAGE) || 'dashboard';
        this.showPage(savedPage, false);
        
        // Setup browser navigation
        this.setupBrowserNavigation();
        
        // Setup change photo handlers
        this.setupChangePhotoHandlers();
        
        // Setup comprehensive activity logging
        ActivityLogger.setupAutoLogging();
    },
    
    // Setup mobile menu functionality
    setupMobileMenu: function() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (event) => {
                if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            });
            
            // Close mobile menu when clicking nav links
            const navLinks = sidebar.querySelectorAll('a:not(.nav-dropdown-toggle)');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('mobile-open');
                });
            });
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
        
        // Log page visit for comprehensive tracking
        ActivityLogger.logPageVisit(page);
        
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
    
    // Load page content
    loadPageContent: function(page) {
        const contentArea = document.getElementById('pageContent');
        
        if (!contentArea) {
            Logger.error('Page content area not found');
            return;
        }
        
        // Clear existing content first
        contentArea.innerHTML = '<div class="loading-placeholder">Loading...</div>';
        
        // Load page-specific content
        switch (page) {
            case 'dashboard':
                if (window.Dashboard) {
                    Dashboard.render(contentArea);
                } else {
                    console.error('Dashboard module not found');
                }
                break;
            case 'players-add':
                if (window.Players) {
                    Players.renderAddForm(contentArea);
                } else {
                    console.error('❌ Players module not found');
                }
                break;
            case 'players-view':
                if (window.Players) {
                    Players.renderViewTable(contentArea);
                } else {
                    console.error('❌ Players module not found');
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
    
    // Update page title
    updatePageTitle: function(page) {
        const titles = {
            'dashboard': 'Dashboard',
            'players-add': 'Add Player',
            'players-view': 'Players',
            'collection-add': 'Add Collection',
            'collection-view': 'Collections',
            'expenses-add': 'Add Expense',
            'expenses-view': 'Expenses',
            'reports': 'Reports',
            'logs': 'System Logs',
            'admin': 'Administration'
        };
        
        const title = titles[page] || 'Racket Warrior';
        document.title = `${title} - Racket Warrior`;
    },
    
    // Update navigation active state
    updateNavigation: function(page) {
        // Remove active class from all nav items
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page
        const currentNavItem = document.querySelector(`[onclick="showPage('${page}')"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    },
    
    // Close mobile menu
    closeMobileMenu: function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    },
    
    // Setup browser navigation
    setupBrowserNavigation: function() {
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.showPage(event.state.page, false);
            }
        });
        
        // Handle initial hash
        const hash = window.location.hash.substring(1);
        if (hash && this.checkPagePermissions(hash)) {
            this.showPage(hash, false);
        }
    },
    
    // Setup change photo handlers
    setupChangePhotoHandlers: function() {
        // Profile photo click handler
        const profilePhoto = document.getElementById('userPhoto');
        if (profilePhoto) {
            profilePhoto.addEventListener('click', () => {
                this.showChangePhotoModal();
            });
        }
        
        // File upload area click handler
        const fileUploadArea = document.getElementById('fileUploadArea');
        if (fileUploadArea) {
            fileUploadArea.addEventListener('click', () => {
                const photoFile = document.getElementById('photoFile');
                if (photoFile) {
                    photoFile.click();
                }
            });
        }
        
        // File input change handler
        const photoFile = document.getElementById('photoFile');
        if (photoFile) {
            photoFile.addEventListener('change', (event) => {
                this.handlePhotoSelection(event);
            });
        }
        
        // Upload form submission
        const uploadForm = document.getElementById('uploadPhotoForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (event) => {
                this.handlePhotoUpload(event);
            });
        }
    },
    
    // Show change photo modal
    showChangePhotoModal: function() {
        const modal = document.getElementById('changePhotoModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Update current photo
            this.updateCurrentPhotoInModal();
        }
    },
    
    // Update current photo in modal
    updateCurrentPhotoInModal: function() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        
        const currentPhoto = document.getElementById('currentPhoto');
        if (currentPhoto) {
            const photoUrl = user.photo_url || UIUtils.generateAvatarUrl(user.username || user.email);
            currentPhoto.src = photoUrl;
        }
    },
    
    // Handle photo selection
    handlePhotoSelection: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            UIUtils.showNotification('Please select an image file', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            UIUtils.showNotification('Image size must be less than 5MB', 'error');
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        
        // Update UI
        const fileName = document.getElementById('fileName');
        if (fileName) {
            fileName.textContent = file.name;
        }
        
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
    },
    
    // Update user photo URL
    updateUserPhoto: function(photoUrl) {
        const user = Auth.getCurrentUser();
        if (user) {
            user.photo_url = photoUrl;
            Auth.setCurrentUser(user);
        }
        
        // Update profile photo
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
                currentUser.photo_url = response.data.photo_url;
                Auth.setCurrentUser(currentUser);
                
                // Update all photo displays
                this.updateUserPhoto(response.data.photo_url);
                
                UIUtils.showNotification('Photo updated successfully', 'success');
                
                // Close modal
                const modal = document.getElementById('changePhotoModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Reset form
                event.target.reset();
                const uploadSection = document.getElementById('uploadSection');
                if (uploadSection) {
                    uploadSection.style.display = 'none';
                }
                
            } else {
                UIUtils.showNotification('Failed to upload photo: ' + response.message, 'error');
            }
        } catch (error) {
            Logger.error('Photo upload error:', error);
            UIUtils.showNotification('Error uploading photo', 'error');
        } finally {
            UIUtils.hideLoading(submitButton, 'Upload Photo');
        }
    },
    
    // Adjust tables for mobile view
    adjustTablesForMobile: function() {
        const tables = document.querySelectorAll('.table, .unified-table');
        tables.forEach(table => {
            // Add mobile-responsive class if not already present
            if (!table.classList.contains('mobile-responsive')) {
                table.classList.add('mobile-responsive');
            }
        });
    }
};

// Global function for navigation
window.showPage = function(page) {
    App.showPage(page);
};

// App initialization is handled by Auth.init() in index.html



// Export App module to global scope
window.App = App;