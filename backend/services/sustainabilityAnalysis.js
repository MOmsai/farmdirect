const Budget = require('../models/Budget');
const Product = require('../models/Product');

async function buildSustainabilityAnalysis(farmerId) {
  if (!farmerId) {
    throw new Error('Farmer ID is required.');
  }

  // ---------------------------------------------------------
  // LOAD FARMER DATA
  // ---------------------------------------------------------

  const [budgets, products] = await Promise.all([
    Budget.find({
      farmer: farmerId,
    })
      .sort({ createdAt: -1 })
      .lean(),

    Product.find({
      farmer: farmerId,
    }).lean(),
  ]);

  // ---------------------------------------------------------
  // PRODUCT ANALYSIS
  // ---------------------------------------------------------

  const organicProducts = products.filter(
    (product) =>
      product.farmingType === 'Organic'
  );

  const nonOrganicProducts = products.filter(
    (product) =>
      product.farmingType === 'Non-Organic'
  );

  const productSummary = {
    totalProducts: products.length,

    organicProducts: organicProducts.length,

    nonOrganicProducts:
      nonOrganicProducts.length,

    organicPercentage:
      products.length > 0
        ? Number(
            (
              (organicProducts.length /
                products.length) *
              100
            ).toFixed(2)
          )
        : 0,

    nonOrganicPercentage:
      products.length > 0
        ? Number(
            (
              (nonOrganicProducts.length /
                products.length) *
              100
            ).toFixed(2)
          )
        : 0,
  };

  // ---------------------------------------------------------
  // BUDGET ANALYSIS
  // ---------------------------------------------------------

  const normalizedBudgets = budgets.map(
    (budget) => {
      const landSize =
        Number(budget.landSize) || 0;

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

      const inputCost =
        seedCost +
        fertilizerCost +
        irrigationCost +
        otherCost;

      const resourceRelatedCost =
        fertilizerCost +
        irrigationCost;

      const costPerKg =
        expectedYieldKg > 0
          ? totalCost / expectedYieldKg
          : 0;

      const fertilizerPercentage =
        totalCost > 0
          ? (fertilizerCost / totalCost) * 100
          : 0;

      const irrigationPercentage =
        totalCost > 0
          ? (irrigationCost / totalCost) * 100
          : 0;

      return {
        budgetId: budget._id,

        createdAt: budget.createdAt,

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
            Number(totalCost.toFixed(2)),

          inputCost:
            Number(inputCost.toFixed(2)),

          resourceRelatedCost:
            Number(
              resourceRelatedCost.toFixed(2)
            ),

          costPerKg:
            Number(costPerKg.toFixed(2)),

          fertilizerPercentage:
            Number(
              fertilizerPercentage.toFixed(2)
            ),

          irrigationPercentage:
            Number(
              irrigationPercentage.toFixed(2)
            ),
        },
      };
    }
  );

  // ---------------------------------------------------------
  // AGGREGATE BUDGET DATA
  // ---------------------------------------------------------

  const totalLandSize =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum + budget.landSize,
      0
    );

  const totalFertilizerCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum +
        budget.costs.fertilizerCost,
      0
    );

  const totalIrrigationCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum +
        budget.costs.irrigationCost,
      0
    );

  const totalSeedCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum + budget.costs.seedCost,
      0
    );

  const totalLaborCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum + budget.costs.laborCost,
      0
    );

  const totalOtherCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum + budget.costs.otherCost,
      0
    );

  const totalExpectedYield =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum + budget.expectedYieldKg,
      0
    );

  const totalBudgetCost =
    normalizedBudgets.reduce(
      (sum, budget) =>
        sum +
        budget.calculated.totalCost,
      0
    );

  // ---------------------------------------------------------
  // SUSTAINABILITY INDICATORS
  // ---------------------------------------------------------

  const fertilizerCostPercentage =
    totalBudgetCost > 0
      ? (totalFertilizerCost /
          totalBudgetCost) *
        100
      : 0;

  const irrigationCostPercentage =
    totalBudgetCost > 0
      ? (totalIrrigationCost /
          totalBudgetCost) *
        100
      : 0;

  const resourceCostPercentage =
    totalBudgetCost > 0
      ? ((totalFertilizerCost +
          totalIrrigationCost) /
          totalBudgetCost) *
        100
      : 0;

  return {
    summary: {
      totalBudgetPlans:
        normalizedBudgets.length,

      totalLandSize:
        Number(totalLandSize.toFixed(2)),

      totalBudgetCost:
        Number(totalBudgetCost.toFixed(2)),

      totalExpectedYieldKg:
        Number(
          totalExpectedYield.toFixed(2)
        ),

      fertilizerCost:
        Number(
          totalFertilizerCost.toFixed(2)
        ),

      irrigationCost:
        Number(
          totalIrrigationCost.toFixed(2)
        ),

      fertilizerCostPercentage:
        Number(
          fertilizerCostPercentage.toFixed(2)
        ),

      irrigationCostPercentage:
        Number(
          irrigationCostPercentage.toFixed(2)
        ),

      resourceCostPercentage:
        Number(
          resourceCostPercentage.toFixed(2)
        ),
    },

    productSummary,

    budgets: normalizedBudgets,

    products: products.map(
      (product) => ({
        name: product.name,

        category:
          product.category || 'Other',

        farmingType:
          product.farmingType ||
          'Not specified',

        quantity:
          Number(product.quantity) || 0,

        pricePerKg:
          Number(product.pricePerKg) || 0,
      })
    ),
  };
}

module.exports = {
  buildSustainabilityAnalysis,
};