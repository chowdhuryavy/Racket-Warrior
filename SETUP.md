# Racket Warrior - Setup Guide

A complete badminton group management application with monthly tracking, role-based access, and Google Sheets backend.

## Overview

Racket Warrior is a full-featured web application for managing badminton groups with:

- **Monthly-based tracking** across all modules
- **Role-based access** (Admin, View/Edit, View-only)
- **Custom email password recovery** with OTP
- **Secure login** with automatic password change requirements
- **Dynamic reporting** with permissions control
- **Responsive design** for mobile and desktop

## Features

### 🔐 Authentication & Security
- Secure login with username/password
- Role-based permissions (Admin, View/Edit, View)
- Password recovery with email OTP verification
- Force password change on first login
- Session management with tokens

### 📊 Dashboard
- Real-time statistics (Active Players, Collections, Expenses, Balance)
- Monthly filtering for all statistics
- Recent activities overview
- Quick action buttons (role-based)

### 👥 Player Management
- Add/edit/delete players (permission-based)
- Active/inactive status tracking per month
- Contact information management
- Monthly status history

### 💰 Financial Management
- **Collections**: Record payments from players
- **Expenses**: Track group expenditures with categories
- Monthly organization and filtering
- Complete CRUD operations with permissions

### 📈 Reports
- Monthly financial reports
- Active players list
- Printable format
- Export capabilities

### 🔧 Admin Panel
- User management (add/edit/delete users)
- Role assignment
- Password reset for users
- System activity logs

## Quick Start

### 1. Google Sheets Setup

1. **Create a new Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it "Racket Warrior Database"
   - Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

2. **Setup Initial User** (Manual)
   - Create a sheet named "Users"
   - Add headers in row 1: `email | password | role | name | needs_password_change | created_at | last_login | status | resetToken | resetTokenExpiry`
   - Add your admin user in row 2: `your-email@gmail.com | YourPassword123! | admin | Your Name | FALSE | 2024-01-01T00:00:00.000Z | | active | |`

### 2. Google Apps Script Setup

1. **Create Apps Script Project**
   - Go to [Google Apps Script](https://script.google.com)
   - Click "New Project"
   - Name it "Racket Warrior Backend"

2. **Upload Backend Code**
   - Delete the default `Code.gs` file
   - Create new files and copy the content from the `gas/` folder:
     - `backend.gs` - Main backend code
     - `appsscript.json` - Project configuration

3. **Configure Settings**
   - Open `backend.gs`
   - Update the `CONFIG` section at the top:
     ```javascript
     const CONFIG = {
       SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE', // Paste your Sheet ID
       EMAIL_FROM: 'your-email@gmail.com',    // Your Gmail address
       BASE_URL: 'YOUR_WEB_APP_URL_HERE',     // Will be updated after deployment
       OTP_EXPIRY_MINUTES: 10,
       TOKEN_EXPIRY_HOURS: 24,
       DEFAULT_PASSWORD: 'RacketWarrior123!'
     };
     ```

4. **Deploy Web App**
   - Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Description: "Racket Warrior API"
   - Execute as: "Me"
   - Who has access: "Anyone" (or "Anyone with Google account" for better security)
   - Click "Deploy"
   - **Copy the Web App URL** - you'll need this for the frontend

5. **Update BASE_URL**
   - Go back to `backend.gs`
   - Update `BASE_URL` with the deployed Web App URL
   - Save and deploy again (new version)

### 3. Frontend Setup

1. **Configure API URL**
   - Open `js/config.js`
   - Update the `API_BASE_URL` with your Apps Script Web App URL:
     ```javascript
     API_BASE_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
     ```

2. **Host the Application**
   
   **Option A: Local Development**
   ```bash
   # Use any static file server
   npx http-server . -p 3000
   # Or
   python -m http.server 3000
   ```
   
   **Option B: GitHub Pages**
   - Push code to GitHub repository
   - Go to Settings → Pages
   - Source: Deploy from branch → main
   - Access via: `https://yourusername.github.io/repository-name`
   
   **Option C: Netlify**
   - Drag and drop the project folder to [Netlify Drop](https://app.netlify.com/drop)
   - Or connect your GitHub repository

3. **Test the Application**
   - Open the application in your browser
   - Login with your admin credentials
   - The application will automatically create the required sheets

## Sheet Structure

The application automatically creates these sheets:

### Users
- `email` - User email (login username)
- `password` - User password (plain text for demo)
- `role` - admin, view_edit, or view
- `name` - Full name
- `needs_password_change` - TRUE/FALSE
- `created_at` - User creation timestamp
- `last_login` - Last login timestamp
- `status` - active/inactive
- `resetToken` - Password reset token
- `resetTokenExpiry` - Token expiry time

### Players
- `ID` - Unique player ID
- `Name` - Player name
- `Phone` - Contact number
- `Email` - Email address (optional)
- `Status` - active/inactive
- `JoinDate` - Date joined
- `CreatedAt` - Record creation time
- `MonthlyStatus` - JSON object for monthly active/inactive status

### Income
- `ID` - Unique transaction ID
- `Date` - Payment date
- `PlayerId` - Reference to player
- `PlayerName` - Player name
- `Amount` - Payment amount
- `Description` - Payment description
- `CreatedAt` - Record creation time
- `Month` - Month in YYYY-MM format

### Expenses
- `ID` - Unique expense ID
- `Date` - Expense date
- `Category` - Expense category
- `Amount` - Expense amount
- `Description` - Expense description
- `CreatedAt` - Record creation time
- `Month` - Month in YYYY-MM format

### Logs
- `timestamp` - Log entry time
- `user` - User email
- `role` - User role
- `action` - Action performed
- `details` - Additional details

### Settings
- `key` - Setting name
- `value` - Setting value

## User Roles & Permissions

### Admin
- Full access to all features
- User management
- System logs access
- All CRUD operations
- Settings management

### View/Edit
- View all data
- Add/edit/delete players
- Add/edit/delete collections
- Add/edit/delete expenses
- Generate reports
- Cannot manage users or access logs

### View
- View-only access to all data
- Can generate reports
- Cannot modify any data

## Configuration Options

### Email Settings
- Configure SMTP settings in Google Apps Script
- Customize email templates in `sendOTPEmail()` and `sendWelcomeEmail()` functions

### Password Policy
- Modify password requirements in `js/config.js` → `VALIDATION.PASSWORD`
- Adjust token expiry times in Apps Script `CONFIG`

### Categories & Options
- Expense categories: Edit in `js/config.js` → `EXPENSE_CATEGORIES`
- Payment methods: Edit in `js/config.js` → `PAYMENT_METHODS`

## Customization

### Branding
- Update logo: Replace `assets/logo.png`
- App name: Change in `js/config.js` → `APP_NAME`
- Colors: Modify CSS variables in `css/styles.css`

### Features
- Add new expense categories in both frontend config and backend
- Customize dashboard widgets in `js/pages/dashboard.js`
- Modify table columns by updating both frontend and backend sheet definitions

## Security Considerations

### For Production Use
1. **Password Hashing**: Implement proper password hashing in Google Apps Script
2. **HTTPS**: Always use HTTPS for the frontend
3. **Token Security**: Implement proper JWT tokens with expiry
4. **Input Validation**: Add server-side validation for all inputs
5. **Email Security**: Use dedicated email service (SendGrid, etc.)

### Access Control
- Set Google Apps Script access to "Anyone with Google account" instead of "Anyone"
- Implement IP whitelisting if needed
- Regular audit of user access logs

## Troubleshooting

### Common Issues

**1. "Failed to connect to backend"**
- Check if Apps Script Web App URL is correct in `js/config.js`
- Ensure Apps Script is deployed and accessible
- Check browser console for CORS errors

**2. "Sheet not found" errors**
- Verify Google Sheet ID in Apps Script configuration
- Ensure the Apps Script has permission to access the sheet
- Check if the sheet is shared with the script owner

**3. Login issues**
- Verify user exists in Users sheet
- Check password (case-sensitive)
- Ensure user status is "active"

**4. Email not working**
- Verify Gmail account has permission to send emails
- Check spam folder
- Ensure EMAIL_FROM is correctly configured

### Debug Mode
Enable debug mode in `js/config.js`:
```javascript
DEBUG: {
    ENABLED: true,
    USE_MOCK_API: true, // Use mock data for testing
    LOG_LEVEL: 'debug'
}
```

## Support

For issues and questions:
1. Check the browser console for error messages
2. Review Google Apps Script logs
3. Verify sheet permissions and structure
4. Test with mock data using debug mode

## Version History

- **v1.0.0** - Initial release with complete feature set
  - User authentication and role management
  - Player management with monthly tracking
  - Financial management (collections and expenses)
  - Dashboard with real-time statistics
  - Responsive design for all screen sizes
  - Complete Google Sheets integration

## License

This project is open source. Feel free to modify and adapt for your badminton group's needs.