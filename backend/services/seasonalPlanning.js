const Product = require('../models/Product');
const Order = require('../models/Order');
const Budget = require('../models/Budget');

async function buildSeasonalPlanningAnalysis(farmerId) {
  if (!farmerId) {
    throw new Error('Farmer ID is required.');
  }

  const products = await Product.find({
    farmer: farmerId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const productIds = products.map(
    (product) => product._id
  );

  const [orders, budgets] = await Promise.all([
    Order.find({
      'items.product': {
        $in: productIds,
      },
    })
      .sort({ createdAt: -1 })
      .lean(),

    Budget.find({
      farmer: farmerId,
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const productMap = new Map();

  products.forEach((product) => {
    productMap.set(
      String(product._id),
      product
    );
  });

  const salesMap = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product =
        productMap.get(
          String(item.product)
        );

      if (!product) {
        return;
      }

      const productId =
        String(item.product);

      if (!salesMap[productId]) {
        salesMap[productId] = {
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
        };
      }

      const quantity =
        Number(item.quantity) || 0;

      const price =
        Number(item.pricePerKg) || 0;

      salesMap[productId].unitsSold +=
        quantity;

      salesMap[productId].revenue +=
        quantity * price;

      salesMap[productId].orderCount += 1;
    });
  });

  const productAnalysis =
    products.map((product) => {
      const sales =
        salesMap[String(product._id)] || {
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
        };

      return {
        productId: product._id,
        name: product.name,
        category:
          product.category || 'Other',
        farmingType:
          product.farmingType ||
          'Not specified',

        currentStockKg:
          Number(product.quantity) || 0,

        currentPricePerKg:
          Number(product.pricePerKg) || 0,

        unitsSold:
          Number(
            sales.unitsSold.toFixed(2)
          ),

        revenue:
          Number(
            sales.revenue.toFixed(2)
          ),

        orderCount:
          sales.orderCount,
      };
    });

  const highSalesProducts =
    [...productAnalysis]
      .filter(
        (product) =>
          product.unitsSold > 0
      )
      .sort(
        (a, b) =>
          b.unitsSold -
          a.unitsSold
      )
      .slice(0, 5);

  const unsoldProducts =
    productAnalysis.filter(
      (product) =>
        product.unitsSold === 0
    );

  const currentStock =
    productAnalysis.reduce(
      (sum, product) =>
        sum +
        product.currentStockKg,
      0
    );

  const totalUnitsSold =
    productAnalysis.reduce(
      (sum, product) =>
        sum + product.unitsSold,
      0
    );

  const totalRevenue =
    productAnalysis.reduce(
      (sum, product) =>
        sum + product.revenue,
      0
    );

  const categorySummary = {};

  productAnalysis.forEach(
    (product) => {
      if (
        !categorySummary[
          product.category
        ]
      ) {
        categorySummary[
          product.category
        ] = {
          category:
            product.category,
          productCount: 0,
          stockKg: 0,
          unitsSold: 0,
          revenue: 0,
        };
      }

      categorySummary[
        product.category
      ].productCount += 1;

      categorySummary[
        product.category
      ].stockKg +=
        product.currentStockKg;

      categorySummary[
        product.category
      ].unitsSold +=
        product.unitsSold;

      categorySummary[
        product.category
      ].revenue +=
        product.revenue;
    }
  );

  const normalizedCategories =
    Object.values(
      categorySummary
    ).map((category) => ({
      ...category,
      stockKg:
        Number(
          category.stockKg.toFixed(2)
        ),
      unitsSold:
        Number(
          category.unitsSold.toFixed(2)
        ),
      revenue:
        Number(
          category.revenue.toFixed(2)
        ),
    }));

  let latestBudget = null;

  if (budgets.length > 0) {
    const budget = budgets[0];

    const seedCost =
      Number(budget.seedCost) || 0;

    const fertilizerCost =
      Number(
        budget.fertilizerCost
      ) || 0;

    const laborCost =
      Number(budget.laborCost) || 0;

    const irrigationCost =
      Number(
        budget.irrigationCost
      ) || 0;

    const otherCost =
      Number(budget.otherCost) || 0;

    const expectedYieldKg =
      Number(
        budget.expectedYieldKg
      ) || 0;

    const expectedPricePerKg =
      Number(
        budget.expectedPricePerKg
      ) || 0;

    const totalCost =
      seedCost +
      fertilizerCost +
      laborCost +
      irrigationCost +
      otherCost;

    const expectedRevenue =
      expectedYieldKg *
      expectedPricePerKg;

    latestBudget = {
      landSize:
        Number(budget.landSize) || 0,

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
            (
              expectedRevenue -
              totalCost
            ).toFixed(2)
          ),
      },
    };
  }

  return {
    farmSummary: {
      totalProducts:
        products.length,

      totalStockKg:
        Number(
          currentStock.toFixed(2)
        ),

      totalUnitsSold:
        Number(
          totalUnitsSold.toFixed(2)
        ),

      totalRevenue:
        Number(
          totalRevenue.toFixed(2)
        ),

      totalOrders:
        orders.length,
    },

    products:
      productAnalysis,

    highSalesProducts,

    unsoldProducts,

    categorySummary:
      normalizedCategories,

    latestBudget,
  };
}

module.exports = {
  buildSeasonalPlanningAnalysis,
};