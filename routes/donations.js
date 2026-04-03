const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images allowed'));
}});

// POST - Donor submits donation
router.post('/', auth, requireRole('donor'), upload.array('photos', 5), async (req, res) => {
  try {
    const { itemName, category, condition, description, quantity, address, pickupDate, lat, lng } = req.body;
    const photos = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
    const donation = new Donation({
      donorId: req.user._id,
      donorName: req.user.name,
      donorPhone: req.user.phone,
      itemName, category, condition, description,
      quantity: quantity || 1,
      photos, address,
      location: { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null },
      pickupDate: pickupDate ? new Date(pickupDate) : null
    });
    await donation.save();
    // Add points to donor
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });
    res.status(201).json({ message: 'Donation listed successfully!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - All donations (admin sees all, donor sees own, ngo sees assigned/listed)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'donor') query.donorId = req.user._id;
    else if (req.user.role === 'ngo') query.status = { $in: ['picked', 'distributed'] };
    // admin sees all
    const donations = await Donation.find(query).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Listed donations for BMC to assign
router.get('/pending', auth, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'listed' }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Donations assigned to logged-in officer
router.get('/my-assignments', auth, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find({ officerId: req.user._id, status: { $in: ['assigned', 'picked'] } }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Picked items for NGO to distribute
router.get('/for-ngo', auth, requireRole('ngo'), async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'picked', ngoId: null }).sort({ pickedAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - single donation
router.get('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - BMC Admin assigns officer to donation
router.put('/:id/assign-officer', auth, requireRole('admin'), async (req, res) => {
  try {
    const { officerId } = req.body;
    const officer = await User.findById(officerId);
    if (!officer) return res.status(404).json({ message: 'Officer not found' });
    const donation = await Donation.findByIdAndUpdate(req.params.id, {
      officerId, officerName: officer.name,
      status: 'assigned', assignedAt: new Date()
    }, { new: true });
    res.json({ message: `Assigned to officer ${officer.name}`, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - Officer marks item as picked up
router.put('/:id/mark-picked', auth, requireRole('admin'), async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, {
      status: 'picked', pickedAt: new Date()
    }, { new: true });
    res.json({ message: 'Item marked as picked!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - BMC assigns to NGO
router.put('/:id/assign-ngo', auth, requireRole('admin'), async (req, res) => {
  try {
    const { ngoId } = req.body;
    const ngo = await User.findById(ngoId);
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    const donation = await Donation.findByIdAndUpdate(req.params.id, {
      ngoId, ngoName: ngo.name || ngo.organizationName
    }, { new: true });
    res.json({ message: `Assigned to NGO ${ngo.organizationName || ngo.name}`, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - NGO marks as distributed
router.put('/:id/distribute', auth, requireRole('ngo'), async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, {
      status: 'distributed', distributedAt: new Date()
    }, { new: true });
    res.json({ message: 'Marked as distributed!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE - Donor cancels listing
router.delete('/:id', auth, requireRole('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donorId: req.user._id });
    if (!donation) return res.status(404).json({ message: 'Not found or unauthorized' });
    if (donation.status !== 'listed') return res.status(400).json({ message: 'Cannot delete - already in progress' });
    await donation.deleteOne();
    res.json({ message: 'Donation removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
