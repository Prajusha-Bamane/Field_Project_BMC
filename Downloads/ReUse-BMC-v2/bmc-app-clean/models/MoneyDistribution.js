const mongoose = require('mongoose');

const moneyDistributionSchema = new mongoose.Schema({
  totalRecycleAmount: { type: Number, required: true }, // Total ₹ from recycling
  distributions: [
    {
      category: {
        type: String,
        enum: ['student_education', 'poor_food', 'medical_aid', 'infrastructure', 'other'],
        required: true
      },
      label: { type: String, required: true },
      amount: { type: Number, required: true },
      beneficiaryCount: { type: Number, default: 0 },
      description: { type: String, default: '' },
      evidence: { type: String, default: '' }, // photo/link
      distributedAt: { type: Date, default: Date.now }
    }
  ],
  note: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MoneyDistribution', moneyDistributionSchema);
