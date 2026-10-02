import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import {
  ArrowLeft,
  Wallet,
  CalendarDays,
  TrendingUp,
  ShoppingBag,
  Leaf,
  Sprout,
  Save,
  RefreshCw,
  AlertTriangle,
  PieChart as PieChartIcon,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import {
  useNavigate,
} from 'react-router-dom';

const API_URL =
  'https://farmdirect-backend-gd6o.onrender.com/api';

const COLORS = [
  '#16a34a',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

/* =========================================================
   CURRENCY
========================================================= */

const formatCurrency = (value) => {
  return `₹${Number(
    value || 0
  ).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CustomerSpending() {
  const navigate = useNavigate();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [budgetInput, setBudgetInput] =
    useState('');

  const [savingBudget, setSavingBudget] =
    useState(false);

  const [budgetMessage, setBudgetMessage] =
    useState('');

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadSpending = async (
    showLoader = true
  ) => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const response =
        await axios.get(
          `${API_URL}/customer-spending`,
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

      setData(response.data);

      setBudgetInput(
        String(
          response.data?.budget
            ?.monthlyBudget || 5000
        )
      );
    } catch (err) {
      console.error(
        'Customer spending error:',
        err
      );

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem(
          'token'
        );

        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.msg ||
          'Unable to load spending data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSpending();
  }, []);

  /* =======================================================
     SAVE BUDGET
  ======================================================= */

  const saveBudget = async () => {
    const token =
      localStorage.getItem('token');

    const amount =
      Number(budgetInput);

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
      setBudgetMessage(
        'Please enter a valid budget.'
      );

      return;
    }

    try {
      setSavingBudget(true);
      setBudgetMessage('');

      await axios.put(
        `${API_URL}/customer-spending/budget`,
        {
          monthlyBudget: amount,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setBudgetMessage(
        'Monthly budget saved successfully.'
      );

      await loadSpending(false);
    } catch (err) {
      console.error(
        'Budget save error:',
        err
      );

      setBudgetMessage(
        err.response?.data?.msg ||
          'Unable to save budget.'
      );
    } finally {
      setSavingBudget(false);
    }
  };

  /* =======================================================
     CHART DATA
  ======================================================= */

  const categoryChartData =
    useMemo(() => {
      return (
        data?.categorySpending || []
      ).map((item) => ({
        name: item.category,
        value: item.amount,
      }));
    }, [data]);

  const farmingChartData =
    useMemo(() => {
      return [
        {
          name: 'Organic',
          value:
            data?.farmingTypeSpending
              ?.organic || 0,
        },
        {
          name: 'Non-Organic',
          value:
            data?.farmingTypeSpending
              ?.nonOrganic || 0,
        },
      ];
    }, [data]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">
            Loading spending dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() =>
              navigate(-1)
            }
            className="flex items-center gap-2 text-gray-600 hover:text-green-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />

            Back
          </button>

          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />

            <p className="text-red-600 font-semibold">
              {error}
            </p>

            <button
              onClick={() =>
                loadSpending()
              }
              className="mt-5 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalSpending =
    data?.totalSpending || 0;

  const monthlySpending =
    data?.monthlySpending || 0;

  const monthlyBudget =
    data?.budget?.monthlyBudget || 0;

  const remainingBudget =
    data?.budget?.remainingBudget || 0;

  const budgetPercentage =
    data?.budget?.percentage || 0;

  const organicSpending =
    data?.farmingTypeSpending
      ?.organic || 0;

  const nonOrganicSpending =
    data?.farmingTypeSpending
      ?.nonOrganic || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-4">

              <button
                onClick={() =>
                  navigate(
                    '/customer-dashboard'
                  )
                }
                className="w-10 h-10 rounded-xl border flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <p className="text-xs uppercase tracking-wider text-green-700 font-semibold">
                  FarmDirect
                </p>

                <h1 className="text-3xl font-bold text-gray-900">
                  Spending & Budget
                </h1>

                <p className="text-gray-500 mt-1">
                  Understand your food spending and manage your monthly budget.
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                loadSpending(false)
              }
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh
            </button>

          </div>

        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          {/* Total */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Total Spending
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(
                    totalSpending
                  )}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Delivered purchases
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-700" />
              </div>

            </div>

          </div>

          {/* Monthly */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  This Month
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(
                    monthlySpending
                  )}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Current month
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-700" />
              </div>

            </div>

          </div>

          {/* Remaining */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Budget Remaining
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(
                    remainingBudget
                  )}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  From monthly budget
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>

            </div>

          </div>

          {/* Budget */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Monthly Budget
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(
                    monthlyBudget
                  )}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {budgetPercentage}% used
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-yellow-700" />
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            BUDGET SECTION
        ================================================= */}

        <section className="bg-white rounded-2xl border shadow-sm p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex-1">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-700" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Monthly Budget
                  </h2>

                  <p className="text-sm text-gray-500">
                    Set how much you want to spend on FarmDirect each month.
                  </p>
                </div>

              </div>

              <div className="mt-6">

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    Spent: <strong>{formatCurrency(monthlySpending)}</strong>
                  </span>

                  <span className="text-gray-600">
                    Budget: <strong>{formatCurrency(monthlyBudget)}</strong>
                  </span>
                </div>

                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetPercentage >= 100
                        ? 'bg-red-500'
                        : budgetPercentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        budgetPercentage,
                        100
                      )}%`,
                    }}
                  />

                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>
                    {budgetPercentage}% used
                  </span>

                  <span>
                    {formatCurrency(
                      remainingBudget
                    )}{' '}
                    remaining
                  </span>
                </div>

              </div>

            </div>

            <div className="w-full lg:w-80">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Set Monthly Budget
              </label>

              <div className="flex gap-2">

                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={budgetInput}
                    onChange={(e) =>
                      setBudgetInput(
                        e.target.value
                      )
                    }
                    className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  onClick={saveBudget}
                  disabled={savingBudget}
                  className="px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />

                  {savingBudget
                    ? 'Saving...'
                    : 'Save'}
                </button>

              </div>

              {budgetMessage && (
                <p className="text-xs text-green-700 mt-2">
                  {budgetMessage}
                </p>
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            CHARTS
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Category */}
          <section className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <PieChartIcon className="w-5 h-5 text-purple-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Category-wise Spending
                </h2>

                <p className="text-sm text-gray-500">
                  Where your money is going
                </p>
              </div>
            </div>

            {categoryChartData.length ===
            0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No delivered purchases yet.
              </div>
            ) : (
              <div className="h-72">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={
                        categoryChartData
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) =>
  `${name}: ${formatCurrency(value)}`
}
labelLine
                    >
                      {categoryChartData.map(
                        (
                          entry,
                          index
                        ) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(
                        value
                      ) =>
                        formatCurrency(
                          value
                        )
                      }
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>
            )}

          </section>

          {/* Organic */}
          <section className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Organic vs Non-Organic
                </h2>

                <p className="text-sm text-gray-500">
                  Spending by farming type
                </p>
              </div>

            </div>

            <div className="h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    farmingChartData
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatCurrency(
                        value
                      )
                    }
                  />

                  <Bar
                    dataKey="value"
                    name="Spending"
                    fill="#16a34a"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">

              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-700">
                  Organic
                </p>

                <p className="text-xl font-bold text-green-800 mt-1">
                  {formatCurrency(
                    organicSpending
                  )}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-600">
                  Non-Organic
                </p>

                <p className="text-xl font-bold text-gray-800 mt-1">
                  {formatCurrency(
                    nonOrganicSpending
                  )}
                </p>
              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            CATEGORY TABLE
        ================================================= */}

        <section className="bg-white rounded-2xl border shadow-sm p-6 mb-8">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Category Breakdown
              </h2>

              <p className="text-sm text-gray-500">
                Detailed spending by product category
              </p>
            </div>

          </div>

          {(
            data?.categorySpending ||
            []
          ).length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No spending data available.
            </p>
          ) : (
            <div className="space-y-3">

              {data.categorySpending.map(
                (item) => {

                  const percentage =
                    totalSpending > 0
                      ? (
                          (item.amount /
                            totalSpending) *
                          100
                        )
                      : 0;

                  return (
                    <div
                      key={
                        item.category
                      }
                    >

                      <div className="flex justify-between text-sm mb-1">

                        <span className="font-medium text-gray-700">
                          {item.category}
                        </span>

                        <span className="font-semibold text-gray-900">
                          {formatCurrency(
                            item.amount
                          )}
                        </span>

                      </div>

                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            TOP PRODUCTS
        ================================================= */}

        <section className="bg-white rounded-2xl border shadow-sm p-6">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-700" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Most Purchased Products
              </h2>

              <p className="text-sm text-gray-500">
                Your highest-spending products
              </p>
            </div>

          </div>

          {(
            data?.topProducts ||
            []
          ).length === 0 ? (
            <div className="py-10 text-center">
              <Sprout className="w-10 h-10 text-gray-300 mx-auto mb-3" />

              <p className="text-gray-500">
                No delivered purchases yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="pb-3">
                      Product
                    </th>

                    <th className="pb-3">
                      Category
                    </th>

                    <th className="pb-3">
                      Farming Type
                    </th>

                    <th className="pb-3">
                      Quantity
                    </th>

                    <th className="pb-3 text-right">
                      Amount
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {data.topProducts.map(
                    (product) => (
                      <tr
                        key={
                          product.productId
                        }
                        className="border-b last:border-0"
                      >

                        <td className="py-4">

                          <div className="font-semibold text-gray-900">
                            {product.name}
                          </div>

                        </td>

                        <td className="py-4 text-gray-600">
                          {product.category}
                        </td>

                        <td className="py-4">

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              product.farmingType ===
                              'Organic'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {
                              product.farmingType
                            }
                          </span>

                        </td>

                        <td className="py-4 text-gray-600">
                          {product.quantity} kg
                        </td>

                        <td className="py-4 text-right font-bold text-gray-900">
                          {formatCurrency(
                            product.amount
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </main>
    </div>
  );
}