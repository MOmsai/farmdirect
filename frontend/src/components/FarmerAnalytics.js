import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BarChart3,
  Boxes,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Eye,
  IndianRupee,
} from 'lucide-react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API_URL = 'https://farmdirect-backend-gd6o.onrender.com/api';

const DEFAULT_ANALYTICS = {
  totals: {
    products: 0,
    stockKg: 0,
    inventoryValue: 0,
    orders: 0,
    unitsSold: 0,
    revenue: 0,
  },
  topProducts: [],
  lowStock: [],
  revenueTrend: [],
};

function FarmerAnalytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] =
    useState(DEFAULT_ANALYTICS);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const token = localStorage.getItem('token');

  const loadAnalytics = async () => {
    const currentToken =
      localStorage.getItem('token');

    if (!currentToken) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `${API_URL}/orders/farmer-analytics`,
        {
          headers: {
            'x-auth-token': currentToken,
          },
        }
      );

      setAnalytics(
        response.data || DEFAULT_ANALYTICS
      );
    } catch (err) {
      console.error(
        'Analytics loading error:',
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          'Unable to load analytics data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totals =
    analytics?.totals ||
    DEFAULT_ANALYTICS.totals;

  const topProducts =
    Array.isArray(analytics?.topProducts)
      ? analytics.topProducts
      : [];

  const lowStock =
    Array.isArray(analytics?.lowStock)
      ? analytics.lowStock
      : [];

  const revenueTrend =
    Array.isArray(analytics?.revenueTrend)
      ? analytics.revenueTrend
      : [];

  /*
   * Normalize revenue trend so the chart can handle
   * slightly different property names from the backend.
   */
  const revenueChartData = useMemo(() => {
    return revenueTrend.map((item, index) => {
      const revenue = Number(
        item.revenue ??
          item.totalRevenue ??
          item.amount ??
          0
      );

      const rawDate =
        item.date ||
        item.day ||
        item._id ||
        item.label;

      let label = `Day ${index + 1}`;

      if (rawDate) {
        const parsedDate =
          new Date(rawDate);

        if (
          !Number.isNaN(
            parsedDate.getTime()
          )
        ) {
          label = parsedDate.toLocaleDateString(
            'en-IN',
            {
              day: '2-digit',
              month: 'short',
            }
          );
        } else {
          label = String(rawDate);
        }
      }

      return {
        label,
        revenue,
      };
    });
  }, [revenueTrend]);

  const productChartData = useMemo(() => {
    return topProducts
      .slice(0, 6)
      .map((product) => ({
        name:
          product.name || 'Unknown',
        unitsSold: Number(
          product.unitsSold || 0
        ),
        revenue: Number(
          product.revenue || 0
        ),
      }));
  }, [topProducts]);

  const revenueDistribution = useMemo(() => {
    return topProducts
      .filter(
        (product) =>
          Number(product.revenue || 0) > 0
      )
      .slice(0, 6)
      .map((product) => ({
        name:
          product.name || 'Unknown',
        value: Number(
          product.revenue || 0
        ),
      }));
  }, [topProducts]);

const inventoryData = useMemo(() => {
  if (
    !Array.isArray(
      analytics?.productPerformance
    )
  ) {
    return [];
  }

  return analytics.productPerformance.map(
    (product) => ({
      ...product,

      quantity:
        Number(product.quantity) || 0,

      pricePerKg:
        Number(product.pricePerKg) || 0,

      unitsSold:
        Number(product.unitsSold) || 0,

      orderCount:
        Number(product.orderCount) || 0,

      revenue:
        Number(product.revenue) || 0,

      inventoryValue:
        Number(
          product.inventoryValue ??
            (
              Number(product.quantity || 0) *
              Number(product.pricePerKg || 0)
            )
        ),
    })
  );
}, [
  analytics?.productPerformance,
]);

  const totalProducts = Number(
    totals.products || 0
  );

  const totalStock = Number(
    totals.stockKg || 0
  );

  const totalOrders = Number(
    totals.orders || 0
  );

  const totalUnitsSold = Number(
    totals.unitsSold || 0
  );

  const totalRevenue = Number(
    totals.revenue || 0
  );

  const inventoryValue = Number(
    totals.inventoryValue || 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate('/farmer-dashboard')
                  }
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-semibold uppercase tracking-wide text-green-700">
                  FarmDirect • Analytics
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900">
                Farm Analytics
              </h1>

              <p className="mt-1 text-gray-500">
                Track your sales, revenue, inventory
                and farm performance.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate('/farmer-dashboard')
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                Dashboard
              </button>

              <button
                onClick={() =>
                  navigate('/farmer-products')
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Boxes className="h-4 w-4" />
                My Products
              </button>

              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-50"
                title="Refresh Analytics"
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    loading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load analytics
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Performance Overview
            </h2>

            <p className="text-sm text-gray-500">
              Your current FarmDirect business metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            <AnalyticsCard
              icon={<Boxes />}
              title="Products"
              value={
                loading
                  ? '—'
                  : totalProducts
              }
            />

            <AnalyticsCard
              icon={<Package />}
              title="Current Stock"
              value={
                loading
                  ? '—'
                  : `${totalStock.toFixed(
                      1
                    )} kg`
              }
            />

            <AnalyticsCard
              icon={<ShoppingBag />}
              title="Orders"
              value={
                loading
                  ? '—'
                  : totalOrders
              }
            />

            <AnalyticsCard
              icon={<TrendingUp />}
              title="Quantity Sold"
              value={
                loading
                  ? '—'
                  : `${totalUnitsSold.toFixed(
                      1
                    )} kg`
              }
            />

            <AnalyticsCard
              icon={<IndianRupee />}
              title="Revenue"
              value={
                loading
                  ? '—'
                  : formatCurrency(
                      totalRevenue
                    )
              }
            />

            <AnalyticsCard
              icon={<Wallet />}
              title="Inventory Value"
              value={
                loading
                  ? '—'
                  : formatCurrency(
                      inventoryValue
                    )
              }
            />
          </div>
        </section>

        {/* Charts */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Sales & Revenue
            </h2>

            <p className="text-sm text-gray-500">
              Understand how your products are performing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* Revenue Trend */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Revenue Trend
                  </h3>

                  <p className="text-sm text-gray-500">
                    Recorded revenue over time
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-700" />
                </div>
              </div>

              {revenueChartData.length === 0 ? (
                <EmptyChart
                  message="Revenue trend data will appear after you receive orders."
                />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={revenueChartData}
                      margin={{
                        top: 10,
                        right: 15,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 12,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        tick={{
                          fontSize: 12,
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `₹${value}`
                        }
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(
                            value
                          ),
                          'Revenue',
                        ]}
                        contentStyle={{
                          borderRadius:
                            '12px',
                          border:
                            '1px solid #e5e7eb',
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Top-Selling Products
                  </h3>

                  <p className="text-sm text-gray-500">
                    Products ranked by recorded sales
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <BarChart3 className="h-5 w-5 text-blue-700" />
                </div>
              </div>

              {productChartData.length === 0 ? (
                <EmptyChart
                  message="Product performance will appear after your first sales."
                />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={productChartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 12,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        tick={{
                          fontSize: 12,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        formatter={(value) => [
                          `${value} kg`,
                          'Quantity Sold',
                        ]}
                        contentStyle={{
                          borderRadius:
                            '12px',
                          border:
                            '1px solid #e5e7eb',
                        }}
                      />

                      <Bar
                        dataKey="unitsSold"
                        fill="#16a34a"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Revenue Distribution + Low Stock */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Revenue Distribution */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Revenue Distribution
                  </h3>

                  <p className="text-sm text-gray-500">
                    Revenue contribution by product
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <IndianRupee className="h-5 w-5 text-purple-700" />
                </div>
              </div>

              {revenueDistribution.length === 0 ? (
                <EmptyChart
                  message="Revenue distribution will appear after sales are recorded."
                />
              ) : (
                <div className="h-[330px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={
                          revenueDistribution
                        }
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={105}
                        innerRadius={55}
                        paddingAngle={3}
                      >
                        {revenueDistribution.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                PIE_COLORS[
                                  index %
                                    PIE_COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(
                            value
                          ),
                          'Revenue',
                        ]}
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={36}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Low Stock */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Inventory Alerts
                  </h3>

                  <p className="text-sm text-gray-500">
                    Products that may need attention
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>

              {lowStock.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl bg-green-50 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-700" />
                  </div>

                  <h4 className="mt-3 font-bold text-green-800">
                    Stock looks healthy
                  </h4>

                  <p className="mt-1 max-w-sm text-sm text-green-700">
                    No products are currently included in the low-stock alert list.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock
                    .slice(0, 6)
                    .map(
                      (
                        product,
                        index
                      ) => {
                        const quantity =
                          Number(
                            product.quantity ??
                              product.currentStockKg ??
                              product.stockKg ??
                              0
                          );

                        return (
                          <div
                            key={
                              product._id ||
                              product.productId ||
                              `${product.name}-${index}`
                            }
                            className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                <Package className="h-5 w-5 text-orange-600" />
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="text-xs text-gray-500">
                                  Low stock alert
                                </p>
                              </div>
                            </div>

                            <span className="font-bold text-orange-700">
                              {quantity.toFixed(
                                1
                              )}{' '}
                              kg
                            </span>
                          </div>
                        );
                      }
                    )}

                  <button
                    onClick={() =>
                      navigate(
                        '/farmer-products'
                      )
                    }
                    className="mt-2 font-semibold text-green-700 hover:underline"
                  >
                    Manage Inventory →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Product Performance Table */}
        <section className="mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Product Performance
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Compare sales, revenue and current inventory.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    '/farmer-products'
                  )
                }
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Manage Products
              </button>
            </div>

            {inventoryData.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No product analytics available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Product
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Sold
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Orders
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Revenue
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Stock
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Price/kg
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Inventory Value
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventoryData.map(
                      (
                        product,
                        index
                      ) => {
                        const sold =
                          Number(
                            product.unitsSold ||
                              0
                          );

                        const productRevenue =
                          Number(
                            product.revenue ||
                              0
                          );

                        const orders =
                          Number(
                            product.orderCount ||
                              0
                          );

                        return (
                          <tr
                            key={
                              product._id ||
                              product.productId ||
                              `${product.name}-${index}`
                            }
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                  <Package className="h-5 w-5 text-green-700" />
                                </div>

                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {
                                      product.name
                                    }
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {product.category ||
                                      'Product'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 font-medium text-gray-700">
                              {sold.toFixed(
                                1
                              )}{' '}
                              kg
                            </td>

                            <td className="px-6 py-4 text-gray-700">
                              {orders}
                            </td>

                            <td className="px-6 py-4 font-semibold text-green-700">
                              {formatCurrency(
                                productRevenue
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                 Number(product.quantity || 0) < 10
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {Number(
                                  product.quantity ||
                                    0
                                ).toFixed(
                                  1
                                )}{' '}
                                kg
                              </span>
                            </td>

                            <td className="px-6 py-4 text-gray-700">
                              {formatCurrency(
                                product.pricePerKg
                              )}
                            </td>

                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {formatCurrency(
                                product.inventoryValue
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* AI Intelligence */}
        <section className="mb-8">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 p-6 text-white shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    FarmDirect AI Intelligence
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-green-100">
                    Use your recorded farm data to explore demand,
                    pricing, budgets, sustainability and seasonal
                    planning with FarmDirect AI.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <AIChip text="Demand Analysis" />
                    <AIChip text="Pricing Insights" />
                    <AIChip text="Budget Advisor" />
                    <AIChip text="Sustainability" />
                    <AIChip text="Seasonal Planning" />
                    <AIChip text="Farm Assistant" />
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(
                    '/farmer-dashboard'
                  )
                }
                className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-green-700 shadow-sm transition hover:bg-green-50"
              >
                <Sparkles className="h-5 w-5" />
                Open AI Intelligence
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Navigation */}
        <div className="flex flex-wrap justify-center gap-3 pb-6">
          <button
            onClick={() =>
              navigate(
                '/farmer-products'
              )
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Boxes className="h-4 w-4" />
            My Products
          </button>

          <button
            onClick={() =>
              navigate(
                '/farmer-orders'
              )
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </button>

          <button
            onClick={() =>
              navigate(
                '/farmer-dashboard'
              )
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

/* ---------------------------------------
   Reusable Components
---------------------------------------- */

function AnalyticsCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          {React.cloneElement(icon, {
            className: 'h-5 w-5',
          })}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({
  message,
}) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-xl bg-gray-50 p-6 text-center">
      <div>
        <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />

        <p className="mt-3 text-sm text-gray-500">
          {message}
        </p>
      </div>
    </div>
  );
}

function AIChip({ text }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
      {text}
    </span>
  );
}

function formatCurrency(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

const PIE_COLORS = [
  '#16a34a',
  '#2563eb',
  '#f59e0b',
  '#9333ea',
  '#ef4444',
  '#0891b2',
];

export default FarmerAnalytics;