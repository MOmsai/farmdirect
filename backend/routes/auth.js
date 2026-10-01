// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  const { name, email, password, role, farmName, farmLocation } = req.body;

  // Validate input
  if (!name || !email || !password || !role) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Validate role
  if (!['customer', 'farmer'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role' });
  }

  // Validate farm details for farmers
  if (role === 'farmer') {
    if (
      !farmName ||
      !farmLocation ||
      !farmLocation.village ||
      !farmLocation.city ||
      !farmLocation.state ||
      !farmLocation.pincode
    ) {
      return res.status(400).json({ msg: 'Farm name and full location are required for farmers' });
    }
  }

  try {
    // Check if user exists
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
      ...(role === 'farmer' && {
        farmName: farmName.trim(),
        farmLocation: {
          village: farmLocation.village.trim(),
          city: farmLocation.city.trim(),
          state: farmLocation.state.trim(),
          pincode: farmLocation.pincode.trim(),
        },
      }),
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter email and password' });
  }

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT payload with email included
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            farmName: user.farmName,
            farmLocation: user.farmLocation,
          },
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/auth/verify - Verify token and get user info
router.get('/verify', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmName: user.farmName,
        farmLocation: user.farmLocation,
      },
    });
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

// x-auth-token middleware, matching the pattern used by products/orders/budget routes
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET).user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// GET /api/auth/farm-profile - Get the logged-in farmer's farm details
router.get('/farm-profile', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ msg: 'Farmers only' });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      farmName: user.farmName,
      farmLocation: user.farmLocation,
    });
  } catch (err) {
    console.error('Farm profile fetch error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/auth/farm-profile - Update the logged-in farmer's farm details
router.put('/farm-profile', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ msg: 'Farmers only' });
  }

  const { farmName, farmLocation } = req.body;

  if (
    !farmName ||
    !farmLocation ||
    !farmLocation.village ||
    !farmLocation.city ||
    !farmLocation.state ||
    !farmLocation.pincode
  ) {
    return res.status(400).json({ msg: 'Farm name and full location are required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        farmName: farmName.trim(),
        farmLocation: {
          village: farmLocation.village.trim(),
          city: farmLocation.city.trim(),
          state: farmLocation.state.trim(),
          pincode: farmLocation.pincode.trim(),
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      name: user.name,
      email: user.email,
      farmName: user.farmName,
      farmLocation: user.farmLocation,
    });
  } catch (err) {
    console.error('Farm profile update error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;