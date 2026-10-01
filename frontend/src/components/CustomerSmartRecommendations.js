import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  Sparkles,
  ShoppingCart,
  Star,
  MapPin,
  Leaf,
  RefreshCw,
  ArrowRight,
  Wallet,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

const API_URL =
  'http://localhost:5000/api';

/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerSmartRecommendations() {
  const navigate = useNavigate();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [addingId, setAddingId] =
    useState(null);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD RECOMMENDATIONS
  ======================================================= */

  const loadRecommendations =
    async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await axios.get(
            `${API_URL}/ai/smart-recommendations`,
            {
              headers: {
                'x-auth-token':
                  token,
              },
            }
          );

        setData(
          response.data
        );
      } catch (err) {
        console.error(
          'Smart recommendations error:',
          err
        );

        if (
          err.response?.status ===
          401
        ) {
          localStorage.removeItem(
            'token'
          );

          navigate('/login');
          return;
        }

        setError(
          err.response?.data
            ?.msg ||
            'Unable to load AI recommendations.'
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadRecommendations();
  }, []);

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart =
    async (product) => {
      const token =
        localStorage.getItem(
          'token'
        );

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setAddingId(
          product._id
        );

const productId =
  product._id || product.id;

if (!productId) {
  console.error(
    'Missing product ID:',
    product
  );

  alert(
    'Unable to add this product. Product ID is missing.'
  );

  return;
}

await axios.post(
  `${API_URL}/cart/add`,
  {
    productId,
    quantity: 1,
  },
  {
    headers: {
      'x-auth-token': token,
    },
  }
);

        /*
          Notify Navbar so the
          cart badge updates.
        */
        window.dispatchEvent(
          new Event(
            'cartUpdated'
          )
        );

        alert(
          `${product.name} added to cart.`
        );
      } catch (err) {
        console.error(
          'Add to cart error:',
          err
        );

        alert(
          err.response?.data
            ?.msg ||
            `Unable to add ${product.name} to cart.`
        );
      } finally {
        setAddingId(null);
      }
    };

  /* =======================================================
     IMAGE FALLBACK
  ======================================================= */

  const handleImageError =
    (event) => {
      const image =
        event.currentTarget;

      /*
        Hide broken image.
      */
      image.style.display =
        'none';

      /*
        Show fallback element.
      */
      const fallback =
        image.parentElement
          ?.querySelector(
            '.product-image-fallback'
          );

      if (fallback) {
        fallback.classList.remove(
          'hidden'
        );

        fallback.classList.add(
          'flex'
        );
      }
    };

  /* =======================================================
     BUDGET
  ======================================================= */

  const context =
    data?.context || {};

  const budget =
    Number(
      context.monthlyBudget || 0
    );

  const spent =
    Number(
      context.currentMonthSpending ||
        0
    );

  const remaining =
    Number(
      context.remainingBudget ||
        0
    );

  const percent =
    budget > 0
      ? Math.min(
          100,
          (spent / budget) *
            100
        )
      : 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f4f9f1] px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#14532d] via-green-700 to-emerald-600 p-6 text-white shadow-lg sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2 text-green-100">

                <Sparkles className="h-5 w-5" />

                <span className="text-sm font-semibold uppercase tracking-wider">
                  FarmDirect AI
                </span>

              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Smart Recommendations
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50 sm:text-base">
                Personalized suggestions based on your purchases, wishlist, cart, budget and live FarmDirect inventory.
              </p>

            </div>

            <button
              onClick={
                loadRecommendations
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-green-800 shadow-sm hover:bg-green-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh AI
            </button>

          </div>

        </section>

        {/* =================================================
            BUDGET CARDS
        ================================================= */}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Monthly Budget */}

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">

            <div className="mb-2 flex items-center gap-2 text-gray-500">

              <Wallet className="h-5 w-5" />

              <span className="text-sm font-semibold">
                Monthly Budget
              </span>

            </div>

            <p className="text-2xl font-bold">
              ₹
              {budget.toFixed(0)}
            </p>

          </div>

          {/* Current Month */}

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">

            <p className="mb-2 text-sm font-semibold text-gray-500">
              This Month
            </p>

            <p className="text-2xl font-bold">
              ₹
              {spent.toFixed(0)}
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{
                  width: `${percent}%`,
                }}
              />

            </div>

          </div>

          {/* Remaining */}

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">

            <p className="mb-2 text-sm font-semibold text-gray-500">
              Budget Remaining
            </p>

            <p className="text-2xl font-bold text-green-700">
              ₹
              {remaining.toFixed(0)}
            </p>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <section className="rounded-3xl border border-green-100 bg-white p-12 text-center shadow-sm">

            <Sparkles className="mx-auto mb-4 h-10 w-10 animate-pulse text-green-600" />

            <h2 className="text-xl font-bold">
              AI is analyzing your shopping pattern...
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Checking purchases, cart, wishlist, budget and live inventory.
            </p>

          </section>
        ) : (
          <>
            {/* =============================================
                AI MESSAGE
            ============================================= */}

            {data?.message && (
              <section className="mb-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">

                <div className="flex gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">

                    <Sparkles className="h-5 w-5 text-green-700" />

                  </div>

                  <div>

                    <h2 className="font-bold">
                      AI's picks for you
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {data.message}
                    </p>

                  </div>

                </div>

                {data.budgetNote && (
                  <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">

                    <strong>
                      Budget note:
                    </strong>{' '}

                    {data.budgetNote}

                  </div>
                )}

              </section>
            )}

            {/* =============================================
                RECOMMENDATIONS
            ============================================= */}

            {data?.recommendations
              ?.length > 0 ? (

              <section>

                {/* Section heading */}

                <div className="mb-4 flex items-center justify-between">

                  <div>

                    <h2 className="text-2xl font-bold">
                      Recommended for You
                    </h2>

                    <p className="text-sm text-gray-500">
                      Live products currently available
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        '/customer-dashboard'
                      )
                    }
                    className="hidden items-center gap-1 text-sm font-semibold text-green-700 sm:flex"
                  >
                    Browse all

                    <ArrowRight className="h-4 w-4" />

                  </button>

                </div>

                {/* Product grid */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                  {data.recommendations.map(
                    (product) => (

                      <article
                        key={
                          product._id || product.id
                        }
                        className="flex flex-col overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >

                        {/* =================================
                            PRODUCT IMAGE
                        ================================= */}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                               `/product/${product._id || product.id}`
                            )
                          }
                          className="relative h-48 overflow-hidden bg-gray-100"
                        >

                          {/* Actual product image */}

                          {product.imageUrl ? (
                            <img
                              src={
                                product.imageUrl
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                              loading="lazy"
                              onError={
                                handleImageError
                              }
                            />
                          ) : null}

                          {/* Fallback */}

                          <div
                            className={`product-image-fallback absolute inset-0 items-center justify-center bg-[#edf5e9] ${
                              product.imageUrl
                                ? 'hidden'
                                : 'flex'
                            }`}
                          >

                            <Leaf className="h-12 w-12 text-green-700 opacity-40" />

                          </div>

                          {/* AI Badge */}

                          <span className="absolute left-3 top-3 rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            AI Pick
                          </span>

                        </button>

                        {/* =================================
                            PRODUCT CONTENT
                        ================================= */}

                        <div className="flex flex-1 flex-col p-4">

                          {/* Name + farming type */}

                          <div className="mb-2 flex items-start justify-between gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                   `/product/${product._id || product.id}`
                                )
                              }
                              className="text-left"
                            >

                              <h3 className="font-bold hover:text-green-700">
                                {product.name}
                              </h3>

                              <p className="text-xs text-gray-500">
                                {product.category}
                              </p>

                            </button>

                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${
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

                          </div>

                          {/* Rating */}

                          <div className="mb-2 flex items-center gap-1">

                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <Star
                                  key={
                                    star
                                  }
                                  className={`h-3.5 w-3.5 ${
                                    star <=
                                    Math.round(
                                      Number(
                                        product.averageRating ||
                                          0
                                      )
                                    )
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              )
                            )}

                            <span className="ml-1 text-xs text-gray-500">
                              {Number(
                                product.averageRating ||
                                  0
                              ).toFixed(1)}{' '}
                              (
                              {Number(
                                product.reviewCount ||
                                  0
                              )}
                              )
                            </span>

                          </div>

                          {/* Price */}

                          <div className="mb-3">

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

                          {/* Farmer */}

                          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">

                            <MapPin className="h-4 w-4 flex-shrink-0 text-green-700" />

                            <span className="truncate">

                              {product.farmerName ||
                                'Local Farmer'}

                              {product.city
                                ? ` • ${product.city}`
                                : ''}

                            </span>

                          </div>

                          {/* AI reason */}

                          <div className="mb-4 rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-800">

                            <strong>
                              Why:
                            </strong>{' '}

                            {product.reason}

                          </div>

                          {/* Stock + Cart */}

                          <div className="mt-auto">

                            <p className="mb-2 text-xs text-gray-500">
                              {
                                product.stockKg
                              }{' '}
                              kg available
                            </p>

                            <button
                              onClick={() =>
                                addToCart(
                                  product
                                )
                              }
                              disabled={
                                addingId ===
                                product._id
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >

                              <ShoppingCart className="h-4 w-4" />

                              {addingId ===
                              product._id
                                ? 'Adding...'
                                : 'Add 1 kg to Cart'}

                            </button>

                          </div>

                        </div>

                      </article>

                    )
                  )}

                </div>

              </section>

            ) : (

              /* =============================================
                 NO RECOMMENDATIONS
              ============================================= */

              <section className="rounded-3xl border border-green-100 bg-white p-10 text-center shadow-sm">

                <Leaf className="mx-auto mb-4 h-10 w-10 text-green-600" />

                <h2 className="text-xl font-bold">
                  No recommendations right now
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Try browsing the marketplace or adding products to your wishlist.
                </p>

              </section>

            )}

          </>
        )}

      </main>
    </div>
  );
}