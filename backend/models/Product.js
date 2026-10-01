// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    pricePerKg: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    category: {
      type: String,
      enum: [
        'Vegetables',
        'Fruits',
        'Grains',
        'Pulses',
        'Spices',
        'Dairy',
        'Oilseeds',
        'Other',
      ],
      default: 'Other',
    },
    farmingType: {
      type: String,
      enum: ['Organic', 'Non-Organic'],
      default: 'Organic',
    },
    imageUrl: { type: String },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Phase 4: Product Reviews & Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
