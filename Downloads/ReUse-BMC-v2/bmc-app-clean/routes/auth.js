const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, phone, address, city,
      organizationName, registrationNumber, ngoCategory, website, description,
      badgeNumber, zone
    } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password, and role are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (!['donor', 'ngo', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Role-specific validation
    if (role === 'ngo' && !organizationName)
      return res.status(400).json({ message: 'Organization name is required for NGO' });
    if (role === 'ngo' && !registrationNumber)
      return res.status(400).json({ message: 'Registration number is required for NGO' });
    if (role === 'admin' && !badgeNumber)
      return res.status(400).json({ message: 'Badge number is required for BMC Officers' });

    const user = new User({
      name, email, password, role, phone, address, city,
      organizationName, registrationNumber, ngoCategory, website, description,
      badgeNumber, zone,
      verificationStatus: role === 'ngo' ? 'pending' : 'verified',
      isVerified: role !== 'ngo'
    });

    await user.save();
    res.status(201).json({ message: 'Account created successfully! Please login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        points: user.points,
        organizationName: user.organizationName,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        badgeNumber: user.badgeNumber,
        zone: user.zone,
        priorityScore: user.priorityScore,
        totalReceived: user.totalReceived,
        totalDistributed: user.totalDistributed
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, city, organizationName, website, description, zone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, city, organizationName, website, description, zone },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(oldPassword);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
