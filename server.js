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
    const users = [
      { name: 'BMC Admin', email: 'admin@bmc.gov.in', password: 'admin123', role: 'admin', phone: '9000000001', address: 'BMC Headquarters, Mumbai', badgeNumber: 'BMC001', zone: 'Central' },
      { name: 'Rahul Donor', email: 'donor@test.com', password: 'donor123', role: 'donor', phone: '9000000002', address: 'Andheri West, Mumbai' },
      { name: 'Seva NGO', email: 'ngo@test.com', password: 'ngo123', role: 'ngo', phone: '9000000003', address: 'Dharavi, Mumbai', organizationName: 'Seva Foundation' },
      { name: 'Officer Priya', email: 'officer@bmc.gov.in', password: 'officer123', role: 'admin', phone: '9000000004', address: 'Bandra, Mumbai', badgeNumber: 'BMC002', zone: 'West' }
    ];
    for (const u of users) {
      const user = new User(u);
      await user.save();
    }
    console.log('✅ Default users created:');
    console.log('  Admin:   admin@bmc.gov.in / admin123');
    console.log('  Donor:   donor@test.com / donor123');
    console.log('  NGO:     ngo@test.com / ngo123');
    console.log('  Officer: officer@bmc.gov.in / officer123');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ReUse BMC running at http://localhost:${PORT}`);
  console.log(`📱 Open in browser for mobile PWA experience\n`);
});
