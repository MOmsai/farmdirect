// backend/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();

// POST /api/users - Register a new user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  if (!['customer', 'farmer'].includes(role)) {
    return res.status(400).json({ msg: 'Role must be customer or farmer' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// =====================================================
// CUSTOMER FARMER PROFILE
// GET /api/users/farmer/:farmerId
// =====================================================

router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    console.log(
      'Loading farmer profile:',
      farmerId
    );

    // Find farmer
    const farmer = await User.findOne({
      _id: farmerId,
      role: 'farmer',
    }).select(
      'name email role farmName farmLocation'
    );

    if (!farmer) {
      return res.status(404).json({
        message: 'Farmer not found',
      });
    }

    // Find farmer's products
    const products = await Product.find({
      farmer: farmerId,
    })
      .sort({ createdAt: -1 })
      .populate(
        'farmer',
        'name farmName farmLocation'
      );

    return res.json({
      farmer,
      products,
    });

  } catch (error) {
    console.error(
      'Farmer profile error:',
      error
    );

    return res.status(500).json({
      message:
        'Server error while loading farmer profile',
    });
  }
});

module.exports = router;