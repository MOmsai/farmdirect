// backend/models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropName: { type: String, trim: true, default: '' },
    landSize: { type: Number, required: true, min: 0.01 },
    seedCost: { type: Number, default: 0, min: 0 },
    fertilizerCost: { type: Number, default: 0, min: 0 },
    laborCost: { type: Number, default: 0, min: 0 },
    irrigationCost: { type: Number, default: 0, min: 0 },
    otherCost: { type: Number, default: 0, min: 0 },
    expectedYieldKg: { type: Number, required: true, min: 0.01 },
    expectedPricePerKg: { type: Number, required: true, min: 0 },

    // Snapshot of the calculation at the time the plan was saved.
    totalCost: { type: Number, default: 0 },
    expectedRevenue: { type: Number, default: 0 },
    expectedProfit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    breakEvenPrice: { type: Number, default: 0 },
    costPerAcre: { type: Number, default: 0 },
    isViable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);
