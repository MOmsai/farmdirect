// backend/routes/products.js

const express = require('express');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');

const router = express.Router();

const FARMER_FIELDS = 'name farmName farmLocation';

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Pulses',
  'Spices',
  'Dairy',
  'Oilseeds',
  'Other',
];

const FARMING_TYPES = ['Organic', 'Non-Organic'];

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
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({
      quantity: { $gt: 0 },
    })
      .populate('farmer', FARMER_FIELDS)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('Get products error:', err);

    res.status(500).json({
      msg: 'Server error',
    });
  }
});

// =====================================================
// GET FARMER'S PRODUCTS
// GET /api/products/my-products
//
// IMPORTANT:
// This MUST come BEFORE /:id
// =====================================================

router.get('/my-products', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({
      msg: 'Farmers only',
    });
  }

  try {
    if (!req.user.id) {
      return res.status(401).json({
        msg: 'User ID missing from authentication token',
      });
    }

    const products = await Product.find({
      farmer: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.json(products);
  } catch (err) {
    console.error('MY PRODUCTS ERROR:', err);

    return res.status(500).json({
      msg: 'Failed to load farmer products',
      error:
        process.env.NODE_ENV === 'production'
          ? undefined
          : err.message,
    });
  }
});

// =====================================================
// ADD PRODUCT
// POST /api/products
// =====================================================

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({
      msg: 'Access denied. Farmers only.',
    });
  }

  const {
    name,
    description,
    category,
    farmingType,
    pricePerKg,
    quantity,
    imageUrl,
  } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({
      msg: 'Product name is required',
    });
  }

  if (
    pricePerKg === undefined ||
    Number(pricePerKg) < 0
  ) {
    return res.status(400).json({
      msg: 'Valid price per kg is required',
    });
  }

  if (
    quantity === undefined ||
    Number(quantity) < 0
  ) {
    return res.status(400).json({
      msg: 'Valid quantity is required',
    });
  }

  if (
    category &&
    !CATEGORIES.includes(category)
  ) {
    return res.status(400).json({
      msg: 'Invalid product category',
    });
  }

  if (
    farmingType &&
    !FARMING_TYPES.includes(farmingType)
  ) {
    return res.status(400).json({
      msg: 'Invalid farming type',
    });
  }

  try {
    const product = new Product({
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'Other',
      farmingType: farmingType || 'Non-Organic',
      pricePerKg: Number(pricePerKg),
      quantity: Number(quantity),
      imageUrl: imageUrl || '',
      farmer: req.user.id,
    });

    await product.save();

    const populatedProduct =
      await Product.findById(product._id)
        .populate('farmer', FARMER_FIELDS);

    res.status(201).json(populatedProduct);
  } catch (err) {
    console.error('Add product error:', err);

    res.status(500).json({
      msg: 'Server error',
    });
  }
});

// =====================================================
// GET PRODUCT BY ID
// GET /api/products/:id
//
// IMPORTANT:
// This MUST come AFTER /my-products
// =====================================================

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).populate('farmer', FARMER_FIELDS);

    if (!product) {
      return res.status(404).json({
        msg: 'Product not found',
      });
    }

    res.json(product);
  } catch (err) {
    console.error('Product details error:', err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        msg: 'Invalid product ID',
      });
    }

    res.status(500).json({
      msg: 'Server error',
    });
  }
});

// =====================================================
// UPDATE STOCK
// PATCH /api/products/:id/stock
// =====================================================

router.patch(
  '/:id/stock',
  auth,
  async (req, res) => {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        msg: 'Access denied',
      });
    }

    const { quantity } = req.body;

    if (
      quantity === undefined ||
      Number(quantity) < 0
    ) {
      return res.status(400).json({
        msg: 'Valid quantity is required',
      });
    }

    try {
      const product =
        await Product.findOneAndUpdate(
          {
            _id: req.params.id,
            farmer: req.user.id,
          },
          {
            quantity: Number(quantity),
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          'farmer',
          FARMER_FIELDS
        );

      if (!product) {
        return res.status(404).json({
          msg: 'Product not found or not owned by you',
        });
      }

      res.json(product);
    } catch (err) {
      console.error(
        'Stock update error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

router.put(
  '/:id',
  auth,
  async (req, res) => {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        msg: 'Access denied',
      });
    }

    const {
      name,
      description,
      category,
      farmingType,
      pricePerKg,
      quantity,
      imageUrl,
    } = req.body;

    if (
      !name ||
      pricePerKg === undefined ||
      quantity === undefined
    ) {
      return res.status(400).json({
        msg:
          'Name, price per kg, and quantity are required',
      });
    }

    if (
      category &&
      !CATEGORIES.includes(category)
    ) {
      return res.status(400).json({
        msg: 'Invalid product category',
      });
    }

    if (
      farmingType &&
      !FARMING_TYPES.includes(farmingType)
    ) {
      return res.status(400).json({
        msg: 'Invalid farming type',
      });
    }

    try {
      const product =
        await Product.findOneAndUpdate(
          {
            _id: req.params.id,
            farmer: req.user.id,
          },
          {
            name: name.trim(),
            description:
              description?.trim() || '',
            category:
              category || 'Other',
            farmingType:
              farmingType || 'Non-Organic',
            pricePerKg:
              Number(pricePerKg),
            quantity:
              Number(quantity),
            imageUrl:
              imageUrl || '',
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          'farmer',
          FARMER_FIELDS
        );

      if (!product) {
        return res.status(404).json({
          msg:
            'Product not found or not owned by you',
        });
      }

      res.json(product);
    } catch (err) {
      console.error(
        'Update product error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

router.delete(
  '/:id',
  auth,
  async (req, res) => {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        msg: 'Access denied',
      });
    }

    try {
      const product =
        await Product.findOneAndDelete({
          _id: req.params.id,
          farmer: req.user.id,
        });

      if (!product) {
        return res.status(404).json({
          msg:
            'Product not found or not owned by you',
        });
      }

      res.json({
        msg: 'Product deleted',
        id: req.params.id,
      });
    } catch (err) {
      console.error(
        'Delete product error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;