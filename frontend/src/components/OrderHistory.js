import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Truck,
  User,
  RefreshCw,
  XCircle,
  RotateCcw,
  Star,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const statusConfig = {
  Pending: {
    label: 'Pending',
    icon: Clock,
    classes:
      'bg-yellow-100 text-yellow-700 border-yellow-200',
  },

  Confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    classes:
      'bg-blue-100 text-blue-700 border-blue-200',
  },

  Delivered: {
    label: 'Delivered',
    icon: Truck,
    classes:
      'bg-green-100 text-green-700 border-green-200',
  },

  Cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    classes:
      'bg-red-100 text-red-700 border-red-200',
  },
};

function StatusBadge({ status }) {
  const config =
    statusConfig[status] ||
    statusConfig.Pending;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function FarmerStatusCard({ items, navigate }) {
  if (!items || items.length === 0) {
    return null;
  }

  /*
    Group products by farmer.
  */

  const farmerGroups = {};

  items.forEach((item) => {
    const farmerId =
      item.farmer?._id ||
      item.farmer ||
      'unknown';

    if (!farmerGroups[farmerId]) {
      farmerGroups[farmerId] = {
        farmer: item.farmer,
        items: [],
      };
    }

    farmerGroups[farmerId].items.push(item);
  });

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Farmer-wise Order Status
      </h3>

      <div className="space-y-4">
        {Object.entries(farmerGroups).map(
          ([farmerId, group]) => {

            const statuses = group.items.map(
              (item) => item.status || 'Pending'
            );

            let farmerStatus = 'Pending';

            if (
              statuses.every(
                (status) =>
                  status === 'Cancelled'
              )
            ) {
              farmerStatus = 'Cancelled';
            } else if (
              statuses.every(
                (status) =>
                  status === 'Delivered'
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
            }

            const farmerName =
              group.farmer?.name ||
              'Farmer';

            const farmName =
              group.farmer?.farmName ||
              '';

            return (
              <div
                key={farmerId}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50"
              >
                {/* Farmer header */}

                <div className="px-5 py-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-700" />
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">
                        {farmerName}
                      </p>

                      {farmName && (
                        <p className="text-sm text-gray-500">
                          {farmName}
                        </p>
                      )}
                    </div>
                  </div>

                  <StatusBadge
                    status={farmerStatus}
                  />
                </div>

                {/* Products */}

                <div className="divide-y divide-gray-200">
                  {group.items.map(
                    (item, index) => (
                      <div
                        key={
                          item._id ||
                          `${farmerId}-${index}`
                        }
                        className="px-5 py-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              {item.quantity} kg × ₹
                              {Number(
                                item.pricePerKg || 0
                              ).toFixed(0)}
                              /kg
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₹
                            {(
                              Number(
                                item.pricePerKg || 0
                              ) *
                              Number(
                                item.quantity || 0
                              )
                            ).toFixed(0)}
                          </p>

                          <div className="mt-1 flex flex-col items-end gap-2">
                            <StatusBadge
                              status={
                                item.status ||
                                'Pending'
                              }
                            />

                            {item.status === 'Delivered' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const productId =
                                    item.product?._id ||
                                    item.product ||
                                    item.productId;

                                  if (!productId) {
                                    alert('Product information is unavailable for this review.');
                                    return;
                                  }

                                  navigate(`/product/${productId}#product-reviews`);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                Review Product
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [cancellingOrderId, setCancellingOrderId] =
    useState(null);

  const loadOrders = async (
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
      const response = await axios.get(
        `${API_URL}/orders/my-orders`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setOrders(response.data || []);

    } catch (err) {
      console.error(
        'Order history error:',
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
          'Unable to load your orders.'
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString(
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

  const getOverallStatus = (order) => {
    if (order.status) {
      return order.status;
    }

    const statuses = (order.items || []).map(
      (item) => item.status || 'Pending'
    );

    if (
      statuses.length > 0 &&
      statuses.every(
        (status) => status === 'Delivered'
      )
    ) {
      return 'Delivered';
    }

    if (
      statuses.some(
        (status) => status === 'Delivered'
      )
    ) {
      return 'Partially Delivered';
    }

    if (
      statuses.some(
        (status) => status === 'Confirmed'
      )
    ) {
      return 'Partially Confirmed';
    }

    return 'Pending';
  };

  const getTotalKg = (order) => {
    return (order.items || []).reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  };

  const cancelOrder = async (order) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (getOverallStatus(order) !== 'Pending') {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${String(order._id).slice(-8).toUpperCase()}?\n\nThe ordered products will be returned to stock.`
    );

    if (!confirmed) {
      return;
    }

    setCancellingOrderId(order._id);
    setError('');

    try {
      await axios.patch(
        `${API_URL}/orders/${order._id}/cancel`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder._id === order._id
            ? {
                ...currentOrder,
                status: 'Cancelled',
                items: (currentOrder.items || []).map(
                  (item) => ({
                    ...item,
                    status: 'Cancelled',
                  })
                ),
              }
            : currentOrder
        )
      );

      setExpandedOrder(null);
    } catch (err) {
      console.error(
        'Order cancellation error:',
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.msg ||
          'Unable to cancel this order.'
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  const buyAgain = async (order) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const cartResponse = await axios.get(`${API_URL}/cart`, {
        headers: { 'x-auth-token': token },
      });

      const existingCart = {};
      (cartResponse.data?.items || []).forEach((item) => {
        const productId = item.product?._id || item.product;
        if (productId) {
          existingCart[String(productId)] = Number(item.quantity || 0);
        }
      });

      const added = [];
      const unavailable = [];

      for (const item of order.items || []) {
        const productId = item.product?._id || item.product || item.productId;
        if (!productId) {
          unavailable.push(item.name || 'Product');
          continue;
        }

        try {
          const productResponse = await axios.get(`${API_URL}/products/${productId}`);
          const product = productResponse.data;
          const stock = Number(product.quantity || 0);
          const alreadyInCart = Number(existingCart[String(productId)] || 0);
          const requested = Number(item.quantity || 0);
          const remaining = Math.max(0, stock - alreadyInCart);
          const quantityToAdd = Math.min(requested, remaining);

          if (quantityToAdd <= 0) {
            unavailable.push(`${item.name || 'Product'} (out of stock)`);
            continue;
          }

          await axios.post(
            `${API_URL}/cart/add`,
            { productId, quantity: quantityToAdd },
            { headers: { 'x-auth-token': token } }
          );

          added.push(`${item.name || 'Product'} (${quantityToAdd} kg)`);
          existingCart[String(productId)] = alreadyInCart + quantityToAdd;
        } catch (itemError) {
          console.error('Buy again item error:', itemError);
          unavailable.push(item.name || 'Product');
        }
      }

      window.dispatchEvent(new Event('cartUpdated'));

      if (added.length === 0) {
        alert('None of the products from this order are currently available.');
        return;
      }

      let message = `Added to cart:\n\n${added.join('\n')}`;
      if (unavailable.length > 0) {
        message += `\n\nUnavailable or partially unavailable:\n${unavailable.join('\n')}`;
      }

      alert(message);
      navigate('/cart');
    } catch (err) {
      console.error('Buy again error:', err);
      alert(err.response?.data?.msg || 'Unable to add the previous order to cart.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-green-700 text-sm font-semibold uppercase tracking-wide">
              FarmDirect
            </p>

            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              Order History
            </h1>

            <p className="text-gray-500 mt-1">
              Track every order and farmer delivery status.
            </p>
          </div>

          <button
            onClick={() => loadOrders(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-green-400 hover:text-green-700 transition disabled:opacity-50"
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

        {/* Error */}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-green-600 animate-spin" />

            <p className="mt-3 text-gray-500">
              Loading your orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty */

          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-green-700" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-5">
              No orders yet
            </h2>

            <p className="text-gray-500 mt-2">
              Start shopping directly from local farmers.
            </p>

            <button
              onClick={() =>
                navigate(
                  '/customer-dashboard'
                )
              }
              className="mt-6 px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {orders.map((order) => {
              const isExpanded =
                expandedOrder ===
                order._id;

              const overallStatus =
                getOverallStatus(order);

              const totalKg =
                getTotalKg(order);

              return (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >

                  {/* Order Header */}

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      <div className="flex items-start gap-4">

                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-green-700" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-bold text-gray-900">
                              Order #
                              {order._id
                                .slice(-8)
                                .toUpperCase()}
                            </h2>

                            <StatusBadge
                              status={
                                overallStatus ===
                                'Partially Delivered'
                                  ? 'Delivered'
                                  : overallStatus ===
                                    'Partially Confirmed'
                                  ? 'Confirmed'
                                  : overallStatus
                              }
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">

                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {formatDate(
                                order.createdAt
                              )}
                            </span>

                            <span>
                              {order.items?.length ||
                                0}{' '}
                              product
                              {order.items?.length ===
                              1
                                ? ''
                                : 's'}
                            </span>

                            <span>
                              {totalKg} kg
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-5">

                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Order Total
                          </p>

                          <p className="text-xl font-bold text-green-700">
                            ₹
                            {Number(
                              order.totalAmount || 0
                            ).toFixed(0)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setExpandedOrder(
                                isExpanded
                                  ? null
                                  : order._id
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-green-400 hover:text-green-700 transition"
                          >
                            {isExpanded
                              ? 'Hide'
                              : 'Details'}

                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => buyAgain(order)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-green-200 rounded-xl font-semibold text-green-700 hover:bg-green-50 hover:border-green-300 transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Buy Again
                          </button>

                          {overallStatus === 'Pending' && (
                            <button
                              onClick={() =>
                                cancelOrder(order)
                              }
                              disabled={
                                cancellingOrderId ===
                                order._id
                              }
                              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle
                                className="w-4 h-4"
                              />

                              {cancellingOrderId ===
                              order._id
                                ? 'Cancelling...'
                                : 'Cancel Order'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-5 sm:p-6">

                      {/* Farmer statuses */}

                      <FarmerStatusCard
                        items={order.items}
                        navigate={navigate}
                      />

                      {overallStatus === 'Cancelled' && (
                        <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold">Order cancelled</p>
                              <p className="text-sm mt-1">
                                This order was cancelled and the ordered quantities were returned to product stock.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Address */}

                      <div className="grid md:grid-cols-2 gap-5 mt-6">

                        <div className="border border-gray-200 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-green-600" />

                            <h3 className="font-bold text-gray-900">
                              Delivery Address
                            </h3>
                          </div>

                          <p className="text-gray-700">
                            {order.address?.street}
                          </p>

                          <p className="text-gray-700">
                            {order.address?.city},{' '}
                            {order.address?.state}
                          </p>

                          <p className="text-gray-500 mt-1">
                            PIN:{' '}
                            {order.address?.pincode}
                          </p>
                        </div>

                        <div className="border border-gray-200 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Phone className="w-5 h-5 text-green-600" />

                            <h3 className="font-bold text-gray-900">
                              Contact
                            </h3>
                          </div>

                          <p className="text-gray-700">
                            {order.address?.phone}
                          </p>

                          <p className="text-sm text-gray-500 mt-2">
                            Order placed on
                          </p>

                          <p className="font-semibold text-gray-900">
                            {formatDateTime(
                              order.createdAt
                            )}
                          </p>
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
}