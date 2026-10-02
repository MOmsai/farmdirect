// src/components/FarmerDashboard.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
  BarChart3,
  Bell,
  Bot,
  Boxes,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Leaf,
  Loader2,
  Package,
  RefreshCw,
  Send,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
  WalletCards,
  X,
  AlertTriangle,
} from 'lucide-react';

import AIFeatureCard from './AIFeatureCard';
import AIInsightsModal from './AIInsightsModal';

const API_URL = 'https://farmdirect-backend-gd6o.onrender.com/api';

/* =========================================================
   DEFAULT ANALYTICS
========================================================= */

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

/* =========================================================
   FARMER DASHBOARD
========================================================= */

function FarmerDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [analytics, setAnalytics] =
    useState(DEFAULT_ANALYTICS);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =======================================================
     AI MODAL
  ======================================================= */

  const [aiModalOpen, setAIModalOpen] =
    useState(false);

  const [activeAI, setActiveAI] =
    useState(null);

  const [aiInsights, setAIInsights] =
    useState('');

  const [aiLoading, setAILoading] =
    useState(false);

  const [aiError, setAIError] =
    useState('');

  /* =======================================================
     FARM ASSISTANT
  ======================================================= */

  const [assistantOpen, setAssistantOpen] =
    useState(false);

  const [assistantQuestion, setAssistantQuestion] =
    useState('');

  const [assistantResponse, setAssistantResponse] =
    useState('');

  const [assistantLoading, setAssistantLoading] =
    useState(false);

  const [assistantError, setAssistantError] =
    useState('');

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(async () => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    const headers = {
      'x-auth-token': token,
    };

    let productsLoaded = false;
    let ordersLoaded = false;
    let analyticsLoaded = false;

    let loadedProducts = [];
    let loadedOrders = [];
    let loadedAnalytics =
      DEFAULT_ANALYTICS;

    /* =====================================================
       PRODUCTS
    ===================================================== */

    try {
      const response =
        await axios.get(
          `${API_URL}/products/my-products`,
          {
            headers,
          }
        );

      loadedProducts =
        Array.isArray(response.data)
          ? response.data
          : [];

      setProducts(
        loadedProducts
      );

      productsLoaded = true;
    } catch (err) {
      console.error(
        'Products API error:',
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
    }

    /* =====================================================
       FARMER ORDERS
    ===================================================== */

    try {
      const response =
        await axios.get(
          `${API_URL}/orders/farmer-orders`,
          {
            headers,
          }
        );

      loadedOrders =
        Array.isArray(response.data)
          ? response.data
          : [];

      setOrders(
        loadedOrders
      );

      ordersLoaded = true;
    } catch (err) {
      console.error(
        'Farmer orders API error:',
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
    }

    /* =====================================================
       FARMER ANALYTICS
    ===================================================== */

    try {
      const response =
        await axios.get(
          `${API_URL}/orders/farmer-analytics`,
          {
            headers,
          }
        );

      if (response.data) {
        loadedAnalytics =
          response.data;

        setAnalytics(
          response.data
        );

        analyticsLoaded = true;
      }
    } catch (err) {
      console.error(
        'Farmer analytics API error:',
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
    }

    /* =====================================================
       FALLBACK CALCULATION
       
       If analytics API fails, calculate the important
       dashboard values from products + orders.
    ===================================================== */

    if (
      !analyticsLoaded
    ) {
      const fallbackAnalytics =
        buildFallbackAnalytics(
          loadedProducts,
          loadedOrders
        );

      setAnalytics(
        fallbackAnalytics
      );
    }

    /* =====================================================
       PARTIAL LOAD WARNING
    ===================================================== */

    if (
      !productsLoaded ||
      !ordersLoaded ||
      !analyticsLoaded
    ) {
      setError(
        'Some dashboard information could not be loaded. Available information is still being displayed.'
      );
    }

    setLoading(false);
  }, [navigate]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     CALCULATED VALUES
  ======================================================= */

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.quantity || 0
        ),
      0
    );

  const inventoryValue =
    products.reduce(
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

  const totalOrders =
    Number(
      analytics?.totals?.orders ??
        orders.length ??
        0
    );

  const totalRevenue =
    Number(
      analytics?.totals?.revenue ||
        0
    );

  const unitsSold =
    Number(
      analytics?.totals?.unitsSold ||
        0
    );

  const topProducts =
    analytics?.topProducts || [];

  const lowStockProducts =
    analytics?.lowStock || [];

  /* =======================================================
     SALES MAP
     
     Used for "stock but no sales" alerts.
  ======================================================= */

  const salesMap = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      (order.items || []).forEach(
        (item) => {
          const productId =
            item.product?._id ||
            item.product;

          if (!productId) {
            return;
          }

          const key =
            String(productId);

          if (!map[key]) {
            map[key] = {
              unitsSold: 0,
              revenue: 0,
              orders: 0,
            };
          }

          const quantity =
            Number(
              item.quantity || 0
            );

          const price =
            Number(
              item.pricePerKg || 0
            );

          map[key].unitsSold +=
            quantity;

          map[key].revenue +=
            quantity * price;

          map[key].orders += 1;
        }
      );
    });

    return map;
  }, [orders]);

  /* =======================================================
     UNSOLD PRODUCTS
  ======================================================= */

  const unsoldProducts =
    useMemo(() => {
      return products.filter(
        (product) => {
          const productId =
            String(product._id);

          const sales =
            salesMap[productId];

          const stock =
            Number(
              product.quantity || 0
            );

          const sold =
            Number(
              sales?.unitsSold || 0
            );

          return (
            stock > 0 &&
            sold === 0
          );
        }
      );
    }, [products, salesMap]);

  /* =======================================================
     PENDING ORDERS
  ======================================================= */

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === 'Pending'
    );

  /* =======================================================
     FARM ALERT COUNT
  ======================================================= */

  const alertCount =
    pendingOrders.length +
    lowStockProducts.length +
    unsoldProducts.length;

  /* =======================================================
     AI ANALYSIS
  ======================================================= */

  const runAIAnalysis = async ({
    endpoint,
    title,
    icon,
    method = 'GET',
    body = null,
  }) => {
    try {
      setActiveAI({
        title,
        icon,
      });

      setAIInsights('');
      setAIError('');
      setAILoading(true);
      setAIModalOpen(true);

      const token =
        localStorage.getItem(
          'token'
        );

      if (!token) {
        throw new Error(
          'Your session has expired. Please log in again.'
        );
      }

      const config = {
        method,
        headers: {
          'Content-Type':
            'application/json',
          'x-auth-token':
            token,
        },
      };

      if (body) {
        config.body =
          JSON.stringify(body);
      }

      const response =
        await fetch(
          `${API_URL}${endpoint}`,
          config
        );

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          'token'
        );

        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.msg ||
            'Failed to generate AI insights.'
        );
      }

      setAIInsights(
        data.insights ||
          'There is not enough FarmDirect data available for this analysis.'
      );
    } catch (err) {
      console.error(
        'AI analysis error:',
        err
      );

      setAIError(
        err.message ||
          'Unable to generate AI insights.'
      );
    } finally {
      setAILoading(false);
    }
  };

  /* =======================================================
     AI BUTTONS
  ======================================================= */

  const handleDemandAnalysis =
    () =>
      runAIAnalysis({
        endpoint:
          '/ai/demand-analysis',
        title:
          'AI Demand Analysis',
        icon: (
          <BarChart3 className="h-6 w-6 text-green-700" />
        ),
      });

  const handlePricingInsights =
    () =>
      runAIAnalysis({
        endpoint:
          '/ai/pricing-insights',
        title:
          'AI Pricing Insights',
        icon: (
          <DollarSign className="h-6 w-6 text-green-700" />
        ),
      });

  const handleBudgetAdvisor =
    () =>
      runAIAnalysis({
        endpoint:
          '/ai/budget-advisor',
        title:
          'AI Budget Advisor',
        icon: (
          <Wallet className="h-6 w-6 text-green-700" />
        ),
      });

  const handleSustainability =
    () =>
      runAIAnalysis({
        endpoint:
          '/ai/sustainability-advisor',
        title:
          'AI Sustainability Advisor',
        icon: (
          <Leaf className="h-6 w-6 text-green-700" />
        ),
      });

  const handleSeasonalPlanning =
    () =>
      runAIAnalysis({
        endpoint:
          '/ai/seasonal-planning',
        title:
          'AI Seasonal Planning',
        icon: (
          <CalendarDays className="h-6 w-6 text-green-700" />
        ),
      });

  /* =======================================================
     FARM ASSISTANT
  ======================================================= */

  const openFarmAssistant =
    () => {
      setAssistantQuestion('');
      setAssistantResponse('');
      setAssistantError('');
      setAssistantOpen(true);
    };

  const askFarmAssistant =
    async () => {
      const question =
        assistantQuestion.trim();

      if (!question) {
        setAssistantError(
          'Please enter a question.'
        );
        return;
      }

      if (question.length > 1000) {
        setAssistantError(
          'Please keep your question under 1000 characters.'
        );
        return;
      }

      try {
        setAssistantLoading(true);
        setAssistantError('');
        setAssistantResponse('');

        const token =
          localStorage.getItem(
            'token'
          );

        if (!token) {
          throw new Error(
            'Your session has expired. Please log in again.'
          );
        }

        const response =
          await fetch(
            `${API_URL}/ai/farm-assistant`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                'x-auth-token':
                  token,
              },
              body: JSON.stringify({
                question,
              }),
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            'token'
          );

          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.msg ||
              'Failed to get Farm Assistant response.'
          );
        }

        setAssistantResponse(
          data.insights ||
            'No AI response was generated.'
        );
      } catch (err) {
        console.error(
          'Farm Assistant error:',
          err
        );

        setAssistantError(
          err.message ||
            'Unable to connect to Farm Assistant.'
        );
      } finally {
        setAssistantLoading(
          false
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase text-green-700">
                FARMDIRECT • FARMER CENTER
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Farmer Dashboard
              </h1>

              <p className="mt-1 text-gray-500">
                Your farm at a glance.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/farm-profile'
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <UserRound className="h-4 w-4" />

                Farm Profile
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/budget-calculator'
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700"
              >
                <WalletCards className="h-4 w-4" />

                Budget Planner
              </button>

              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                title="Refresh dashboard"
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

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">

            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />

            <div>
              <p className="font-semibold">
                Dashboard warning
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="mb-6">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <p className="text-sm text-gray-500">
              Manage your farm from one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* MY PRODUCTS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/farmer-products'
                )
              }
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-green-400 hover:shadow-md"
            >

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                <Boxes className="h-6 w-6 text-green-700" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                My Products
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Edit products and manage stock
              </p>

            </button>

            {/* ORDERS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/farmer-orders'
                )
              }
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-green-400 hover:shadow-md"
            >

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                <Package className="h-6 w-6 text-green-700" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Order Management
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Confirm and deliver customer orders
              </p>

            </button>

            {/* ANALYTICS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/farmer-analytics'
                )
              }
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-md"
            >

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-700" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Analytics
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Track sales and farm performance
              </p>

            </button>

            {/* BUDGET */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/budget-calculator'
                )
              }
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-green-400 hover:shadow-md"
            >

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                <Wallet className="h-6 w-6 text-green-700" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Budget Planner
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Plan costs and expected farm returns
              </p>

            </button>

          </div>

        </section>

        {/* =================================================
            FARM ALERTS
        ================================================= */}

        <section className="mb-6">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <div className="flex items-center gap-2">

                <Bell className="h-5 w-5 text-green-700" />

                <h2 className="text-xl font-bold text-gray-900">
                  Farm Alerts
                </h2>

                {alertCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                    {alertCount}
                  </span>
                )}

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Important farm activity that may need your attention.
              </p>
            </div>

          </div>

          {alertCount === 0 ? (

            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-700" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Everything looks good
                  </h3>

                  <p className="mt-1 text-sm text-green-700">
                    No immediate actions are required.
                  </p>
                </div>

              </div>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

              {/* PENDING ORDERS */}

              {pendingOrders
                .slice(0, 3)
                .map((order) => (

                  <AlertCard
                    key={`order-${order._id}`}
                    type="blue"
                    icon={
                      <ShoppingBag className="h-5 w-5" />
                    }
                    title="Pending order requires attention"
                    description={`Order #${String(
                      order._id
                    ).slice(
                      -8
                    )} is waiting for confirmation.`}
                    buttonText="View Orders"
                    onClick={() =>
                      navigate(
                        '/farmer-orders'
                      )
                    }
                  />

                ))}

              {/* LOW STOCK */}

              {lowStockProducts
                .slice(0, 3)
                .map((product) => (

                  <AlertCard
                    key={`stock-${product._id}`}
                    type="orange"
                    icon={
                      <AlertTriangle className="h-5 w-5" />
                    }
                    title="Low stock alert"
                    description={`${product.name} has only ${Number(
                      product.quantity || 0
                    ).toFixed(
                      1
                    )} kg remaining.`}
                    buttonText="Manage Products"
                    onClick={() =>
                      navigate(
                        '/farmer-products'
                      )
                    }
                  />

                ))}

              {/* UNSOLD STOCK */}

              {unsoldProducts
                .slice(0, 3)
                .map((product) => {

                  const inventory =
                    Number(
                      product.quantity ||
                        0
                    ) *
                    Number(
                      product.pricePerKg ||
                        0
                    );

                  return (
                    <AlertCard
                      key={`unsold-${product._id}`}
                      type="purple"
                      icon={
                        <Package className="h-5 w-5" />
                      }
                      title="Product has stock but no sales"
                      description={`${product.name} has ${Number(
                        product.quantity || 0
                      ).toFixed(
                        1
                      )} kg available but no recorded sales. Inventory value: ₹${inventory.toLocaleString(
                        'en-IN'
                      )}.`}
                      buttonText="Review Products"
                      onClick={() =>
                        navigate(
                          '/farmer-products'
                        )
                      }
                    />
                  );
                })}

            </div>

          )}

        </section>

        {/* =================================================
            FARM OVERVIEW
        ================================================= */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Farm Overview
            </h2>

            <p className="text-sm text-gray-500">
              Your current FarmDirect business metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <StatCard
              icon={
                <Boxes className="h-5 w-5" />
              }
              title="Products"
              value={
                loading
                  ? '—'
                  : totalProducts
              }
            />

            <StatCard
              icon={
                <Package className="h-5 w-5" />
              }
              title="Available Stock"
              value={
                loading
                  ? '—'
                  : `${totalStock.toFixed(
                      1
                    )} kg`
              }
            />

            <StatCard
              icon={
                <ShoppingBag className="h-5 w-5" />
              }
              title="Orders"
              value={
                loading
                  ? '—'
                  : totalOrders
              }
            />

            <StatCard
              icon={
                <TrendingUp className="h-5 w-5" />
              }
              title="Revenue"
              value={
                loading
                  ? '—'
                  : `₹${totalRevenue.toLocaleString(
                      'en-IN'
                    )}`
              }
            />

            <StatCard
              icon={
                <Wallet className="h-5 w-5" />
              }
              title="Inventory Value"
              value={
                loading
                  ? '—'
                  : `₹${inventoryValue.toLocaleString(
                      'en-IN'
                    )}`
              }
            />

          </div>

        </section>

        {/* =================================================
            FARM PERFORMANCE
        ================================================= */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Farm Performance
              </h2>

              <p className="text-sm text-gray-500">
                A quick summary of your current activity.
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm text-gray-500">
                Quantity Sold
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {unitsSold.toFixed(
                  1
                )}{' '}
                kg
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm text-gray-500">
                Total Orders
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalOrders}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-5">
              <p className="text-sm text-gray-500">
                Revenue
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                ₹
                {totalRevenue.toLocaleString(
                  'en-IN'
                )}
              </p>
            </div>

          </div>

        </section>

        {/* =================================================
            TOP PRODUCTS
        ================================================= */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Top Products
              </h2>

              <p className="text-sm text-gray-500">
                Products with the strongest recorded sales.
              </p>
            </div>

            <TrendingUp className="h-6 w-6 text-green-600" />

          </div>

          {topProducts.length === 0 ? (

            <div className="rounded-xl bg-gray-50 p-5 text-gray-500">
              No sales data available yet.
            </div>

          ) : (

            <div className="space-y-3">

              {topProducts
                .slice(0, 5)
                .map(
                  (
                    product,
                    index
                  ) => (

                    <div
                      key={`${product.name}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                          {index + 1}
                        </div>

                        <div>

                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {Number(
                              product.unitsSold ||
                                0
                            ).toFixed(
                              1
                            )}{' '}
                            kg sold
                          </p>

                        </div>

                      </div>

                      <p className="font-bold text-green-700">
                        ₹
                        {Number(
                          product.revenue ||
                            0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </p>

                    </div>

                  )
                )}

            </div>

          )}

          <button
            type="button"
            onClick={() =>
              navigate(
                '/farmer-analytics'
              )
            }
            className="mt-5 font-semibold text-green-700 hover:underline"
          >
            View Full Analytics →
          </button>

        </section>

        {/* =================================================
            AI HEADER
        ================================================= */}

        <section className="mb-5 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 p-6 text-white shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Sparkles className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  FarmDirect AI Intelligence
                </h2>

                <p className="mt-1 text-green-100">
                  AI-powered insights based on your actual farm data.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 text-sm text-green-100">
              <Bot className="h-5 w-5" />

              Powered by Gemini AI
            </div>

          </div>

        </section>

        {/* =================================================
            AI FEATURES
        ================================================= */}

        <section className="mb-8">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            <AIFeatureCard
              icon={
                <BarChart3 className="h-6 w-6 text-green-700" />
              }
              title="AI Demand Analysis"
              description="Analyze recorded sales and identify products with stronger or weaker demand."
              buttonText="Analyze Demand"
              onClick={
                handleDemandAnalysis
              }
              loading={
                aiLoading &&
                activeAI?.title ===
                  'AI Demand Analysis'
              }
            />

            <AIFeatureCard
              icon={
                <DollarSign className="h-6 w-6 text-green-700" />
              }
              title="AI Pricing Insights"
              description="Review current prices, historical selling data, and pricing considerations."
              buttonText="Analyze Pricing"
              onClick={
                handlePricingInsights
              }
              loading={
                aiLoading &&
                activeAI?.title ===
                  'AI Pricing Insights'
              }
            />

            <AIFeatureCard
              icon={
                <Wallet className="h-6 w-6 text-green-700" />
              }
              title="AI Budget Advisor"
              description="Understand saved farm budgets, costs, expected revenue, and profitability projections."
              buttonText="Analyze Budget"
              onClick={
                handleBudgetAdvisor
              }
              loading={
                aiLoading &&
                activeAI?.title ===
                  'AI Budget Advisor'
              }
            />

            <AIFeatureCard
              icon={
                <Leaf className="h-6 w-6 text-green-700" />
              }
              title="AI Sustainability Advisor"
              description="Review resource-related financial indicators and sustainability considerations."
              buttonText="View Sustainability"
              onClick={
                handleSustainability
              }
              loading={
                aiLoading &&
                activeAI?.title ===
                  'AI Sustainability Advisor'
              }
            />

            <AIFeatureCard
              icon={
                <CalendarDays className="h-6 w-6 text-green-700" />
              }
              title="AI Seasonal Planning"
              description="Use recorded products, sales, inventory, and budgets to support future planning."
              buttonText="Plan Season"
              onClick={
                handleSeasonalPlanning
              }
              loading={
                aiLoading &&
                activeAI?.title ===
                  'AI Seasonal Planning'
              }
            />

            <AIFeatureCard
              icon={
                <Bot className="h-6 w-6 text-green-700" />
              }
              title="AI Farm Assistant"
              description="Ask questions about your products, sales, inventory, budgets, and farm data."
              buttonText="Ask AI"
              onClick={
                openFarmAssistant
              }
              loading={false}
            />

          </div>

        </section>

      </main>

      {/* =====================================================
          AI INSIGHTS MODAL
      ===================================================== */}

      <AIInsightsModal
        open={aiModalOpen}
        onClose={() => {
          if (!aiLoading) {
            setAIModalOpen(false);
          }
        }}
        title={
          activeAI?.title ||
          'FarmDirect AI'
        }
        icon={activeAI?.icon}
        insights={aiInsights}
        loading={aiLoading}
        error={aiError}
      />

      {/* =====================================================
          FARM ASSISTANT MODAL
      ===================================================== */}

      {assistantOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !assistantLoading
            ) {
              setAssistantOpen(
                false
              );
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                  <Bot className="h-6 w-6 text-green-700" />
                </div>

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    AI Farm Assistant
                  </h2>

                  <p className="text-sm text-gray-500">
                    Ask questions about your FarmDirect data.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !assistantLoading
                  ) {
                    setAssistantOpen(
                      false
                    );
                  }
                }}
                disabled={
                  assistantLoading
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* BODY */}

            <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Your question
              </label>

              <textarea
                value={
                  assistantQuestion
                }
                onChange={(event) => {
                  setAssistantQuestion(
                    event.target.value
                  );

                  setAssistantError(
                    ''
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' &&
                    (event.ctrlKey ||
                      event.metaKey)
                  ) {
                    event.preventDefault();

                    if (
                      !assistantLoading
                    ) {
                      askFarmAssistant();
                    }
                  }
                }}
                rows={4}
                maxLength={1000}
                placeholder="Example: Which products are selling the most?"
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              <div className="mt-1 flex justify-between text-xs text-gray-400">

                <span>
                  Press Ctrl + Enter to ask
                </span>

                <span>
                  {assistantQuestion.length}/1000
                </span>

              </div>

              {/* QUICK QUESTIONS */}

              <div className="mt-5">

                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Try asking
                </p>

                <div className="flex flex-wrap gap-2">

                  {[
                    'Give me a summary of my farm.',
                    'Which products are selling the most?',
                    'Which products have no sales?',
                    'What is my current stock?',
                    'Summarize my latest budget.',
                  ].map(
                    (question) => (
                      <button
                        key={question}
                        type="button"
                        disabled={
                          assistantLoading
                        }
                        onClick={() =>
                          setAssistantQuestion(
                            question
                          )
                        }
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                      >
                        {question}
                      </button>
                    )
                  )}

                </div>

              </div>

              {/* ERROR */}

              {assistantError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {assistantError}
                </div>
              )}

              {/* ASK BUTTON */}

              <button
                type="button"
                onClick={
                  askFarmAssistant
                }
                disabled={
                  assistantLoading ||
                  !assistantQuestion.trim()
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {assistantLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />

                    Analyzing your farm data...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />

                    Ask Farm Assistant
                  </>
                )}

              </button>

              {/* RESPONSE */}

              {assistantResponse && (
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/50 p-5">

                  <div className="mb-4 flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                      <Sparkles className="h-5 w-5 text-green-700" />
                    </div>

                    <div>

                      <h3 className="font-bold text-gray-900">
                        FarmDirect AI
                      </h3>

                      <p className="text-xs text-gray-500">
                        Based on your FarmDirect data
                      </p>

                    </div>

                  </div>

                  <AIText
                    text={
                      assistantResponse
                    }
                  />

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   FALLBACK ANALYTICS
========================================================= */

function buildFallbackAnalytics(
  products,
  orders
) {
  const productMap = {};

  let totalRevenue = 0;
  let unitsSold = 0;

  /* -------------------------------------------------------
     SALES
  ------------------------------------------------------- */

  orders.forEach((order) => {
    (order.items || []).forEach(
      (item) => {
        const productId =
          item.product?._id ||
          item.product;

        const productName =
          item.name ||
          'Unknown Product';

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

        totalRevenue += revenue;
        unitsSold += quantity;

        const key =
          String(
            productId ||
              productName
          );

        if (!productMap[key]) {
          productMap[key] = {
            name: productName,
            unitsSold: 0,
            revenue: 0,
            orderCount: 0,
          };
        }

        productMap[key].unitsSold +=
          quantity;

        productMap[key].revenue +=
          revenue;

        productMap[key].orderCount +=
          1;
      }
    );
  });

  /* -------------------------------------------------------
     STOCK
  ------------------------------------------------------- */

  const stockKg =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.quantity || 0
        ),
      0
    );

  const inventoryValue =
    products.reduce(
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
     LOW STOCK
  ------------------------------------------------------- */

  const lowStock =
    products
      .filter(
        (product) =>
          Number(
            product.quantity || 0
          ) < 10
      )
      .map((product) => ({
        _id: product._id,
        name: product.name,
        quantity:
          Number(
            product.quantity || 0
          ),
      }));

  /* -------------------------------------------------------
     TOP PRODUCTS
  ------------------------------------------------------- */

  const topProducts =
    Object.values(productMap)
      .sort(
        (a, b) =>
          b.unitsSold -
          a.unitsSold
      )
      .slice(0, 5);

  return {
    totals: {
      products:
        products.length,

      stockKg,

      inventoryValue,

      orders:
        orders.length,

      unitsSold,

      revenue:
        totalRevenue,
    },

    topProducts,

    lowStock,

    revenueTrend: [],
  };
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
          {icon}
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

/* =========================================================
   ALERT CARD
========================================================= */

function AlertCard({
  type,
  icon,
  title,
  description,
  buttonText,
  onClick,
}) {
  const styles = {
    blue: {
      container:
        'border-blue-100 bg-blue-50',
      icon:
        'bg-blue-100 text-blue-700',
      title:
        'text-blue-900',
      text:
        'text-blue-700',
    },

    orange: {
      container:
        'border-orange-100 bg-orange-50',
      icon:
        'bg-orange-100 text-orange-700',
      title:
        'text-orange-900',
      text:
        'text-orange-700',
    },

    purple: {
      container:
        'border-purple-100 bg-purple-50',
      icon:
        'bg-purple-100 text-purple-700',
      title:
        'text-purple-900',
      text:
        'text-purple-700',
    },
  };

  const style =
    styles[type] ||
    styles.blue;

  return (
    <div
      className={`rounded-2xl border p-4 ${style.container}`}
    >

      <div className="flex items-start gap-4">

        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">

          <h3
            className={`font-semibold ${style.title}`}
          >
            {title}
          </h3>

          <p
            className={`mt-1 text-sm leading-6 ${style.text}`}
          >
            {description}
          </p>

          <button
            type="button"
            onClick={onClick}
            className={`mt-2 text-sm font-semibold hover:underline ${style.title}`}
          >
            {buttonText} →
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   AI TEXT FORMATTER
========================================================= */

function AIText({
  text,
}) {
  return (
    <div className="space-y-3">

      {String(text)
        .split('\n')
        .map(
          (line, index) => {
            const trimmed =
              line.trim();

            if (!trimmed) {
              return (
                <div
                  key={index}
                  className="h-1"
                />
              );
            }

            if (
              trimmed.startsWith(
                '### '
              )
            ) {
              return (
                <h4
                  key={index}
                  className="mt-5 border-b border-green-100 pb-2 text-lg font-bold text-green-800"
                >
                  {trimmed.replace(
                    '### ',
                    ''
                  )}
                </h4>
              );
            }

            if (
              trimmed.startsWith(
                '- '
              )
            ) {
              return (
                <div
                  key={index}
                  className="flex gap-3 text-sm leading-7 text-gray-700"
                >

                  <span className="mt-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" />

                  <p>
                    {formatInlineText(
                      trimmed.substring(
                        2
                      )
                    )}
                  </p>

                </div>
              );
            }

            if (
              /^\d+\.\s/.test(
                trimmed
              )
            ) {
              const match =
                trimmed.match(
                  /^(\d+)\.\s(.*)$/
                );

              return (
                <div
                  key={index}
                  className="flex gap-3 text-sm leading-7 text-gray-700"
                >

                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                    {match[1]}
                  </span>

                  <p>
                    {formatInlineText(
                      match[2]
                    )}
                  </p>

                </div>
              );
            }

            return (
              <p
                key={index}
                className="text-sm leading-7 text-gray-700"
              >
                {formatInlineText(
                  trimmed
                )}
              </p>
            );
          }
        )}

    </div>
  );
}

/* =========================================================
   INLINE MARKDOWN
========================================================= */

function formatInlineText(
  text
) {
  const parts =
    String(text).split(
      /(\*\*.*?\*\*)/g
    );

  return parts.map(
    (part, index) => {
      if (
        part.startsWith(
          '**'
        ) &&
        part.endsWith(
          '**'
        )
      ) {
        return (
          <strong
            key={index}
            className="font-semibold text-gray-900"
          >
            {part.slice(
              2,
              -2
            )}
          </strong>
        );
      }

      return part;
    }
  );
}

export default FarmerDashboard;