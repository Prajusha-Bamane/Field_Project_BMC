const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true },
  donorPhone: { type: String, default: '' },
  itemName: { type: String, required: true },
  category: {
    type: String,
    enum: ['clothes', 'books', 'utensils', 'toys', 'appliances', 'other'],
    required: true
  },
  condition: { type: String, enum: ['good', 'used', 'worn'], required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  photos: [{ type: String }], // array of file paths
  address: { type: String, required: true },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  pickupDate: { type: Date },
  status: {
    type: String,
    enum: ['listed', 'assigned', 'picked', 'distributed'],
    default: 'listed'
  },
  // BMC Officer assigned to collect
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  officerName: { type: String, default: '' },
  assignedAt: { type: Date, default: null },
  pickedAt: { type: Date, default: null },
  // NGO assigned to distribute
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ngoName: { type: String, default: '' },
  distributedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
