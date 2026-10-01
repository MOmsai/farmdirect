const Budget = require('../models/Budget');

async function buildBudgetAnalysis(farmerId) {
  if (!farmerId) {
    throw new Error('Farmer ID is required.');
  }

  const budgets = await Budget.find({
    farmer: farmerId,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!budgets.length) {
    return {
      summary: {
        totalPlans: 0,
        totalPlannedCost: 0,
        totalExpectedRevenue: 0,
        totalExpectedProfit: 0,
        averageProfitMargin: 0,
      },
      budgets: [],
    };
  }

  const normalizedBudgets = budgets.map((budget) => {
    const landSize = Number(budget.landSize) || 0;

    const seedCost =
      Number(budget.seedCost) || 0;

    const fertilizerCost =
      Number(budget.fertilizerCost) || 0;

    const laborCost =
      Number(budget.laborCost) || 0;

    const irrigationCost =
      Number(budget.irrigationCost) || 0;

    const otherCost =
      Number(budget.otherCost) || 0;

    const expectedYieldKg =
      Number(budget.expectedYieldKg) || 0;

    const expectedPricePerKg =
      Number(budget.expectedPricePerKg) || 0;

    const totalCost =
      seedCost +
      fertilizerCost +
      laborCost +
      irrigationCost +
      otherCost;

    const expectedRevenue =
      expectedYieldKg *
      expectedPricePerKg;

    const expectedProfit =
      expectedRevenue -
      totalCost;

    const profitMargin =
      expectedRevenue > 0
        ? (expectedProfit /
            expectedRevenue) *
          100
        : 0;

    const breakEvenPrice =
      expectedYieldKg > 0
        ? totalCost /
          expectedYieldKg
        : 0;

    const costPerAcre =
      landSize > 0
        ? totalCost / landSize
        : 0;

    return {
      budgetId: budget._id,

      createdAt:
        budget.createdAt,

      landSize,

      costs: {
        seedCost,
        fertilizerCost,
        laborCost,
        irrigationCost,
        otherCost,
      },

      expectedYieldKg,

      expectedPricePerKg,

      calculated: {
        totalCost:
          Number(
            totalCost.toFixed(2)
          ),

        expectedRevenue:
          Number(
            expectedRevenue.toFixed(2)
          ),

        expectedProfit:
          Number(
            expectedProfit.toFixed(2)
          ),

        profitMargin:
          Number(
            profitMargin.toFixed(2)
          ),

        breakEvenPrice:
          Number(
            breakEvenPrice.toFixed(2)
          ),

        costPerAcre:
          Number(
            costPerAcre.toFixed(2)
          ),
      },
    };
  });

  const totalPlannedCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum +
        budget.calculated.totalCost,
      0
    );

  const totalExpectedRevenue =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum +
        budget.calculated.expectedRevenue,
      0
    );

  const totalExpectedProfit =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum +
        budget.calculated.expectedProfit,
      0
    );

  const averageProfitMargin =
    normalizedBudgets.length > 0
      ? normalizedBudgets.reduce(
          (sum, budget) =>
            sum +
            budget.calculated
              .profitMargin,
          0
        ) /
        normalizedBudgets.length
      : 0;

  const latestBudget =
    normalizedBudgets[0];

  const highestCostBudget =
    [...normalizedBudgets].sort(
      (a, b) =>
        b.calculated.totalCost -
        a.calculated.totalCost
    )[0];

  const highestProfitBudget =
    [...normalizedBudgets].sort(
      (a, b) =>
        b.calculated.expectedProfit -
        a.calculated.expectedProfit
    )[0];

  return {
    summary: {
      totalPlans:
        normalizedBudgets.length,

      totalPlannedCost:
        Number(
          totalPlannedCost.toFixed(2)
        ),

      totalExpectedRevenue:
        Number(
          totalExpectedRevenue.toFixed(2)
        ),

      totalExpectedProfit:
        Number(
          totalExpectedProfit.toFixed(2)
        ),

      averageProfitMargin:
        Number(
          averageProfitMargin.toFixed(2)
        ),
    },

    latestBudget,

    highestCostBudget,

    highestProfitBudget,

    budgets:
      normalizedBudgets,
  };
}

module.exports = {
  buildBudgetAnalysis,
};