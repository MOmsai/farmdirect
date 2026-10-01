const express = require('express');
const jwt = require('jsonwebtoken');
const Address = require('../models/Address');

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

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Access denied: Customers only',
    });
  }

  next();
};

// =====================================================
// GET ALL ADDRESSES
// GET /api/addresses
// =====================================================

router.get(
  '/',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const addresses = await Address.find({
        customer: req.user.id,
      }).sort({
        isDefault: -1,
        createdAt: -1,
      });

      res.json(addresses);
    } catch (err) {
      console.error(
        'Get addresses error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// ADD ADDRESS
// POST /api/addresses
// =====================================================

router.post(
  '/',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const {
        label,
        fullName,
        phone,
        street,
        city,
        state,
        pincode,
        isDefault,
      } = req.body;

      if (
        !fullName ||
        !phone ||
        !street ||
        !city ||
        !state ||
        !pincode
      ) {
        return res.status(400).json({
          msg: 'Please complete all address fields',
        });
      }

      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          msg: 'Phone number must contain 10 digits',
        });
      }

      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          msg: 'Pincode must contain 6 digits',
        });
      }

      const existingCount =
        await Address.countDocuments({
          customer: req.user.id,
        });

      const shouldBeDefault =
        Boolean(isDefault) ||
        existingCount === 0;

      if (shouldBeDefault) {
        await Address.updateMany(
          {
            customer: req.user.id,
          },
          {
            $set: {
              isDefault: false,
            },
          }
        );
      }

      const address = await Address.create({
        customer: req.user.id,
        label: label || 'Home',
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault: shouldBeDefault,
      });

      res.status(201).json({
        msg: 'Address added successfully',
        address,
      });
    } catch (err) {
      console.error(
        'Add address error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// UPDATE ADDRESS
// PUT /api/addresses/:id
// =====================================================

router.put(
  '/:id',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const address =
        await Address.findOne({
          _id: req.params.id,
          customer: req.user.id,
        });

      if (!address) {
        return res.status(404).json({
          msg: 'Address not found',
        });
      }

      const {
        label,
        fullName,
        phone,
        street,
        city,
        state,
        pincode,
        isDefault,
      } = req.body;

      if (
        !fullName ||
        !phone ||
        !street ||
        !city ||
        !state ||
        !pincode
      ) {
        return res.status(400).json({
          msg: 'Please complete all address fields',
        });
      }

      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          msg: 'Phone number must contain 10 digits',
        });
      }

      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          msg: 'Pincode must contain 6 digits',
        });
      }

      if (Boolean(isDefault)) {
        await Address.updateMany(
          {
            customer: req.user.id,
            _id: { $ne: address._id },
          },
          {
            $set: {
              isDefault: false,
            },
          }
        );
      }

      address.label = label || 'Home';
      address.fullName = fullName.trim();
      address.phone = phone.trim();
      address.street = street.trim();
      address.city = city.trim();
      address.state = state.trim();
      address.pincode = pincode.trim();
      address.isDefault = Boolean(isDefault);

      await address.save();

      res.json({
        msg: 'Address updated successfully',
        address,
      });
    } catch (err) {
      console.error(
        'Update address error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// SET DEFAULT ADDRESS
// PATCH /api/addresses/:id/default
// =====================================================

router.patch(
  '/:id/default',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const address =
        await Address.findOne({
          _id: req.params.id,
          customer: req.user.id,
        });

      if (!address) {
        return res.status(404).json({
          msg: 'Address not found',
        });
      }

      await Address.updateMany(
        {
          customer: req.user.id,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      address.isDefault = true;

      await address.save();

      res.json({
        msg: 'Default address updated',
        address,
      });
    } catch (err) {
      console.error(
        'Set default address error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// DELETE ADDRESS
// DELETE /api/addresses/:id
// =====================================================

router.delete(
  '/:id',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const address =
        await Address.findOneAndDelete({
          _id: req.params.id,
          customer: req.user.id,
        });

      if (!address) {
        return res.status(404).json({
          msg: 'Address not found',
        });
      }

      // If deleted address was default,
      // make another address default.
      if (address.isDefault) {
        const replacement =
          await Address.findOne({
            customer: req.user.id,
          }).sort({
            createdAt: -1,
          });

        if (replacement) {
          replacement.isDefault = true;
          await replacement.save();
        }
      }

      res.json({
        msg: 'Address deleted successfully',
      });
    } catch (err) {
      console.error(
        'Delete address error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;