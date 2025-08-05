# 🏸 Racket Warrior - Deployment Guide

## 📋 Prerequisites
- Google account
- Web hosting service (GitHub Pages, Netlify, Vercel, etc.)

## 🚀 Quick Setup

### 1. Google Sheets Setup
1. Create a new Google Sheet
2. Note the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 2. Google Apps Script Setup
1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Replace `Code.gs` content with `gas/backend.gs`
4. Create `appsscript.json` with content from `gas/appsscript.json`
5. Update `CONFIG.SHEET_ID` in the backend with your Sheet ID
6. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
7. Copy the deployment URL

### 3. Frontend Configuration
1. Update `js/config.js`:
   - Set `API_BASE_URL` to your Apps Script deployment URL
2. Host the frontend files on your preferred platform

### 4. First Login
- Default admin: `chowdhuryavy@gmail.com` / `Doha@2580`
- Or: `admin@gmail.com` / `admin123`

## 📁 File Structure
```
racket-warrior/
├── index.html              # Main application
├── css/
│   ├── styles.css          # Main styles
│   └── responsive.css      # Mobile responsiveness
├── js/
│   ├── config.js          # Configuration
│   ├── auth.js            # Authentication
│   ├── api.js             # API communication
│   ├── app.js             # Main app controller
│   ├── utils.js           # Utilities
│   └── pages/             # Page modules
└── gas/
    ├── backend.gs         # Apps Script backend
    └── appsscript.json    # Apps Script manifest
```

## 🎯 Features
- **Player Management** - Add, edit, track badminton group members
- **Financial Tracking** - Collections and expenses management
- **Reports & Analytics** - Monthly financial reports
- **User Management** - Role-based access control
- **Responsive Design** - Works on all devices

## 🔧 Configuration
Edit `js/config.js` to customize:
- API endpoints
- Sheet column mappings
- Default settings
- App branding

That's it! Your badminton group management system is ready to use. 🏸✨