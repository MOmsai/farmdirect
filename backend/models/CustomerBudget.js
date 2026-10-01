const mongoose = require('mongoose');

const customerBudgetSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    monthlyBudget: {
      type: Number,
      required: true,
      min: 0,
      default: 5000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'CustomerBudget',
  customerBudgetSchema
);