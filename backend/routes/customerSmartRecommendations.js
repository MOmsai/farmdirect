const express = require('express');
const jwt = require('jsonwebtoken');

const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const CustomerBudget = require('../models/CustomerBudget');

const router = express.Router();

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

function auth(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({
      msg: 'Authentication required',
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
      msg: 'Invalid or expired token',
    });
  }
}

/* =========================================================
   CUSTOMER ONLY
========================================================= */

function customerOnly(req, res, next) {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({
      msg: 'Customers only',
    });
  }

  next();
}

/* =========================================================
   PARSE GEMINI JSON
========================================================= */

function parseJson(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start >= 0 && end > start) {
      return JSON.parse(
        cleaned.slice(start, end + 1)
      );
    }

    throw new Error(
      'AI returned invalid JSON'
    );
  }
}

/* =========================================================
   GEMINI
========================================================= */

async function generateWithGemini(prompt) {
  const { GoogleGenAI } = require('@google/genai');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is not configured'
    );
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
  ].filter(Boolean);

  let lastError;

  for (const model of [
    ...new Set(models),
  ]) {
    try {
      const response =
        await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType:
              'application/json',
          },
        });

      const text =
        typeof response.text === 'function'
          ? response.text()
          : response.text;

      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;

      const message = String(
        err?.message || err
      ).toLowerCase();

      const temporary = [
        '503',
        '429',
        'unavailable',
        'overloaded',
        'resource exhausted',
      ].some((value) =>
        message.includes(value)
      );

      if (!temporary) {
        throw err;
      }
    }
  }

  throw (
    lastError ||
    new Error('Gemini request failed')
  );
}

/* =========================================================
   SMART RECOMMENDATIONS
   GET /api/ai/smart-recommendations
========================================================= */

router.get(
  '/smart-recommendations',
  auth,
  customerOnly,
  async (req, res) => {
    try {
      const customerId = req.user.id;

      /* ---------------------------------------------------
         LOAD CUSTOMER DATA
      --------------------------------------------------- */

      const [
        products,
        cart,
        wishlist,
        orders,
        budgetDoc,
      ] = await Promise.all([
        Product.find({
          quantity: {
            $gt: 0,
          },
        })
          .populate(
            'farmer',
            'name farmName farmLocation'
          )
          .lean(),

        Cart.findOne({
          customer: customerId,
        })
          .populate('items.product')
          .lean(),

        Wishlist.findOne({
          customer: customerId,
        })
          .populate({
            path: 'products',
            populate: {
              path: 'farmer',
              select:
                'name farmName farmLocation',
            },
          })
          .lean(),

        Order.find({
          customer: customerId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .populate(
            'items.product',
            'name category farmingType'
          )
          .lean(),

        CustomerBudget.findOne({
          customer: customerId,
        }).lean(),
      ]);

      /* ---------------------------------------------------
         CALCULATE SPENDING
      --------------------------------------------------- */

      const now = new Date();

      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      let allTimeSpending = 0;
      let currentMonthSpending = 0;

      const purchasedNames = [];

      for (const order of orders || []) {
        for (const item of order.items || []) {
          const status =
            item.status ||
            order.status ||
            'Pending';

          /*
            Only delivered purchases count
            towards spending.
          */

          if (status !== 'Delivered') {
            continue;
          }

          const amount =
            Number(
              item.pricePerKg || 0
            ) *
            Number(
              item.quantity || 0
            );

          allTimeSpending += amount;

          if (
            new Date(order.createdAt) >=
            monthStart
          ) {
            currentMonthSpending +=
              amount;
          }

          if (
            item.product?.name
          ) {
            purchasedNames.push(
              item.product.name
            );
          }
        }
      }

      /* ---------------------------------------------------
         BUDGET
      --------------------------------------------------- */

      const monthlyBudget =
        Number(
          budgetDoc?.monthlyBudget
        ) || 5000;

      const remainingBudget =
        Math.max(
          0,
          monthlyBudget -
            currentMonthSpending
        );

      /* ---------------------------------------------------
         CART
      --------------------------------------------------- */

      const cartItems = (
        cart?.items || []
      ).map((item) => ({
        productId:
          item.product?._id,

        name:
          item.product?.name,

        quantity:
          Number(
            item.quantity || 0
          ),
      }));

      /* ---------------------------------------------------
         WISHLIST
      --------------------------------------------------- */

      const wishlistItems = (
        wishlist?.products || []
      ).map((product) => ({
        productId:
          product?._id,

        name:
          product?.name,

        category:
          product?.category,

        farmingType:
          product?.farmingType,
      }));

      /* ---------------------------------------------------
         LIVE PRODUCT CATALOG
         
         IMPORTANT:
         imageUrl is included here.
      --------------------------------------------------- */

const catalog = products.map((product) => ({
  id: String(product._id),

  // IMPORTANT: frontend uses MongoDB _id
  _id: String(product._id),

  name: product.name,

  description: product.description || '',

  category:
    product.category || 'Other',

  farmingType:
    product.farmingType || 'Not specified',

  pricePerKg:
    Number(product.pricePerKg || 0),

  stockKg:
    Number(product.quantity || 0),

  imageUrl:
    product.imageUrl || '',

  averageRating:
    Number(product.averageRating || 0),

  reviewCount:
    Number(product.reviewCount || 0),

  farmerName:
    product.farmer?.farmName ||
    product.farmer?.name ||
    'Local Farmer',

  city:
    product.farmer?.farmLocation?.city ||
    '',

  state:
    product.farmer?.farmLocation?.state ||
    '',
}));

      /* ---------------------------------------------------
         NO PRODUCTS
      --------------------------------------------------- */

      if (!catalog.length) {
        return res.json({
          message:
            'There are no products currently available.',

          recommendations: [],

          context: {
            monthlyBudget,
            currentMonthSpending,
            remainingBudget,
          },
        });
      }

      /* ---------------------------------------------------
         GEMINI PROMPT
      --------------------------------------------------- */

      const prompt = `
You are FarmDirect AI Smart Recommendations.

Use ONLY the supplied live catalog.

Never invent:
- products
- prices
- stock
- farmers
- ratings
- availability
- images

Every recommended productId MUST exactly match
a catalog id.

Only recommend products where stockKg > 0.

Do not recommend products already in the customer's cart.

Respect Organic vs Non-Organic exactly as listed.

Prices are per kg.

Budget is monthly.

"Nearby" means only the supplied city/state.
Do not calculate distance.

Return valid JSON only.

CUSTOMER:

Monthly budget:
₹${monthlyBudget}

Current month delivered spending:
₹${currentMonthSpending}

Remaining budget:
₹${remainingBudget}

Recent delivered purchases:
${JSON.stringify(
  purchasedNames.slice(0, 20)
)}

Cart:
${JSON.stringify(cartItems)}

Wishlist:
${JSON.stringify(wishlistItems)}

LIVE CATALOG:
${JSON.stringify(catalog)}

Return exactly:

{
  "message": "short personalized explanation",
  "recommendations": [
    {
      "productId": "exact catalog id",
      "reason": "short reason"
    }
  ],
  "budgetNote": "short budget note"
}

Return 3-6 recommendations when possible.
`;

      /* ---------------------------------------------------
         GENERATE AI RESPONSE
      --------------------------------------------------- */

      const aiResponse =
        await generateWithGemini(
          prompt
        );

      const parsed =
        parseJson(aiResponse);

      /* ---------------------------------------------------
         VALIDATE AI PRODUCT IDS
      --------------------------------------------------- */

      const validProducts =
        new Map(
          catalog.map(
            (product) => [
              product.id,
              product,
            ]
          )
        );

      const cartIds =
        new Set(
          cartItems
            .map(
              (item) =>
                String(
                  item.productId
                )
            )
            .filter(Boolean)
        );

      const recommendations = [];

      const seen =
        new Set();

      for (
        const item of
          parsed.recommendations ||
          []
      ) {
        const id =
          String(
            item?.productId || ''
          );

        if (
          !id ||
          seen.has(id) ||
          cartIds.has(id)
        ) {
          continue;
        }

        const product =
          validProducts.get(id);

        if (
          !product ||
          product.stockKg <= 0
        ) {
          continue;
        }

        seen.add(id);

        recommendations.push({
  _id: product._id,
  id: product.id,

  name: product.name,
  description: product.description,
  category: product.category,
  farmingType: product.farmingType,

  pricePerKg: product.pricePerKg,
  stockKg: product.stockKg,

  imageUrl: product.imageUrl,

  averageRating: product.averageRating,
  reviewCount: product.reviewCount,

  farmerName: product.farmerName,
  city: product.city,
  state: product.state,

  reason:
    String(
      item?.reason ||
        'Recommended for you'
    ).slice(0, 240),
});

        if (
          recommendations.length >=
          6
        ) {
          break;
        }
      }

      /* ---------------------------------------------------
         FALLBACK RECOMMENDATIONS
      --------------------------------------------------- */

      if (
        !recommendations.length
      ) {
        catalog
          .filter(
            (product) =>
              product.stockKg > 0 &&
              !cartIds.has(
                product.id
              )
          )
          .sort(
            (a, b) =>
              b.averageRating -
                a.averageRating ||
              b.reviewCount -
                a.reviewCount
          )
          .slice(0, 4)
          .forEach(
            (product) => {
              recommendations.push({
                ...product,

                reason:
                  'Currently available on FarmDirect.',
              });
            }
          );
      }

      /* ---------------------------------------------------
         RESPONSE
      --------------------------------------------------- */

      return res.json({
        message:
          String(
            parsed.message ||
              'Here are some products selected for you.'
          ).slice(0, 500),

        recommendations,

        budgetNote:
          String(
            parsed.budgetNote || ''
          ).slice(0, 300),

        context: {
          monthlyBudget,
          currentMonthSpending,
          remainingBudget,
        },
      });
    } catch (err) {
      console.error(
        'AI smart recommendations error:',
        err
      );

      return res.status(500).json({
        msg:
          err.message ||
          'Unable to generate smart recommendations.',
      });
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;