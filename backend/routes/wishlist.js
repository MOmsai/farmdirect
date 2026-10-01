const express = require('express');
const jwt = require('jsonwebtoken');

const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const router = express.Router();

// =====================================================
// AUTH
// =====================================================

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

// =====================================================
// CUSTOMER ONLY
// =====================================================

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Customers only',
    });
  }

  next();
};

// =====================================================
// GET WISHLIST
// GET /api/wishlist
// =====================================================

router.get(
  '/',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const wishlist =
        await Wishlist.findOne({
          customer: req.user.id,
        }).populate({
          path: 'products',
          populate: {
            path: 'farmer',
            select:
              'name farmName farmLocation',
          },
        });

      if (!wishlist) {
        return res.json({
          products: [],
        });
      }

      // Remove deleted products automatically
      const validProducts =
        wishlist.products.filter(
          (product) => product
        );

      res.json({
        products: validProducts,
      });
    } catch (err) {
      console.error(
        'Get wishlist error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// CHECK WISHLIST STATUS
// GET /api/wishlist/check/:productId
// =====================================================

router.get(
  '/check/:productId',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const wishlist =
        await Wishlist.findOne({
          customer: req.user.id,
        });

      if (!wishlist) {
        return res.json({
          isWishlisted: false,
        });
      }

      const isWishlisted =
        wishlist.products.some(
          (id) =>
            String(id) ===
            String(req.params.productId)
        );

      res.json({
        isWishlisted,
      });
    } catch (err) {
      console.error(
        'Wishlist check error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// ADD TO WISHLIST
// POST /api/wishlist/:productId
// =====================================================

router.post(
  '/:productId',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.productId
        );

      if (!product) {
        return res.status(404).json({
          msg: 'Product not found',
        });
      }

      let wishlist =
        await Wishlist.findOne({
          customer: req.user.id,
        });

      if (!wishlist) {
        wishlist = new Wishlist({
          customer: req.user.id,
          products: [product._id],
        });

        await wishlist.save();

        return res.status(201).json({
          msg: 'Product added to wishlist',
          isWishlisted: true,
        });
      }

      const alreadyExists =
        wishlist.products.some(
          (id) =>
            String(id) ===
            String(product._id)
        );

      if (alreadyExists) {
        return res.json({
          msg: 'Product is already in wishlist',
          isWishlisted: true,
        });
      }

      wishlist.products.push(product._id);

      await wishlist.save();

      res.json({
        msg: 'Product added to wishlist',
        isWishlisted: true,
      });
    } catch (err) {
      console.error(
        'Add wishlist error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// REMOVE FROM WISHLIST
// DELETE /api/wishlist/:productId
// =====================================================

router.delete(
  '/:productId',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const wishlist =
        await Wishlist.findOne({
          customer: req.user.id,
        });

      if (!wishlist) {
        return res.json({
          msg: 'Wishlist is empty',
          isWishlisted: false,
        });
      }

      wishlist.products =
        wishlist.products.filter(
          (id) =>
            String(id) !==
            String(req.params.productId)
        );

      await wishlist.save();

      res.json({
        msg: 'Product removed from wishlist',
        isWishlisted: false,
      });
    } catch (err) {
      console.error(
        'Remove wishlist error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// MOVE WISHLIST PRODUCT TO CART
// POST /api/wishlist/:productId/move-to-cart
// =====================================================

router.post(
  '/:productId/move-to-cart',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.productId
        );

      if (!product) {
        return res.status(404).json({
          msg: 'Product not found',
        });
      }

      if (
        Number(product.quantity) <= 0
      ) {
        return res.status(400).json({
          msg: 'Product is currently out of stock',
        });
      }

      let cart =
        await Cart.findOne({
          customer: req.user.id,
        });

      if (!cart) {
        cart = new Cart({
          customer: req.user.id,
          items: [],
        });
      }

      const existingItem =
        cart.items.find(
          (item) =>
            String(item.product) ===
            String(product._id)
        );

      if (existingItem) {
        if (
          Number(existingItem.quantity) >=
          Number(product.quantity)
        ) {
          return res.status(400).json({
            msg: `Only ${product.quantity} kg is available`,
          });
        }

        existingItem.quantity =
          Number(existingItem.quantity) + 1;
      } else {
        cart.items.push({
          product: product._id,
          quantity: 1,
        });
      }

      await cart.save();

      res.json({
        msg: 'Product moved to cart',
        cart,
      });
    } catch (err) {
      console.error(
        'Move wishlist product to cart error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;