const express = require('express');
const jwt = require('jsonwebtoken');
const Budget = require('../models/Budget');

const router = express.Router();

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

// POST /api/budget/calculate - Calculate without saving
router.post('/calculate', auth, (req, res) => {
  const { landSize, seedCost, fertilizerCost, laborCost, irrigationCost, otherCost, expectedYieldKg, expectedPricePerKg } = req.body;

  if (!landSize || !expectedYieldKg || !expectedPricePerKg) {
    return res.status(400).json({ msg: 'Land size, expected yield, and price are required' });
  }

  const totalCost = (Number(seedCost) || 0) + (Number(fertilizerCost) || 0) +
    (Number(laborCost) || 0) + (Number(irrigationCost) || 0) + (Number(otherCost) || 0);

  const expectedRevenue = Number(expectedYieldKg) * Number(expectedPricePerKg);
  const expectedProfit = expectedRevenue - totalCost;
  const profitMargin = expectedRevenue > 0 ? ((expectedProfit / expectedRevenue) * 100).toFixed(1) : 0;
  const breakEvenPrice = Number(expectedYieldKg) > 0 ? (totalCost / Number(expectedYieldKg)).toFixed(2) : 0;
  const costPerAcre = (totalCost / Number(landSize)).toFixed(2);

  res.json({
    totalCost,
    expectedRevenue,
    expectedProfit,
    profitMargin,
    breakEvenPrice,
    costPerAcre,
    isViable: expectedProfit > 0,
  });
});

// POST /api/budget - Save a budget plan
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).json({ msg: 'Farmers only' });
  try {
    const budget = new Budget({ ...req.body, farmer: req.user.id });
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/budget - Get farmer's saved plans
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'farmer') return res.status(403).json({ msg: 'Farmers only' });
  try {
    const budgets = await Budget.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/budget/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, farmer: req.user.id });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;