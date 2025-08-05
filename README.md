# 🏸 Racket Warrior - Badminton Group Manager

A comprehensive, modern web-based badminton group management system built with vanilla JavaScript, HTML5, CSS3, and Google Apps Script backend. Features beautiful animations, responsive design, and complete group operation management.

![Racket Warrior](https://i.imgur.com/04MGPFl.png)

## ✨ Features

### 🔐 Authentication & Security
- **Role-based Access Control** (Admin, User, View-only)
- **Secure Password Management** with strength requirements
- **Forgot Password** with OTP verification via email
- **Session Management** with auto-login
- **Activity Logging** for all user actions

### 📊 Dashboard
- **Dynamic Month Selection** based on available data
- **Real-time Statistics Cards**:
  - Active players count for selected month
  - Total collections for the month
  - Total expenses for the month
  - Current balance calculation
- **Animated Cards** with hover effects
- **Auto-refresh** with current month as default

### 👥 Player Management
- **Complete Player Profiles** (Name, Phone, Email, Join Date, Status)
- **Monthly Activity Tracking** for badminton group participation
- **Advanced Filtering** by month and status
- **Responsive Table Design** with edit/delete operations
- **Status Management** (Active/Inactive)

### 💰 Financial Management
#### Collections
- **Player-wise Collection Tracking**
- **Date-wise Records** with amount and descriptions
- **Advanced Filtering** by month and player
- **Real-time Balance Updates**

#### Expenses
- **Category-wise Expense Tracking**
- **Predefined Categories**: Equipment, Maintenance, Utilities, Staff, Rent, Other
- **Monthly Expense Reports**
- **Detailed Descriptions** and amount tracking

### 📋 Admin Features
- **User Management**: Create, edit, delete users
- **System Logs**: Complete audit trail of all activities
- **Email Notifications**: Welcome emails for new users
- **Role Management**: Fine-grained permission control
- **Data Export** capabilities (via Google Sheets)

### 🎨 Modern UI/UX
- **Responsive Design** for all devices (Mobile, Tablet, Desktop)
- **Beautiful Animations**: Page transitions, card hover effects, modal popups
- **Modern Color Palette**: Teal, Indigo, White, Gray theme
- **FontAwesome Icons** throughout the interface
- **Loading Spinners** and success/error notifications
- **Dark Mode Support** (system preference based)

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **FontAwesome** - Icon library

### Backend
- **Google Apps Script** - Serverless backend
- **Google Sheets** - Database storage
- **Gmail API** - Email services

### Features
- **Progressive Web App** ready
- **Print Styles** for reports
- **Accessibility** features (ARIA labels, keyboard navigation)
- **Browser Compatibility** (Modern browsers)

## 📋 Setup Instructions

### 1. Google Sheets Setup

1. **Open the Google Sheet**: [Gym Management Data](https://docs.google.com/spreadsheets/d/1zJHUpcWaOBhKCzHS-uGPqaJepv_eZm019ElKtt249fg/edit?gid=0#gid=0)

2. **Make a Copy**: 
   - File → Make a Copy
   - Name it "Your Gym Management System"
   - Note your new spreadsheet ID from the URL

### 2. Google Apps Script Setup

1. **Open Google Apps Script**: [script.google.com](https://script.google.com)

2. **Create New Project**:
   - Click "New Project"
   - Name it "Gym Management Backend"

3. **Add the Backend Code**:
   - Replace the default code with the content from `gas-backend.gs`
   - Update `SPREADSHEET_ID` with your spreadsheet ID

4. **Deploy as Web App**:
   - Click "Deploy" → "New Deployment"
   - Choose "Web app" as type
   - Set execute as "Me"
   - Set access to "Anyone"
   - Click "Deploy"
   - Copy the Web App URL

5. **Initialize Database**:
   - In Apps Script editor, run the `initializeSpreadsheet()` function
   - This creates all necessary sheets and a default admin user

### 3. Frontend Setup

1. **Update Configuration**:
   - Open `js/app.js`
   - Replace `YOUR_SCRIPT_ID` in `CONFIG.SCRIPT_URL` with your Web App URL

2. **Host the Files**:
   - Upload all files to a web server or
   - Use GitHub Pages, Netlify, or Vercel for free hosting
   - Or run locally with a simple HTTP server

### 4. Test the Application

1. **Default Admin Login**:
   - Email: `admin@gym.com`
   - Password: `Admin123!`

2. **Verify Features**:
   - Login with admin credentials
   - Check all pages load correctly
   - Test adding a player, collection, and expense
   - Verify data appears in Google Sheets

## 🎯 Usage Guide

### Initial Setup
1. Login with the default admin account
2. Change the admin password (recommended)
3. Add your gym users through Admin Panel
4. Configure player monthly statuses for current operations

### Daily Operations
1. **Adding Players**: Use Players → Add Player
2. **Recording Collections**: Use Collections → Add Collection
3. **Tracking Expenses**: Use Expenses → Add Expense
4. **Monthly Reports**: Use Dashboard with month filters

### User Roles

#### Admin
- Full access to all features
- User management capabilities
- System logs access
- Can create/edit/delete all data

#### User
- Full access except logs and admin panel
- Can manage players, collections, and expenses
- Can view dashboard and reports

#### View
- Read-only access to all data
- Cannot add, edit, or delete anything
- Perfect for gym owners who only need to view reports

## 📊 Data Structure

### Google Sheets Schema

```javascript
SHEETS = {
  users:    ['email', 'password', 'role', 'name', 'needs_password_change', 'created_at', 'last_login', 'status', 'resetToken', 'resetTokenExpiry'],
  players:  ['ID', 'Name', 'Phone', 'Email', 'Status', 'JoinDate', 'CreatedAt', 'MonthlyStatus'],
  income:   ['ID', 'Date', 'PlayerId', 'PlayerName', 'Amount', 'Description', 'CreatedAt'],
  expenses: ['ID', 'Date', 'Category', 'Amount', 'Description', 'CreatedAt'],
  logs:     ['timestamp', 'user', 'role', 'action', 'details'],
  settings: ['key', 'value']
};
```

### Monthly Status Format
Players' monthly status is stored as JSON:
```json
{
  "Jan'25": true,
  "Feb'25": false,
  "Mar'25": true
}
```

## 🔧 Configuration

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Email Configuration
The system uses Gmail API for sending emails. Ensure the Google account has:
- Gmail enabled
- Apps Script permissions granted
- Appropriate email sending limits

## 🎨 Customization

### Colors
Update CSS variables in `css/style.css`:
```css
:root {
  --primary-color: #0891b2;    /* Main theme color */
  --secondary-color: #6366f1;  /* Secondary theme color */
  --success-color: #10b981;    /* Success messages */
  --warning-color: #f59e0b;    /* Warning messages */
  --danger-color: #ef4444;     /* Error messages */
}
```

### Logo
Replace the logo URL in both `index.html` and update the variable:
```javascript
// Update this URL in the HTML files
const LOGO_URL = 'https://i.imgur.com/04MGPFl.png';
```

### Email Templates
Customize email templates in `gas-backend.gs`:
- Welcome email for new users
- Password reset OTP email
- Update branding and content as needed

## 🔒 Security Features

- **Password Hashing**: SHA-256 encryption
- **Session Management**: Secure token-based authentication
- **Input Validation**: All user inputs are validated
- **SQL Injection Protection**: Using Google Sheets API prevents SQL injection
- **XSS Protection**: All user content is properly escaped
- **CSRF Protection**: Request validation and origin checking

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience
- **Tablet**: Adapted layout with touch-friendly controls
- **Mobile**: Simplified navigation with drawer-style sidebar

## 🚀 Performance Optimization

- **Lazy Loading**: Data loaded only when needed
- **Caching**: Frontend caching for improved performance
- **Animations**: Hardware-accelerated CSS animations
- **Minification**: Optimized for production deployment

## 🐛 Troubleshooting

### Common Issues

1. **Login Issues**:
   - Verify Google Apps Script is deployed as web app
   - Check SCRIPT_URL in configuration
   - Ensure spreadsheet permissions are correct

2. **Data Not Saving**:
   - Verify Apps Script has edit permissions to the spreadsheet
   - Check browser console for JavaScript errors
   - Ensure all required fields are filled

3. **Email Not Sending**:
   - Verify Gmail is enabled for the Google account
   - Check Apps Script execution permissions
   - Ensure recipient email addresses are valid

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ for gym management efficiency**