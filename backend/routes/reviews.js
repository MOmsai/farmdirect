// backend/routes/reviews.js
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

/* =========================================================
   AUTH
========================================================= */
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({
      msg: 'No token, authorization denied',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({
      msg: 'Token is not valid',
    });
  }
};

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Customers only',
    });
  }

  next();
};

const validObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

/* =========================================================
   RECALCULATE PRODUCT RATING
========================================================= */
const refreshProductRating = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = result.length
    ? Number(result[0].averageRating.toFixed(1))
    : 0;

  const reviewCount = result.length
    ? result[0].reviewCount
    : 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating,
    reviewCount,
  });

  return { averageRating, reviewCount };
};

/* =========================================================
   CHECK WHETHER CUSTOMER HAS A DELIVERED PURCHASE
========================================================= */
const findDeliveredPurchase = async (customerId, productId) => {
  const orders = await Order.find({
    customer: customerId,
    'items.product': productId,
  }).sort({ createdAt: -1 });

  for (const order of orders) {
    const item = (order.items || []).find(
      (orderItem) =>
        String(orderItem.product) === String(productId)
    );

    if (!item) continue;

    // Current FarmDirect orders use item-level Delivered status.
    // The overall Delivered check keeps compatibility with older orders.
    if (
      item.status === 'Delivered' ||
      order.status === 'Delivered'
    ) {
      return {
        order,
        item,
      };
    }
  }

  return null;
};

/* =========================================================
   GET REVIEWS FOR A PRODUCT
   GET /api/reviews/product/:productId

   Public endpoint: anyone can read reviews.
========================================================= */
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;

  if (!validObjectId(productId)) {
    return res.status(400).json({
      msg: 'Invalid product ID',
    });
  }

  try {
    const product = await Product.findById(productId).select(
      '_id name averageRating reviewCount'
    );

    if (!product) {
      return res.status(404).json({
        msg: 'Product not found',
      });
    }

    const reviews = await Review.find({
      product: productId,
    })
      .sort({ createdAt: -1 })
      .populate('customer', 'name')
      .lean();

    return res.json({
      productId,
      averageRating: Number(product.averageRating || 0),
      reviewCount: Number(product.reviewCount || 0),
      reviews,
    });
  } catch (err) {
    console.error('Get reviews error:', err);
    return res.status(500).json({
      msg: 'Server error',
    });
  }
});

/* =========================================================
   GET CURRENT CUSTOMER'S REVIEW + ELIGIBILITY
   GET /api/reviews/product/:productId/my-review
========================================================= */
router.get(
  '/product/:productId/my-review',
  auth,
  customerOnly,
  async (req, res) => {
    const { productId } = req.params;

    if (!validObjectId(productId)) {
      return res.status(400).json({
        msg: 'Invalid product ID',
      });
    }

    try {
      const review = await Review.findOne({
        product: productId,
        customer: req.user.id,
      }).lean();

      const purchase = await findDeliveredPurchase(
        req.user.id,
        productId
      );

      return res.json({
        review: review || null,
        eligible: Boolean(purchase),
        deliveredOrderId: purchase?.order?._id || null,
      });
    } catch (err) {
      console.error('My review error:', err);
      return res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

/* =========================================================
   CREATE REVIEW
   POST /api/reviews/product/:productId
========================================================= */
router.post(
  '/product/:productId',
  auth,
  customerOnly,
  async (req, res) => {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    if (!validObjectId(productId)) {
      return res.status(400).json({
        msg: 'Invalid product ID',
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        msg: 'Rating must be a whole number from 1 to 5',
      });
    }

    if (comment && String(comment).trim().length > 1000) {
      return res.status(400).json({
        msg: 'Review comment cannot exceed 1000 characters',
      });
    }

    try {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          msg: 'Product not found',
        });
      }

      const existingReview = await Review.findOne({
        product: productId,
        customer: req.user.id,
      });

      if (existingReview) {
        return res.status(409).json({
          msg: 'You have already reviewed this product. You can edit your review.',
          review: existingReview,
        });
      }

      const purchase = await findDeliveredPurchase(
        req.user.id,
        productId
      );

      if (!purchase) {
        return res.status(403).json({
          msg: 'You can review this product only after it has been delivered to you.',
        });
      }

      const customer = await User.findById(req.user.id).select(
        'name'
      );

      const review = new Review({
        product: productId,
        customer: req.user.id,
        order: purchase.order._id,
        rating: numericRating,
        title: String(title || '').trim(),
        comment: String(comment || '').trim(),
        customerName: customer?.name || 'Customer',
      });

      await review.save();

      const summary = await refreshProductRating(productId);

      const populatedReview = await Review.findById(review._id)
        .populate('customer', 'name')
        .lean();

      return res.status(201).json({
        msg: 'Review submitted successfully',
        review: populatedReview,
        ...summary,
      });
    } catch (err) {
      console.error('Create review error:', err);

      if (err.code === 11000) {
        return res.status(409).json({
          msg: 'You have already reviewed this product.',
        });
      }

      return res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

/* =========================================================
   UPDATE MY REVIEW
   PUT /api/reviews/:reviewId
========================================================= */
router.put(
  '/:reviewId',
  auth,
  customerOnly,
  async (req, res) => {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    if (!validObjectId(reviewId)) {
      return res.status(400).json({
        msg: 'Invalid review ID',
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        msg: 'Rating must be a whole number from 1 to 5',
      });
    }

    try {
      const review = await Review.findOne({
        _id: reviewId,
        customer: req.user.id,
      });

      if (!review) {
        return res.status(404).json({
          msg: 'Review not found',
        });
      }

      // Keep the review tied to a verified delivered purchase.
      const purchase = await findDeliveredPurchase(
        req.user.id,
        review.product
      );

      if (!purchase) {
        return res.status(403).json({
          msg: 'This review is no longer eligible for editing.',
        });
      }

      review.rating = numericRating;
      review.title = String(title || '').trim();
      review.comment = String(comment || '').trim();

      await review.save();

      const summary = await refreshProductRating(
        review.product
      );

      const populatedReview = await Review.findById(review._id)
        .populate('customer', 'name')
        .lean();

      return res.json({
        msg: 'Review updated successfully',
        review: populatedReview,
        ...summary,
      });
    } catch (err) {
      console.error('Update review error:', err);
      return res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

/* =========================================================
   DELETE MY REVIEW
   DELETE /api/reviews/:reviewId
========================================================= */
router.delete(
  '/:reviewId',
  auth,
  customerOnly,
  async (req, res) => {
    const { reviewId } = req.params;

    if (!validObjectId(reviewId)) {
      return res.status(400).json({
        msg: 'Invalid review ID',
      });
    }

    try {
      const review = await Review.findOne({
        _id: reviewId,
        customer: req.user.id,
      });

      if (!review) {
        return res.status(404).json({
          msg: 'Review not found',
        });
      }

      const productId = review.product;

      await review.deleteOne();

      const summary = await refreshProductRating(productId);

      return res.json({
        msg: 'Review deleted successfully',
        ...summary,
      });
    } catch (err) {
      console.error('Delete review error:', err);
      return res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;
