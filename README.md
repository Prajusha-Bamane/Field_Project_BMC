# ♻️ ReUse BMC — Reuse & Donation Platform

**Vivekanand Education Society's Institute of Technology**  
Department of Information Technology | Semester IV  
Project by: Prajusha Bamane, Sanika Palav, Gayatri Bajaj, Komal Yadav  
Mentor: Mrs. Bharti Raut

---

## 📱 About
A full-stack mobile PWA for BMC (Brihanmumbai Municipal Corporation) connecting **Donors → BMC Officers → NGOs → Needy People** to reduce household waste through structured donation & pickup.

---

## 🚀 Quick Setup (VS Code)

### Prerequisites
- [Node.js](https://nodejs.org) (v18+)
- [MongoDB Community](https://www.mongodb.com/try/download/community) installed & running locally

### Steps

```bash
# 1. Open terminal in VS Code (Ctrl + `)
# 2. Install dependencies
npm install

# 3. Start MongoDB (if not running as service)
# Windows: mongod
# Mac/Linux: sudo systemctl start mongod

# 4. Start the server
npm start

# 5. Open browser at:
# http://localhost:3000
```

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🏛️ BMC Admin | admin@bmc.gov.in | admin123 |
| 👮 BMC Officer | officer@bmc.gov.in | officer123 |
| 🏠 Donor | donor@test.com | donor123 |
| 🤝 NGO | ngo@test.com | ngo123 |

---

## 🔄 Donation Flow

```
DONOR lists item + shares location
        ↓
BMC ADMIN sees request → assigns OFFICER
        ↓
OFFICER navigates to donor (Google Maps) → picks up item
        ↓
BMC ADMIN assigns picked item to NGO
        ↓
NGO receives item → distributes to needy people ✅
```

---

## 📂 Project Structure

```
reuse-bmc/
├── server.js              ← Main server (Express + MongoDB)
├── package.json
├── .env                   ← Environment config
├── models/
│   ├── User.js            ← User schema (donor/ngo/admin)
│   └── Donation.js        ← Donation schema with location
├── routes/
│   ├── auth.js            ← Register, Login, Profile
│   ├── donations.js       ← All donation CRUD + status updates
│   └── users.js           ← User management + stats
├── middleware/
│   └── auth.js            ← JWT authentication
└── public/                ← Frontend (served as static)
    ├── index.html         ← Splash screen
    ├── login.html         ← Login
    ├── register.html      ← Register (all 3 roles)
    ├── donor.html         ← Donor dashboard
    ├── ngo.html           ← NGO dashboard
    ├── admin.html         ← BMC Admin/Officer dashboard
    ├── styles.css         ← All styles (mobile-first)
    ├── app.js             ← Shared utilities
    ├── uploads/           ← Item photos stored here
    └── manifest.json      ← PWA manifest
```

---

## 🌟 Key Features

### Donor
- Register and list reusable items (clothes, books, utensils, toys, appliances)
- Upload up to 5 photos per item
- **Share live GPS location** (for accurate pickup)
- Track donation status in real-time
- Earn 10 points per donation

### BMC Admin / Officer
- View all pending donations on dashboard
- **Assign specific officer** to each pickup request
- View donor's location on embedded Google Map
- Officer gets navigation link directly to donor
- Mark items as picked → assign to NGO

### NGO
- See all picked-up items available for distribution
- Filter by category
- Mark items as distributed to beneficiaries

---

## 🗺️ Location Sharing
- Donor taps "Get My Location" → browser GPS captures coordinates
- Coordinates stored in MongoDB with the donation
- BMC Admin sees embedded map in donation card
- Officer gets direct Google Maps navigation link
- NGO can also see donor location for reference

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/donations | Submit donation (with photos) |
| GET | /api/donations | Get donations (role-filtered) |
| GET | /api/donations/pending | Pending donations (admin) |
| GET | /api/donations/for-ngo | Picked items for NGO |
| PUT | /api/donations/:id/assign-officer | Assign officer |
| PUT | /api/donations/:id/mark-picked | Mark as picked |
| PUT | /api/donations/:id/assign-ngo | Assign to NGO |
| PUT | /api/donations/:id/distribute | Mark distributed |
| GET | /api/users | All users (admin) |
| GET | /api/users/officers | BMC officers list |
| GET | /api/users/ngos | NGO list |
| GET | /api/users/stats | Platform statistics |

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (PWA)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Tokens) + bcryptjs
- **File Upload**: Multer (photos)
- **Maps**: Google Maps Embed API (free, no key needed for embed)

---

## 📱 PWA Features
- Add to homescreen on Android/iOS
- Mobile-first design (max 430px)
- Bottom navigation like native apps
- Green theme matching BMC branding

---

*Built for VESIT IT Department Field Project — Solid Waste Management Domain*
