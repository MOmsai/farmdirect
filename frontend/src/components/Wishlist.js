import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  Heart,
  ShoppingCart,
  Trash2,
  Leaf,
  MapPin,
  ArrowLeft,
  Package,
  CheckCircle2,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const API_URL =
  'http://localhost:5000/api';

function Wishlist() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem('token');

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [movingProduct, setMovingProduct] =
    useState(null);

  // =====================================================
  // LOAD WISHLIST
  // =====================================================

  const loadWishlist = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response =
        await axios.get(
          `${API_URL}/wishlist`,
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

      setProducts(
        response.data.products || []
      );
    } catch (err) {
      console.error(
        'Wishlist loading error:',
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
          'Unable to load wishlist.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  // =====================================================
  // REMOVE
  // =====================================================

  const removeFromWishlist = async (
    productId
  ) => {
    try {
      await axios.delete(
        `${API_URL}/wishlist/${productId}`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setProducts((prev) =>
        prev.filter(
          (product) =>
            product._id !== productId
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.msg ||
          'Unable to remove product.'
      );
    }
  };

  // =====================================================
  // MOVE TO CART
  // =====================================================

  const moveToCart = async (
    product
  ) => {
    try {
      setMovingProduct(product._id);

      await axios.post(
        `${API_URL}/wishlist/${product._id}/move-to-cart`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      window.dispatchEvent(
        new Event('cartUpdated')
      );

      await removeFromWishlist(
        product._id
      );

      alert(
        `${product.name} has been added to your cart.`
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.msg ||
          'Unable to move product to cart.'
      );
    } finally {
      setMovingProduct(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f9f1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">
            Loading your wishlist...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f4f9f1] py-8">

      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                navigate(
                  '/customer-dashboard'
                )
              }
              className="p-2.5 rounded-xl bg-white border hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <p className="text-green-700 text-sm font-semibold">
                FarmDirect
              </p>

              <h1 className="text-3xl font-bold text-gray-900">
                My Wishlist
              </h1>

              <p className="text-gray-500 mt-1">
                {products.length}{' '}
                {products.length === 1
                  ? 'product'
                  : 'products'}{' '}
                saved for later.
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              navigate(
                '/customer-dashboard'
              )
            }
            className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700"
          >
            Continue Shopping
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">

            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-10 h-10 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Save products you love and
              come back to them whenever
              you're ready to buy.
            </p>

            <button
              onClick={() =>
                navigate(
                  '/customer-dashboard'
                )
              }
              className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
            >
              Explore Products
            </button>

          </div>
        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {products.map((product) => {

              const outOfStock =
                Number(product.quantity) <=
                0;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition"
                >

                  {/* IMAGE */}

                  <div
                    className="relative h-56 bg-[#edf5e9] cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/product/${product._id}`
                      )
                    }
                  >

                    {product.imageUrl ? (
                      <img
                        src={
                          product.imageUrl
                        }
                        alt={
                          product.name
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-14 h-14 text-green-600 opacity-30" />
                      </div>
                    )}

                    <span className="absolute top-3 left-3 bg-white text-gray-700 px-3 py-1 rounded-full text-xs font-bold shadow">
                      {product.category ||
                        'Other'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        removeFromWishlist(
                          product._id
                        );
                      }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>

                  </div>

                  {/* CONTENT */}

                  <div className="p-5">

                    <div className="flex items-center gap-2 mb-2">

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          product.farmingType ===
                          'Organic'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.farmingType ||
                          'Farm Fresh'}
                      </span>

                    </div>

                    <h2
                      className="font-bold text-xl text-gray-900 cursor-pointer hover:text-green-700"
                      onClick={() =>
                        navigate(
                          `/product/${product._id}`
                        )
                      }
                    >
                      {product.name}
                    </h2>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                      {product.description ||
                        'Fresh farm produce'}
                    </p>

                    <div className="flex items-end justify-between mt-4">

                      <div>
                        <span className="text-2xl font-bold text-green-700">
                          ₹
                          {Number(
                            product.pricePerKg ||
                              0
                          ).toFixed(0)}
                        </span>

                        <span className="text-sm text-gray-500">
                          {' '}
                          / kg
                        </span>
                      </div>

                      <span className="text-xs text-gray-500">
                        {product.quantity}{' '}
                        kg
                      </span>

                    </div>

                    {/* FARMER */}

                    <div className="mt-4 bg-[#f4f9f1] rounded-xl p-3">

                      <div className="flex gap-2">

                        <MapPin className="w-4 h-4 text-green-700 mt-0.5" />

                        <div>
                          <p className="text-sm font-semibold">
                            {product.farmer
                              ?.farmName ||
                              product.farmer
                                ?.name ||
                              'Local Farmer'}
                          </p>

                          {product.farmer
                            ?.farmLocation
                            ?.city && (
                            <p className="text-xs text-gray-500">
                              {
                                product
                                  .farmer
                                  .farmLocation
                                  .city
                              }
                              {product
                                .farmer
                                .farmLocation
                                .state
                                ? `, ${product.farmer.farmLocation.state}`
                                : ''}
                            </p>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* CART BUTTON */}

                    <button
                      onClick={() =>
                        moveToCart(
                          product
                        )
                      }
                      disabled={
                        outOfStock ||
                        movingProduct ===
                          product._id
                      }
                      className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                        outOfStock
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50`}
                    >

                      {outOfStock ? (
                        <>
                          <Package className="w-5 h-5" />
                          Out of Stock
                        </>
                      ) : movingProduct ===
                        product._id ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Move to Cart
                        </>
                      )}

                    </button>

                  </div>
                </div>
              );
            })}

          </div>

        )}

      </div>
    </div>
  );
}

export default Wishlist;