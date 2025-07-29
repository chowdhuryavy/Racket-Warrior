// Authentication Module for Racket Warrior App

const Auth = {
    currentUser: null,
    
    // Initialize authentication
    init: function() {
        Logger.debug('Initializing authentication module');
        
        // Check for existing session
        const userData = StorageUtils.get(CONFIG.STORAGE_KEYS.USER_DATA);
        const token = StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        
        if (userData && token) {
            this.currentUser = userData;
            Logger.info('Existing session found', userData);
            
            // Check if password change is required FIRST
            if (userData.needs_password_change) {
                Logger.info('Password change required for user');
                // Show login container but immediately show password change modal
                this.showLogin();
                setTimeout(() => {
                    this.showChangePasswordModal(true);
                }, 500);
            } else {
                this.showApp();
                // Refresh user data from server to get latest photo
                this.refreshUserData();
            }
        } else {
            this.showLogin();
        }
        
        // Setup login form
        this.setupLoginForm();
    },
    
    // Setup login form event listeners
    setupLoginForm: function() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Setup password toggle
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('input', this.handlePasswordInput.bind(this));
        }
    },
    
    // Handle login form submission
    handleLogin: async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            UIUtils.showNotification('Please enter both email and password', 'error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            UIUtils.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Signing in...');
        
        try {
            const response = await API.login({ username: email, password });
            
            if (response.success) {
                // Store user data and token
                this.currentUser = response.user;
                StorageUtils.set(CONFIG.STORAGE_KEYS.USER_DATA, response.user);
                StorageUtils.set(CONFIG.STORAGE_KEYS.AUTH_TOKEN, response.token);
                
                // Log the login
                await API.addLog('LOGIN', 'User logged in');
                
                UIUtils.showNotification('Login successful!', 'success');
                
                // Check if password change is required
                if (response.user.needs_password_change) {
                    this.showChangePasswordModal(true);
                } else {
                    this.showApp();
                }
            } else {
                UIUtils.showNotification(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            Logger.error('Login error', error);
            UIUtils.showNotification('Login failed. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Handle password input for real-time validation
    handlePasswordInput: function(event) {
        const password = event.target.value;
        // You can add real-time password strength indicator here
    },
    
    // Show loading screen
    showLoadingScreen: function() {
        document.getElementById('loadingScreen').style.display = 'flex';
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'none';
    },

    // Show login page
    showLogin: function() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    },
    
    // Show main app
    showApp: function() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        
        // Update user profile in header
        this.updateUserProfile();
        
        // Setup role-based navigation
        this.setupRoleBasedNavigation();
        
        // Load dashboard page
        if (window.App && typeof window.App.showPage === 'function') {
            window.App.showPage('dashboard');
        }
    },
    
    // Update user profile display
    updateUserProfile: function() {
        if (!this.currentUser) return;
        
        Logger.debug('Updating user profile with data:', this.currentUser);
        Logger.debug('User photo URL:', this.currentUser.photo_url);
        
        const userName = document.getElementById('userName');
        const userPhoto = document.getElementById('userPhoto');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserPhoto = document.getElementById('dropdownUserPhoto');
        const userRole = document.getElementById('userRole');
        
        const photoUrl = this.currentUser.photo_url || CONFIG.DEFAULTS.USER_PHOTO;
        Logger.debug('Final photo URL to use:', photoUrl);
        
        if (userName) userName.textContent = this.currentUser.name;
        if (userPhoto) {
            userPhoto.src = photoUrl;
            Logger.debug('Set userPhoto src to:', photoUrl);
        }
        if (dropdownUserName) dropdownUserName.textContent = this.currentUser.name;
        if (dropdownUserPhoto) {
            dropdownUserPhoto.src = photoUrl;
            Logger.debug('Set dropdownUserPhoto src to:', photoUrl);
        }
        if (userRole) {
            const roleInfo = PermissionUtils.getRoleInfo(this.currentUser.role);
            userRole.textContent = `${roleInfo.icon} ${roleInfo.name}`;
        }
    },
    
    // Setup role-based navigation visibility
    setupRoleBasedNavigation: function() {
        if (!this.currentUser) return;
        
        const userRole = this.currentUser.role;
        const navItems = document.querySelectorAll('[data-role]');
        
        navItems.forEach(item => {
            const allowedRoles = item.getAttribute('data-role').split(',');
            const hasAccess = allowedRoles.includes(userRole);
            item.style.display = hasAccess ? '' : 'none';
        });
    },
    
    // Show forgot password modal
    showForgotPassword: function() {
        const modal = UIUtils.createModal({
            title: '🔒 Reset Your Password',
            content: this.getForgotPasswordContent(),
            showCloseButton: true
        });
        
        this.currentForgotPasswordModal = modal;
        this.forgotEmail = '';
        this.currentStep = 1;
        
        // Setup initial step and event handlers after modal is rendered
        setTimeout(() => {
            this.showForgotStep(1);
        }, 100);
    },
    
    // Remove existing event handlers to prevent duplicates
    removeForgotPasswordHandlers: function() {
        const forgotForm = document.getElementById('forgotPasswordForm');
        const otpForm = document.getElementById('otpVerificationForm');
        const resetForm = document.getElementById('resetPasswordForm');
        
        if (forgotForm && this._forgotFormHandler) {
            forgotForm.removeEventListener('submit', this._forgotFormHandler);
        }
        if (otpForm && this._otpFormHandler) {
            otpForm.removeEventListener('submit', this._otpFormHandler);
        }
        if (resetForm && this._resetFormHandler) {
            resetForm.removeEventListener('submit', this._resetFormHandler);
        }
    },
    
    // Resend OTP
    resendOTP: async function() {
        if (!this.forgotEmail) {
            UIUtils.showNotification('Session expired. Please start over.', 'error');
            this.showForgotStep(1);
            return;
        }
        
        try {
            const response = await API.forgotPassword(this.forgotEmail);
            
            if (response.success) {
                UIUtils.showNotification('✅ New verification code sent!', 'success');
            } else {
                UIUtils.showNotification(response.message || 'Failed to resend code.', 'error');
            }
        } catch (error) {
            Logger.error('Resend OTP error', error);
            UIUtils.showNotification('Failed to resend code. Please try again.', 'error');
        }
    },
    
    // Get forgot password modal content
    getForgotPasswordContent: function() {
        return `
            <!-- Step 1: Email Input -->
            <div id="forgotStep1" class="forgot-step active">
                <div class="forgot-header">
                    <div class="forgot-icon-container">
                        <div class="forgot-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                    </div>
                    <h3>Reset Your Password</h3>
                    <p>Enter your email address and we'll send you a verification code</p>
                </div>
                
                <form id="forgotPasswordForm" class="forgot-form">
                    <div class="form-group">
                        <label for="forgotEmail">
                            <i class="fas fa-envelope"></i>
                            Email Address
                        </label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="forgotEmail" placeholder="Enter your email address" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-unified btn-unified-secondary" onclick="Auth.currentForgotPasswordModal.hide()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn-unified btn-unified-primary">
                            <i class="fas fa-paper-plane"></i>
                            Send Code
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Step 2: OTP Verification -->
            <div id="forgotStep2" class="forgot-step">
                <div class="forgot-header">
                    <div class="forgot-icon-container">
                        <div class="forgot-icon success">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                    </div>
                    <h3>Verify Your Email</h3>
                    <p>We've sent a verification code to:</p>
                    <div class="email-highlight">
                        <i class="fas fa-envelope"></i>
                        <span class="email-display">your email</span>
                    </div>
                    <p class="otp-instruction">Please enter the 6-digit code below:</p>
                </div>
                
                <form id="otpVerificationForm" class="forgot-form">
                    <div class="form-group">
                        <label for="otpCode">
                            <i class="fas fa-key"></i>
                            Verification Code
                        </label>
                        <div class="input-wrapper">
                            <i class="fas fa-key"></i>
                            <input type="text" id="otpCode" placeholder="000000" required maxlength="6" class="otp-input">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-unified btn-unified-secondary" onclick="Auth.showForgotStep(1)">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <button type="submit" class="btn-unified btn-unified-primary">
                            <i class="fas fa-check"></i>
                            Verify Code
                        </button>
                    </div>
                    <div class="resend-section">
                        <p>Didn't receive the code?</p>
                        <button type="button" class="btn-link" onclick="Auth.resendOTP()">
                            <i class="fas fa-redo"></i>
                            Resend Code
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Step 3: New Password -->
            <div id="forgotStep3" class="forgot-step">
                <div class="forgot-header">
                    <div class="forgot-icon-container">
                        <div class="forgot-icon warning">
                            <i class="fas fa-lock"></i>
                        </div>
                    </div>
                    <h3>Create New Password</h3>
                    <p>Choose a strong password to secure your account</p>
                </div>
                
                <form id="resetPasswordForm" class="forgot-form">
                    <div class="form-group">
                        <label for="newPassword">
                            <i class="fas fa-lock"></i>
                            New Password
                        </label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="newPassword" placeholder="Enter new password" required>
                            <span class="password-toggle" onclick="togglePassword('newPassword')">
                                <i class="fas fa-eye"></i>
                            </span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">
                            <i class="fas fa-check-circle"></i>
                            Confirm Password
                        </label>
                        <div class="input-wrapper">
                            <i class="fas fa-check-circle"></i>
                            <input type="password" id="confirmPassword" placeholder="Confirm new password" required>
                            <span class="password-toggle" onclick="togglePassword('confirmPassword')">
                                <i class="fas fa-eye"></i>
                            </span>
                        </div>
                    </div>
                    
                    <div class="password-requirements">
                        <h4><i class="fas fa-shield-alt"></i> Password Requirements:</h4>
                        <div class="requirements-grid">
                            <div class="requirement-item" id="req-length">
                                <i class="fas fa-times requirement-icon"></i>
                                <span>At least 8 characters</span>
                            </div>
                            <div class="requirement-item" id="req-uppercase">
                                <i class="fas fa-times requirement-icon"></i>
                                <span>One uppercase letter</span>
                            </div>
                            <div class="requirement-item" id="req-lowercase">
                                <i class="fas fa-times requirement-icon"></i>
                                <span>One lowercase letter</span>
                            </div>
                            <div class="requirement-item" id="req-number">
                                <i class="fas fa-times requirement-icon"></i>
                                <span>One number</span>
                            </div>
                            <div class="requirement-item" id="req-special">
                                <i class="fas fa-times requirement-icon"></i>
                                <span>One special character</span>
                            </div>
                            <div class="requirement-item" id="req-match">
                                <i class="fas fa-times requirement-icon"></i>
                                <span>Passwords match</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-unified btn-unified-secondary" onclick="Auth.showForgotStep(2)">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <button type="submit" class="btn-unified btn-unified-primary" id="resetPasswordBtn" disabled>
                            <i class="fas fa-lock"></i>
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        `;
    },
    
    // Show specific step in forgot password process
    showForgotStep: function(step) {
        for (let i = 1; i <= 3; i++) {
            const stepElement = document.getElementById(`forgotStep${i}`);
            if (stepElement) {
                stepElement.style.display = i === step ? 'block' : 'none';
            }
        }
        
        this.currentStep = step;
        
        // Setup form handlers for the current step
        this.setupForgotPasswordHandlers(step);
        
        // Focus on first input of the current step
        setTimeout(() => {
            const activeStep = document.getElementById(`forgotStep${step}`);
            if (activeStep) {
                const firstInput = activeStep.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        }, 100);
    },
    
    // Setup form handlers for forgot password steps
    setupForgotPasswordHandlers: function(step) {
        // Remove existing event listeners first
        this.removeForgotPasswordHandlers();
        
        switch (step) {
            case 1:
                const forgotForm = document.getElementById('forgotPasswordForm');
                if (forgotForm) {
                    this._forgotFormHandler = this.handleForgotPassword.bind(this);
                    forgotForm.addEventListener('submit', this._forgotFormHandler);
                }
                break;
                
            case 2:
                const otpForm = document.getElementById('otpVerificationForm');
                if (otpForm) {
                    this._otpFormHandler = this.handleOTPVerification.bind(this);
                    otpForm.addEventListener('submit', this._otpFormHandler);
                }
                break;
                
            case 3:
                const resetForm = document.getElementById('resetPasswordForm');
                if (resetForm) {
                    this._resetFormHandler = this.handlePasswordReset.bind(this);
                    resetForm.addEventListener('submit', this._resetFormHandler);
                }
                
                // Setup password validation
                const newPasswordField = document.getElementById('newPassword');
                const confirmPasswordField = document.getElementById('confirmPassword');
                
                if (newPasswordField && confirmPasswordField) {
                    newPasswordField.addEventListener('input', this.validatePasswordRequirements.bind(this));
                    confirmPasswordField.addEventListener('input', this.validatePasswordRequirements.bind(this));
                }
                break;
        }
    },
    
    // Handle forgot password form submission
    handleForgotPassword: async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('forgotEmail').value.trim();
        
        if (!email) {
            UIUtils.showNotification('Please enter your email address', 'error');
            return;
        }
        
        if (!ValidationUtils.isValidEmail(email)) {
            UIUtils.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Sending...');
        
        try {
            const response = await API.forgotPassword(email);
            
            if (response.success) {
                UIUtils.showNotification('✅ Verification code sent to your email!', 'success');
                this.forgotEmail = email;
                
                // Update step 2 content with email
                setTimeout(() => {
                    const step2Element = document.getElementById('forgotStep2');
                    if (step2Element) {
                        const emailSpan = step2Element.querySelector('.email-display');
                        if (emailSpan) {
                            emailSpan.textContent = email;
                        }
                    }
                    this.showForgotStep(2);
                }, 500);
            } else {
                UIUtils.showNotification(response.message || 'Failed to send verification code. Please check your email address.', 'error');
            }
        } catch (error) {
            Logger.error('Forgot password error', error);
            UIUtils.showNotification('Network error. Please check your connection and try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Handle OTP verification
    handleOTPVerification: async function(event) {
        event.preventDefault();
        
        const otp = document.getElementById('otpCode').value.trim();
        
        if (!otp) {
            UIUtils.showNotification('Please enter the verification code', 'error');
            return;
        }
        
        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            UIUtils.showNotification('Please enter a valid 6-digit code', 'error');
            return;
        }
        
        if (!this.forgotEmail) {
            UIUtils.showNotification('Session expired. Please start over.', 'error');
            this.showForgotStep(1);
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Verifying...');
        
        try {
            const response = await API.verifyOTP(this.forgotEmail, otp);
            
            if (response.success) {
                UIUtils.showNotification('✅ Code verified! Set your new password.', 'success');
                this.resetToken = response.resetToken || response.token;
                setTimeout(() => {
                    this.showForgotStep(3);
                }, 500);
            } else {
                UIUtils.showNotification(response.message || 'Invalid or expired verification code. Please try again.', 'error');
            }
        } catch (error) {
            Logger.error('OTP verification error', error);
            UIUtils.showNotification('Verification failed. Please check your connection and try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Handle password reset
    handlePasswordReset: async function(event) {
        event.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const validation = ValidationUtils.validatePassword(newPassword);
        if (!validation.isValid) {
            UIUtils.showNotification(validation.errors.join(', '), 'error');
            return;
        }
        
        if (!ValidationUtils.passwordsMatch(newPassword, confirmPassword)) {
            UIUtils.showNotification('Passwords do not match', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Resetting...');
        
        try {
            const response = await API.resetPassword(this.resetToken, newPassword);
            
            if (response.success) {
                UIUtils.showNotification('Password reset successfully! Please login with your new password.', 'success');
                this.currentForgotPasswordModal.hide();
            } else {
                UIUtils.showNotification(response.message || 'Failed to reset password', 'error');
            }
        } catch (error) {
            Logger.error('Password reset error', error);
            UIUtils.showNotification('Failed to reset password. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Validate password requirements in real-time
    validatePasswordRequirements: function() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const resetButton = document.getElementById('resetPasswordBtn');
        
        const validation = ValidationUtils.validatePassword(newPassword);
        const passwordsMatch = ValidationUtils.passwordsMatch(newPassword, confirmPassword);
        
        // Update requirement indicators
        this.updateRequirementIndicator('req-length', validation.requirements.length);
        this.updateRequirementIndicator('req-uppercase', validation.requirements.uppercase);
        this.updateRequirementIndicator('req-lowercase', validation.requirements.lowercase);
        this.updateRequirementIndicator('req-number', validation.requirements.number);
        this.updateRequirementIndicator('req-special', validation.requirements.special);
        this.updateRequirementIndicator('req-match', passwordsMatch && confirmPassword.length > 0);
        
        // Enable/disable submit button
        const allValid = validation.isValid && passwordsMatch && confirmPassword.length > 0;
        resetButton.disabled = !allValid;
    },
    
    // Update individual requirement indicator
    updateRequirementIndicator: function(elementId, isValid) {
        const element = document.getElementById(elementId);
        if (element) {
            const icon = element.querySelector('.requirement-icon');
            if (isValid) {
                element.classList.add('valid');
                icon.className = 'fas fa-check requirement-icon';
            } else {
                element.classList.remove('valid');
                icon.className = 'fas fa-times requirement-icon';
            }
        }
    },
    
    // Show change password modal
    showChangePasswordModal: function(isFirstLogin = false) {
        const modal = UIUtils.createModal({
            title: isFirstLogin ? '🔐 First Login - Change Password Required' : '🔐 Change Password',
            content: this.getChangePasswordContent(isFirstLogin),
            showCloseButton: !isFirstLogin
        });
        
        this.currentChangePasswordModal = modal;
        this.setupChangePasswordHandlers();
    },
    
    // Get change password modal content
    getChangePasswordContent: function(isFirstLogin) {
        return `
            ${isFirstLogin ? '<p style="text-align: center; margin-bottom: 1.5rem; color: var(--warning-color); font-weight: 500;">For security reasons, you must change your password before continuing.</p>' : ''}
            
            <form id="changePasswordForm">
                ${!isFirstLogin ? `
                    <div class="form-group">
                        <label for="currentPassword">Current Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="currentPassword" placeholder="Enter current password" required>
                            <i class="fas fa-eye password-toggle" onclick="togglePassword('currentPassword')"></i>
                        </div>
                    </div>
                ` : ''}
                
                <div class="form-group">
                    <label for="changeNewPassword">New Password</label>
                    <div class="input-wrapper">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="changeNewPassword" placeholder="Enter new password" required>
                        <i class="fas fa-eye password-toggle" onclick="togglePassword('changeNewPassword')"></i>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="changeConfirmPassword">Confirm New Password</label>
                    <div class="input-wrapper">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="changeConfirmPassword" placeholder="Confirm new password" required>
                        <i class="fas fa-eye password-toggle" onclick="togglePassword('changeConfirmPassword')"></i>
                    </div>
                </div>
                
                <div class="password-requirements">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">Password Requirements:</div>
                    <div class="requirements-grid">
                        <div class="requirement-item" id="change-req-length">
                            <i class="fas fa-times requirement-icon"></i>
                            <span>At least 8 characters</span>
                        </div>
                        <div class="requirement-item" id="change-req-uppercase">
                            <i class="fas fa-times requirement-icon"></i>
                            <span>One uppercase letter</span>
                        </div>
                        <div class="requirement-item" id="change-req-lowercase">
                            <i class="fas fa-times requirement-icon"></i>
                            <span>One lowercase letter</span>
                        </div>
                        <div class="requirement-item" id="change-req-number">
                            <i class="fas fa-times requirement-icon"></i>
                            <span>One number</span>
                        </div>
                        <div class="requirement-item" id="change-req-special">
                            <i class="fas fa-times requirement-icon"></i>
                            <span>One special character</span>
                        </div>
                        <div class="requirement-item" id="change-req-match">
                            <i class="fas fa-times requirement-icon"></i>
                            <span>Passwords match</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    ${!isFirstLogin ? '<button type="button" class="btn btn-secondary" onclick="Auth.currentChangePasswordModal.hide()">Cancel</button>' : ''}
                    <button type="submit" class="btn btn-primary" id="changePasswordBtn" disabled>Change Password</button>
                </div>
            </form>
        `;
    },
    
    // Setup change password form handlers
    setupChangePasswordHandlers: function() {
        const changeForm = document.getElementById('changePasswordForm');
        if (changeForm) {
            changeForm.addEventListener('submit', this.handleChangePassword.bind(this));
        }
        
        const newPasswordField = document.getElementById('changeNewPassword');
        const confirmPasswordField = document.getElementById('changeConfirmPassword');
        
        if (newPasswordField && confirmPasswordField) {
            newPasswordField.addEventListener('input', this.validateChangePasswordRequirements.bind(this));
            confirmPasswordField.addEventListener('input', this.validateChangePasswordRequirements.bind(this));
        }
    },
    
    // Handle change password form submission
    handleChangePassword: async function(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword')?.value || '';
        const newPassword = document.getElementById('changeNewPassword').value;
        const confirmPassword = document.getElementById('changeConfirmPassword').value;
        
        const validation = ValidationUtils.validatePassword(newPassword);
        if (!validation.isValid) {
            UIUtils.showNotification(validation.errors.join(', '), 'error');
            return;
        }
        
        if (!ValidationUtils.passwordsMatch(newPassword, confirmPassword)) {
            UIUtils.showNotification('Passwords do not match', 'error');
            return;
        }
        
        const submitButton = event.target.querySelector('button[type="submit"]');
        UIUtils.showLoading(submitButton, 'Changing...');
        
        try {
            const response = await API.changePassword(currentPassword, newPassword);
            
            if (response.success) {
                UIUtils.showNotification('Password changed successfully!', 'success');
                this.currentChangePasswordModal.hide();
                
                // Update user data to remove first login flag
                if (this.currentUser) {
                    this.currentUser.needs_password_change = false;
                    StorageUtils.set(CONFIG.STORAGE_KEYS.USER_DATA, this.currentUser);
                    
                    // If this was first login, now show the app
                    if (document.getElementById('appContainer').style.display === 'none') {
                        this.showApp();
                    }
                }
            } else {
                UIUtils.showNotification(response.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            Logger.error('Change password error', error);
            UIUtils.showNotification('Failed to change password. Please try again.', 'error');
        } finally {
            UIUtils.hideLoading(submitButton);
        }
    },
    
    // Validate change password requirements in real-time
    validateChangePasswordRequirements: function() {
        const newPassword = document.getElementById('changeNewPassword').value;
        const confirmPassword = document.getElementById('changeConfirmPassword').value;
        const changeButton = document.getElementById('changePasswordBtn');
        
        const validation = ValidationUtils.validatePassword(newPassword);
        const passwordsMatch = ValidationUtils.passwordsMatch(newPassword, confirmPassword);
        
        // Update requirement indicators
        this.updateRequirementIndicator('change-req-length', validation.requirements.length);
        this.updateRequirementIndicator('change-req-uppercase', validation.requirements.uppercase);
        this.updateRequirementIndicator('change-req-lowercase', validation.requirements.lowercase);
        this.updateRequirementIndicator('change-req-number', validation.requirements.number);
        this.updateRequirementIndicator('change-req-special', validation.requirements.special);
        this.updateRequirementIndicator('change-req-match', passwordsMatch && confirmPassword.length > 0);
        
        // Enable/disable submit button
        const allValid = validation.isValid && passwordsMatch && confirmPassword.length > 0;
        changeButton.disabled = !allValid;
    },
    
    // Logout user
    logout: async function() {
        try {
            // Log the logout
            if (this.currentUser) {
                await API.addLog('LOGOUT', 'User logged out');
            }
        } catch (error) {
            Logger.warn('Failed to log logout event', error);
        }
        
        // Clear user data FIRST
        this.currentUser = null;
        StorageUtils.clearAppData();
        
        // Clear API cache
        if (API.cache) {
            API.cache.clear();
        }
        
        // Hide app container IMMEDIATELY
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('loadingScreen').style.display = 'none';
        
        // Reset form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Show notification
        UIUtils.showNotification('Logged out successfully', 'info');
        
        // Force page reload to ensure clean state (most reliable method)
        setTimeout(() => {
            window.location.reload();
        }, 500);
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
        return this.currentUser !== null;
    },
    
    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // Set current user
    setCurrentUser: function(user) {
        this.currentUser = user;
        if (user) {
            StorageUtils.set(CONFIG.STORAGE_KEYS.USER_DATA, user);
            this.updateUserProfile();
        } else {
            StorageUtils.remove(CONFIG.STORAGE_KEYS.USER_DATA);
        }
    },
    
    // Refresh user data from server
    refreshUserData: async function() {
        if (!this.currentUser) return;
        
        try {
            Logger.debug('Refreshing user data from server');
            const token = StorageUtils.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            
            if (!token) return;
            
            // Make API call to get fresh user data
            const response = await API.makeRequest('get_user_profile', { token });
            
            if (response.success && response.data) {
                Logger.debug('Fresh user data received:', response.data);
                
                // Update current user with fresh data
                this.currentUser = { ...this.currentUser, ...response.data };
                this.setCurrentUser(this.currentUser);
                
                Logger.info('User data refreshed successfully');
            }
        } catch (error) {
            Logger.warn('Failed to refresh user data:', error);
            // Don't throw error, just continue with cached data
        }
    },
    
    // Check if user has permission
    hasPermission: function(permission) {
        if (!this.currentUser) return false;
        return PermissionUtils.hasPermission(this.currentUser.role, permission);
    }
};

// Global functions for HTML onclick handlers
window.togglePassword = function(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
};

window.showForgotPassword = function() {
    Auth.showForgotPassword();
};

window.showChangePassword = function() {
    Auth.showChangePasswordModal();
};

window.logout = function() {
    Auth.logout();
};

window.toggleProfileDropdown = function() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
    
    // Close dropdown when clicking outside
    if (dropdown.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(event) {
                if (!event.target.closest('.user-profile')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }
};

// Export Auth module
window.Auth = Auth;