const express = require('express');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

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
// GET NOTIFICATIONS
// GET /api/notifications
// =====================================================

router.get(
  '/',
  auth,
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          customer: req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      const unreadCount =
        await Notification.countDocuments({
          customer: req.user.id,
          isRead: false,
        });

      res.json({
        notifications,
        unreadCount,
      });
    } catch (err) {
      console.error(
        'Get notifications error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// MARK ONE AS READ
// PATCH /api/notifications/:id/read
// =====================================================

router.patch(
  '/:id/read',
  auth,
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,
            customer: req.user.id,
          },
          {
            $set: {
              isRead: true,
            },
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          msg: 'Notification not found',
        });
      }

      res.json(notification);
    } catch (err) {
      console.error(
        'Mark notification read error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// =====================================================

router.patch(
  '/read-all',
  auth,
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          customer: req.user.id,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

      res.json({
        msg: 'All notifications marked as read',
      });
    } catch (err) {
      console.error(
        'Mark all notifications read error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

// =====================================================
// DELETE ONE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================

router.delete(
  '/:id',
  auth,
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndDelete({
          _id: req.params.id,
          customer: req.user.id,
        });

      if (!notification) {
        return res.status(404).json({
          msg: 'Notification not found',
        });
      }

      res.json({
        msg: 'Notification deleted',
      });
    } catch (err) {
      console.error(
        'Delete notification error:',
        err
      );

      res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);

module.exports = router;