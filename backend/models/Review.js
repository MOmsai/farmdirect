// backend/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // The order in which the customer purchased this product.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    customerName: {
      type: String,
      trim: true,
      default: 'Customer',
    },
  },
  { timestamps: true }
);

// One review per customer per product. The customer can edit that review.
reviewSchema.index(
  { customer: 1, product: 1 },
  { unique: true }
);

module.exports = mongoose.model('Review', reviewSchema);
