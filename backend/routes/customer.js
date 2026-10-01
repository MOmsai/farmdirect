const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
// CUSTOMER ONLY
// =====================================================

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Access denied: Customers only',
    });
  }

  next();
};

// =====================================================
// GET CUSTOMER PROFILE
// GET /api/customer/profile
// =====================================================

router.get(
  '/profile',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select(
        '-password'
      );

      if (!user) {
        return res.status(404).json({
          msg: 'Customer not found',
        });
      }

      res.json(user);
    } catch (err) {
      console.error(
        'Get customer profile error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// UPDATE CUSTOMER PROFILE
// PUT /api/customer/profile
// =====================================================

router.put(
  '/profile',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        profileImage,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          msg: 'Name is required',
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          msg: 'Email is required',
        });
      }

      const existingUser = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(400).json({
          msg: 'Email is already registered',
        });
      }

      const user = await User.findById(
        req.user.id
      );

      if (!user) {
        return res.status(404).json({
          msg: 'Customer not found',
        });
      }

      user.name = name.trim();
      user.email = email.trim().toLowerCase();
      user.phone = phone
        ? phone.trim()
        : '';
      user.profileImage = profileImage
        ? profileImage.trim()
        : '';

      await user.save();

      const responseUser =
        await User.findById(req.user.id).select(
          '-password'
        );

      res.json({
        msg: 'Profile updated successfully',
        user: responseUser,
      });
    } catch (err) {
      console.error(
        'Update customer profile error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;