const Product = require('../models/Product');
const Order = require('../models/Order');

async function buildPricingAnalysis(farmerId, days = 30) {
  if (!farmerId) {
    throw new Error('Farmer ID is required.');
  }

  const periodDays = Math.min(
    Math.max(Number(days) || 30, 7),
    90
  );

  const periodStart = new Date();

  periodStart.setDate(
    periodStart.getDate() - periodDays
  );

  const periodEnd = new Date();

  // ---------------------------------------------------------
  // GET FARMER PRODUCTS
  // ---------------------------------------------------------

  const farmerProducts = await Product.find({
    farmer: farmerId,
  })
    .select(
      '_id name category farmingType pricePerKg quantity'
    )
    .lean();

  if (!farmerProducts.length) {
    return {
      periodDays,
      periodStart,
      periodEnd,

      summary: {
        products: 0,
        productsWithSales: 0,
        productsWithoutSales: 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
      },

      products: [],
    };
  }

  const farmerProductIds =
    farmerProducts.map(
      (product) => product._id
    );

  const farmerProductIdSet =
    new Set(
      farmerProductIds.map(
        (id) => String(id)
      )
    );

  // ---------------------------------------------------------
  // GET RECENT ORDERS
  // ---------------------------------------------------------

  const orders = await Order.find({
    createdAt: {
      $gte: periodStart,
      $lte: periodEnd,
    },

    'items.product': {
      $in: farmerProductIds,
    },
  })
    .select(
      'items createdAt status'
    )
    .lean();

  // ---------------------------------------------------------
  // INITIALIZE PRODUCT STATS
  // ---------------------------------------------------------

  const productStats = {};

  farmerProducts.forEach(
    (product) => {
      productStats[
        String(product._id)
      ] = {
        productId: product._id,

        name: product.name,

        category:
          product.category ||
          'Other',

        farmingType:
          product.farmingType ||
          'Non-Organic',

        currentPricePerKg:
          Number(
            product.pricePerKg || 0
          ),

        currentStockKg:
          Number(
            product.quantity || 0
          ),

        unitsSold: 0,

        revenue: 0,

        orderCount: 0,

        totalHistoricalPrice: 0,

        priceObservations: 0,
      };
    }
  );

  // ---------------------------------------------------------
  // PROCESS ORDERS
  // ---------------------------------------------------------

  for (const order of orders) {
    for (const item of order.items || []) {
      const productId =
        String(item.product);

      if (
        !farmerProductIdSet.has(
          productId
        )
      ) {
        continue;
      }

      const stats =
        productStats[productId];

      if (!stats) {
        continue;
      }

      const quantity =
        Number(
          item.quantity || 0
        );

      const price =
        Number(
          item.pricePerKg || 0
        );

      const revenue =
        quantity * price;

      stats.unitsSold += quantity;

      stats.revenue += revenue;

      stats.orderCount += 1;

      if (price > 0) {
        stats.totalHistoricalPrice +=
          price;

        stats.priceObservations +=
          1;
      }
    }
  }

  // ---------------------------------------------------------
  // CALCULATE PRICING METRICS
  // ---------------------------------------------------------

  const products =
    Object.values(productStats)
      .map((product) => {
        const averageHistoricalPrice =
          product.priceObservations >
          0
            ? product.totalHistoricalPrice /
              product.priceObservations
            : product.currentPricePerKg;

        const averageRevenuePerOrder =
          product.orderCount > 0
            ? product.revenue /
              product.orderCount
            : 0;

        return {
          productId:
            product.productId,

          name:
            product.name,

          category:
            product.category,

          farmingType:
            product.farmingType,

          currentPricePerKg:
            Number(
              product.currentPricePerKg.toFixed(
                2
              )
            ),

          averageHistoricalPricePerKg:
            Number(
              averageHistoricalPrice.toFixed(
                2
              )
            ),

          currentStockKg:
            Number(
              product.currentStockKg.toFixed(
                2
              )
            ),

          unitsSold:
            Number(
              product.unitsSold.toFixed(
                2
              )
            ),

          revenue:
            Number(
              product.revenue.toFixed(
                2
              )
            ),

          orderCount:
            product.orderCount,

          averageRevenuePerOrder:
            Number(
              averageRevenuePerOrder.toFixed(
                2
              )
            ),

          priceDifferenceFromHistorical:
            Number(
              (
                product.currentPricePerKg -
                averageHistoricalPrice
              ).toFixed(2)
            ),
        };
      })
      .sort(
        (a, b) =>
          b.revenue - a.revenue
      );

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------

  const productsWithSales =
    products.filter(
      (product) =>
        product.unitsSold > 0
    );

  const productsWithoutSales =
    products.filter(
      (product) =>
        product.unitsSold === 0
    );

  const totalUnitsSold =
    products.reduce(
      (sum, product) =>
        sum + product.unitsSold,
      0
    );

  const totalRevenue =
    products.reduce(
      (sum, product) =>
        sum + product.revenue,
      0
    );

  const productsWithHigherCurrentPrice =
    products.filter(
      (product) =>
        product.currentPricePerKg >
        product.averageHistoricalPricePerKg
    );

  const productsWithLowerCurrentPrice =
    products.filter(
      (product) =>
        product.currentPricePerKg <
        product.averageHistoricalPricePerKg
    );

  return {
    periodDays,

    periodStart,

    periodEnd,

    summary: {
      products:
        products.length,

      productsWithSales:
        productsWithSales.length,

      productsWithoutSales:
        productsWithoutSales.length,

      totalUnitsSold:
        Number(
          totalUnitsSold.toFixed(2)
        ),

      totalRevenue:
        Number(
          totalRevenue.toFixed(2)
        ),

      productsWithHigherCurrentPrice:
        productsWithHigherCurrentPrice.length,

      productsWithLowerCurrentPrice:
        productsWithLowerCurrentPrice.length,
    },

    products,

    productsWithSales,

    productsWithoutSales,

    productsWithHigherCurrentPrice,

    productsWithLowerCurrentPrice,
  };
}

module.exports = {
  buildPricingAnalysis,
};