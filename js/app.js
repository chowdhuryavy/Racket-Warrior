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
        
        // Simple debug commands for production use
        window.debugApp = {
            clearCache: () => {
                if (API.cache) {
                    API.cache.clear();
                    console.log('✅ Cache cleared');
                }
            },
            logout: () => Auth.logout(),
            getUser: () => Auth.getCurrentUser()
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
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
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
                if (e.target !== photoFile) {
                    photoFile.click();
                }
            });
        }
        
        if (photoFile) {
            photoFile.addEventListener('change', (event) => {
                const file = event.target.files[0];
                this.handleFileSelection(file);
            });
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