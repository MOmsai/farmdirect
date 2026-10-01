import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Phone,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function Cart() {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const [cart, setCart] = useState(null);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);

  const [checkoutLoading, setCheckoutLoading] =
    useState(false);

  const [updatingProduct, setUpdatingProduct] =
    useState(null);

  const [error, setError] = useState('');

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [orderId, setOrderId] = useState('');

  // =====================================================
  // LOAD CART
  // =====================================================

  const loadCart = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await axios.get(
        `${API_URL}/cart`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setCart(res.data);
    } catch (err) {
      console.error('Load cart error:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.msg ||
          'Unable to load your cart.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQty = async (
    productId,
    quantity
  ) => {
    if (quantity < 0) return;

    try {
      setUpdatingProduct(productId);
      setError('');

      const res = await axios.patch(
        `${API_URL}/cart/${productId}`,
        {
          quantity,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setCart(res.data);

      window.dispatchEvent(
        new Event('cartUpdated')
      );
    } catch (err) {
      console.error(
        'Update quantity error:',
        err
      );

      alert(
        err.response?.data?.msg ||
          'Unable to update cart.'
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const removeItem = async (
    productId
  ) => {
    try {
      setUpdatingProduct(productId);
      setError('');

      const res = await axios.delete(
        `${API_URL}/cart/${productId}`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setCart(res.data);

      window.dispatchEvent(
        new Event('cartUpdated')
      );
    } catch (err) {
      console.error(
        'Remove item error:',
        err
      );

      alert(
        err.response?.data?.msg ||
          'Unable to remove item.'
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  // =====================================================
  // ADDRESS CHANGE
  // =====================================================

  const handleAddressChange = (
    field,
    value
  ) => {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =====================================================
  // CART CALCULATIONS
  // =====================================================

  const cartItems = cart?.items || [];

  const total = cartItems.reduce(
    (sum, item) => {
      const product = item.product;

      return (
        sum +
        Number(
          product?.pricePerKg || 0
        ) *
          Number(item.quantity || 0)
      );
    },
    0
  );

  const cartCount = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  // =====================================================
  // VALIDATE ADDRESS
  // =====================================================

  const validateAddress = () => {
    const street =
      address.street.trim();

    const city =
      address.city.trim();

    const state =
      address.state.trim();

    const pincode =
      address.pincode.trim();

    const phone =
      address.phone.trim();

    if (
      !street ||
      !city ||
      !state ||
      !pincode ||
      !phone
    ) {
      setError(
        'Please fill in all delivery address fields.'
      );

      return false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError(
        'Pincode must contain exactly 6 digits.'
      );

      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        'Phone number must contain exactly 10 digits.'
      );

      return false;
    }

    return true;
  };

  // =====================================================
  // CHECKOUT
  // =====================================================

  const checkout = async () => {
    setError('');

    if (cartItems.length === 0) {
      setError(
        'Your cart is empty.'
      );

      return;
    }

    if (!validateAddress()) {
      return;
    }

    const items = cartItems.map(
      (item) => ({
        product: item.product._id,
        quantity: Number(
          item.quantity
        ),
      })
    );

    try {
      setCheckoutLoading(true);

      // -------------------------------------------------
      // CREATE ORDER
      // -------------------------------------------------

      const orderResponse =
        await axios.post(
          `${API_URL}/orders`,
          {
            items,
            address: {
              street:
                address.street.trim(),

              city:
                address.city.trim(),

              state:
                address.state.trim(),

              pincode:
                address.pincode.trim(),

              phone:
                address.phone.trim(),
            },
          },
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

      const createdOrder =
        orderResponse.data;

      // -------------------------------------------------
      // CLEAR DATABASE CART
      // -------------------------------------------------

      try {
        await axios.delete(
          `${API_URL}/cart`,
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );
      } catch (clearError) {
        /*
          The order has already been created.

          Do not report checkout as failed just because
          the cart cleanup request failed.
        */

        console.error(
          'Cart cleanup error after successful order:',
          clearError
        );
      }

      // -------------------------------------------------
      // UPDATE NAVBAR
      // -------------------------------------------------

      window.dispatchEvent(
        new Event('cartUpdated')
      );

      // -------------------------------------------------
      // SUCCESS STATE
      // -------------------------------------------------

      setOrderId(
        createdOrder?._id || ''
      );

      setOrderSuccess(true);
    } catch (err) {
      console.error(
        'Checkout error:',
        err
      );

      setError(
        err.response?.data?.msg ||
          'Unable to place your order. Please try again.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f9f1] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ORDER SUCCESS
  // =====================================================

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#f4f9f1] flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full bg-white rounded-3xl border shadow-sm p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Order Placed Successfully!
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for shopping directly
            from our farmers.
          </p>

          {orderId && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">
                Order ID
              </p>

              <p className="font-bold text-green-700 break-all mt-1">
                {orderId}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() =>
                navigate('/orders')
              }
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              View My Orders
            </button>

            <button
              onClick={() =>
                navigate(
                  '/customer-dashboard'
                )
              }
              className="border border-green-700 text-green-700 hover:bg-green-50 px-6 py-3 rounded-xl font-bold transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (
    !cart ||
    cartItems.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#f4f9f1] px-6 py-12">
        <div className="max-w-3xl mx-auto text-center bg-white rounded-3xl border p-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-5" />

          <h2 className="text-3xl font-bold mb-3">
            Your Cart is Empty
          </h2>

          <p className="text-gray-500 mb-6">
            Explore fresh products directly
            from farmers.
          </p>

          <button
            onClick={() =>
              navigate(
                '/customer-dashboard'
              )
            }
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-bold transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN CART
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f4f9f1] px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto">

        {/* BACK */}

        <button
          onClick={() =>
            navigate(
              '/customer-dashboard'
            )
          }
          className="flex items-center gap-2 text-green-700 font-semibold mb-6 hover:text-green-800"
        >
          <ArrowLeft className="w-5 h-5" />

          Continue Shopping
        </button>

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold">
            Your Cart
          </h1>

          <p className="text-gray-500 mt-2">
            {cartCount} kg of products
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* =================================================
              CART ITEMS
          ================================================= */}

          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(
              (item) => {
                const product =
                  item.product;

                const isUpdating =
                  updatingProduct ===
                  product._id;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl border p-5"
                  >
                    <div className="flex flex-col sm:flex-row gap-5">

                      {/* IMAGE */}

                      {product.imageUrl ? (
                        <img
                          src={
                            product.imageUrl
                          }
                          alt={
                            product.name
                          }
                          className="w-28 h-28 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-xl bg-green-50 flex items-center justify-center">
                          <ShoppingCart className="text-green-700" />
                        </div>
                      )}

                      {/* DETAILS */}

                      <div className="flex-1">
                        <h3 className="text-xl font-bold">
                          {product.name}
                        </h3>

                        <p className="text-green-700 font-semibold mt-1">
                          ₹
                          {Number(
                            product.pricePerKg ||
                              0
                          ).toFixed(0)}
                          /kg
                        </p>

                        {product.farmingType && (
                          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {product.farmingType}
                          </span>
                        )}

                        {/* QUANTITY */}

                        <div className="flex items-center gap-2 mt-4">

                          <button
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              updateQty(
                                product._id,
                                Math.max(
                                  0,
                                  Number(
                                    item.quantity
                                  ) - 1
                                )
                              )
                            }
                            className="w-9 h-9 border rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="font-bold w-16 text-center">
                            {
                              item.quantity
                            }{' '}
                            kg
                          </span>

                          <button
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              updateQty(
                                product._id,
                                Number(
                                  item.quantity
                                ) + 1
                              )
                            }
                            className="w-9 h-9 border rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <button
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              removeItem(
                                product._id
                              )
                            }
                            className="ml-auto text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>

                        </div>
                      </div>

                      {/* PRICE */}

                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ₹
                          {(
                            Number(
                              product.pricePerKg ||
                                0
                            ) *
                            Number(
                              item.quantity ||
                                0
                            )
                          ).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <div className="bg-white rounded-2xl border p-6 h-fit">

            <h2 className="text-xl font-bold mb-5">
              Order Summary
            </h2>

            <div className="flex justify-between mb-3 text-gray-600">
              <span>
                Products
              </span>

              <span>
                {cartCount} kg
              </span>
            </div>

            <div className="flex justify-between mb-4 text-gray-600">
              <span>
                Number of Items
              </span>

              <span>
                {cartItems.length}
              </span>
            </div>

            <div className="border-t pt-4 flex justify-between text-xl font-bold">
              <span>
                Total
              </span>

              <span className="text-green-700">
                ₹{total.toFixed(0)}
              </span>
            </div>

            {/* =================================================
                DELIVERY ADDRESS
            ================================================= */}

            <div className="mt-7">

              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-green-700" />

                <h3 className="font-bold">
                  Delivery Address
                </h3>
              </div>

              <div className="space-y-3">

                {/* STREET */}

                <input
                  type="text"
                  value={
                    address.street
                  }
                  onChange={(e) =>
                    handleAddressChange(
                      'street',
                      e.target.value
                    )
                  }
                  placeholder="Street / House No."
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                />

                {/* CITY */}

                <input
                  type="text"
                  value={
                    address.city
                  }
                  onChange={(e) =>
                    handleAddressChange(
                      'city',
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                />

                {/* STATE */}

                <input
                  type="text"
                  value={
                    address.state
                  }
                  onChange={(e) =>
                    handleAddressChange(
                      'state',
                      e.target.value
                    )
                  }
                  placeholder="State"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                />

                {/* PINCODE */}

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={
                    address.pincode
                  }
                  onChange={(e) =>
                    handleAddressChange(
                      'pincode',
                      e.target.value.replace(
                        /\D/g,
                        ''
                      )
                    )
                  }
                  placeholder="6-digit Pincode"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                />

                {/* PHONE */}

                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={
                      address.phone
                    }
                    onChange={(e) =>
                      handleAddressChange(
                        'phone',
                        e.target.value.replace(
                          /\D/g,
                          ''
                        )
                      )
                    }
                    placeholder="10-digit Phone Number"
                    className="w-full border rounded-lg pl-10 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                  />
                </div>

              </div>
            </div>

            {/* PLACE ORDER */}

            <button
              onClick={checkout}
              disabled={
                checkoutLoading
              }
              className="w-full mt-6 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white py-3 rounded-xl font-bold transition"
            >
              {checkoutLoading
                ? 'Placing Order...'
                : 'Place Order'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Your order will be sent directly
              to the farmer.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;