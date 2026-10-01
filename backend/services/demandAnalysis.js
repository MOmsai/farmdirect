const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Build demand-analysis data for the currently logged-in farmer.
 *
 * The database is the source of truth for all numerical information.
 */
async function buildDemandAnalysis(farmerId, days = 30) {
  if (!farmerId) {
    throw new Error('Farmer ID is required.');
  }

  const periodDays = Math.min(
    Math.max(Number(days) || 30, 7),
    90
  );

  const since = new Date();

  since.setDate(
    since.getDate() - periodDays
  );

  /*
  |--------------------------------------------------------------------------
  | 1. Get farmer products
  |--------------------------------------------------------------------------
  */

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
      periodStart: since,
      periodEnd: new Date(),
      summary: {
        products: 0,
        orders: 0,
        unitsSold: 0,
        revenue: 0,
      },
      products: [],
      currentInventory: [],
    };
  }

  const farmerProductIds = farmerProducts.map(
    (product) => product._id
  );

  const farmerProductIdSet = new Set(
    farmerProductIds.map((id) => String(id))
  );

  /*
  |--------------------------------------------------------------------------
  | 2. Get recent orders containing farmer products
  |--------------------------------------------------------------------------
  */

  const orders = await Order.find({
    createdAt: {
      $gte: since,
    },
    'items.product': {
      $in: farmerProductIds,
    },
  })
    .select(
      'items createdAt status totalAmount'
    )
    .lean();

  /*
  |--------------------------------------------------------------------------
  | 3. Prepare product statistics
  |--------------------------------------------------------------------------
  */

  const productStats = {};

  farmerProducts.forEach((product) => {
    productStats[String(product._id)] = {
      productId: product._id,
      name: product.name,
      category: product.category || 'Other',
      farmingType:
        product.farmingType || 'Non-Organic',

      currentPricePerKg: Number(
        product.pricePerKg || 0
      ),

      currentStockKg: Number(
        product.quantity || 0
      ),

      unitsSold: 0,
      revenue: 0,
      orderCount: 0,
    };
  });

  let totalUnitsSold = 0;
  let totalRevenue = 0;
  const uniqueOrderIds = new Set();

  /*
  |--------------------------------------------------------------------------
  | 4. Process orders
  |--------------------------------------------------------------------------
  */

  for (const order of orders) {
    let farmerOrderHasProduct = false;

    for (const item of order.items || []) {
      const productId = String(item.product);

      if (!farmerProductIdSet.has(productId)) {
        continue;
      }

      const stats = productStats[productId];

      if (!stats) {
        continue;
      }

      const quantity = Number(
        item.quantity || 0
      );

      const price = Number(
        item.pricePerKg || 0
      );

      const revenue = quantity * price;

      stats.unitsSold += quantity;
      stats.revenue += revenue;
      stats.orderCount += 1;

      totalUnitsSold += quantity;
      totalRevenue += revenue;

      farmerOrderHasProduct = true;
    }

    if (farmerOrderHasProduct) {
      uniqueOrderIds.add(
        String(order._id)
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 5. Convert product statistics
  |--------------------------------------------------------------------------
  */

  const products = Object.values(productStats)
    .map((product) => {
      const averageSellingPrice =
        product.unitsSold > 0
          ? product.revenue /
            product.unitsSold
          : product.currentPricePerKg;

      return {
        ...product,

        averageSellingPrice:
          Number(
            averageSellingPrice.toFixed(2)
          ),

        revenue: Number(
          product.revenue.toFixed(2)
        ),
      };
    })
    .sort(
      (a, b) =>
        b.unitsSold - a.unitsSold
    );

  /*
  |--------------------------------------------------------------------------
  | 6. Current inventory
  |--------------------------------------------------------------------------
  */

  const currentInventory =
    farmerProducts
      .map((product) => ({
        productId: product._id,
        name: product.name,
        category:
          product.category || 'Other',

        farmingType:
          product.farmingType ||
          'Non-Organic',

        pricePerKg: Number(
          product.pricePerKg || 0
        ),

        stockKg: Number(
          product.quantity || 0
        ),
      }))
      .sort(
        (a, b) =>
          a.stockKg - b.stockKg
      );

  /*
  |--------------------------------------------------------------------------
  | 7. Demand indicators
  |--------------------------------------------------------------------------
  */

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

  const lowStockProducts =
    currentInventory.filter(
      (product) =>
        product.stockKg < 10
    );

  const highDemandProducts =
    productsWithSales.slice(0, 5);

  /*
  |--------------------------------------------------------------------------
  | 8. Final analysis data
  |--------------------------------------------------------------------------
  */

  return {
    periodDays,

    periodStart: since,
    periodEnd: new Date(),

    summary: {
      products:
        farmerProducts.length,

      orders:
        uniqueOrderIds.size,

      unitsSold:
        Number(
          totalUnitsSold.toFixed(2)
        ),

      revenue:
        Number(
          totalRevenue.toFixed(2)
        ),

      productsWithSales:
        productsWithSales.length,

      productsWithoutSales:
        productsWithoutSales.length,

      lowStockProducts:
        lowStockProducts.length,
    },

    highDemandProducts,

    products,

    currentInventory,

    lowStockProducts,

    productsWithoutSales,
  };
}

module.exports = {
  buildDemandAnalysis,
};