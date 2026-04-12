require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads folder exists
if (!fs.existsSync('public/uploads')) fs.mkdirSync('public/uploads', { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/users', require('./routes/users'));

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/register.html')));
app.get('/donor', (req, res) => res.sendFile(path.join(__dirname, 'public/donor.html')));
app.get('/ngo', (req, res) => res.sendFile(path.join(__dirname, 'public/ngo.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('/public-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/public-dashboard.html')));

// Connect DB and seed
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ MongoDB connected');
  await seedUsers();
}).catch(err => console.error('❌ MongoDB error:', err));

async function seedUsers() {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('🌱 Seeding default users...');
    const bcrypt = require('bcryptjs');
    const hash = (pw) => bcrypt.hash(pw, 10);
    const users = [
      {
        name: 'BMC Admin', email: 'admin@bmc.gov.in',
        password: await hash('admin123'), role: 'admin',
        phone: '9000000001', address: 'BMC Headquarters, Mumbai',
        badgeNumber: 'ADMIN', zone: 'Central',
        isVerified: true, verificationStatus: 'verified'
      },
      {
        name: 'Rahul Sharma', email: 'donor@test.com',
        password: await hash('donor123'), role: 'donor',
        phone: '9000000002', address: 'Andheri West, Mumbai', city: 'Mumbai',
        isVerified: true, verificationStatus: 'verified'
      },
      {
        name: 'Seva Foundation', email: 'ngo@test.com',
        password: await hash('ngo123'), role: 'ngo',
        phone: '9000000003', address: 'Dharavi, Mumbai',
        organizationName: 'Seva Foundation',
        registrationNumber: 'NGO-MH-2024-001',
        ngoCategory: 'general',
        isVerified: true, verificationStatus: 'verified',
        verifiedAt: new Date(),
        priorityScore: 75, totalReceived: 10, totalDistributed: 8
      },
      {
        name: 'Officer Priya', email: 'officer@bmc.gov.in',
        password: await hash('officer123'), role: 'admin',
        phone: '9000000004', address: 'Bandra, Mumbai',
        badgeNumber: 'BMC002', zone: 'West',
        isVerified: true, verificationStatus: 'verified'
      }
    ];
    const UserModel = require('./models/User');
    for (const u of users) {
      // Save without hashing again (already hashed)
      await UserModel.collection.insertOne({ ...u, points: 0, createdAt: new Date() });
    }
    console.log('✅ Default users seeded:');
    console.log('  Admin:   admin@bmc.gov.in / admin123');
    console.log('  Donor:   donor@test.com / donor123');
    console.log('  NGO:     ngo@test.com / ngo123');
    console.log('  Officer: officer@bmc.gov.in / officer123');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ReUse BMC v2.0 running at http://localhost:${PORT}`);
  console.log(`🌐 Open browser for the full web experience\n`);
});
