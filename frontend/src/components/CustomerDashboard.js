import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import {
  Search,
  ShoppingCart,
  Leaf,
  MapPin,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  X,
  ArrowUpDown,
  Heart,
  Star,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const API_URL = 'https://farmdirect-backend-gd6o.onrender.com/api';

const CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Grains',
  'Pulses',
  'Spices',
  'Dairy',
  'Oilseeds',
  'Other',
];

const FARMING_TYPES = [
  'All',
  'Organic',
  'Non-Organic',
];

function CustomerDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [wishlist, setWishlist] = useState({});
  const [wishlistLoading, setWishlistLoading] = useState({});

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [farmingType, setFarmingType] =
    useState('All');
  const [sort, setSort] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addedProduct, setAddedProduct] =
    useState(null);

  // =====================================================
  // LOAD PRODUCTS + CART
  // =====================================================

  const loadMarketplace = async () => {
    try {
      setLoading(true);
      setError('');

      const productsResponse = await axios.get(
        `${API_URL}/products`
      );

      setProducts(
        productsResponse.data || []
      );

      const token =
        localStorage.getItem('token');

      if (!token) {
        setCart({});
        return;
      }

      const cartResponse = await axios.get(
        `${API_URL}/cart`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      const cartMap = {};

      cartResponse.data.items?.forEach(
        (item) => {
          if (item.product?._id) {
            cartMap[item.product._id] =
              Number(item.quantity);
          }
        }
      );

      setCart(cartMap);

      const wishlistResponse = await axios.get(
        `${API_URL}/wishlist`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      const wishlistMap = {};
      wishlistResponse.data.products?.forEach((item) => {
        const productId =
          typeof item === 'string' ? item : item?._id;
        if (productId) wishlistMap[productId] = true;
      });

      setWishlist(wishlistMap);
    } catch (err) {
      console.error(
        'Marketplace error:',
        err
      );

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.msg ||
          'Unable to load marketplace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = async (product) => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const currentQuantity = Number(
        cart[product._id] || 0
      );

      if (
        currentQuantity >=
        Number(product.quantity)
      ) {
        alert(
          `Only ${product.quantity} kg of ${product.name} is available.`
        );
        return;
      }

      const response = await axios.post(
        `${API_URL}/cart/add`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      const updatedCart = {};

      response.data.items?.forEach(
        (item) => {
          if (item.product?._id) {
            updatedCart[
              item.product._id
            ] = Number(item.quantity);
          }
        }
      );

      setCart(updatedCart);
      setAddedProduct(product._id);

      window.dispatchEvent(
        new Event('cartUpdated')
      );

      setTimeout(() => {
        setAddedProduct(null);
      }, 1200);
    } catch (err) {
      console.error(
        'Add to cart error:',
        err
      );

      alert(
        err.response?.data?.msg ||
          'Unable to add product to cart.'
      );
    }
  };

  // =====================================================
  // CHANGE QUANTITY
  // =====================================================

  const changeQuantity = async (
    product,
    change
  ) => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const currentQuantity = Number(
      cart[product._id] || 0
    );

    const newQuantity =
      currentQuantity + change;

    if (newQuantity < 0) {
      return;
    }

    if (
      newQuantity >
      Number(product.quantity)
    ) {
      alert(
        `Only ${product.quantity} kg is available.`
      );
      return;
    }

    try {
      const response = await axios.patch(
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

      const updatedCart = {};

      response.data.items?.forEach(
        (item) => {
          if (item.product?._id) {
            updatedCart[
              item.product._id
            ] = Number(item.quantity);
          }
        }
      );

      setCart(updatedCart);

      window.dispatchEvent(
        new Event('cartUpdated')
      );
    } catch (err) {
      console.error(
        'Cart quantity error:',
        err
      );

      alert(
        err.response?.data?.msg ||
          'Unable to update cart.'
      );
    }
  };

  // =====================================================
  // WISHLIST
  // =====================================================

  const toggleWishlist = async (product) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setWishlistLoading((prev) => ({
        ...prev,
        [product._id]: true,
      }));

      if (wishlist[product._id]) {
        await axios.delete(
          `${API_URL}/wishlist/${product._id}`,
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

        setWishlist((prev) => {
          const updated = { ...prev };
          delete updated[product._id];
          return updated;
        });
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

        setWishlist((prev) => ({
          ...prev,
          [product._id]: true,
        }));
      }

      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      console.error('Wishlist error:', err);
      alert(
        err.response?.data?.msg ||
          'Unable to update wishlist.'
      );
    } finally {
      setWishlistLoading((prev) => ({
        ...prev,
        [product._id]: false,
      }));
    }
  };

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredProducts = useMemo(() => {
    const result =
      products.filter((product) => {
        const text =
          search.trim().toLowerCase();

        const farmerName =
          product.farmer?.name ||
          '';

        const farmName =
          product.farmer?.farmName ||
          '';

        const matchesSearch =
          !text ||
          product.name
            ?.toLowerCase()
            .includes(text) ||
          product.description
            ?.toLowerCase()
            .includes(text) ||
          farmerName
            .toLowerCase()
            .includes(text) ||
          farmName
            .toLowerCase()
            .includes(text);

        const matchesCategory =
          category === 'All' ||
          product.category === category;

        const matchesFarming =
          farmingType === 'All' ||
          product.farmingType ===
            farmingType;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesFarming
        );
      });

    return [...result].sort(
      (a, b) => {
        if (sort === 'price-low') {
          return (
            Number(a.pricePerKg || 0) -
            Number(b.pricePerKg || 0)
          );
        }

        if (sort === 'price-high') {
          return (
            Number(b.pricePerKg || 0) -
            Number(a.pricePerKg || 0)
          );
        }

        if (sort === 'stock') {
          return (
            Number(b.quantity || 0) -
            Number(a.quantity || 0)
          );
        }

        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      }
    );
  }, [
    products,
    search,
    category,
    farmingType,
    sort,
  ]);

  // =====================================================
  // CART SUMMARY
  // =====================================================

  const cartCount = Object.values(
    cart
  ).reduce(
    (sum, quantity) =>
      sum + Number(quantity || 0),
    0
  );

  const cartValue = Object.entries(
    cart
  ).reduce(
    (sum, [productId, quantity]) => {
      const product = products.find(
        (item) =>
          item._id === productId
      );

      if (!product) {
        return sum;
      }

      return (
        sum +
        Number(product.pricePerKg || 0) *
          Number(quantity || 0)
      );
    },
    0
  );

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setFarmingType('All');
    setSort('newest');
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
            Loading fresh products...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f4f9f1]">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="bg-gradient-to-br from-[#123a24] via-[#1b4d32] to-[#2d6a4f] text-white">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <div className="flex items-center gap-2 text-[#95d5b2] text-sm font-semibold mb-3">
                <Leaf className="w-5 h-5" />
                FARM TO TABLE
              </div>

              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Fresh from the Farm
              </h1>

              <p className="text-[#cfe8db] max-w-2xl">
                Discover fresh produce directly
                from farmers. Choose organic or
                non-organic products and shop with
                complete transparency.
              </p>

            </div>

            {/* HERO CART */}

            <button
              onClick={() =>
                navigate('/cart')
              }
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 min-w-[220px] text-left hover:bg-white/15 transition"
            >

              <div className="flex items-center gap-3 mb-2">

                <ShoppingCart className="w-6 h-6" />

                <span className="font-semibold">
                  Your Cart
                </span>

              </div>

              <div className="flex justify-between text-sm text-[#cfe8db]">

                <span>
                  {cartCount} kg
                </span>

                <span className="font-bold text-white">
                  ₹{cartValue.toFixed(0)}
                </span>

              </div>

            </button>

          </div>

        </div>

      </section>

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <section className="max-w-7xl mx-auto px-5 sm:px-6 -mt-6 relative z-10">

        <div className="bg-white rounded-2xl shadow-lg border border-[#d9e8d3] p-4">

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

            {/* SEARCH */}

            <div className="relative md:col-span-2 xl:col-span-1">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search products or farmers..."
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch('')
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

            </div>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none"
            >
              {CATEGORIES.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === 'All'
                    ? 'All Categories'
                    : item}
                </option>
              ))}
            </select>

            {/* FARMING */}

            <select
              value={farmingType}
              onChange={(e) =>
                setFarmingType(e.target.value)
              }
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none"
            >
              {FARMING_TYPES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === 'All'
                      ? 'All Farming Types'
                      : item}
                  </option>
                )
              )}
            </select>

            {/* SORT */}

            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none"
            >
              <option value="newest">
                Newest
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="stock">
                Stock Available
              </option>
            </select>

          </div>

          {/* ACTIVE FILTERS */}

          {(search ||
            category !== 'All' ||
            farmingType !== 'All') && (

            <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">

              <span className="text-sm text-gray-500">
                Active filters:
              </span>

              {search && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                  Search: {search}
                </span>
              )}

              {category !== 'All' && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                  {category}
                </span>
              )}

              {farmingType !==
                'All' && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                  {farmingType}
                </span>
              )}

              <button
                onClick={clearFilters}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Clear all
              </button>

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          MARKETPLACE
      ================================================= */}

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-10">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 mb-8">
            <p className="font-semibold">
              Unable to load marketplace
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>
        )}

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

          <div>

            <h2 className="text-2xl font-bold text-[#16241a]">
              Marketplace
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length}{' '}
              {filteredProducts.length ===
              1
                ? 'product'
                : 'products'}{' '}
              available
            </p>

          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">

            <ArrowUpDown className="w-4 h-4" />

            Sorted by

            <span className="font-semibold text-gray-700">
              {sort === 'newest'
                ? 'Newest'
                : sort ===
                  'price-low'
                ? 'Lowest Price'
                : sort ===
                  'price-high'
                ? 'Highest Price'
                : 'Stock'}
            </span>

          </div>

        </div>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        {filteredProducts.length ===
        0 ? (

          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">

            <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />

            <h3 className="text-xl font-bold mb-2">
              No products found
            </h3>

            <p className="text-gray-500 mb-5">
              Try changing your search or
              filters.
            </p>

            <button
              onClick={clearFilters}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">

            {filteredProducts.map(
              (product) => {

                const quantityInCart =
                  Number(
                    cart[
                      product._id
                    ] || 0
                  );

                const outOfStock =
                  Number(
                    product.quantity
                  ) <= 0;

                const isAdded =
                  addedProduct ===
                  product._id;

                return (

                  <article
                    key={product._id}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#d9e8d3] shadow-sm hover:shadow-xl transition duration-300 h-full min-h-[500px] flex flex-col"
                  >

                    {/* ===================================
                        IMAGE
                    =================================== */}

                    <div
                      className="relative h-44 flex-shrink-0 bg-[#edf5e9] overflow-hidden cursor-pointer"
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
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-green-700">
                          <Leaf className="w-14 h-14 mb-2 opacity-30" />

                          <span className="text-sm opacity-60">
                            Farm Fresh
                          </span>
                        </div>
                      )}

                      {/* FARMING TYPE */}

                      <div className="absolute top-3 left-3">

                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                            product.farmingType ===
                            'Organic'
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          {product.farmingType ===
                          'Organic'
                            ? '🌱 Organic'
                            : '🌾 Non-Organic'}
                        </span>

                      </div>

                      {/* WISHLIST */}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        disabled={wishlistLoading[product._id]}
                        aria-label={
                          wishlist[product._id]
                            ? 'Remove from wishlist'
                            : 'Add to wishlist'
                        }
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${
                          wishlist[product._id]
                            ? 'bg-red-500 text-white'
                            : 'bg-white/95 text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart
                          className="w-5 h-5"
                          fill={
                            wishlist[product._id]
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>

                      {/* CATEGORY */}

                      <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1 bg-black/60 text-white rounded-full text-xs">
                          {product.category || 'Other'}
                        </span>
                      </div>

                    </div>

                    {/* ===================================
                        CONTENT
                    =================================== */}

                    <div className="p-4 flex flex-col flex-1">

                      {/* NAME */}

                      <h3
                        onClick={() =>
                          navigate(
                            `/product/${product._id}`
                          )
                        }
                        className="text-lg font-bold text-[#16241a] mb-1 cursor-pointer hover:text-green-700 h-7 overflow-hidden"
                      >
                        {product.name}
                      </h3>

                      {/* DESCRIPTION */}

                      <div className="h-9 mb-2 overflow-hidden">

                        <p className="text-sm text-gray-500 line-clamp-2">
                          {product.description ||
                            'Fresh farm produce'}
                        </p>

                      </div>

                      {/* RATING */}

                      <button
                        type="button"
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="flex items-center gap-1.5 mb-2 w-fit"
                      >
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(Number(product.averageRating || 0))
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {Number(product.averageRating || 0).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({Number(product.reviewCount || 0)})
                        </span>
                      </button>

                      {/* PRICE */}

                      <div className="flex items-center justify-between min-h-[38px] mb-3">

                        <div>

                          <span className="text-2xl font-bold text-green-700">
                            ₹
                            {Number(
                              product.pricePerKg
                            ).toFixed(0)}
                          </span>

                          <span className="text-sm text-gray-500">
                            {' '}
                            / kg
                          </span>

                        </div>

                        <span className="text-xs text-gray-500 text-right">
                          {product.quantity}
                          {' '}
                          kg
                          <br />
                          available
                        </span>

                      </div>

                      {/* FARMER */}

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();

    const farmerId = product.farmer?._id;

    if (farmerId) {
      navigate(`/customer/farmer/${farmerId}`);
    }
  }}
  disabled={!product.farmer?._id}
  className="w-full text-left bg-[#f4f9f1] rounded-xl p-2.5 mb-3 h-[58px] flex-shrink-0 border border-transparent hover:border-green-300 hover:bg-green-50 transition"
>
  <div className="flex items-center gap-2">

    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
      <MapPin className="w-4 h-4 text-green-700" />
    </div>

    <div className="min-w-0 flex-1">

      <p className="text-sm font-semibold text-gray-800 truncate">
        {product.farmer?.farmName ||
          product.farmer?.name ||
          'Local Farmer'}
      </p>

      <p className="text-xs text-gray-500 truncate">
        {product.farmer?.farmLocation?.city ||
          'FarmDirect Farmer'}

        {product.farmer?.farmLocation?.state
          ? `, ${product.farmer.farmLocation.state}`
          : ''}
      </p>

    </div>

    {product.farmer?._id && (
      <span className="text-[11px] font-semibold text-green-700 whitespace-nowrap">
        View Farm →
      </span>
    )}

  </div>
</button>

                      {/* =================================
                          CART CONTROL
                      ================================= */}

                      <div className="mt-auto">

                        {quantityInCart >
                        0 ? (

                          <div className="flex items-center gap-2">

                            <div className="flex items-center border border-green-200 rounded-xl overflow-hidden flex-1 h-12">

                              <button
                                onClick={() =>
                                  changeQuantity(
                                    product,
                                    -1
                                  )
                                }
                                className="w-11 h-full flex items-center justify-center text-green-700 hover:bg-green-50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              <div className="flex-1 text-center font-bold text-gray-800">
                                {
                                  quantityInCart
                                }{' '}
                                kg
                              </div>

                              <button
                                onClick={() =>
                                  changeQuantity(
                                    product,
                                    1
                                  )
                                }
                                disabled={
                                  quantityInCart >=
                                  Number(
                                    product.quantity
                                  )
                                }
                                className="w-11 h-full flex items-center justify-center text-green-700 hover:bg-green-50 disabled:opacity-30"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                            </div>

                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />

                          </div>

                        ) : (

                          <button
                            onClick={() =>
                              addToCart(
                                product
                              )
                            }
                            disabled={
                              outOfStock
                            }
                            className={`w-full h-10 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                              outOfStock
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : isAdded
                                ? 'bg-green-700 text-white'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >

                            {outOfStock ? (
                              <>
                                <Package className="w-5 h-5" />
                                Out of Stock
                              </>
                            ) : isAdded ? (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                Added to Cart
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-5 h-5" />
                                Add to Cart
                              </>
                            )}

                          </button>

                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </main>

      {/* =================================================
          FLOATING CART
      ================================================= */}

      <button
        onClick={() =>
          navigate('/cart')
        }
        className="fixed bottom-6 right-6 z-40 bg-[#14532d] text-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 hover:bg-green-800 transition"
      >

        <div className="relative">

          <ShoppingCart className="w-6 h-6" />

          {cartCount > 0 && (
            <span className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}

        </div>

        <div className="text-left">

          <p className="text-xs opacity-80">
            Cart
          </p>

          <p className="font-bold">
            ₹{cartValue.toFixed(0)}
          </p>

        </div>

      </button>

    </div>
  );
}

export default CustomerDashboard;