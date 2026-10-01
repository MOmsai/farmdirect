// backend/routes/orders.js

const express = require('express');
const jwt = require('jsonwebtoken');

const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();


/*
=========================================================
AUTH MIDDLEWARE
=========================================================
*/

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
    console.error(
      'Auth error:',
      err.message
    );

    return res.status(401).json({
      msg: 'Token is not valid',
    });
  }
};


/*
=========================================================
HELPER
CALCULATE FARMER STATUS FROM ITEMS
=========================================================
*/

const calculateFarmerStatus = (items) => {
  if (!items || items.length === 0) {
    return 'Pending';
  }

  const statuses = items.map(
    (item) => item.status || 'Pending'
  );

  if (
    statuses.every(
      (status) => status === 'Cancelled'
    )
  ) {
    return 'Cancelled';
  }

  if (
    statuses.every(
      (status) => status === 'Delivered'
    )
  ) {
    return 'Delivered';
  }

  if (
    statuses.some(
      (status) =>
        status === 'Confirmed' ||
        status === 'Delivered'
    )
  ) {
    return 'Confirmed';
  }

  return 'Pending';
};


/*
=========================================================
HELPER
CALCULATE OVERALL CUSTOMER ORDER STATUS
=========================================================
*/

const calculateOverallOrderStatus = (items) => {
  if (!items || items.length === 0) {
    return 'Pending';
  }

  const statuses = items.map(
    (item) => item.status || 'Pending'
  );

  if (
    statuses.every(
      (status) => status === 'Delivered'
    )
  ) {
    return 'Delivered';
  }

  if (
    statuses.some(
      (status) =>
        status === 'Confirmed' ||
        status === 'Delivered'
    )
  ) {
    return 'Confirmed';
  }

  return 'Pending';
};


/*
=========================================================
CREATE ORDER
POST /api/orders
=========================================================
*/

router.post(
  '/',
  auth,
  async (req, res) => {

    if (req.user.role !== 'customer') {
      return res.status(403).json({
        msg: 'Access denied: Customers only',
      });
    }

    const {
      items,
      address,
    } = req.body;


    /*
    ---------- Validate cart ----------
    */

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        msg: 'Cart is empty or invalid',
      });
    }


    /*
    ---------- Validate address ----------
    */

    if (
      !address ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.pincode ||
      !address.phone
    ) {
      return res.status(400).json({
        msg:
          'Complete delivery address is required',
      });
    }


    const phone =
      String(address.phone).replace(
        /\D/g,
        ''
      );


    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        msg:
          'Valid 10-digit phone number is required',
      });
    }


    try {

      let totalAmount = 0;

      const orderItems = [];


      /*
      ---------- Process products ----------
      */

      for (const item of items) {

        if (
          !item.product ||
          !item.quantity ||
          Number(item.quantity) <= 0
        ) {
          return res.status(400).json({
            msg: 'Invalid item in cart',
          });
        }


        const product =
          await Product.findById(
            item.product
          );


        if (!product) {
          return res.status(404).json({
            msg:
              `Product not found: ${item.product}`,
          });
        }


        if (
          Number(product.quantity) <
          Number(item.quantity)
        ) {
          return res.status(400).json({
            msg:
              `Not enough stock for ${product.name}. Available: ${product.quantity} kg`,
          });
        }


        const quantity =
          Number(item.quantity);

        const price =
          Number(product.pricePerKg);

        const itemTotal =
          price * quantity;

        totalAmount += itemTotal;


        /*
        IMPORTANT:

        Store farmer + individual status
        inside the order item.
        */

orderItems.push({
  product: product._id,
  farmer: product.farmer,
  name: product.name,
  pricePerKg: Number(product.pricePerKg),
  quantity: Number(item.quantity),
  imageUrl: product.imageUrl || '',

  // Every farmer starts with Pending
  status: 'Pending',
});


        /*
        Reduce stock.
        */

        product.quantity -=
          quantity;

        await product.save();
      }


      /*
      ---------- Create order ----------
      */

      const order =
        new Order({
          customer:
            req.user.id,

          items:
            orderItems,

          totalAmount:
            totalAmount,

          address: {
            street:
              String(
                address.street
              ).trim(),

            city:
              String(
                address.city
              ).trim(),

            state:
              String(
                address.state
              ).trim(),

            pincode:
              String(
                address.pincode
              ).trim(),

            phone:
              phone,
          },

          status:
            'Pending',
        });


      await order.save();


      /*
      ---------- Return populated order ----------
      */

      const populatedOrder =
        await Order.findById(
          order._id
        )
          .populate(
            'customer',
            'name email'
          )
          .populate(
            'items.product',
            'name imageUrl pricePerKg'
          );


      return res.status(201).json(
        populatedOrder
      );

    } catch (err) {

      console.error(
        'Order creation error:',
        err
      );

      return res.status(500).json({
        msg:
          'Server error. Please try again.',
      });
    }
  }
);


/*
=========================================================
CUSTOMER ORDER HISTORY
GET /api/orders/my-orders
=========================================================
*/

router.get('/my-orders', auth, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Access denied: Customers only',
    });
  }

  try {
    const orders = await Order.find({
      customer: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate(
        'items.product',
        'name imageUrl pricePerKg'
      )
      .populate(
        'items.farmer',
        'name farmName farmLocation'
      )
      .select('-__v');

    return res.json(orders);

  } catch (err) {
    console.error(
      'Customer orders error:',
      err
    );

    return res.status(500).json({
      msg: 'Server error',
    });
  }
});

/*
=========================================================
CUSTOMER ORDER CANCELLATION
PATCH /api/orders/:id/cancel

A customer can cancel only their own Pending order.
When cancelled, the purchased quantities are returned
back to the corresponding products' stock.
=========================================================
*/

router.patch('/:id/cancel', auth, async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      msg: 'Access denied: Customers only',
    });
  }

  try {
    /*
      Atomically claim the order for cancellation.
      This prevents two cancel requests from restoring
      the same stock twice.
    */
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        customer: req.user.id,
        status: 'Pending',
      },
      {
        $set: {
          status: 'Cancelled',
        },
        $setOnInsert: {},
      },
      {
        new: true,
      }
    );

    if (!order) {
      const existingOrder = await Order.findOne({
        _id: req.params.id,
        customer: req.user.id,
      }).select('status');

      if (!existingOrder) {
        return res.status(404).json({
          msg: 'Order not found',
        });
      }

      if (existingOrder.status === 'Cancelled') {
        return res.status(400).json({
          msg: 'Order is already cancelled',
        });
      }

      return res.status(400).json({
        msg: 'Only Pending orders can be cancelled',
      });
    }

    /*
      Validate all products before changing stock.
    */
    const productIds = order.items.map(
      (item) => item.product
    );

    const products = await Product.find({
      _id: { $in: productIds },
    }).select('_id name');

    const productMap = new Map(
      products.map((product) => [
        String(product._id),
        product,
      ])
    );

    for (const item of order.items) {
      if (!productMap.has(String(item.product))) {
        /* Roll back the cancellation claim. */
        await Order.updateOne(
          {
            _id: order._id,
            customer: req.user.id,
            status: 'Cancelled',
          },
          {
            $set: {
              status: 'Pending',
            },
          }
        );

        return res.status(409).json({
          msg: `Product for ${item.name || 'an order item'} no longer exists, so the order could not be cancelled safely.`,
        });
      }
    }

    /*
      Restore every ordered quantity to stock.
    */
    try {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          {
            $inc: {
              quantity: Number(item.quantity) || 0,
            },
          }
        );
      }
    } catch (stockError) {
      console.error(
        'Order cancellation stock restore error:',
        stockError
      );

      /*
        Best-effort rollback of any stock increments that
        were already applied before the failure.
      */
      for (const item of order.items) {
        try {
          await Product.updateOne(
            { _id: item.product },
            {
              $inc: {
                quantity: -(Number(item.quantity) || 0),
              },
            }
          );
        } catch (rollbackError) {
          console.error(
            'Stock rollback error:',
            rollbackError
          );
        }
      }

      await Order.updateOne(
        {
          _id: order._id,
          customer: req.user.id,
          status: 'Cancelled',
        },
        {
          $set: {
            status: 'Pending',
          },
        }
      );

      return res.status(500).json({
        msg: 'Unable to restore product stock. Order cancellation was not completed.',
      });
    }

    /*
      Mark every item as Cancelled as well, so the farmer
      and customer views remain consistent.
    */
    await Order.updateOne(
      {
        _id: order._id,
        customer: req.user.id,
        status: 'Cancelled',
      },
      {
        $set: {
          'items.$[].status': 'Cancelled',
        },
      }
    );

    const cancelledOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate(
        'items.product',
        'name imageUrl pricePerKg'
      )
      .populate(
        'items.farmer',
        'name farmName farmLocation'
      )
      .select('-__v');

    return res.json({
      msg: 'Order cancelled successfully',
      order: cancelledOrder,
    });
  } catch (err) {
    console.error(
      'Order cancellation error:',
      err
    );

    return res.status(500).json({
      msg: 'Server error while cancelling order',
    });
  }
});


/*
=========================================================
FARMER ORDER MANAGEMENT
GET /api/orders/farmer-orders

IMPORTANT:
Only products belonging to the logged-in farmer
are returned.

Example:

Customer order:
    Beetroot → Farmer A
    Brinjal  → Farmer B

Farmer A receives:
    Beetroot only

Farmer B receives:
    Brinjal only
=========================================================
*/

router.get('/farmer-orders', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({
      msg: 'Farmers only',
    });
  }

  try {
    const farmerProducts = await Product.find({
      farmer: req.user.id,
    }).select('_id name pricePerKg quantity');

    const farmerProductIds = farmerProducts.map(
      (product) => product._id
    );

    const farmerProductIdSet = new Set(
      farmerProductIds.map((id) => String(id))
    );

    const orders = await Order.find({
      'items.product': {
        $in: farmerProductIds,
      },
    })
      .populate('customer', 'name email')
      .populate(
        'items.product',
        'name imageUrl pricePerKg'
      )
      .populate(
        'items.farmer',
        'name farmName farmLocation'
      )
      .sort({ createdAt: -1 })
      .lean();

    const farmerOrders = orders.map((order) => {
      const farmerItems = (order.items || []).filter(
        (item) =>
          farmerProductIdSet.has(
            String(item.product?._id || item.product)
          )
      );

      const farmerTotal = farmerItems.reduce(
        (sum, item) => {
          const price = Number(
            item.pricePerKg || 0
          );

          const quantity = Number(
            item.quantity || 0
          );

          return sum + price * quantity;
        },
        0
      );

      /*
        Farmer-specific status.

        Because all items returned here belong
        to the same farmer, we can use the
        common status.
      */

      let farmerStatus = 'Pending';

      if (farmerItems.length > 0) {
        const statuses = farmerItems.map(
          (item) => item.status || 'Pending'
        );

        if (
          statuses.every(
            (status) => status === 'Cancelled'
          )
        ) {
          farmerStatus = 'Cancelled';
        } else if (
          statuses.every(
            (status) => status === 'Delivered'
          )
        ) {
          farmerStatus = 'Delivered';
        } else if (
          statuses.every(
            (status) =>
              status === 'Confirmed' ||
              status === 'Delivered'
          )
        ) {
          farmerStatus = 'Confirmed';
        } else {
          farmerStatus = 'Pending';
        }
      }

      return {
        _id: order._id,

        customer: order.customer,

        address: order.address,

        // Farmer-specific status
        status: farmerStatus,

        // Overall customer order status
        overallStatus: order.status,

        createdAt: order.createdAt,

        items: farmerItems,

        farmerTotal,
      };
    });

    return res.json(farmerOrders);

  } catch (err) {
    console.error(
      'Farmer orders error:',
      err
    );

    return res.status(500).json({
      msg: 'Server error',
    });
  }
});

/* =========================================================
   FARMER ANALYTICS
   GET /api/orders/farmer-analytics
========================================================= */

router.get('/farmer-analytics', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({
      msg: 'Farmers only',
    });
  }

  try {
    /* -------------------------------------------------------
       1. Get ALL products belonging to this farmer
    ------------------------------------------------------- */

    const farmerProducts = await Product.find({
      farmer: req.user.id,
    })
      .select(
        '_id name category farmingType pricePerKg quantity'
      )
      .lean();

    const productIds = farmerProducts.map(
      (product) => product._id
    );

    const productIdSet = new Set(
      productIds.map((id) => String(id))
    );

    /* -------------------------------------------------------
       2. Initialize statistics for EVERY product

       This is important because products with zero sales
       must also appear in Product Performance.
    ------------------------------------------------------- */

    const productStats = {};

    for (const product of farmerProducts) {
      productStats[String(product._id)] = {
        productId: product._id,
        name: product.name,
        category:
          product.category || 'Other',
        farmingType:
          product.farmingType ||
          'Not specified',

        /* Current product data */
        quantity:
          Number(product.quantity) || 0,

        pricePerKg:
          Number(product.pricePerKg) || 0,

        /* Sales data */
        unitsSold: 0,
        orderCount: 0,
        revenue: 0,
      };
    }

    /* -------------------------------------------------------
       3. Get orders containing this farmer's products
    ------------------------------------------------------- */

    const orders =
      productIds.length > 0
        ? await Order.find({
            'items.product': {
              $in: productIds,
            },
          })
            .sort({ createdAt: 1 })
            .lean()
        : [];

    /* -------------------------------------------------------
       4. Analytics variables
    ------------------------------------------------------- */

    let totalRevenue = 0;
    let unitsSold = 0;

    const orderIds = new Set();

    const dailyRevenue = {};

    /* -------------------------------------------------------
       5. Process orders
    ------------------------------------------------------- */

    for (const order of orders) {
      if (order.status === 'Cancelled') {
        continue;
      }

      let farmerOrderTotal = 0;
      let hasFarmerItem = false;

      const productsInThisOrder =
        new Set();

      for (const item of order.items || []) {
        const productId = String(
          item.product
        );

        /* Ignore products belonging to other farmers */
        if (
          !productIdSet.has(productId)
        ) {
          continue;
        }

        hasFarmerItem = true;

        const price =
          Number(item.pricePerKg) || 0;

        const quantity =
          Number(item.quantity) || 0;

        const itemRevenue =
          price * quantity;

        totalRevenue += itemRevenue;
        unitsSold += quantity;
        farmerOrderTotal += itemRevenue;

        /* -----------------------------------------------
           Product sales statistics
        ------------------------------------------------ */

        if (!productStats[productId]) {
          continue;
        }

        productStats[productId].unitsSold +=
          quantity;

        productStats[productId].revenue +=
          itemRevenue;

        /*
         * Count each product only once per order.
         * Example:
         * Tomato appearing twice in the same order
         * still counts as 1 Tomato order.
         */
        productsInThisOrder.add(
          productId
        );

        /* -----------------------------------------------
           Revenue trend
        ------------------------------------------------ */

        if (order.createdAt) {
          const date = new Date(
            order.createdAt
          )
            .toISOString()
            .slice(0, 10);

          dailyRevenue[date] =
            (dailyRevenue[date] || 0) +
            itemRevenue;
        }
      }

      /* Count the order once for this farmer */
      if (hasFarmerItem) {
        orderIds.add(
          String(order._id)
        );
      }

      /* Add product-specific order counts */
      for (const productId of productsInThisOrder) {
        if (productStats[productId]) {
          productStats[productId]
            .orderCount += 1;
        }
      }
    }

    /* -------------------------------------------------------
       6. ALL Product Performance
    ------------------------------------------------------- */

    const productPerformance =
      Object.values(productStats)
        .map((product) => ({
          ...product,

          inventoryValue:
            Number(
              (
                product.quantity *
                product.pricePerKg
              ).toFixed(2)
            ),
        }))
        .sort((a, b) => {
          /*
           * Products with sales first.
           * Then sort by revenue.
           */
          if (
            b.revenue !==
            a.revenue
          ) {
            return (
              b.revenue -
              a.revenue
            );
          }

          return (
            b.unitsSold -
            a.unitsSold
          );
        });

    /* -------------------------------------------------------
       7. Top-selling products

       Keep this separate from productPerformance.
       This is used by the dashboard/chart.
    ------------------------------------------------------- */

    const topProducts =
      productPerformance
        .filter(
          (product) =>
            product.unitsSold > 0
        )
        .slice(0, 5)
        .map((product) => ({
          productId:
            product.productId,

          name: product.name,

          category:
            product.category,

          farmingType:
            product.farmingType,

          unitsSold:
            product.unitsSold,

          orderCount:
            product.orderCount,

          revenue:
            Number(
              product.revenue.toFixed(2)
            ),

          quantity:
            product.quantity,

          pricePerKg:
            product.pricePerKg,
        }));

    /* -------------------------------------------------------
       8. Low stock
    ------------------------------------------------------- */

    const lowStock =
      farmerProducts
        .filter(
          (product) =>
            Number(product.quantity || 0) <
            10
        )
        .map((product) => ({
          _id: product._id,

          name: product.name,

          quantity:
            Number(
              product.quantity
            ) || 0,
        }));

    /* -------------------------------------------------------
       9. Revenue trend
    ------------------------------------------------------- */

    const revenueTrend =
      Object.entries(
        dailyRevenue
      )
        .sort(
          ([dateA], [dateB]) =>
            dateA.localeCompare(
              dateB
            )
        )
        .map(
          ([date, amount]) => ({
            date,
            amount:
              Number(
                amount.toFixed(2)
              ),
          })
        );

    /* -------------------------------------------------------
       10. Inventory value
    ------------------------------------------------------- */

    const inventoryValue =
      farmerProducts.reduce(
        (sum, product) =>
          sum +
          Number(
            product.quantity || 0
          ) *
            Number(
              product.pricePerKg || 0
            ),
        0
      );

    /* -------------------------------------------------------
       11. Current stock
    ------------------------------------------------------- */

    const stockKg =
      farmerProducts.reduce(
        (sum, product) =>
          sum +
          Number(
            product.quantity || 0
          ),
        0
      );

    /* -------------------------------------------------------
       12. Final response
    ------------------------------------------------------- */

    return res.json({
      totals: {
        products:
          farmerProducts.length,

        stockKg:
          Number(
            stockKg.toFixed(2)
          ),

        inventoryValue:
          Number(
            inventoryValue.toFixed(2)
          ),

        orders:
          orderIds.size,

        unitsSold:
          Number(
            unitsSold.toFixed(2)
          ),

        revenue:
          Number(
            totalRevenue.toFixed(2)
          ),
      },

      /*
       * Used by dashboard charts
       */
      topProducts,

      /*
       * Used by low-stock section
       */
      lowStock,

      /*
       * Used by revenue chart
       */
      revenueTrend,

      /*
       * Used by Product Performance table
       *
       * Contains ALL products, including
       * products with zero sales.
       */
      productPerformance,
    });
  } catch (err) {
    console.error(
      'Farmer analytics error:',
      err
    );

    return res.status(500).json({
      msg: 'Server error',
    });
  }
});

/*
=========================================================
UPDATE INDIVIDUAL ORDER ITEM STATUS

PATCH
/api/orders/:orderId/items/:itemId/status

This is the KEY FIX.

Farmer A can change only:
    Order X → Beetroot

Farmer B can change only:
    Order X → Brinjal
=========================================================
*/

router.patch(
  '/:orderId/items/:itemId/status',
  auth,
  async (req, res) => {

    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        msg: 'Farmers only',
      });
    }


    const {
      status,
    } = req.body;


    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Delivered',
    ];


    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        msg: 'Invalid status',
      });
    }


    try {

      /*
      Find complete order.
      */

      const order =
        await Order.findById(
          req.params.orderId
        );


      if (!order) {
        return res.status(404).json({
          msg:
            'Order not found',
        });
      }

      if (order.status === 'Cancelled') {
        return res.status(400).json({
          msg: 'Cancelled order cannot be changed',
        });
      }


      /*
      Find exact item.
      */

      const item =
        order.items.id(
          req.params.itemId
        );


      if (!item) {
        return res.status(404).json({
          msg:
            'Order item not found',
        });
      }


      /*
      Find product and verify
      it belongs to logged-in farmer.
      */

      const product =
        await Product.findOne({
          _id:
            item.product,

          farmer:
            req.user.id,
        });


      if (!product) {
        return res.status(403).json({
          msg:
            'You are not authorized to manage this product',
        });
      }


      /*
      Existing orders created before this
      update may not have item.farmer.

      Add it now.
      */

      item.farmer =
        req.user.id;


      /*
      Existing old order items may not
      have a status.
      */

      const currentStatus =
        item.status ||
        'Pending';


      /*
      Don't allow jumping directly
      from Pending to Delivered.
      */

      if (
        currentStatus ===
          'Pending' &&
        status !==
          'Confirmed'
      ) {

        return res.status(400).json({
          msg:
            'Pending order can only be moved to Confirmed',
        });
      }


      /*
      Confirmed → Delivered only.
      */

      if (
        currentStatus ===
          'Confirmed' &&
        status !==
          'Delivered'
      ) {

        return res.status(400).json({
          msg:
            'Confirmed order can only be moved to Delivered',
        });
      }


      /*
      Delivered cannot be changed.
      */

      if (
        currentStatus ===
        'Delivered'
      ) {

        return res.status(400).json({
          msg:
            'Delivered order cannot be changed',
        });
      }


      /*
      UPDATE ONLY THIS ITEM.
      */

      item.status =
        status;


      /*
      Calculate overall customer
      order status.
      */

      order.status =
        calculateOverallOrderStatus(
          order.items
        );


      await order.save();


      /*
      Return farmer-specific order.
      */

      const farmerProductIds =
        await Product.find({
          farmer:
            req.user.id,
        }).distinct('_id');


      const farmerProductIdSet =
        new Set(
          farmerProductIds.map(
            (id) =>
              String(id)
          )
        );


      const farmerItems =
        order.items
          .filter(
            (orderItem) =>
              farmerProductIdSet.has(
                String(
                  orderItem.product
                )
              )
          )
          .map(
            (orderItem) => ({
              ...orderItem.toObject(),

              status:
                orderItem.status ||
                'Pending',
            })
          );


      const farmerTotal =
        farmerItems.reduce(
          (
            sum,
            orderItem
          ) =>
            sum +
            Number(
              orderItem.pricePerKg ||
                0
            ) *
              Number(
                orderItem.quantity ||
                  0
              ),
          0
        );


      const farmerStatus =
        calculateFarmerStatus(
          farmerItems
        );


      const customer =
        await Order.findById(
          order._id
        )
          .populate(
            'customer',
            'name email'
          )
          .select('customer');


      return res.json({

        _id:
          order._id,

        customer:
          customer.customer,

        address:
          order.address,

        createdAt:
          order.createdAt,

        status:
          farmerStatus,

        items:
          farmerItems,

        farmerTotal:
          farmerTotal,
      });

    } catch (err) {

      console.error(
        'Individual item status update error:',
        err
      );

      return res.status(500).json({
        msg: 'Server error',
      });
    }
  }
);


/*
=========================================================
OPTIONAL OLD STATUS ROUTE

We keep this route temporarily so old frontend code
doesn't crash, BUT it is intentionally disabled for
farmer status management.

Use the new item-specific route instead.
=========================================================
*/

/* =========================================================
   UPDATE FARMER ORDER ITEM STATUS

   PATCH /api/orders/:id/status

   A farmer can ONLY update the status of products
   that belong to that farmer.
========================================================= */

router.patch('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({
      msg: 'Farmers only',
    });
  }

  const allowedStatuses = [
    'Pending',
    'Confirmed',
    'Delivered',
  ];

  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      msg: 'Invalid status',
    });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        msg: 'Order not found',
      });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        msg: 'Cancelled order cannot be changed',
      });
    }

    /*
      Find products owned by this farmer.
    */

    const farmerProductIds = await Product.find({
      farmer: req.user.id,
    }).distinct('_id');

    const farmerProductIdSet = new Set(
      farmerProductIds.map((id) => String(id))
    );

    /*
      Find only THIS farmer's items
      inside this order.
    */

    const farmerItems = order.items.filter((item) =>
      farmerProductIdSet.has(String(item.product))
    );

    if (farmerItems.length === 0) {
      return res.status(403).json({
        msg: 'This order does not contain your products',
      });
    }

    /*
      Update ONLY this farmer's items.
    */

    for (const item of farmerItems) {
      item.status = status;
    }

    /*
      Calculate overall order status.
    */

    const allStatuses = order.items.map(
      (item) => item.status || 'Pending'
    );

    const allCancelled = allStatuses.every(
      (itemStatus) => itemStatus === 'Cancelled'
    );

    const allDelivered = allStatuses.every(
      (itemStatus) => itemStatus === 'Delivered'
    );

    const allConfirmedOrDelivered = allStatuses.every(
      (itemStatus) =>
        itemStatus === 'Confirmed' ||
        itemStatus === 'Delivered'
    );

    const hasDelivered = allStatuses.some(
      (itemStatus) => itemStatus === 'Delivered'
    );

    const hasConfirmed = allStatuses.some(
      (itemStatus) => itemStatus === 'Confirmed'
    );

    if (allCancelled) {
      order.status = 'Cancelled';
    } else if (allDelivered) {
      order.status = 'Delivered';
    } else if (hasDelivered) {
      order.status = 'Partially Delivered';
    } else if (allConfirmedOrDelivered) {
      order.status = 'Confirmed';
    } else if (hasConfirmed) {
      order.status = 'Partially Confirmed';
    } else {
      order.status = 'Pending';
    }

    await order.save();

    /*
      Return updated order.
    */

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate(
        'items.product',
        'name imageUrl pricePerKg'
      )
      .populate(
        'items.farmer',
        'name farmName farmLocation'
      );

    return res.json(updatedOrder);

  } catch (err) {
    console.error(
      'Farmer item status update error:',
      err
    );

    return res.status(500).json({
      msg: 'Server error',
    });
  }
});

/*
=========================================================
TEST ROUTE
GET /api/orders/test
=========================================================
*/

router.get(
  '/test',
  (req, res) => {

    res.json({
      success: true,
      message:
        'Orders API is working',
    });
  }
);


/*
=========================================================
EXPORT
=========================================================
*/

module.exports = router;