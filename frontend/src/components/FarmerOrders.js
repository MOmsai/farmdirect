// src/components/FarmerOrders.js

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  IndianRupee,
  User,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  ChevronRight,
  X,
  Loader2,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const STATUS_OPTIONS = [
  'All',
  'Pending',
  'Confirmed',
  'Delivered',
  'Cancelled',
];

const EMPTY_STATS = {
  total: 0,
  pending: 0,
  confirmed: 0,
  delivered: 0,
  cancelled: 0,
  revenue: 0,
};

function FarmerOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('All');

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [updatingOrderId, setUpdatingOrderId] =
    useState(null);

  const [showFilters, setShowFilters] =
    useState(false);

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders = async (
    showFullLoader = true
  ) => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError('');

      const response = await axios.get(
        `${API_URL}/orders/farmer-orders`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setOrders(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        'Farmer orders loading error:',
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
          err.response?.data?.message ||
          'Unable to load farmer orders.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
  }, []);

  // =========================================================
  // CALCULATE STATISTICS
  // =========================================================

  const stats = useMemo(() => {
    const result = {
      ...EMPTY_STATS,
    };

    result.total = orders.length;

    orders.forEach((order) => {
      const status =
        order.status || 'Pending';

      if (status === 'Pending') {
        result.pending += 1;
      }

      if (status === 'Confirmed') {
        result.confirmed += 1;
      }

      if (status === 'Delivered') {
        result.delivered += 1;
      }

      if (status === 'Cancelled') {
        result.cancelled += 1;
      } else {
        result.revenue += Number(
          order.farmerTotal || 0
        );
      }
    });

    return result;
  }, [orders]);

  // =========================================================
  // FILTER ORDERS
  // =========================================================

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName =
        order.customer?.name ||
        '';

      const customerEmail =
        order.customer?.email ||
        '';

      const orderId =
        order._id || '';

      const productNames = (
        order.items || []
      )
        .map(
          (item) =>
            item.name || ''
        )
        .join(' ');

      const matchesSearch =
        !query ||
        customerName
          .toLowerCase()
          .includes(query) ||
        customerEmail
          .toLowerCase()
          .includes(query) ||
        orderId
          .toLowerCase()
          .includes(query) ||
        productNames
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'All' ||
        order.status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    orders,
    search,
    statusFilter,
  ]);

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateStatus = async (
    order,
    newStatus
  ) => {
    if (!order?._id) {
      return;
    }

    if (
      order.status === newStatus
    ) {
      return;
    }

    if (order.status === 'Cancelled') {
      return;
    }

    const token =
      localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setUpdatingOrderId(
        order._id
      );

      setError('');

      const response =
        await axios.patch(
          `${API_URL}/orders/${order._id}/status`,
          {
            status: newStatus,
          },
          {
            headers: {
              'Content-Type':
                'application/json',
              'x-auth-token':
                token,
            },
          }
        );

      const updatedOrder =
        response.data;

      setOrders((previous) =>
        previous.map((item) =>
          item._id === order._id
            ? {
                ...item,
                ...updatedOrder,
                status: newStatus,
              }
            : item
        )
      );

      setSelectedOrder(
        (previous) =>
          previous?._id === order._id
            ? {
                ...previous,
                ...updatedOrder,
                status: newStatus,
              }
            : previous
      );
    } catch (err) {
      console.error(
        'Order status update error:',
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
          err.response?.data?.message ||
          'Unable to update order status.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (
    amount
  ) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString('en-IN')}`;
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return '—';
    }

    return new Date(
      date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatDateTime = (
    date
  ) => {
    if (!date) {
      return '—';
    }

    return new Date(
      date
    ).toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const getTotalQuantity = (
    order
  ) => {
    return (order.items || []).reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  };

  const getStatusClass = (
    status
  ) => {
    if (status === 'Delivered') {
      return 'bg-green-100 text-green-700 border-green-200';
    }

    if (status === 'Confirmed') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }

    if (status === 'Cancelled') {
      return 'bg-red-100 text-red-700 border-red-200';
    }

    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const getNextStatus = (
    status
  ) => {
    if (status === 'Pending') {
      return 'Confirmed';
    }

    if (status === 'Confirmed') {
      return 'Delivered';
    }

    return null;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <button
                onClick={() =>
                  navigate(
                    '/farmer-dashboard'
                  )
                }
                className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>

              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                FARMDIRECT • ORDERS
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Order Management
              </h1>

              <p className="mt-1 text-gray-500">
                Manage customer orders and
                update delivery status.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  loadOrders(false)
                }
                disabled={refreshing}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }`}
                />

                Refresh
              </button>

              <button
                onClick={() =>
                  navigate(
                    '/farmer-products'
                  )
                }
                className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-4 font-semibold text-white transition hover:bg-green-700"
              >
                <Package className="h-4 w-4" />

                My Products
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Order Overview
            </h2>

            <p className="text-sm text-gray-500">
              Your current order activity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <SummaryCard
              icon={
                <ShoppingBag className="h-5 w-5" />
              }
              label="Total Orders"
              value={
                loading
                  ? '—'
                  : stats.total
              }
              iconClass="bg-green-100 text-green-700"
            />

            <SummaryCard
              icon={
                <Clock className="h-5 w-5" />
              }
              label="Pending"
              value={
                loading
                  ? '—'
                  : stats.pending
              }
              iconClass="bg-yellow-100 text-yellow-700"
            />

            <SummaryCard
              icon={
                <Truck className="h-5 w-5" />
              }
              label="Confirmed"
              value={
                loading
                  ? '—'
                  : stats.confirmed
              }
              iconClass="bg-blue-100 text-blue-700"
            />

            <SummaryCard
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
              label="Delivered"
              value={
                loading
                  ? '—'
                  : stats.delivered
              }
              iconClass="bg-green-100 text-green-700"
            />

            <SummaryCard
              icon={
                <AlertCircle className="h-5 w-5" />
              }
              label="Cancelled"
              value={
                loading
                  ? '—'
                  : stats.cancelled
              }
              iconClass="bg-red-100 text-red-700"
            />

            <SummaryCard
              icon={
                <IndianRupee className="h-5 w-5" />
              }
              label="Farmer Revenue"
              value={
                loading
                  ? '—'
                  : formatCurrency(
                      stats.revenue
                    )
              }
              iconClass="bg-emerald-100 text-emerald-700"
            />

          </div>
        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by order ID, customer, email or product..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </div>

            <button
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 font-medium text-gray-700 hover:bg-gray-50 lg:hidden"
            >
              <Filter className="h-4 w-4" />

              Filters
            </button>

            <div
              className={`${
                showFilters
                  ? 'flex'
                  : 'hidden'
              } items-center gap-2 lg:flex`}
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      statusFilter ===
                      status
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing{' '}
              <strong className="text-gray-800">
                {filteredOrders.length}
              </strong>{' '}
              of{' '}
              <strong className="text-gray-800">
                {orders.length}
              </strong>{' '}
              orders
            </span>

            {(search ||
              statusFilter !==
                'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter(
                    'All'
                  );
                }}
                className="font-semibold text-green-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* =================================================
            ORDERS
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Customer Orders
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Orders containing your products.
            </p>
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredOrders.length ===
            0 ? (
            <EmptyState
              hasFilters={
                Boolean(search) ||
                statusFilter !==
                  'All'
              }
              onClear={() => {
                setSearch('');
                setStatusFilter(
                  'All'
                );
              }}
            />
          ) : (
            <div className="divide-y divide-gray-100">

              {filteredOrders.map(
                (order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    updating={
                      updatingOrderId ===
                      order._id
                    }
                    onView={() =>
                      setSelectedOrder(
                        order
                      )
                    }
                    onUpdateStatus={
                      updateStatus
                    }
                    formatCurrency={
                      formatCurrency
                    }
                    formatDate={
                      formatDate
                    }
                    getStatusClass={
                      getStatusClass
                    }
                    getNextStatus={
                      getNextStatus
                    }
                    getTotalQuantity={
                      getTotalQuantity
                    }
                  />
                )
              )}

            </div>
          )}
        </section>

      </main>

      {/* ===================================================
          ORDER DETAILS MODAL
      =================================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          updating={
            updatingOrderId ===
            selectedOrder._id
          }
          onClose={() =>
            setSelectedOrder(null)
          }
          onUpdateStatus={
            updateStatus
          }
          formatCurrency={
            formatCurrency
          }
          formatDateTime={
            formatDateTime
          }
          getStatusClass={
            getStatusClass
          }
          getNextStatus={
            getNextStatus
          }
          getTotalQuantity={
            getTotalQuantity
          }
        />
      )}
    </div>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  icon,
  label,
  value,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>

      </div>
    </div>
  );
}

// =========================================================
// ORDER ROW
// =========================================================

function OrderRow({
  order,
  updating,
  onView,
  onUpdateStatus,
  formatCurrency,
  formatDate,
  getStatusClass,
  getNextStatus,
  getTotalQuantity,
}) {
  const nextStatus =
    getNextStatus(
      order.status
    );

  const customerName =
    order.customer?.name ||
    'Customer';

  const items =
    order.items || [];

  return (
    <div className="p-5 transition hover:bg-gray-50">

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

        {/* ORDER INFO */}

        <div className="flex min-w-0 flex-1 items-start gap-4">

          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
            <Package className="h-6 w-6 text-green-700" />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-bold text-gray-900">
                #{String(
                  order._id || ''
                ).slice(-8)}
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                  order.status
                )}`}
              >
                {order.status ||
                  'Pending'}
              </span>

            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">

              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />

                {customerName}
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />

                {formatDate(
                  order.createdAt
                )}
              </span>

            </div>

            <div className="mt-3 flex flex-wrap gap-2">

              {items
                .slice(0, 3)
                .map(
                  (
                    item,
                    index
                  ) => (
                    <span
                      key={`${item.name}-${index}`}
                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                    >
                      {item.name ||
                        'Product'}{' '}
                      ×{' '}
                      {Number(
                        item.quantity ||
                          0
                      )}{' '}
                      kg
                    </span>
                  )
                )}

              {items.length >
                3 && (
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  +
                  {items.length -
                    3}{' '}
                  more
                </span>
              )}

            </div>
          </div>
        </div>

        {/* QUANTITY */}

        <div className="min-w-[100px]">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Quantity
          </p>

          <p className="mt-1 font-bold text-gray-900">
            {getTotalQuantity(
              order
            ).toFixed(1)}{' '}
            kg
          </p>
        </div>

        {/* REVENUE */}

        <div className="min-w-[120px]">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Your Revenue
          </p>

          <p className="mt-1 font-bold text-green-700">
            {formatCurrency(
              order.farmerTotal
            )}
          </p>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap items-center gap-2">

          <button
            onClick={onView}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Details

            <ChevronRight className="h-4 w-4" />
          </button>

          {order.status === 'Cancelled' ? (
            <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4" />
              Cancelled
            </span>
          ) : nextStatus && (
            <button
              onClick={() =>
                onUpdateStatus(
                  order,
                  nextStatus
                )
              }
              disabled={updating}
              className="flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : nextStatus ===
                'Confirmed' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Truck className="h-4 w-4" />
              )}

              {updating
                ? 'Updating...'
                : nextStatus ===
                  'Confirmed'
                ? 'Confirm'
                : 'Deliver'}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

// =========================================================
// ORDER DETAILS MODAL
// =========================================================

function OrderDetailsModal({
  order,
  updating,
  onClose,
  onUpdateStatus,
  formatCurrency,
  formatDateTime,
  getStatusClass,
  getNextStatus,
  getTotalQuantity,
}) {
  const nextStatus =
    getNextStatus(
      order.status
    );

  const customerName =
    order.customer?.name ||
    'Customer';

  const customerEmail =
    order.customer?.email ||
    '';

  const address =
    order.address || {};

  const items =
    order.items || [];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

          <div>
            <div className="flex items-center gap-3">

              <h2 className="text-xl font-bold text-gray-900">
                Order #
                {String(
                  order._id || ''
                ).slice(-8)}
              </h2>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                  order.status
                )}`}
              >
                {order.status ||
                  'Pending'}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Placed{' '}
              {formatDateTime(
                order.createdAt
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* CONTENT */}

        <div className="overflow-y-auto px-6 py-6">

          <div className="grid gap-6 lg:grid-cols-3">

            {/* CUSTOMER */}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <User className="h-5 w-5 text-green-700" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Customer
                  </h3>

                  <p className="text-xs text-gray-500">
                    Buyer information
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">

                <div>
                  <p className="text-xs text-gray-400">
                    Name
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {customerName}
                  </p>
                </div>

                {customerEmail && (
                  <div>
                    <p className="text-xs text-gray-400">
                      Email
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {customerEmail}
                    </p>
                  </div>
                )}

                {address.phone && (
                  <div>
                    <p className="text-xs text-gray-400">
                      Phone
                    </p>

                    <p className="mt-1 flex items-center gap-2 font-medium text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {address.phone}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* DELIVERY ADDRESS */}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <MapPin className="h-5 w-5 text-blue-700" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Delivery Address
                  </h3>

                  <p className="text-xs text-gray-500">
                    Customer delivery location
                  </p>
                </div>
              </div>

              <div className="text-sm leading-6 text-gray-700">

                <p>
                  {address.street ||
                    '—'}
                </p>

                <p>
                  {address.city ||
                    '—'}
                  {address.city &&
                    address.state
                    ? ', '
                    : ''}
                  {address.state ||
                    ''}
                </p>

                <p>
                  {address.pincode ||
                    '—'}
                </p>

              </div>
            </div>

            {/* ORDER SUMMARY */}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <IndianRupee className="h-5 w-5 text-green-700" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Order Summary
                  </h3>

                  <p className="text-xs text-gray-500">
                    Your portion of the order
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Products
                  </span>

                  <span className="font-semibold">
                    {items.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Quantity
                  </span>

                  <span className="font-semibold">
                    {getTotalQuantity(
                      order
                    ).toFixed(1)}{' '}
                    kg
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">

                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Your Revenue
                    </span>

                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(
                        order.farmerTotal
                      )}
                    </span>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* PRODUCTS */}

          <div className="mt-6">

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Ordered Products
                </h3>

                <p className="text-sm text-gray-500">
                  Products included from your farm.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200">

              <div className="hidden grid-cols-[1fr_110px_130px_140px] border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">

                <span>Product</span>
                <span>Quantity</span>
                <span>Price/kg</span>
                <span>Total</span>

              </div>

              <div className="divide-y divide-gray-100">

                {items.map(
                  (
                    item,
                    index
                  ) => {
                    const quantity =
                      Number(
                        item.quantity ||
                          0
                      );

                    const price =
                      Number(
                        item.pricePerKg ||
                          0
                      );

                    const total =
                      quantity *
                      price;

                    return (
                      <div
                        key={`${item.product || item.name}-${index}`}
                        className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_110px_130px_140px] sm:items-center"
                      >

                        <div className="flex items-center gap-3">

                          {item.imageUrl ? (
                            <img
                              src={
                                item.imageUrl
                              }
                              alt={
                                item.name ||
                                'Product'
                              }
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                              <Package className="h-5 w-5 text-green-700" />
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.name ||
                                'Product'}
                            </p>

                            <p className="text-xs text-gray-500">
                              Farm product
                            </p>
                          </div>

                        </div>

                        <div>
                          <p className="text-xs text-gray-400 sm:hidden">
                            Quantity
                          </p>

                          <p className="font-semibold text-gray-800">
                            {quantity}{' '}
                            kg
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 sm:hidden">
                            Price
                          </p>

                          <p className="font-medium text-gray-700">
                            {formatCurrency(
                              price
                            )}
                            /kg
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 sm:hidden">
                            Total
                          </p>

                          <p className="font-bold text-green-700">
                            {formatCurrency(
                              total
                            )}
                          </p>
                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm text-gray-500">
            {order.status ===
            'Delivered' ? (
              <span className="flex items-center gap-2 font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                This order has been delivered.
              </span>
            ) : (
              <span>
                Update the order status as
                you process it.
              </span>
            )}
          </div>

          <div className="flex gap-2">

            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>

            {order.status === 'Cancelled' ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                This order was cancelled by the customer. No further status updates are available.
              </div>
            ) : nextStatus && (
              <button
                onClick={() =>
                  onUpdateStatus(
                    order,
                    nextStatus
                  )
                }
                disabled={updating}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : nextStatus ===
                  'Confirmed' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}

                {updating
                  ? 'Updating...'
                  : `Mark as ${nextStatus}`}
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// =========================================================
// LOADING STATE
// =========================================================

function LoadingState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-8">

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
        <Loader2 className="h-7 w-7 animate-spin text-green-700" />
      </div>

      <h3 className="font-semibold text-gray-900">
        Loading orders...
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Getting your latest customer orders.
      </p>

    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  hasFilters,
  onClear,
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ShoppingBag className="h-8 w-8 text-gray-400" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        {hasFilters
          ? 'No matching orders'
          : 'No customer orders yet'}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
        {hasFilters
          ? 'Try changing your search or status filter.'
          : 'When customers purchase your products, their orders will appear here.'}
      </p>

      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          Clear Filters
        </button>
      )}

    </div>
  );
}

export default FarmerOrders;