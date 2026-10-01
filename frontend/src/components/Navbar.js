import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  ShoppingCart,
  Heart,
  Package,
  LogOut,
  Store,
  LayoutDashboard,
  BarChart3,
  Leaf,
  ChevronDown,
  Menu,
  X,
  User,
  Wallet,
  Sparkles,
} from 'lucide-react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // =====================================================
  // LOAD USER
  // =====================================================

  const loadUser = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUserName('');
      setUserRole('');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = payload?.user || {};

      setUserName(
        user.name ||
        user.email?.split('@')[0] ||
        ''
      );

      setUserRole(user.role || '');
    } catch (error) {
      console.error('Navbar user error:', error);

      setUserName('');
      setUserRole('');
    }
  }, []);

  // =====================================================
  // LOAD CART COUNT
  // =====================================================

  const loadCartCount = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload?.user?.role;

      // Cart exists only for customers
      if (role !== 'customer') {
        setCartCount(0);
        return;
      }

      const response = await axios.get(
        `${API_URL}/cart`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      const items = response.data?.items || [];

      const total = items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

      setCartCount(total);
    } catch (error) {
      console.error(
        'Navbar cart error:',
        error.response?.data || error.message
      );

      setCartCount(0);
    }
  }, []);

  // =====================================================
  // LOAD WISHLIST COUNT
  // =====================================================

  const loadWishlistCount = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setWishlistCount(0);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload?.user?.role;

      if (role !== 'customer') {
        setWishlistCount(0);
        return;
      }

      const response = await axios.get(
        `${API_URL}/wishlist`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setWishlistCount(
        (response.data?.products || []).length
      );
    } catch (error) {
      console.error('Navbar wishlist error:', error);
      setWishlistCount(0);
    }
  }, []);

  // =====================================================
  // LOAD ON ROUTE CHANGE
  // =====================================================

  useEffect(() => {
    loadUser();
    loadCartCount();
    loadWishlistCount();
  }, [
    location.pathname,
    loadUser,
    loadCartCount,
    loadWishlistCount,
  ]);

  // =====================================================
  // LISTEN FOR CART UPDATES
  // =====================================================

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartCount();
    };

    window.addEventListener(
      'cartUpdated',
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        'cartUpdated',
        handleCartUpdated
      );
    };
  }, [loadCartCount]);

  // =====================================================
  // LISTEN FOR WISHLIST UPDATES
  // =====================================================

  useEffect(() => {
    const handleWishlistUpdated = () => {
      loadWishlistCount();
    };

    window.addEventListener(
      'wishlistUpdated',
      handleWishlistUpdated
    );

    return () => {
      window.removeEventListener(
        'wishlistUpdated',
        handleWishlistUpdated
      );
    };
  }, [loadWishlistCount]);

  // =====================================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // =====================================================

  useEffect(() => {
    setMobileMenuOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem('token');

    setCartCount(0);
    setWishlistCount(0);
    setUserName('');
    setUserRole('');

    setMenuOpen(false);
    setMobileMenuOpen(false);

    navigate('/login');
  };

  // =====================================================
  // ACTIVE LINK
  // =====================================================

  const isActive = (path) => {
    return location.pathname === path;
  };

// =====================================================
// PUBLIC PAGES
// =====================================================

const publicRoutes = [
  '/',
  '/login',
  '/register',
];

// Never show the authenticated navbar
// on public pages.
if (publicRoutes.includes(location.pathname)) {
  return null;
}

// =====================================================
// NOT LOGGED IN
// =====================================================

if (!localStorage.getItem('token')) {
  return null;
}

  return (
    <>
      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav
        className="
          sticky
          top-0
          z-50
          w-full
          bg-white
          border-b
          border-gray-200
          shadow-sm
        "
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-[72px] flex items-center justify-between">

            {/* =================================================
                LOGO
            ================================================= */}

            <Link
              to={
                userRole === 'farmer'
                  ? '/farmer-dashboard'
                  : '/customer-dashboard'
              }
              className="flex items-center gap-3 group"
            >

              {/* Logo icon */}
              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-green-600
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  group-hover:bg-green-700
                  transition
                "
              >
                <Leaf
                  className="w-6 h-6 text-white"
                />
              </div>

              {/* Logo text */}
              <div className="hidden sm:block">

                <div
                  className="
                    text-xl
                    font-extrabold
                    tracking-tight
                    text-gray-900
                    leading-none
                  "
                >
                  Farm<span className="text-green-600">
                    Direct
                  </span>
                </div>

                <div
                  className="
                    text-[10px]
                    font-medium
                    text-gray-500
                    tracking-widest
                    uppercase
                    mt-1
                  "
                >
                  {userRole === 'farmer'
                    ? 'Farmer Center'
                    : 'Farm to Table'}
                </div>

              </div>
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <div className="hidden lg:flex items-center gap-1">

              {/* ================= CUSTOMER ================= */}

              {userRole === 'customer' && (
                <>
                  <Link
                    to="/customer-dashboard"
                    className={`
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      transition
                      ${
                        isActive('/customer-dashboard')
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                      }
                    `}
                  >
                    <Store className="w-4 h-4" />
                    Marketplace
                  </Link>

                  <Link
                    to="/orders"
                    className={`
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      transition
                      ${
                        isActive('/orders')
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                      }
                    `}
                  >
                    <Package className="w-4 h-4" />
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className={`
                      relative
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      transition
                      ${
                        isActive('/wishlist')
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                      }
                    `}
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
  to="/customer-spending"
  className={`
    flex
    items-center
    gap-2
    px-4
    py-2.5
    rounded-xl
    text-sm
    font-semibold
    transition
    ${
      isActive('/customer-spending')
        ? 'bg-green-50 text-green-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
    }
  `}
>
  <Wallet className="w-4 h-4" />

  Spending
</Link>

<Link
  to="/customer-ai"
  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${isActive('/customer-ai') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'}`}
>
  <Sparkles className="w-4 h-4" />
  AI Assistant
</Link>

<Link to="/customer-smart-recommendations" className="...">
  <Sparkles className="w-4 h-4" />
  AI Picks
</Link>

                </>
              )}

              {/* ================= FARMER ================= */}

              {userRole === 'farmer' && (
                <>
                  <Link
                    to="/farmer-dashboard"
                    className={`
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      transition
                      ${
                        isActive('/farmer-dashboard')
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                      }
                    `}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <Link
                    to="/farmer-products"
                    className="
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      text-gray-600
                      hover:bg-gray-50
                      hover:text-green-700
                      transition
                    "
                  >
                    <Store className="w-4 h-4" />
                    My Products
                  </Link>

                  <Link
                    to="/farmer-orders"
                    className={`
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      transition
                      ${
                        isActive('/farmer-orders')
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                      }
                    `}
                  >
                    <Package className="w-4 h-4" />
                    Orders
                  </Link>

                  <Link
                    to="/farmer-analytics"
                    className="
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-semibold
                      text-gray-600
                      hover:bg-gray-50
                      hover:text-green-700
                      transition
                    "
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Link>
                </>
              )}

            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="flex items-center gap-2">

              {/* ================= CUSTOMER CART ================= */}

              {userRole === 'customer' && (
                <button
                  onClick={() => navigate('/cart')}
                  className={`
                    relative
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    font-semibold
                    text-sm
                    transition
                    ${
                      isActive('/cart')
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }
                  `}
                >

                  <ShoppingCart className="w-5 h-5" />

                  <span className="hidden sm:inline">
                    Cart
                  </span>

                  {cartCount > 0 && (
                    <span
                      className="
                        absolute
                        -top-2
                        -right-2
                        min-w-[22px]
                        h-[22px]
                        px-1
                        rounded-full
                        bg-red-500
                        text-white
                        text-[11px]
                        font-bold
                        flex
                        items-center
                        justify-center
                        border-2
                        border-white
                      "
                    >
                      {cartCount > 99
                        ? '99+'
                        : cartCount}
                    </span>
                  )}

                </button>
              )}

              {/* ================= USER MENU ================= */}

              <div className="relative hidden md:block">

                <button
                  onClick={() =>
                    setMenuOpen(!menuOpen)
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-xl
                    hover:bg-gray-50
                    transition
                  "
                >

                  <div
                    className="
                      w-9
                      h-9
                      rounded-full
                      bg-green-100
                      text-green-700
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <User className="w-5 h-5" />
                  </div>

                  <div className="hidden xl:block text-left">

                    <div
                      className="
                        text-xs
                        text-gray-500
                      "
                    >
                      Welcome
                    </div>

                    <div
                      className="
                        text-sm
                        font-bold
                        text-gray-900
                        max-w-[120px]
                        truncate
                      "
                    >
                      {userName}
                    </div>

                  </div>

                  <ChevronDown
                    className={`
                      w-4
                      h-4
                      text-gray-400
                      transition
                      ${
                        menuOpen
                          ? 'rotate-180'
                          : ''
                      }
                    `}
                  />

                </button>

                {/* USER DROPDOWN */}

                {menuOpen && (
                  <div
                    className="
                      absolute
                      right-0
                      top-14
                      w-56
                      bg-white
                      border
                      border-gray-200
                      rounded-2xl
                      shadow-xl
                      p-2
                      z-50
                    "
                  >

                    <div
                      className="
                        px-3
                        py-3
                        border-b
                        border-gray-100
                        mb-1
                      "
                    >

                      <p
                        className="
                          text-xs
                          text-gray-500
                        "
                      >
                        Signed in as
                      </p>

                      <p
                        className="
                          font-bold
                          text-gray-900
                          truncate
                        "
                      >
                        {userName}
                      </p>

                      <span
                        className="
                          inline-block
                          mt-1
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wider
                          text-green-700
                          bg-green-50
                          px-2
                          py-1
                          rounded-full
                        "
                      >
                        {userRole}
                      </span>

                    </div>

                    <button
                      onClick={handleLogout}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-sm
                        font-semibold
                        text-red-600
                        hover:bg-red-50
                        transition
                      "
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>

                  </div>
                )}

              </div>

              {/* ================= MOBILE MENU ================= */}

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="
                  lg:hidden
                  w-10
                  h-10
                  rounded-xl
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  text-gray-700
                  hover:bg-gray-50
                "
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

            </div>

          </div>
        </div>

        {/* =================================================
            MOBILE NAVIGATION
        ================================================= */}

        {mobileMenuOpen && (
          <div
            className="
              lg:hidden
              border-t
              border-gray-100
              bg-white
              px-4
              py-4
              shadow-lg
            "
          >

            <div className="space-y-1">

              {/* CUSTOMER */}

              {userRole === 'customer' && (
                <>
                  <Link
                    to="/customer-dashboard"
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <Store className="w-5 h-5" />
                    Marketplace
                  </Link>

                  <Link
                    to="/orders"
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <Package className="w-5 h-5" />
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className="
                      flex
                      items-center
                      justify-between
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="w-5 h-5" />
                      Wishlist
                    </span>
                    {wishlistCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>


                  <Link
                    to="/cart"
                    className="
                      flex
                      items-center
                      justify-between
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >

                    <span className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5" />
                      Cart
                    </span>

                    {cartCount > 0 && (
                      <span
                        className="
                          bg-red-500
                          text-white
                          text-xs
                          font-bold
                          px-2
                          py-1
                          rounded-full
                        "
                      >
                        {cartCount}
                      </span>
                    )}

                  </Link>
                </>
              )}

              {/* FARMER */}

              {userRole === 'farmer' && (
                <>
                  <Link
                    to="/farmer-dashboard"
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>

                  <Link
                    to="/farmer-orders"
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <Package className="w-5 h-5" />
                    Orders
                  </Link>

                  <Link
                    to="/farmer-dashboard"
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <Store className="w-5 h-5" />
                    My Products
                  </Link>

                  <Link
                    to="/farmer-dashboard"
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-xl
                      text-gray-700
                      hover:bg-green-50
                      hover:text-green-700
                      font-semibold
                    "
                  >
                    <BarChart3 className="w-5 h-5" />
                    Analytics
                  </Link>
                </>
              )}

              {/* MOBILE LOGOUT */}

              <div
                className="
                  pt-3
                  mt-3
                  border-t
                  border-gray-100
                "
              >

                <button
                  onClick={handleLogout}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    text-red-600
                    hover:bg-red-50
                    font-semibold
                  "
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>

              </div>

            </div>
          </div>
        )}

      </nav>
    </>
  );
};

export default Navbar;