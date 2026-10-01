const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');
const CustomerBudget = require('../models/CustomerBudget');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ msg: 'Customers only' });
  }
  next();
};

async function generateCustomerAI(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini AI is not configured. Please add GEMINI_API_KEY to backend/.env');
  }
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    contents: prompt,
  });
  return response.text || '';
}

const cleanJson = (text) =>
  String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

router.post('/customer-assistant', auth, customerOnly, async (req, res) => {
  const question = String(req.body?.question || '').trim();

  if (!question) return res.status(400).json({ msg: 'Please enter a question.' });
  if (question.length > 1000) {
    return res.status(400).json({ msg: 'Question must be 1000 characters or less.' });
  }

  try {
    const customerId = new mongoose.Types.ObjectId(req.user.id);

    const [products, cart, wishlist, orders, budget] = await Promise.all([
      Product.find({ quantity: { $gt: 0 } })
        .populate({ path: 'farmer', select: 'name farmName farmLocation' })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Cart.findOne({ customer: customerId })
        .populate({ path: 'items.product', populate: { path: 'farmer', select: 'name farmName farmLocation' } })
        .lean(),
      Wishlist.findOne({ customer: customerId })
        .populate({ path: 'products', populate: { path: 'farmer', select: 'name farmName farmLocation' } })
        .lean(),
      Order.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate({ path: 'items.product', select: 'name category farmingType pricePerKg' })
        .lean(),
      CustomerBudget.findOne({ customer: customerId }).lean(),
    ]);

    const catalog = products.map((p) => ({
      id: String(p._id),
      name: p.name,
      category: p.category || 'Other',
      farmingType: p.farmingType || 'Organic',
      pricePerKg: Number(p.pricePerKg || 0),
      stockKg: Number(p.quantity || 0),
      rating: Number(p.averageRating || 0),
      reviewCount: Number(p.reviewCount || 0),
      farmerName: p.farmer?.farmName || p.farmer?.name || 'Local Farmer',
      city: p.farmer?.farmLocation?.city || '',
      state: p.farmer?.farmLocation?.state || '',
    }));

    const cartText = (cart?.items || []).length
      ? cart.items.map(i => `${i.product?.name || 'Unknown'} x${Number(i.quantity || 0)}kg @ ₹${Number(i.product?.pricePerKg || 0).toFixed(0)}/kg`).join('\n')
      : 'Cart is empty.';

    const wishlistText = (wishlist?.products || []).length
      ? wishlist.products.map(p => `${p.name} | ${p.category || 'Other'} | ${p.farmingType || 'Organic'} | ₹${Number(p.pricePerKg || 0).toFixed(0)}/kg`).join('\n')
      : 'Wishlist is empty.';

    let totalSpending = 0;
    let currentMonthSpending = 0;
    const now = new Date();

    (orders || []).forEach((order) => {
      const orderDate = new Date(order.createdAt || now);
      (order.items || []).forEach((item) => {
        if (item.status !== 'Delivered') return;
        const amount = Number(item.quantity || 0) * Number(item.pricePerKg || item.product?.pricePerKg || 0);
        totalSpending += amount;
        if (orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth()) {
          currentMonthSpending += amount;
        }
      });
    });

    const monthlyBudget = Number(budget?.monthlyBudget || 5000);
    const remainingBudget = Math.max(0, monthlyBudget - currentMonthSpending);

    const purchaseText = [];
    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.status === 'Delivered') {
          purchaseText.push(`${item.name || item.product?.name || 'Unknown'} | ${item.product?.category || 'Other'} | ${item.product?.farmingType || 'Unknown'} | ${Number(item.quantity || 0)}kg`);
        }
      });
    });

    const catalogText = catalog.map(p =>
      `${p.id} | ${p.name} | ${p.category} | ${p.farmingType} | ₹${p.pricePerKg.toFixed(0)}/kg | stock ${p.stockKg}kg | rating ${p.rating} (${p.reviewCount}) | farmer ${p.farmerName} | ${p.city}, ${p.state}`
    ).join('\n');

    const prompt = `
You are FarmDirect AI, the shopping assistant inside a farm-to-customer marketplace.

Use ONLY the supplied FarmDirect data.
Never invent products, prices, stock, farmers, ratings, or availability.
Recommend only IDs from LIVE PRODUCT CATALOG.
Only products with stock > 0 are available.
Do not call a product organic unless farmingType is Organic.
Prices are per kg.
If a budget is discussed, remember quantity affects the total.
For local requests, use the supplied city/state; do not claim exact distance.
If data is insufficient, say what is missing.
Return VALID JSON ONLY, with no markdown fences.

Schema:
{
  "message": "answer to customer",
  "recommendedProductIds": ["id1", "id2"],
  "budgetNote": "short budget note or empty string"
}

CUSTOMER QUESTION:
${question}

MONTHLY BUDGET: ₹${monthlyBudget.toFixed(0)}
CURRENT MONTH SPENDING: ₹${currentMonthSpending.toFixed(0)}
REMAINING BUDGET: ₹${remainingBudget.toFixed(0)}
ALL-TIME DELIVERED SPENDING IN AVAILABLE HISTORY: ₹${totalSpending.toFixed(0)}

CURRENT CART:
${cartText}

WISHLIST:
${wishlistText}

RECENT DELIVERED PURCHASES:
${purchaseText.slice(0, 30).join('\n') || 'No delivered purchase history available.'}

LIVE PRODUCT CATALOG:
${catalogText}
`;

    const raw = await generateCustomerAI(prompt);

    let result;
    try {
      result = JSON.parse(cleanJson(raw));
    } catch {
      result = {
        message: raw || 'I could not generate a shopping response right now.',
        recommendedProductIds: [],
        budgetNote: '',
      };
    }

    const validIds = new Set(products.map(p => String(p._id)));
    const ids = Array.isArray(result.recommendedProductIds)
      ? result.recommendedProductIds.map(String).filter(id => validIds.has(id)).slice(0, 8)
      : [];

    const productMap = new Map(products.map(p => [String(p._id), p]));

    const recommendedProducts = ids.map(id => {
      const p = productMap.get(id);
      return {
        _id: p._id,
        name: p.name,
        description: p.description || '',
        category: p.category || 'Other',
        farmingType: p.farmingType || 'Organic',
        pricePerKg: Number(p.pricePerKg || 0),
        quantity: Number(p.quantity || 0),
        imageUrl: p.imageUrl || '',
        averageRating: Number(p.averageRating || 0),
        reviewCount: Number(p.reviewCount || 0),
        farmer: p.farmer ? {
          _id: p.farmer._id,
          name: p.farmer.name,
          farmName: p.farmer.farmName,
          farmLocation: p.farmer.farmLocation,
        } : null,
      };
    });

    res.json({
      message: 'Customer AI response generated successfully',
      answer: result.message || 'Here are some suggestions based on your FarmDirect data.',
      budgetNote: result.budgetNote || '',
      recommendedProducts,
      context: { monthlyBudget, currentMonthSpending, remainingBudget },
    });
  } catch (err) {
    console.error('Customer AI error:', err);
    res.status(500).json({ msg: err.message || 'Unable to generate customer AI response.' });
  }
});

module.exports = router;
