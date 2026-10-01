const express = require('express');
const jwt = require('jsonwebtoken');

const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomerBudget = require('../models/CustomerBudget');

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

/* =========================================================
   CUSTOMER ONLY
========================================================= */

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Customers only',
    });
  }

  next();
};

/* =========================================================
   GET CUSTOMER SPENDING
   GET /api/customer-spending
========================================================= */

router.get(
  '/',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      /*
      -------------------------------------------------------
      Get customer's orders
      -------------------------------------------------------
      */

      const orders = await Order.find({
        customer: req.user.id,
      })
        .sort({ createdAt: -1 })
        .populate(
          'items.product',
          'name category farmingType pricePerKg'
        )
        .lean();

      /*
      -------------------------------------------------------
      Statistics
      -------------------------------------------------------
      */

      let totalSpending = 0;
      let monthlySpending = 0;

      const now = new Date();

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const categoryMap = {};
      const farmingTypeMap = {
        Organic: 0,
        'Non-Organic': 0,
      };

      const productMap = {};

      /*
      -------------------------------------------------------
      Process orders
      -------------------------------------------------------
      */

      for (const order of orders) {
        /*
        Only delivered orders count as spending.

        Cancelled orders are ignored.
        */

        const items = order.items || [];

        for (const item of items) {
          const itemStatus =
            item.status ||
            order.status ||
            'Pending';

          if (itemStatus === 'Cancelled') {
            continue;
          }

          /*
          Only delivered purchases count.

          This prevents pending/confirmed orders
          from being counted as completed spending.
          */

          if (itemStatus !== 'Delivered') {
            continue;
          }

          const quantity =
            Number(item.quantity) || 0;

          const price =
            Number(item.pricePerKg) ||
            Number(item.product?.pricePerKg) ||
            0;

          const amount =
            quantity * price;

          totalSpending += amount;

          /*
          ---------------------------------------------------
          Monthly spending
          ---------------------------------------------------
          */

          const orderDate =
            new Date(order.createdAt);

          if (
            orderDate.getMonth() ===
              currentMonth &&
            orderDate.getFullYear() ===
              currentYear
          ) {
            monthlySpending += amount;
          }

          /*
          ---------------------------------------------------
          Category
          ---------------------------------------------------
          */

          const category =
            item.product?.category ||
            'Other';

          categoryMap[category] =
            (categoryMap[category] || 0) +
            amount;

          /*
          ---------------------------------------------------
          Organic / Non-Organic
          ---------------------------------------------------
          */

          const farmingType =
            item.product?.farmingType ||
            'Non-Organic';

          if (
            farmingType === 'Organic'
          ) {
            farmingTypeMap.Organic +=
              amount;
          } else {
            farmingTypeMap[
              'Non-Organic'
            ] += amount;
          }

          /*
          ---------------------------------------------------
          Most purchased products
          ---------------------------------------------------
          */

          const productId =
            item.product?._id
              ? String(item.product._id)
              : String(item.product);

          const productName =
            item.name ||
            item.product?.name ||
            'Unknown Product';

          if (!productMap[productId]) {
            productMap[productId] = {
              productId,
              name: productName,
              category,
              farmingType,
              quantity: 0,
              amount: 0,
            };
          }

          productMap[
            productId
          ].quantity += quantity;

          productMap[
            productId
          ].amount += amount;
        }
      }

      /*
      -------------------------------------------------------
      Category array
      -------------------------------------------------------
      */

      const categorySpending =
        Object.entries(categoryMap)
          .map(
            ([category, amount]) => ({
              category,
              amount: Number(
                amount.toFixed(2)
              ),
            })
          )
          .sort(
            (a, b) =>
              b.amount - a.amount
          );

      /*
      -------------------------------------------------------
      Most purchased products
      -------------------------------------------------------
      */

      const topProducts =
        Object.values(productMap)
          .map((product) => ({
            ...product,
            quantity: Number(
              product.quantity.toFixed(2)
            ),
            amount: Number(
              product.amount.toFixed(2)
            ),
          }))
          .sort(
            (a, b) =>
              b.amount - a.amount
          )
          .slice(0, 5);

      /*
      -------------------------------------------------------
      Budget
      -------------------------------------------------------
      */

      let budget =
        await CustomerBudget.findOne({
          customer: req.user.id,
        }).lean();

      if (!budget) {
        budget = {
          monthlyBudget: 5000,
        };
      }

      const monthlyBudget =
        Number(
          budget.monthlyBudget
        ) || 0;

      const remainingBudget =
        Math.max(
          monthlyBudget -
            monthlySpending,
          0
        );

      const budgetPercentage =
        monthlyBudget > 0
          ? Math.min(
              (
                monthlySpending /
                  monthlyBudget
              ) *
                100,
              100
            )
          : 0;

      /*
      -------------------------------------------------------
      Response
      -------------------------------------------------------
      */

      return res.json({
        totalSpending: Number(
          totalSpending.toFixed(2)
        ),

        monthlySpending: Number(
          monthlySpending.toFixed(2)
        ),

        categorySpending,

        farmingTypeSpending: {
          organic: Number(
            farmingTypeMap.Organic.toFixed(
              2
            )
          ),

          nonOrganic: Number(
            farmingTypeMap[
              'Non-Organic'
            ].toFixed(2)
          ),
        },

        topProducts,

        budget: {
          monthlyBudget: Number(
            monthlyBudget.toFixed(2)
          ),

          remainingBudget: Number(
            remainingBudget.toFixed(2)
          ),

          percentage: Number(
            budgetPercentage.toFixed(1)
          ),
        },

        currency: 'INR',
      });
    } catch (error) {
      console.error(
        'Customer spending error:',
        error
      );

      return res.status(500).json({
        msg:
          'Server error while calculating spending',
      });
    }
  }
);

/* =========================================================
   UPDATE MONTHLY BUDGET

   PUT /api/customer-spending/budget
========================================================= */

router.put(
  '/budget',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const monthlyBudget =
        Number(
          req.body.monthlyBudget
        );

      if (
        Number.isNaN(monthlyBudget) ||
        monthlyBudget < 0
      ) {
        return res.status(400).json({
          msg:
            'Monthly budget must be a valid positive number',
        });
      }

      const budget =
        await CustomerBudget.findOneAndUpdate(
          {
            customer: req.user.id,
          },
          {
            customer: req.user.id,
            monthlyBudget,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

      return res.json({
        msg:
          'Monthly budget updated successfully',

        budget: {
          monthlyBudget:
            budget.monthlyBudget,
        },
      });
    } catch (error) {
      console.error(
        'Customer budget update error:',
        error
      );

      return res.status(500).json({
        msg:
          'Server error while updating budget',
      });
    }
  }
);

/* =========================================================
   GET MONTHLY BUDGET

   GET /api/customer-spending/budget
========================================================= */

router.get(
  '/budget',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const budget =
        await CustomerBudget.findOne({
          customer: req.user.id,
        }).lean();

      return res.json({
        monthlyBudget:
          Number(
            budget?.monthlyBudget || 5000
          ),
      });
    } catch (error) {
      console.error(
        'Customer budget fetch error:',
        error
      );

      return res.status(500).json({
        msg:
          'Server error while loading budget',
      });
    }
  }
);

module.exports = router;