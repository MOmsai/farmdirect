const express = require('express');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

// =====================================================
// AUTH MIDDLEWARE
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
// CUSTOMER CHECK
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
// GET CART
// GET /api/cart
// =====================================================

router.get(
  '/',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      let cart = await Cart.findOne({
        customer: req.user.id,
      }).populate({
        path: 'items.product',
        populate: {
          path: 'farmer',
          select: 'name farmName farmLocation',
        },
      });

      if (!cart) {
        cart = await Cart.create({
          customer: req.user.id,
          items: [],
        });
      }

      res.json(cart);
    } catch (err) {
      console.error('Get cart error:', err);

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// ADD TO CART
// POST /api/cart/add
// =====================================================

router.post(
  '/add',
  auth,
  customerOnly,
  async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        msg: 'Product ID is required',
      });
    }

    const requestedQuantity = Number(quantity);

    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return res.status(400).json({
        msg: 'Quantity must be greater than 0',
      });
    }

    try {
      const product = await Product.findById(
        productId
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
          msg: 'Product is out of stock',
        });
      }

      let cart = await Cart.findOne({
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
          item =>
            String(item.product) ===
            String(productId)
        );

      const existingQuantity =
        existingItem
          ? Number(existingItem.quantity)
          : 0;

      const newQuantity =
        existingQuantity +
        requestedQuantity;

      if (
        newQuantity >
        Number(product.quantity)
      ) {
        return res.status(400).json({
          msg: `Only ${product.quantity} kg of ${product.name} is available`,
        });
      }

      if (existingItem) {
        existingItem.quantity =
          newQuantity;
      } else {
        cart.items.push({
          product: product._id,
          quantity: requestedQuantity,
        });
      }

      await cart.save();

      const populatedCart =
        await Cart.findById(cart._id).populate({
          path: 'items.product',
          populate: {
            path: 'farmer',
            select:
              'name farmName farmLocation',
          },
        });

      res.json(populatedCart);
    } catch (err) {
      console.error(
        'Add cart error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// UPDATE CART QUANTITY
// PATCH /api/cart/:productId
// =====================================================

router.patch(
  '/:productId',
  auth,
  customerOnly,
  async (req, res) => {
    const { quantity } = req.body;

    const newQuantity =
      Number(quantity);

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity < 0
    ) {
      return res.status(400).json({
        msg: 'Invalid quantity',
      });
    }

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
        newQuantity >
        Number(product.quantity)
      ) {
        return res.status(400).json({
          msg: `Only ${product.quantity} kg of ${product.name} is available`,
        });
      }

      const cart =
        await Cart.findOne({
          customer: req.user.id,
        });

      if (!cart) {
        return res.status(404).json({
          msg: 'Cart not found',
        });
      }

      const item =
        cart.items.find(
          item =>
            String(item.product) ===
            String(req.params.productId)
        );

      if (!item) {
        return res.status(404).json({
          msg: 'Product is not in cart',
        });
      }

      if (newQuantity === 0) {
        cart.items =
          cart.items.filter(
            item =>
              String(item.product) !==
              String(req.params.productId)
          );
      } else {
        item.quantity = newQuantity;
      }

      await cart.save();

      const populatedCart =
        await Cart.findById(cart._id).populate({
          path: 'items.product',
          populate: {
            path: 'farmer',
            select:
              'name farmName farmLocation',
          },
        });

      res.json(populatedCart);
    } catch (err) {
      console.error(
        'Update cart error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// REMOVE PRODUCT
// DELETE /api/cart/:productId
// =====================================================

router.delete(
  '/:productId',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const cart =
        await Cart.findOne({
          customer: req.user.id,
        });

      if (!cart) {
        return res.json({
          customer: req.user.id,
          items: [],
        });
      }

      cart.items =
        cart.items.filter(
          item =>
            String(item.product) !==
            String(req.params.productId)
        );

      await cart.save();

      const populatedCart =
        await Cart.findById(cart._id).populate({
          path: 'items.product',
          populate: {
            path: 'farmer',
            select:
              'name farmName farmLocation',
          },
        });

      res.json(populatedCart);
    } catch (err) {
      console.error(
        'Remove cart error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// CLEAR CART
// DELETE /api/cart
// =====================================================

router.delete(
  '/',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      await Cart.findOneAndUpdate(
        {
          customer: req.user.id,
        },
        {
          $set: {
            items: [],
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      res.json({
        msg: 'Cart cleared',
        items: [],
      });
    } catch (err) {
      console.error(
        'Clear cart error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;