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
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// ─── DONOR ────────────────────────────────────────────────────────────────────

// POST - Donor submits donation
router.post('/', auth, requireRole('donor'), upload.array('photos', 5), async (req, res) => {
  try {
    const { itemName, category, condition, description, quantity, address, pickupDate, lat, lng } = req.body;
    if (!itemName || !category || !condition || !address)
      return res.status(400).json({ message: 'Item name, category, condition, and address are required' });

    const photos = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
    const donation = new Donation({
      donorId: req.user._id,
      donorName: req.user.name,
      donorPhone: req.user.phone,
      itemName, category, condition, description,
      quantity: quantity || 1,
      photos, address,
      location: {
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null
      },
      pickupDate: pickupDate ? new Date(pickupDate) : null
    });
    await donation.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });
    res.status(201).json({ message: 'Donation listed successfully! You earned 10 points.', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Donor's own donations with tracking
router.get('/my', auth, requireRole('donor'), async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE - Donor cancels listing (only if 'listed')
router.delete('/:id', auth, requireRole('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donorId: req.user._id });
    if (!donation) return res.status(404).json({ message: 'Not found or unauthorized' });
    if (donation.status !== 'listed')
      return res.status(400).json({ message: 'Cannot delete — already in progress' });
    await donation.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: -10 } });
    res.json({ message: 'Donation removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── NGO ──────────────────────────────────────────────────────────────────────

// GET - Items available for NGO to request (status: 'picked', not yet NGO-assigned)
router.get('/available-for-ngo', auth, requireRole('ngo'), async (req, res) => {
  try {
    if (!req.user.isVerified)
      return res.status(403).json({ message: 'Your NGO must be verified by BMC first' });
    const donations = await Donation.find({ status: 'picked', ngoId: null }).sort({ pickedAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - NGO requests an item
router.post('/:id/request', auth, requireRole('ngo'), async (req, res) => {
  try {
    if (!req.user.isVerified)
      return res.status(403).json({ message: 'Your NGO must be verified by BMC first' });
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.status !== 'picked')
      return res.status(400).json({ message: 'Item is not available for request' });
    if (donation.ngoId)
      return res.status(400).json({ message: 'Item already assigned to another NGO' });
    if (donation.ngoRequests.includes(req.user._id))
      return res.status(400).json({ message: 'You have already requested this item' });

    donation.ngoRequests.push(req.user._id);
    await donation.save();
    res.json({ message: 'Request submitted! BMC will assign based on priority.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Items assigned to this NGO
router.get('/my-ngo', auth, requireRole('ngo'), async (req, res) => {
  try {
    const donations = await Donation.find({ ngoId: req.user._id }).sort({ ngoAssignedAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - NGO marks as received
router.put('/:id/received', auth, requireRole('ngo'), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, ngoId: req.user._id });
    if (!donation) return res.status(404).json({ message: 'Not found or unauthorized' });
    if (donation.status !== 'submitted')
      return res.status(400).json({ message: 'Item must be in "submitted" state first' });
    donation.status = 'received';
    donation.receivedAt = new Date();
    await donation.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalReceived: 1 } });
    res.json({ message: 'Item marked as received!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - NGO marks as distributed (with evidence)
router.put('/:id/distribute', auth, requireRole('ngo'), upload.array('evidence', 3), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, ngoId: req.user._id });
    if (!donation) return res.status(404).json({ message: 'Not found or unauthorized' });
    if (donation.status !== 'received')
      return res.status(400).json({ message: 'Item must be received first' });

    const { distributionNote, beneficiaryCount } = req.body;
    const evidencePhotos = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];

    donation.status = 'distributed';
    donation.distributedAt = new Date();
    donation.distributionNote = distributionNote || '';
    donation.beneficiaryCount = parseInt(beneficiaryCount) || 0;
    donation.evidencePhotos = evidencePhotos;
    await donation.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalDistributed: 1 } });
    // Update priority score
    const ngo = await User.findById(req.user._id);
    ngo.priorityScore = ngo.computePriority();
    await ngo.save();

    res.json({ message: 'Marked as distributed! Evidence saved.', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── BMC ADMIN ────────────────────────────────────────────────────────────────

// GET - All donations (admin view)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const donations = await Donation.find(query).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Pending (listed) donations
router.get('/pending', auth, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'listed' }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Donations with NGO requests (for BMC to assign)
router.get('/ngo-requests', auth, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find({
      status: 'picked',
      ngoId: null,
      ngoRequests: { $exists: true, $not: { $size: 0 } }
    }).sort({ pickedAt: -1 });

    // Populate NGO details for each request
    const populated = await Promise.all(donations.map(async (d) => {
      const ngoDetails = await User.find({ _id: { $in: d.ngoRequests } })
        .select('name organizationName priorityScore isVerified totalReceived totalDistributed');
      return { ...d.toObject(), ngoDetails };
    }));

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Officer's assignments
router.get('/my-assignments', auth, requireRole('admin'), async (req, res) => {
  try {
    const donations = await Donation.find({
      officerId: req.user._id,
      status: { $in: ['assigned', 'picked'] }
    }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - BMC assigns officer
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

// PUT - Officer marks as picked
router.put('/:id/mark-picked', auth, requireRole('admin'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.officerId.toString() !== req.user._id.toString() && req.user.badgeNumber !== 'ADMIN')
      return res.status(403).json({ message: 'Only the assigned officer can mark as picked' });
    donation.status = 'picked';
    donation.pickedAt = new Date();
    await donation.save();
    res.json({ message: 'Item marked as picked!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - BMC assigns NGO (priority-based)
/*router.put('/:id/assign-ngo', auth, requireRole('admin'), async (req, res) => {
  try {
    const { ngoId } = req.body;
    const ngo = await User.findById(ngoId);
    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    if (!ngo.isVerified) return res.status(400).json({ message: 'NGO is not verified by BMC' });

    const donation = await Donation.findByIdAndUpdate(req.params.id, {
      ngoId,
      ngoName: ngo.organizationName || ngo.name,
      ngoAssignedAt: new Date()
    }, { new: true });
    res.json({ message: `Assigned to NGO: ${ngo.organizationName || ngo.name}`, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});*/
router.put('/:id/assign-ngo', auth, requireRole('admin'), async (req, res) => {
  try {
    const { ngoId } = req.body;

  console.log("BODY:", req.body);        // 👈 ADD HERE
console.log("NGO ID:", ngoId);         // 👈 ADD HERE
console.log("Donation ID:", req.params.id);

    const ngo = await User.findById(ngoId);

    if (!ngo) return res.status(404).json({ message: 'NGO not found' });
    if (!ngo.isVerified) return res.status(400).json({ message: 'NGO is not verified by BMC' });

    // 🔥 GET DOCUMENT FIRST
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // 🔥 UPDATE MANUALLY
    donation.ngoId = ngoId;
    donation.ngoName = ngo.organizationName || ngo.name;
    donation.ngoAssignedAt = new Date();
    donation.status = "assigned_to_ngo";

    await donation.save();

    console.log("UPDATED DONATION:", donation);

    res.json({
      message: `Assigned to NGO: ${ngo.organizationName || ngo.name}`,
      donation
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
// PUT - BMC marks as submitted (to NGO)
router.put('/:id/submit', auth, requireRole('admin'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (!donation.ngoId) return res.status(400).json({ message: 'Assign an NGO first' });
    if (!['picked'].includes(donation.status))
      return res.status(400).json({ message: 'Item must be in picked state' });
    donation.status = 'submitted';
    donation.submittedAt = new Date();
    await donation.save();
    res.json({ message: 'Marked as submitted to NGO!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - BMC recycles distributed/received item (leftover)
router.put('/:id/recycle', auth, requireRole('admin'), async (req, res) => {
  try {
    const { recycleNote, recycleValue } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (!['distributed', 'received', 'picked', 'submitted'].includes(donation.status))
      return res.status(400).json({ message: 'Item cannot be recycled in its current state' });

    donation.status = 'recycled';
    donation.isRecycled = true;
    donation.recycleNote = recycleNote || '';
    donation.recycleValue = parseFloat(recycleValue) || 0;
    donation.recycledAt = new Date();
    donation.recycledBy = req.user._id;
    await donation.save();

    res.json({ message: 'Item marked as recycled!', donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Single donation
router.get('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
