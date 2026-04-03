const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const { auth, requireRole } = require('../middleware/auth');

// GET all users (admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET officers only (admin only)
router.get('/officers', auth, requireRole('admin'), async (req, res) => {
  try {
    const officers = await User.find({ role: 'admin' }).select('-password');
    res.json(officers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET NGOs only (admin only)
router.get('/ngos', auth, requireRole('admin'), async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo' }).select('-password');
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET platform stats
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role === 'donor') {
      const total = await Donation.countDocuments({ donorId: req.user._id });
      const picked = await Donation.countDocuments({ donorId: req.user._id, status: 'picked' });
      const distributed = await Donation.countDocuments({ donorId: req.user._id, status: 'distributed' });
      const user = await User.findById(req.user._id).select('points');
      return res.json({ total, picked, distributed, points: user.points });
    }
    if (req.user.role === 'ngo') {
      const available = await Donation.countDocuments({ status: 'picked' });
      const myDistributed = await Donation.countDocuments({ ngoId: req.user._id, status: 'distributed' });
      return res.json({ available, distributed: myDistributed });
    }
    // admin
    const totalDonations = await Donation.countDocuments();
    const listed = await Donation.countDocuments({ status: 'listed' });
    const assigned = await Donation.countDocuments({ status: 'assigned' });
    const picked = await Donation.countDocuments({ status: 'picked' });
    const distributed = await Donation.countDocuments({ status: 'distributed' });
    const totalUsers = await User.countDocuments();
    const donors = await User.countDocuments({ role: 'donor' });
    const ngos = await User.countDocuments({ role: 'ngo' });
    const officers = await User.countDocuments({ role: 'admin' });
    res.json({ totalDonations, listed, assigned, picked, distributed, totalUsers, donors, ngos, officers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
