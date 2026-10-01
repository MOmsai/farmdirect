import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  User,
  Leaf,
  Package,
  Minus,
  Plus,
  CheckCircle2,
  Heart,
  Star,
} from 'lucide-react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

const API_URL =
  'http://localhost:5000/api';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token =
    localStorage.getItem('token');

  const [product, setProduct] =
    useState(null);

  const [cartQuantity, setCartQuantity] =
    useState(0);

  const [quantity, setQuantity] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [cartLoading, setCartLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

const [isWishlisted, setIsWishlisted] =
  useState(false);

const [wishlistLoading, setWishlistLoading] =
  useState(false);

  // =====================================================
  // PHASE 4: REVIEWS & RATINGS
  // =====================================================
  const [reviewData, setReviewData] = useState({
    averageRating: 0,
    reviewCount: 0,
    reviews: [],
  });
  const [myReview, setMyReview] = useState(null);
  const [reviewEligible, setReviewEligible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  
  // =====================================================
  // LOAD PRODUCT
  // =====================================================

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const res =
          await axios.get(
            `${API_URL}/products/${id}`
          );

        setProduct(res.data);
      } catch (err) {
        console.error(
          'Product details error:',
          err
        );

        setError(
          err.response?.data?.msg ||
          'Unable to load product.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);
useEffect(() => {
  if (product?._id) {
    checkWishlist();
  }
}, [product?._id]);

useEffect(() => {
  if (product?._id) {
    loadReviews();
  }
}, [product?._id]);

useEffect(() => {
  if (!loading && window.location.hash === '#product-reviews') {
    window.setTimeout(() => {
      document.getElementById('product-reviews')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 150);
  }
}, [loading]);

  // =====================================================
  // LOAD DATABASE CART
  // =====================================================

  useEffect(() => {
    const loadCart = async () => {
      if (!token) return;

      try {
        const res =
          await axios.get(
            `${API_URL}/cart`,
            {
              headers: {
                'x-auth-token': token,
              },
            }
          );

        const item =
          res.data.items?.find(
            item =>
              item.product?._id === id
          );

        setCartQuantity(
          item
            ? Number(item.quantity)
            : 0
        );
      } catch (err) {
        console.error(
          'Load cart error:',
          err
        );
      }
    };

    loadCart();
  }, [id, token]);

const toggleWishlist = async () => {
  const token =
    localStorage.getItem('token');

  if (!token) {
    navigate('/login');
    return;
  }

  try {
    setWishlistLoading(true);

    if (isWishlisted) {
      await axios.delete(
        `${API_URL}/wishlist/${product._id}`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setIsWishlisted(false);
    } else {
      await axios.post(
        `${API_URL}/wishlist/${product._id}`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setIsWishlisted(true);
    }
  } catch (err) {
    console.error(
      'Wishlist error:',
      err
    );

    alert(
      err.response?.data?.msg ||
        'Unable to update wishlist.'
    );
  } finally {
    setWishlistLoading(false);
  }
};

  // =====================================================
  // ADD TO DATABASE CART
  // =====================================================

  const addToCart = async () => {
    if (!product) return;

    if (!token) {
      navigate(
        `/login?redirect=/product/${id}`
      );
      return;
    }

    if (
      quantity >
      Number(product.quantity)
    ) {
      setError(
        `Only ${product.quantity} kg is available.`
      );
      return;
    }

    try {
      setCartLoading(true);
      setError('');
      setSuccess('');

      const res =
        await axios.post(
          `${API_URL}/cart/add`,
          {
            productId:
              product._id,
            quantity,
          },
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

      const item =
        res.data.items?.find(
          item =>
            item.product?._id ===
            product._id
        );

      const newQuantity =
        item
          ? Number(item.quantity)
          : cartQuantity + quantity;

      setCartQuantity(newQuantity);

      setSuccess(
        `${quantity} kg added to your cart.`
      );

      // Navbar will refresh
      window.dispatchEvent(
        new Event('cartUpdated')
      );

      setTimeout(() => {
        setSuccess('');
      }, 2500);

    } catch (err) {
      console.error(
        'Add to cart error:',
        err
      );

      setError(
        err.response?.data?.msg ||
        'Unable to add product to cart.'
      );
    } finally {
      setCartLoading(false);
    }
  };

  // =====================================================
  // UPDATE CART DIRECTLY
  // =====================================================

  const updateCartQuantity =
    async (newQuantity) => {
      if (!token) return;

      if (
        newQuantity < 0 ||
        newQuantity >
          Number(product.quantity)
      ) {
        return;
      }

      try {
        setCartLoading(true);

        await axios.patch(
          `${API_URL}/cart/${product._id}`,
          {
            quantity: newQuantity,
          },
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

        setCartQuantity(
          newQuantity
        );

        window.dispatchEvent(
          new Event('cartUpdated')
        );

      } catch (err) {
        console.error(
          'Update cart error:',
          err
        );

        setError(
          err.response?.data?.msg ||
          'Unable to update cart.'
        );
      } finally {
        setCartLoading(false);
      }
    };

    const checkWishlist = async () => {
  const token =
    localStorage.getItem('token');

  if (!token || !product?._id) {
    return;
  }

  try {
    const response =
      await axios.get(
        `${API_URL}/wishlist/check/${product._id}`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

    setIsWishlisted(
      response.data.isWishlisted
    );
  } catch (err) {
    console.error(
      'Wishlist check error:',
      err
    );
  }
};

  // =====================================================
  // PHASE 4: LOAD REVIEWS
  // =====================================================
  const loadReviews = async () => {
    if (!product?._id) return;

    try {
      setReviewLoading(true);

      const publicResponse = await axios.get(
        `${API_URL}/reviews/product/${product._id}`
      );

      setReviewData({
        averageRating: Number(publicResponse.data.averageRating || 0),
        reviewCount: Number(publicResponse.data.reviewCount || 0),
        reviews: publicResponse.data.reviews || [],
      });

      const currentToken = localStorage.getItem('token');

      if (currentToken) {
        try {
          const mineResponse = await axios.get(
            `${API_URL}/reviews/product/${product._id}/my-review`,
            {
              headers: {
                'x-auth-token': currentToken,
              },
            }
          );

          setMyReview(mineResponse.data.review || null);
          setReviewEligible(Boolean(mineResponse.data.eligible));

          if (mineResponse.data.review) {
            setReviewForm({
              rating: Number(mineResponse.data.review.rating || 5),
              title: mineResponse.data.review.title || '',
              comment: mineResponse.data.review.comment || '',
            });
          }
        } catch (mineError) {
          console.error('My review load error:', mineError);
        }
      } else {
        setMyReview(null);
        setReviewEligible(false);
      }
    } catch (err) {
      console.error('Reviews load error:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();

    const currentToken = localStorage.getItem('token');

    if (!currentToken) {
      navigate('/login');
      return;
    }

    if (!reviewEligible) {
      alert('You can review this product after it has been delivered to you.');
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert('Please write a short review.');
      return;
    }

    try {
      setReviewSubmitting(true);

      const payload = {
        rating: Number(reviewForm.rating),
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      };

      const response = myReview
        ? await axios.put(
            `${API_URL}/reviews/${myReview._id}`,
            payload,
            {
              headers: {
                'x-auth-token': currentToken,
              },
            }
          )
        : await axios.post(
            `${API_URL}/reviews/product/${product._id}`,
            payload,
            {
              headers: {
                'x-auth-token': currentToken,
              },
            }
          );

      setMyReview(response.data.review);
      setReviewData((prev) => ({
        ...prev,
        averageRating: Number(response.data.averageRating || 0),
        reviewCount: Number(response.data.reviewCount || 0),
      }));

      setProduct((prev) => ({
        ...prev,
        averageRating: Number(response.data.averageRating || 0),
        reviewCount: Number(response.data.reviewCount || 0),
      }));

      alert(myReview ? 'Your review was updated.' : 'Thank you for reviewing this product!');
      await loadReviews();
    } catch (err) {
      console.error('Review submit error:', err);
      alert(
        err.response?.data?.msg ||
          'Unable to submit your review.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const deleteReview = async () => {
    if (!myReview) return;

    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    if (!window.confirm('Delete your review for this product?')) {
      return;
    }

    try {
      setReviewSubmitting(true);

      const response = await axios.delete(
        `${API_URL}/reviews/${myReview._id}`,
        {
          headers: {
            'x-auth-token': currentToken,
          },
        }
      );

      setMyReview(null);
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
      });

      setReviewData((prev) => ({
        ...prev,
        averageRating: Number(response.data.averageRating || 0),
        reviewCount: Number(response.data.reviewCount || 0),
        reviews: prev.reviews.filter(
          (review) => String(review._id) !== String(myReview._id)
        ),
      }));

      setProduct((prev) => ({
        ...prev,
        averageRating: Number(response.data.averageRating || 0),
        reviewCount: Number(response.data.reviewCount || 0),
      }));
    } catch (err) {
      console.error('Delete review error:', err);
      alert(
        err.response?.data?.msg ||
          'Unable to delete your review.'
      );
    } finally {
      setReviewSubmitting(false);
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
            Loading product...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // PRODUCT NOT FOUND
  // =====================================================

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f4f9f1] p-6">

        <div className="max-w-4xl mx-auto">

          <button
            onClick={() =>
              navigate(
                '/customer-dashboard'
              )
            }
            className="flex items-center gap-2 text-green-700 font-semibold mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>

          <div className="bg-white rounded-2xl border p-10 text-center">

            <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />

            <h2 className="text-2xl font-bold mb-2">
              Product not found
            </h2>

            <p className="text-gray-500">
              {error}
            </p>

          </div>

        </div>

      </div>
    );
  }

  const outOfStock =
    Number(product.quantity) <= 0;

  const totalPrice =
    Number(product.pricePerKg || 0) *
    Number(quantity || 0);

  const farmer =
    product.farmer;

  return (
    <div className="min-h-screen bg-[#f4f9f1] px-4 sm:px-6 py-8">

      <div className="max-w-6xl mx-auto">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          onClick={() =>
            navigate(
              '/customer-dashboard'
            )
          }
          className="flex items-center gap-2 text-gray-600 hover:text-green-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        {/* =================================================
            PRODUCT
        ================================================= */}

        <div className="bg-white rounded-3xl border border-[#d9e8d3] shadow-sm overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* IMAGE */}

            <div className="bg-[#edf5e9] min-h-[450px] flex items-center justify-center p-8">

              {product.imageUrl ? (

                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-[430px] object-contain rounded-2xl"
                />

              ) : (

                <div className="text-center text-green-700">

                  <Leaf className="w-20 h-20 mx-auto mb-3 opacity-30" />

                  <p>
                    Farm Fresh
                  </p>

                </div>

              )}

            </div>

            {/* DETAILS */}

            <div className="p-7 sm:p-10">

              {/* BADGES */}

              <div className="flex flex-wrap gap-2 mb-5">

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-bold">

                  <Leaf className="w-4 h-4" />

                  {product.farmingType ||
                    'Farm Fresh'}

                </span>

                {product.category && (
                  <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                    {product.category}
                  </span>
                )}

              </div>

              {/* NAME */}

              <h1 className="text-4xl font-serif font-bold text-[#16241a] mb-4">
                {product.name}
              </h1>

              {/* PRICE */}

              <div className="mb-5">

                <span className="text-3xl font-bold text-green-700">
                  ₹
                  {Number(
                    product.pricePerKg
                  ).toFixed(0)}
                </span>

                <span className="text-gray-500 ml-2">
                  / kg
                </span>

              </div>

              {/* RATING SUMMARY */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(Number(reviewData.averageRating || 0))
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-800">
                  {Number(reviewData.averageRating || 0).toFixed(1)}
                </span>
                <button
                  type="button"
                  onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-gray-500 hover:text-green-700 underline"
                >
                  {reviewData.reviewCount} {reviewData.reviewCount === 1 ? 'review' : 'reviews'}
                </button>
              </div>

              {/* STOCK */}

              <div className="flex items-center gap-2 mb-6 text-gray-600">

                <Package className="w-5 h-5 text-green-700" />

                Available:

                <strong className="text-gray-900">
                  {product.quantity} kg
                </strong>

              </div>

              {/* DESCRIPTION */}

              {product.description && (
                <div className="mb-7">

                  <h3 className="font-bold text-lg mb-2">
                    About this product
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>

                </div>
              )}

              {/* =================================================
                  QUANTITY TO ADD
              ================================================= */}

              {!outOfStock && (
                <div className="mb-5">

                  <p className="font-semibold mb-2">
                    Quantity
                  </p>

                  <div className="flex items-center gap-3">

                    <button
                      onClick={() =>
                        setQuantity(
                          Math.max(
                            1,
                            quantity - 1
                          )
                        )
                      }
                      className="w-11 h-11 border rounded-xl flex items-center justify-center hover:bg-green-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="w-24 h-11 border rounded-xl flex items-center justify-center font-bold">
                      {quantity} kg
                    </div>

                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            Number(
                              product.quantity
                            ),
                            quantity + 1
                          )
                        )
                      }
                      className="w-11 h-11 border rounded-xl flex items-center justify-center hover:bg-green-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              )}

              {/* TOTAL */}

              {!outOfStock && (
                <div className="flex justify-between items-center bg-[#f4f9f1] rounded-xl p-4 mb-5">

                  <span className="text-gray-600">
                    Total
                  </span>

                  <strong className="text-xl text-gray-900">
                    ₹
                    {totalPrice.toFixed(0)}
                  </strong>

                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-center gap-2 text-sm">

                  <CheckCircle2 className="w-5 h-5" />

                  {success}

                </div>
              )}

              {/* ADD TO CART + WISHLIST */}

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={outOfStock || cartLoading}
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                    outOfStock
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-green-700 text-white hover:bg-green-800'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartLoading
                    ? 'Updating...'
                    : outOfStock
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                </button>

                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className={`sm:min-w-[190px] flex items-center justify-center gap-2 px-5 py-4 rounded-xl border font-semibold transition ${
                    isWishlisted
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-600'
                  }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                  />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

              </div>

              {/* CURRENT CART QUANTITY */}

              {cartQuantity > 0 && (
                <div className="mt-4 border border-green-200 bg-green-50 rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <div>

                      <p className="text-sm text-gray-500">
                        In your cart
                      </p>

                      <p className="font-bold text-green-700">
                        {cartQuantity} kg
                      </p>

                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        disabled={cartLoading}
                        onClick={() =>
                          updateCartQuantity(
                            cartQuantity - 1
                          )
                        }
                        className="w-9 h-9 rounded-lg border border-green-300 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <button
                        disabled={cartLoading}
                        onClick={() =>
                          updateCartQuantity(
                            cartQuantity + 1
                          )
                        }
                        className="w-9 h-9 rounded-lg border border-green-300 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                    </div>

                  </div>

                </div>
              )}

              {/* VIEW CART */}

              {cartQuantity > 0 && (
                <button
                  onClick={() =>
                    navigate('/cart')
                  }
                  className="w-full mt-3 py-3 border border-green-700 text-green-700 rounded-xl font-bold hover:bg-green-50"
                >
                  View Cart
                </button>
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            PRODUCT REVIEWS & RATINGS
        ================================================= */}

        <section
          id="product-reviews"
          className="bg-white rounded-3xl border border-[#d9e8d3] shadow-sm mt-6 p-7 sm:p-9"
        >

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div>
              <p className="text-green-700 text-sm font-semibold uppercase tracking-wide">
                Customer Feedback
              </p>
              <h2 className="text-2xl font-serif font-bold mt-1">
                Product Reviews & Ratings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Reviews can be submitted only after a delivered purchase.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f4f9f1] px-5 py-4 text-center min-w-[150px]">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-bold text-gray-900">
                  {Number(reviewData.averageRating || 0).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviewData.reviewCount} {reviewData.reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>

          {reviewEligible && (
            <form
              onSubmit={submitReview}
              className="mb-8 rounded-2xl border border-green-100 bg-green-50/50 p-5"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {myReview ? 'Edit your review' : 'Write a review'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Your review is linked to your delivered purchase.
                  </p>
                </div>

                {myReview && (
                  <button
                    type="button"
                    onClick={deleteReview}
                    disabled={reviewSubmitting}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((prev) => ({
                          ...prev,
                          rating: star,
                        }))
                      }
                      className="p-1"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-8 h-8 transition ${
                          star <= reviewForm.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                maxLength={100}
                placeholder="Review title (optional)"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-500 mb-3"
              />

              <textarea
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                maxLength={1000}
                rows={4}
                placeholder="How was the quality, freshness and overall product?"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-500 resize-none"
              />

              <div className="flex justify-between items-center mt-2 mb-4">
                <span className="text-xs text-gray-400">
                  {reviewForm.comment.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="rounded-xl bg-green-700 text-white px-5 py-3 font-bold hover:bg-green-800 disabled:opacity-50"
              >
                {reviewSubmitting
                  ? 'Saving...'
                  : myReview
                    ? 'Update Review'
                    : 'Submit Review'}
              </button>
            </form>
          )}

          {!reviewEligible && !myReview && localStorage.getItem('token') && (
            <div className="mb-7 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Purchase and receive this product to unlock the review form.
            </div>
          )}

          {reviewLoading ? (
            <div className="py-8 text-center text-gray-500">
              Loading reviews...
            </div>
          ) : reviewData.reviews.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-gray-200 rounded-2xl">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">
                No reviews yet
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Be the first customer to review this product.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewData.reviews.map((review) => (
                <article
                  key={review._id}
                  className="border border-gray-200 rounded-2xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Number(review.rating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="font-bold text-gray-900">
                        {review.title || 'Customer review'}
                      </p>
                    </div>

                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed mt-3">
                      {review.comment}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    — {review.customer?.name || review.customerName || 'Customer'}
                  </p>
                </article>
              ))}
            </div>
          )}

        </section>

        {/* =================================================
            FARMER INFORMATION
        ================================================= */}

        <div className="bg-white rounded-3xl border border-[#d9e8d3] shadow-sm mt-6 p-7 sm:p-9">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">

              <User className="w-6 h-6" />

            </div>

            <div>

              <h2 className="text-2xl font-serif font-bold">
                About the Farmer
              </h2>

              <p className="text-sm text-gray-500">
                Know where your food comes from
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* FARMER */}

            <div className="border rounded-2xl p-5">

              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Farmer
              </p>

              <h3 className="text-xl font-bold">
                {farmer?.name ||
                  'FarmDirect Farmer'}
              </h3>

              {farmer?.farmName && (
                <p className="text-green-700 font-semibold mt-1">
                  {farmer.farmName}
                </p>
              )}

            </div>

            {/* LOCATION */}

            <div className="border rounded-2xl p-5">

              <div className="flex gap-3">

                <MapPin className="w-5 h-5 text-green-700 mt-1" />

                <div>

                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    Farm Location
                  </p>

                  {farmer?.farmLocation ? (
                    <p className="text-gray-700">

                      {farmer.farmLocation.village &&
                        `${farmer.farmLocation.village}, `}

                      {farmer.farmLocation.city &&
                        `${farmer.farmLocation.city}, `}

                      {farmer.farmLocation.state &&
                        `${farmer.farmLocation.state}`}

                      {farmer.farmLocation.pincode &&
                        ` - ${farmer.farmLocation.pincode}`}

                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Location not available
                    </p>
                  )}

                </div>

              </div>

            </div>

          </div>

          <div className="mt-6 bg-[#f4f9f1] rounded-2xl p-5">

            <div className="flex gap-3">

              <Leaf className="w-5 h-5 text-green-700 mt-0.5" />

              <p className="text-sm text-gray-600 leading-relaxed">
                FarmDirect connects customers directly
                with farmers, helping customers know
                where their products come from while
                giving farmers a direct marketplace.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ProductDetails;