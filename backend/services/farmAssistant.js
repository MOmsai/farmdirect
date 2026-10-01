const Product = require('../models/Product');
const Order = require('../models/Order');
const Budget = require('../models/Budget');

async function buildFarmAssistantContext(farmerId) {
  if (!farmerId) {
    throw new Error('Farmer ID is required.');
  }

  const [products, orders, budgets] = await Promise.all([
    Product.find({
      farmer: farmerId,
    })
      .sort({ createdAt: -1 })
      .lean(),

    Order.find({
      'items.product': {
        $in: await Product.find({
          farmer: farmerId,
        }).distinct('_id'),
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

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let totalOrders = 0;

  const salesByProduct = {};

  orders.forEach((order) => {
    let farmerOrder = false;

    order.items.forEach((item) => {
      const product = productMap.get(
        String(item.product)
      );

      if (!product) {
        return;
      }

      farmerOrder = true;

      const quantity =
        Number(item.quantity) || 0;

      const price =
        Number(item.pricePerKg) || 0;

      const revenue =
        quantity * price;

      const productId =
        String(item.product);

      if (!salesByProduct[productId]) {
        salesByProduct[productId] = {
          productId,
          name:
            product.name ||
            item.name ||
            'Unknown Product',
          category:
            product.category ||
            'Other',
          farmingType:
            product.farmingType ||
            'Not specified',
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
        };
      }

      salesByProduct[productId].unitsSold +=
        quantity;

      salesByProduct[productId].revenue +=
        revenue;

      salesByProduct[productId].orderCount +=
        1;

      totalUnitsSold += quantity;
      totalRevenue += revenue;
    });

    if (farmerOrder) {
      totalOrders += 1;
    }
  });

  const productSummary = products.map(
    (product) => {
      const sales =
        salesByProduct[String(product._id)] || {
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
    }
  );

  const lowStockProducts =
    productSummary.filter(
      (product) =>
        product.currentStockKg < 10
    );

  const productsWithoutSales =
    productSummary.filter(
      (product) =>
        product.unitsSold === 0
    );

  const topSellingProducts =
    [...productSummary]
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

  const latestBudget =
    budgets.length > 0
      ? budgets[0]
      : null;

  let latestBudgetSummary = null;

  if (latestBudget) {
    const seedCost =
      Number(latestBudget.seedCost) || 0;

    const fertilizerCost =
      Number(
        latestBudget.fertilizerCost
      ) || 0;

    const laborCost =
      Number(latestBudget.laborCost) || 0;

    const irrigationCost =
      Number(
        latestBudget.irrigationCost
      ) || 0;

    const otherCost =
      Number(latestBudget.otherCost) || 0;

    const expectedYieldKg =
      Number(
        latestBudget.expectedYieldKg
      ) || 0;

    const expectedPricePerKg =
      Number(
        latestBudget.expectedPricePerKg
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

    const expectedProfit =
      expectedRevenue -
      totalCost;

    latestBudgetSummary = {
      landSize:
        Number(latestBudget.landSize) || 0,

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
      },
    };
  }

  return {
    farmSummary: {
      totalProducts:
        products.length,

      totalStockKg:
        Number(
          productSummary.reduce(
            (sum, product) =>
              sum +
              product.currentStockKg,
            0
          ).toFixed(2)
        ),

      totalOrders:
        totalOrders,

      totalUnitsSold:
        Number(
          totalUnitsSold.toFixed(2)
        ),

      totalRevenue:
        Number(
          totalRevenue.toFixed(2)
        ),
    },

    products:
      productSummary,

    lowStockProducts,

    productsWithoutSales,

    topSellingProducts,

    latestBudget:
      latestBudgetSummary,
  };
}

module.exports = {
  buildFarmAssistantContext,
};