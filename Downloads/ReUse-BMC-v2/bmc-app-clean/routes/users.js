const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const MoneyDistribution = require('../models/MoneyDistribution');
const { auth, requireRole } = require('../middleware/auth');

// GET all NGOs (public - for donor to see)
router.get('/ngos/public', auth, async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo' })
      .select('-password -email')
      .sort({ priorityScore: -1, totalDistributed: -1 });
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET verified NGOs list (public, no auth required)
router.get('/ngos/verified', async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', isVerified: true })
      .select('name organizationName ngoCategory address priorityScore totalReceived totalDistributed verifiedAt website description')
      .sort({ priorityScore: -1 });
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET NGOs with priority scores (admin view for smart assignment)
router.get('/ngos/priority', auth, requireRole('admin'), async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', isVerified: true })
      .select('-password')
      .sort({ priorityScore: -1, totalDistributed: -1 });
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users (admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET officers only
router.get('/officers', auth, requireRole('admin'), async (req, res) => {
  try {
    const officers = await User.find({ role: 'admin' }).select('-password');
    res.json(officers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET pending NGOs for verification
router.get('/ngos/pending', auth, requireRole('admin'), async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', verificationStatus: 'pending' }).select('-password');
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - BMC verifies or rejects an NGO
router.put('/ngos/:id/verify', auth, requireRole('admin'), async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'verify' or 'reject'
    if (!['verify', 'reject'].includes(action))
      return res.status(400).json({ message: 'Action must be "verify" or "reject"' });

    const ngo = await User.findById(req.params.id);
    if (!ngo || ngo.role !== 'ngo') return res.status(404).json({ message: 'NGO not found' });

    ngo.verificationStatus = action === 'verify' ? 'verified' : 'rejected';
    ngo.isVerified = action === 'verify';
    ngo.verificationNote = note || '';
    ngo.verifiedAt = action === 'verify' ? new Date() : null;
    await ngo.save();

    res.json({
      message: action === 'verify'
        ? `NGO "${ngo.organizationName}" verified successfully!`
        : `NGO "${ngo.organizationName}" rejected.`,
      ngo
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Platform stats (role-based)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role === 'donor') {
      const total = await Donation.countDocuments({ donorId: req.user._id });
      const picked = await Donation.countDocuments({ donorId: req.user._id, status: 'picked' });
      const distributed = await Donation.countDocuments({ donorId: req.user._id, status: 'distributed' });
      const received = await Donation.countDocuments({ donorId: req.user._id, status: 'received' });
      const recycled = await Donation.countDocuments({ donorId: req.user._id, isRecycled: true });
      const user = await User.findById(req.user._id).select('points');
      return res.json({ total, picked, distributed, received, recycled, points: user.points });
    }

    if (req.user.role === 'ngo') {
      const available = await Donation.countDocuments({ status: 'picked', ngoId: null });
      const myAssigned = await Donation.countDocuments({ ngoId: req.user._id });
      const myReceived = await Donation.countDocuments({ ngoId: req.user._id, status: 'received' });
      const myDistributed = await Donation.countDocuments({ ngoId: req.user._id, status: 'distributed' });
      return res.json({
        available,
        myAssigned,
        received: myReceived,
        distributed: myDistributed,
        priorityScore: req.user.priorityScore
      });
    }

    // Admin stats
    const totalDonations = await Donation.countDocuments();
    const listed = await Donation.countDocuments({ status: 'listed' });
    const assigned = await Donation.countDocuments({ status: 'assigned' });
    const picked = await Donation.countDocuments({ status: 'picked' });
    const submitted = await Donation.countDocuments({ status: 'submitted' });
    const received = await Donation.countDocuments({ status: 'received' });
    const distributed = await Donation.countDocuments({ status: 'distributed' });
    const recycled = await Donation.countDocuments({ status: 'recycled' });
    const totalUsers = await User.countDocuments();
    const donors = await User.countDocuments({ role: 'donor' });
    const ngos = await User.countDocuments({ role: 'ngo' });
    const verifiedNgos = await User.countDocuments({ role: 'ngo', isVerified: true });
    const pendingNgos = await User.countDocuments({ role: 'ngo', verificationStatus: 'pending' });
    const officers = await User.countDocuments({ role: 'admin' });

    // Recycle money total
    const recycleData = await Donation.aggregate([
      { $match: { isRecycled: true } },
      { $group: { _id: null, totalValue: { $sum: '$recycleValue' } } }
    ]);
    const totalRecycleValue = recycleData.length ? recycleData[0].totalValue : 0;

    res.json({
      totalDonations, listed, assigned, picked, submitted,
      received, distributed, recycled, totalUsers,
      donors, ngos, verifiedNgos, pendingNgos, officers,
      totalRecycleValue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Money Distribution ────────────────────────────────────────────────────────

// GET - All money distributions (public)
router.get('/money-distributions', async (req, res) => {
  try {
    const distributions = await MoneyDistribution.find().sort({ createdAt: -1 });
    res.json(distributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - BMC creates money distribution record
router.post('/money-distributions', auth, requireRole('admin'), async (req, res) => {
  try {
    const { totalRecycleAmount, distributions, note } = req.body;
    if (!totalRecycleAmount || !distributions || distributions.length === 0)
      return res.status(400).json({ message: 'Amount and distribution details are required' });

    const md = new MoneyDistribution({
      totalRecycleAmount,
      distributions,
      note,
      createdBy: req.user._id,
      createdByName: req.user.name
    });
    await md.save();
    res.status(201).json({ message: 'Money distribution recorded!', md });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Public Dashboard Data ─────────────────────────────────────────────────────

// GET - Public dashboard (no auth needed)
router.get('/public/dashboard', async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const distributed = await Donation.countDocuments({ status: 'distributed' });
    const recycled = await Donation.countDocuments({ status: 'recycled' });
    const verifiedNgos = await User.countDocuments({ role: 'ngo', isVerified: true });
    const totalDonors = await User.countDocuments({ role: 'donor' });

    const recycleAgg = await Donation.aggregate([
      { $match: { isRecycled: true } },
      { $group: { _id: null, totalValue: { $sum: '$recycleValue' }, count: { $sum: 1 } } }
    ]);
    const totalRecycleValue = recycleAgg.length ? recycleAgg[0].totalValue : 0;

    const beneficiaryAgg = await Donation.aggregate([
      { $match: { status: 'distributed' } },
      { $group: { _id: null, total: { $sum: '$beneficiaryCount' } } }
    ]);
    const totalBeneficiaries = beneficiaryAgg.length ? beneficiaryAgg[0].total : 0;

    const moneyDistributed = await MoneyDistribution.find().sort({ createdAt: -1 }).limit(5);

    const recentDistributed = await Donation.find({ status: 'distributed' })
      .sort({ distributedAt: -1 })
      .limit(10)
      .select('itemName category ngoName distributedAt beneficiaryCount evidencePhotos distributionNote donorName');

    const ngos = await User.find({ role: 'ngo', isVerified: true })
      .select('name organizationName ngoCategory priorityScore totalReceived totalDistributed verifiedAt')
      .sort({ priorityScore: -1 });

    res.json({
      totalDonations, distributed, recycled, verifiedNgos, totalDonors,
      totalRecycleValue, totalBeneficiaries, moneyDistributed,
      recentDistributed, ngos
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
