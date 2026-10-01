import React, { useMemo } from 'react';

import {
  Bell,
  AlertTriangle,
  Package,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FarmerAlerts = ({
  products = [],
  orders = [],
  analytics = {},
  onViewOrders,
  onViewProducts,
  onViewAnalytics,
}) => {
  const alerts = useMemo(() => {
    const result = [];

    /* =====================================================
       PRODUCT SALES MAP
    ===================================================== */

    const salesMap = {};

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const productId =
          item.product?._id ||
          item.product;

        if (!productId) return;

        const key = String(productId);

        if (!salesMap[key]) {
          salesMap[key] = {
            unitsSold: 0,
            revenue: 0,
            orders: 0,
          };
        }

        salesMap[key].unitsSold +=
          Number(item.quantity || 0);

        salesMap[key].revenue +=
          Number(item.pricePerKg || 0) *
          Number(item.quantity || 0);

        salesMap[key].orders += 1;
      });
    });

    /* =====================================================
       1. PENDING ORDERS
    ===================================================== */

    const pendingOrders = orders.filter(
      (order) =>
        order.status === 'Pending'
    );

    pendingOrders
      .slice(0, 3)
      .forEach((order) => {
        const itemCount =
          Array.isArray(order.items)
            ? order.items.length
            : 0;

        const customerName =
          order.customer?.name ||
          'Customer';

        result.push({
          id: `order-${order._id}`,
          priority: 1,

          title:
            'Pending order requires attention',

          description:
            `${customerName} placed an order containing ${itemCount} product${
              itemCount === 1
                ? ''
                : 's'
            }.`,

          action: 'View Orders',

          onClick: onViewOrders,

          icon: (
            <ShoppingBag className="h-5 w-5 text-blue-700" />
          ),

          iconBg: 'bg-blue-100',

          container:
            'border-blue-100 bg-blue-50',

          titleColor:
            'text-blue-900',

          descriptionColor:
            'text-blue-700',
        });
      });

    /* =====================================================
       2. LOW STOCK
    ===================================================== */

    const lowStockProducts =
      Array.isArray(
        analytics?.lowStock
      )
        ? analytics.lowStock
        : products.filter(
            (product) =>
              Number(
                product.quantity || 0
              ) < 10
          );

    lowStockProducts
      .slice(0, 3)
      .forEach((product) => {
        const quantity =
          Number(
            product.quantity || 0
          );

        result.push({
          id: `stock-${product._id}`,

          priority: 2,

          title:
            'Low stock alert',

          description:
            `${product.name} has only ${quantity.toFixed(
              1
            )} kg remaining.`,

          action:
            'Manage Products',

          onClick:
            onViewProducts,

          icon: (
            <AlertTriangle className="h-5 w-5 text-orange-700" />
          ),

          iconBg:
            'bg-orange-100',

          container:
            'border-orange-100 bg-orange-50',

          titleColor:
            'text-orange-900',

          descriptionColor:
            'text-orange-700',
        });
      });

    /* =====================================================
       3. STOCK WITH NO SALES
    ===================================================== */

    products
      .filter((product) => {
        const productId =
          String(product._id);

        const sales =
          salesMap[productId];

        const quantity =
          Number(
            product.quantity || 0
          );

        const unitsSold =
          sales?.unitsSold || 0;

        return (
          quantity > 0 &&
          unitsSold === 0
        );
      })
      .slice(0, 3)
      .forEach((product) => {
        const quantity =
          Number(
            product.quantity || 0
          );

        const inventoryValue =
          quantity *
          Number(
            product.pricePerKg || 0
          );

        result.push({
          id: `unsold-${product._id}`,

          priority: 3,

          title:
            'Product has stock but no sales',

          description:
            `${product.name} has ${quantity.toFixed(
              1
            )} kg available but no recorded sales. Inventory value: ${formatCurrency(
              inventoryValue
            )}.`,

          action:
            'Review Products',

          onClick:
            onViewProducts,

          icon: (
            <Package className="h-5 w-5 text-purple-700" />
          ),

          iconBg:
            'bg-purple-100',

          container:
            'border-purple-100 bg-purple-50',

          titleColor:
            'text-purple-900',

          descriptionColor:
            'text-purple-700',
        });
      });

    /* =====================================================
       4. TOP SELLING PRODUCT
    ===================================================== */

    const topProduct =
      Array.isArray(
        analytics?.topProducts
      ) &&
      analytics.topProducts.length
        ? analytics.topProducts[0]
        : null;

    if (
      topProduct &&
      Number(
        topProduct.unitsSold || 0
      ) > 0
    ) {
      result.push({
        id: 'top-product',

        priority: 4,

        title:
          'Top-selling product',

        description:
          `${topProduct.name} has recorded ${Number(
            topProduct.unitsSold || 0
          ).toFixed(
            1
          )} kg in sales and generated ${formatCurrency(
            topProduct.revenue || 0
          )}.`,

        action:
          'View Analytics',

        onClick:
          onViewAnalytics,

        icon: (
          <TrendingUp className="h-5 w-5 text-green-700" />
        ),

        iconBg:
          'bg-green-100',

        container:
          'border-green-100 bg-green-50',

        titleColor:
          'text-green-900',

        descriptionColor:
          'text-green-700',
      });
    }

    return result
      .sort(
        (a, b) =>
          a.priority -
          b.priority
      )
      .slice(0, 6);
  }, [
    products,
    orders,
    analytics,
    onViewOrders,
    onViewProducts,
    onViewAnalytics,
  ]);

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  if (alerts.length === 0) {
    return (
      <section className="mb-6">
        <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Farm Alerts
              </h2>

              <p className="mt-1 text-sm text-green-700">
                Everything looks good right now.
                No immediate actions are required.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* =====================================================
     ALERT DISPLAY
  ===================================================== */

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-700" />

            <h2 className="text-xl font-bold text-gray-900">
              Farm Alerts
            </h2>

            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
              {alerts.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Important activity and actions that may need
            your attention.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-2xl border p-4 transition hover:shadow-sm ${alert.container}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${alert.iconBg}`}
              >
                {alert.icon}
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className={`font-semibold ${alert.titleColor}`}
                >
                  {alert.title}
                </h3>

                <p
                  className={`mt-1 text-sm leading-6 ${alert.descriptionColor}`}
                >
                  {alert.description}
                </p>

                {alert.onClick && (
                  <button
                    type="button"
                    onClick={alert.onClick}
                    className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${alert.titleColor} hover:underline`}
                  >
                    {alert.action}

                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

function formatCurrency(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export default FarmerAlerts;