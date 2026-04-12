const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Donor info
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true },
  donorPhone: { type: String, default: '' },

  // Item info
  itemName: { type: String, required: true },
  category: {
    type: String,
    enum: ['clothes', 'books', 'utensils', 'toys', 'appliances', 'furniture', 'other'],
    required: true
  },
  condition: { type: String, enum: ['good', 'used', 'worn'], required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  photos: [{ type: String }],

  // Pickup info
  address: { type: String, required: true },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  pickupDate: { type: Date },

  // Status flow:
  // listed → assigned → picked → submitted → received → distributed → [recycled]
  status: {
    type: String,
    enum: ['listed', 'assigned', 'picked', 'submitted', 'received', 'distributed', 'recycled'],
    default: 'listed'
  },

  // BMC Officer
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  officerName: { type: String, default: '' },
  assignedAt: { type: Date, default: null },
  pickedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: null },

  // NGO Assignment - requests & assignment
  ngoRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // NGOs who requested
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ngoName: { type: String, default: '' },
  ngoAssignedAt: { type: Date, default: null },
  receivedAt: { type: Date, default: null },
  distributedAt: { type: Date, default: null },

  // Distribution details
  distributionNote: { type: String, default: '' },
  beneficiaryCount: { type: Number, default: 0 },
  evidencePhotos: [{ type: String }],

  // Recycle info
  isRecycled: { type: Boolean, default: false },
  recycleNote: { type: String, default: '' },
  recycleValue: { type: Number, default: 0 }, // Estimated money from recycling (₹)
  recycledAt: { type: Date, default: null },
  recycledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
