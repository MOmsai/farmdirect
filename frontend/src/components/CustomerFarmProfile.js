import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Leaf,
  Package,
  ShoppingBag,
  Star,
  Search,
  ChevronRight,
  User,
  Sprout,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://farmdirect-backend-gd6o.onrender.com/api';

const CustomerFarmProfile = () => {
  const navigate = useNavigate();
  const { farmerId } = useParams();

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchFarmProfile();
  }, [farmerId]);

  const fetchFarmProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE}/users/farmer/${farmerId}`
      );

      setFarmer(response.data.farmer);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error("Farm profile error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load farmer profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        product.category
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.quantity || 0),
    0
  );

  const organicProducts = products.filter(
    (product) =>
      product.farmingType?.toLowerCase() === "organic"
  ).length;

  const averageRating =
    products.length > 0
      ? (
          products.reduce(
            (sum, product) =>
              sum + Number(product.averageRating || 0),
            0
          ) / products.length
        ).toFixed(1)
      : "0.0";

  const farmerName =
    farmer?.farmName ||
    farmer?.name ||
    "Local Farmer";

  const location =
    farmer?.farmLocation?.city ||
    farmer?.farmLocation?.state
      ? `${farmer?.farmLocation?.city || ""}${
          farmer?.farmLocation?.city &&
          farmer?.farmLocation?.state
            ? ", "
            : ""
        }${farmer?.farmLocation?.state || ""}`
      : "FarmDirect Farmer";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-600">
            Loading farm profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-green-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
            <p className="text-red-600 font-medium">
              {error}
            </p>

            <button
              onClick={fetchFarmProfile}
              className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                Back
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Farm Hero */}
      <section className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Farm Icon */}
            <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Sprout className="w-12 h-12" />
            </div>

            {/* Farmer Info */}
            <div className="flex-1">
              <p className="text-green-100 text-sm font-medium mb-1">
                FARM PROFILE
              </p>

              <h1 className="text-3xl md:text-4xl font-bold">
                {farmerName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-green-50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>
                    {farmer?.name || "Farmer"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-700" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length}
                </p>

                <p className="text-sm text-gray-500">
                  Products
                </p>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-700" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalStock}
                </p>

                <p className="text-sm text-gray-500">
                  Stock Available
                </p>
              </div>
            </div>
          </div>

          {/* Organic */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-700" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {organicProducts}
                </p>

                <p className="text-sm text-gray-500">
                  Organic Products
                </p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-500" />
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {averageRating}
                </p>

                <p className="text-sm text-gray-500">
                  Average Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Products from this Farm
            </h2>

            <p className="text-gray-500 mt-1">
              Fresh products directly from {farmerName}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                category === item
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-green-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />

            <h3 className="text-lg font-semibold text-gray-700">
              No products found
            </h3>

            <p className="text-gray-500 mt-1">
              Try changing your search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-12 h-12 text-green-300" />
                    </div>
                  )}

                  {/* Farming Type */}
                  {product.farmingType && (
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.farmingType === "Organic"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.farmingType}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {product.name}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        {product.category}
                      </p>
                    </div>

                    {product.averageRating > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />

                        <span className="font-medium">
                          {Number(
                            product.averageRating
                          ).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-lg font-bold text-green-700">
                        ₹{Number(product.pricePerKg || 0).toFixed(0)}
                      </span>

                      <span className="text-xs text-gray-500">
                        /kg
                      </span>
                    </div>

                    <span className="text-xs text-gray-500">
                      {product.quantity > 0
                        ? `${product.quantity} kg available`
                        : "Out of stock"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/product/${product._id}`
                      )
                    }
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 py-2.5 rounded-xl font-medium transition"
                  >
                    View Product

                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerFarmProfile;