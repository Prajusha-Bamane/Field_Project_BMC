# ReUse BMC v2.0 - Full Stack Donation Management Platform

A complete Node.js + MongoDB web application for transparent donation management between Donors, BMC Authority, and NGOs.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Installation
```bash
# Install dependencies
npm install

# Configure environment
# Edit .env file:
MONGODB_URI=mongodb://localhost:27017/reuse-bmc
JWT_SECRET=your_secret_key_here
PORT=3000

# Start the server
npm start

# Or for development with auto-restart:
npm run dev
```

Open browser: http://localhost:3000

## 🔑 Demo Accounts (auto-seeded on first run)
| Role | Email | Password |
|------|-------|----------|
| BMC Admin | admin@bmc.gov.in | admin123 |
| Donor | donor@test.com | donor123 |
| NGO | ngo@test.com | ngo123 |
| BMC Officer | officer@bmc.gov.in | officer123 |

## 📋 Full Feature List

### Donor
- Register/login with profile
- List donations with photos (up to 5) + GPS location
- Track donation status in real-time (7-step pipeline)
- Earn points per donation
- View all verified NGOs with priority scores
- View recycle & money distribution dashboard

### BMC Authority
- Full donation management dashboard
- Assign officers to pick up donations
- Mark items as picked up
- View NGO requests → assign based on priority score
- Mark items submitted to NGO
- Verify or reject NGO registrations
- Recycle leftover items with estimated ₹ value
- Record money distribution (education, food, medical, etc.)
- View all stats and reports

### NGO
- Register with organization details (pending BMC verification)
- BMC verification badge on approval
- Request available items
- Priority score (0-100) based on distribution history
- Mark items received from BMC
- Mark items distributed with photo evidence + beneficiary count
- View donor information
- Track own performance stats

### Public Dashboard (no login needed)
- Full transparency — all donations, distributions, recycling
- Money distribution breakdown with charts
- Evidence photos from NGO distributions
- Verified NGO directory with priority scores
- Auto-refreshes every 30 seconds

## 🔄 Donation Status Flow
```
listed → assigned → picked → submitted → received → distributed → recycled
```

## 🏗️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (7-day tokens)
- **File Upload**: Multer (photos up to 5MB)
- **Frontend**: Vanilla HTML/CSS/JS (no framework)

## 📁 Project Structure
```
/
├── server.js          # Main server
├── .env               # Environment config
├── models/
│   ├── User.js        # User with NGO verification, priority score
│   ├── Donation.js    # Full donation lifecycle
│   └── MoneyDistribution.js
├── routes/
│   ├── auth.js        # Register, login, profile
│   ├── donations.js   # Full donation CRUD + status transitions
│   └── users.js       # Users, NGO management, public dashboard
├── middleware/
│   └── auth.js        # JWT verification
└── public/
    ├── index.html          # Welcome/landing page
    ├── login.html          # Login
    ├── register.html       # Role-based registration
    ├── donor.html          # Donor dashboard
    ├── admin.html          # BMC Authority dashboard
    ├── ngo.html            # NGO dashboard
    ├── public-dashboard.html # Public transparency page
    ├── styles.css          # Shared styles
    └── app.js             # Shared JS utilities
```
