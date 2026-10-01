const express = require('express');
const jwt = require('jsonwebtoken');

const Product = require('../models/Product');
const Order = require('../models/Order');

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
// GET RECOMMENDATIONS
// GET /api/recommendations
// =====================================================

router.get(
  '/',
  auth,
  async (req, res) => {
    try {
      const customerId =
        req.user.id;

      // -------------------------------------------------
      // Get customer's previous orders
      // -------------------------------------------------

      const orders =
        await Order.find({
          customer: customerId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(30)
          .lean();

      // -------------------------------------------------
      // Collect purchased product IDs
      // -------------------------------------------------

      const purchasedProductIds =
        new Set();

      for (const order of orders) {
        for (const item of order.items ||
          []) {
          if (item.product) {
            purchasedProductIds.add(
              String(item.product)
            );
          }
        }
      }

      // -------------------------------------------------
      // Load purchased product information
      // -------------------------------------------------

      const purchasedProducts =
        purchasedProductIds.size > 0
          ? await Product.find({
              _id: {
                $in: Array.from(
                  purchasedProductIds
                ),
              },
            }).lean()
          : [];

      // -------------------------------------------------
      // Build preference scores
      // -------------------------------------------------

      const categoryScore = {};
      const farmingTypeScore = {};
      const farmerScore = {};

      for (const product of purchasedProducts) {
        if (product.category) {
          categoryScore[
            product.category
          ] =
            (categoryScore[
              product.category
            ] || 0) + 3;
        }

        if (product.farmingType) {
          farmingTypeScore[
            product.farmingType
          ] =
            (farmingTypeScore[
              product.farmingType
            ] || 0) + 2;
        }

        if (product.farmer) {
          const farmerId =
            String(product.farmer);

          farmerScore[farmerId] =
            (farmerScore[farmerId] || 0) +
            2;
        }
      }

      // -------------------------------------------------
      // Get available products
      // -------------------------------------------------

      const products =
        await Product.find({
          quantity: {
            $gt: 0,
          },
        })
          .populate(
            'farmer',
            'name farmName farmLocation'
          )
          .lean();

      // -------------------------------------------------
      // Score products
      // -------------------------------------------------

      const scoredProducts =
        products
          .filter(
            (product) =>
              !purchasedProductIds.has(
                String(product._id)
              )
          )
          .map((product) => {
            let score = 0;

            // Same category
            if (
              product.category &&
              categoryScore[
                product.category
              ]
            ) {
              score +=
                categoryScore[
                  product.category
                ];
            }

            // Same farming type
            if (
              product.farmingType &&
              farmingTypeScore[
                product.farmingType
              ]
            ) {
              score +=
                farmingTypeScore[
                  product.farmingType
                ];
            }

            // Same farmer
            if (
              product.farmer?._id &&
              farmerScore[
                String(
                  product.farmer._id
                )
              ]
            ) {
              score +=
                farmerScore[
                  String(
                    product.farmer._id
                  )
                ];
            }

            // Small boost to newer products
            const age =
              Date.now() -
              new Date(
                product.createdAt ||
                  Date.now()
              ).getTime();

            const daysOld =
              age /
              (1000 * 60 * 60 * 24);

            if (daysOld <= 7) {
              score += 1;
            }

            return {
              ...product,
              recommendationScore:
                score,
            };
          });

      // -------------------------------------------------
      // Sort by recommendation score
      // -------------------------------------------------

      scoredProducts.sort(
        (a, b) => {
          if (
            b.recommendationScore !==
            a.recommendationScore
          ) {
            return (
              b.recommendationScore -
              a.recommendationScore
            );
          }

          return (
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
          );
        }
      );

      // -------------------------------------------------
      // Fallback for new customers
      // -------------------------------------------------

      let recommendations =
        scoredProducts.slice(0, 8);

      if (
        recommendations.length < 8
      ) {
        const existingIds =
          new Set(
            recommendations.map(
              (product) =>
                String(product._id)
            )
          );

        const fallback =
          products
            .filter(
              (product) =>
                !purchasedProductIds.has(
                  String(product._id)
                ) &&
                !existingIds.has(
                  String(product._id)
                )
            )
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt || 0
                ) -
                new Date(
                  a.createdAt || 0
                )
            );

        recommendations = [
          ...recommendations,
          ...fallback.slice(
            0,
            8 -
              recommendations.length
          ),
        ];
      }

      res.json({
        recommendations,
        personalized:
          purchasedProducts.length > 0,
      });
    } catch (err) {
      console.error(
        'Recommendation error:',
        err
      );

      res.status(500).json({
        msg: 'Unable to generate recommendations',
      });
    }
  }
);

module.exports = router;