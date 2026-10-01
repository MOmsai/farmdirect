// backend/routes/farmers.js
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();

const FARMER_FIELDS = 'name email farmName farmLocation role';

/*
  GET /api/farmers/:id
  Customer-facing farm profile.
*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid farmer ID' });
    }

    const farmer = await User.findOne({
      _id: id,
      role: 'farmer',
    }).select(FARMER_FIELDS);

    if (!farmer) {
      return res.status(404).json({ msg: 'Farmer not found' });
    }

    const products = await Product.find({
      farmer: farmer._id,
    })
      .sort({ createdAt: -1 })
      .select('name description pricePerKg quantity imageUrl category farmingType createdAt')
      .lean();

    const totalStock = products.reduce(
      (sum, product) => sum + Number(product.quantity || 0),
      0
    );

    const categories = [
      ...new Set(products.map((product) => product.category).filter(Boolean)),
    ];

    return res.json({
      farmer,
      products,
      stats: {
        productCount: products.length,
        totalStock,
        categories,
        organicProducts: products.filter(
          (product) => product.farmingType === 'Organic'
        ).length,
        nonOrganicProducts: products.filter(
          (product) => product.farmingType === 'Non-Organic'
        ).length,
      },
    });
  } catch (err) {
    console.error('Farmer profile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
