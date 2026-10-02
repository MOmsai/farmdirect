import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Package,
  IndianRupee,
  Sprout,
  Image as ImageIcon,
  X,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  MapPin,
  Wheat,
} from 'lucide-react';

const API_URL = 'https://farmdirect-backend-gd6o.onrender.com/api';

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Pulses',
  'Spices',
  'Dairy',
  'Oilseeds',
  'Other',
];

const FARMING_TYPES = ['Organic', 'Non-Organic'];

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Vegetables',
  farmingType: 'Organic',
  pricePerKg: '',
  quantity: '',
};

function FarmerProducts() {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // =====================================================
  // STATE
  // =====================================================

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [stockUpdatingId, setStockUpdatingId] = useState(null);

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getHeaders = () => ({
    headers: {
      'x-auth-token': token,
    },
  });

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = async (showRefresh = false) => {
    try {
      setError('');

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `${API_URL}/products/my-products`,
        getHeaders()
      );

      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Load farmer products error:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.msg ||
          'Failed to load your products. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  };

  // =====================================================
  // IMAGE SELECTION
  // =====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview((oldPreview) => {
      if (oldPreview && oldPreview.startsWith('blob:')) {
        URL.revokeObjectURL(oldPreview);
      }

      return previewUrl;
    });

    setError('');
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
    setError('');
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'Other',
      farmingType: product.farmingType || 'Non-Organic',
      pricePerKg:
        product.pricePerKg !== undefined
          ? String(product.pricePerKg)
          : '',
      quantity:
        product.quantity !== undefined
          ? String(product.quantity)
          : '',
    });

    setImageFile(null);
    setImagePreview(product.imageUrl || '');

    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================


  // =====================================================
  // IMAGE UPLOAD - CLOUDINARY
  // =====================================================

  const uploadImage = async () => {
    // Keep the existing image when editing without selecting a new one
    if (!imageFile) {
      return editingProduct?.imageUrl || '';
    }

    const uploadData = new FormData();
    uploadData.append('file', imageFile);
    uploadData.append('upload_preset', 'farmdirect_products');

    try {
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dnu55jzv1/image/upload',
        uploadData
      );

      const imageUrl = response.data?.secure_url;

      if (!imageUrl) {
        throw new Error('Cloudinary did not return an image URL.');
      }

      console.log('Cloudinary image uploaded:', imageUrl);

      // IMPORTANT: Return the URL to handleSubmit()
      return imageUrl;
    } catch (error) {
      console.error(
        'Cloudinary upload error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to upload product image.'
      );
    }
  };



  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required.');
      return false;
    }

    if (
      formData.pricePerKg === '' ||
      Number(formData.pricePerKg) < 0
    ) {
      setError('Please enter a valid price per kg.');
      return false;
    }

    if (
      formData.quantity === '' ||
      Number(formData.quantity) < 0
    ) {
      setError('Please enter a valid quantity.');
      return false;
    }

    if (!CATEGORIES.includes(formData.category)) {
      setError('Please select a valid category.');
      return false;
    }

    if (!FARMING_TYPES.includes(formData.farmingType)) {
      setError('Please select a valid farming type.');
      return false;
    }

    return true;
  };

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let imageUrl = editingProduct?.imageUrl || '';

      // Upload only if a new image was selected
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        farmingType: formData.farmingType,
        pricePerKg: Number(formData.pricePerKg),
        quantity: Number(formData.quantity),
        imageUrl,
      };

      let response;

      if (editingProduct) {
        response = await axios.put(
          `${API_URL}/products/${editingProduct._id}`,
          payload,
          getHeaders()
        );

        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProduct._id
              ? response.data
              : product
          )
        );

        setSuccess('Product updated successfully.');
      } else {
        response = await axios.post(
          `${API_URL}/products`,
          payload,
          getHeaders()
        );

        setProducts((prev) => [response.data, ...prev]);

        setSuccess('Product added successfully.');
      }

      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 700);
    } catch (err) {
      console.error('Save product error:', err);

      setError(
        err.response?.data?.msg ||
          err.message ||
          'Failed to save product.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product._id);
      setError('');

      await axios.delete(
        `${API_URL}/products/${product._id}`,
        getHeaders()
      );

      setProducts((prev) =>
        prev.filter((item) => item._id !== product._id)
      );

      setSuccess(`${product.name} deleted successfully.`);

      setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err) {
      console.error('Delete product error:', err);

      setError(
        err.response?.data?.msg ||
          'Failed to delete product.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // UPDATE STOCK
  // =====================================================

  const handleStockUpdate = async (product) => {
    const newQuantity = window.prompt(
      `Enter available stock for ${product.name} (kg):`,
      product.quantity
    );

    if (newQuantity === null) {
      return;
    }

    const quantity = Number(newQuantity);

    if (Number.isNaN(quantity) || quantity < 0) {
      setError('Please enter a valid stock quantity.');
      return;
    }

    try {
      setStockUpdatingId(product._id);
      setError('');

      const response = await axios.patch(
        `${API_URL}/products/${product._id}/stock`,
        {
          quantity,
        },
        getHeaders()
      );

      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? response.data : item
        )
      );

      setSuccess('Stock updated successfully.');

      setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err) {
      console.error('Stock update error:', err);

      setError(
        err.response?.data?.msg ||
          'Failed to update stock.'
      );
    } finally {
      setStockUpdatingId(null);
    }
  };

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.farmingType?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  // =====================================================
  // STATS
  // =====================================================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.pricePerKg || 0) *
        Number(product.quantity || 0),
    0
  );

  const organicProducts = products.filter(
    (product) => product.farmingType === 'Organic'
  ).length;

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <button
                onClick={() => navigate('/farmer-dashboard')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-700 mb-3 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>

              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                FARMDIRECT • FARMER CENTER
              </p>

              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                My Products
              </h1>

              <p className="text-gray-500 mt-1">
                Add, edit and manage your farm products.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>

          </div>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && !showModal && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />

            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>

            <button onClick={() => setError('')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && !showModal && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

          <StatCard
            icon={<Package className="w-6 h-6 text-green-700" />}
            title="Total Products"
            value={totalProducts}
          />

          <StatCard
            icon={<Wheat className="w-6 h-6 text-green-700" />}
            title="Total Stock"
            value={`${totalStock.toFixed(1)} kg`}
          />

          <StatCard
            icon={<IndianRupee className="w-6 h-6 text-green-700" />}
            title="Inventory Value"
            value={formatCurrency(inventoryValue)}
          />

          <StatCard
            icon={<Sprout className="w-6 h-6 text-green-700" />}
            title="Organic Products"
            value={organicProducts}
          />

        </div>

        {/* =================================================
            SEARCH + REFRESH
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mt-6">

          <div className="flex flex-col md:flex-row gap-3">

            <div className="relative flex-1">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your products..."
                className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />

            </div>

            <button
              onClick={() => loadProducts(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />

              Refresh
            </button>

          </div>

        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <div className="mt-8 pb-12">

          <div className="flex items-center justify-between mb-4">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Products
              </h2>

              <p className="text-gray-500 mt-1">
                Showing {filteredProducts.length} of{' '}
                {products.length} products
              </p>
            </div>

          </div>

          {loading ? (
            <LoadingGrid />
          ) : filteredProducts.length === 0 ? (

            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">

              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                {search
                  ? 'No products found'
                  : 'No products yet'}
              </h3>

              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {search
                  ? 'Try a different search term.'
                  : 'Start adding your farm products to the FarmDirect marketplace.'}
              </p>

              {!search && (
                <button
                  onClick={openAddModal}
                  className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Product
                </button>
              )}

            </div>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={() => openEditModal(product)}
                  onDelete={() => handleDelete(product)}
                  onStockUpdate={() =>
                    handleStockUpdate(product)
                  }
                  deleting={
                    deletingId === product._id
                  }
                  updatingStock={
                    stockUpdatingId === product._id
                  }
                  formatCurrency={formatCurrency}
                />
              ))}

            </div>

          )}

        </div>

      </div>

      {/* ===================================================
          ADD / EDIT PRODUCT MODAL
      =================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col">

            {/* MODAL HEADER */}

            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add New Product'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingProduct
                    ? 'Update your product information.'
                    : 'Add a product to your FarmDirect marketplace.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="overflow-y-auto">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />

                      <p className="text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />

                      <p className="text-sm font-medium">
                        {success}
                      </p>
                    </div>
                  )}

                  {/* NAME */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Example: Fresh Tomatoes"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Describe your product..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* CATEGORY + FARMING TYPE */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>

                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {CATEGORIES.map((category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Farming Type *
                      </label>

                      <select
                        name="farmingType"
                        value={formData.farmingType}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {FARMING_TYPES.map((type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* PRICE + QUANTITY */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price per Kg *
                      </label>

                      <div className="relative">

                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                        <input
                          type="number"
                          name="pricePerKg"
                          value={formData.pricePerKg}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                        />

                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Available Quantity (Kg) *
                      </label>

                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                  </div>

                  {/* CHOOSE FILE */}

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Image
                    </label>

                    <div className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl p-5 transition">

                      <div className="flex flex-col sm:flex-row items-center gap-4">

                        <label className="cursor-pointer">

                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />

                          <div className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold px-5 py-3 rounded-xl transition">

                            <Upload className="w-5 h-5" />

                            Choose File

                          </div>

                        </label>

                        <div className="text-sm text-gray-500">

                          {imageFile ? (
                            <span className="text-green-700 font-medium">
                              {imageFile.name}
                            </span>
                          ) : (
                            <span>
                              JPG, PNG or WebP • Max 5MB
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    {/* IMAGE PREVIEW */}

                    {imagePreview && (
                      <div className="mt-4">

                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Image Preview
                        </p>

                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">

                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />

                        </div>

                      </div>
                    )}

                  </div>

                  {/* BUTTONS */}

                  <div className="flex gap-3 pt-3">

                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >

                      {saving ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          {imageFile
                            ? 'Uploading...'
                            : 'Saving...'}
                        </>
                      ) : (
                        <>
                          {editingProduct ? (
                            <Save className="w-5 h-5" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}

                          {editingProduct
                            ? 'Save Changes'
                            : 'Add Product'}
                        </>
                      )}

                    </button>

                  </div>

                </form>

                {/* =================================================
                    LIVE PRODUCT PREVIEW
                ================================================= */}

                <div className="lg:border-l lg:border-gray-200 lg:pl-8">

                  <div className="sticky top-0">

                    <div className="flex items-center gap-2 mb-4">

                      <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-green-700" />
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900">
                          Live Preview
                        </h3>

                        <p className="text-xs text-gray-500">
                          Customer marketplace view
                        </p>
                      </div>

                    </div>

                    {/* PREVIEW CARD */}

                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                      {/* IMAGE */}

                      <div className="h-64 bg-gray-100 relative">

                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">

                            <ImageIcon className="w-14 h-14 mb-3" />

                            <p className="text-sm">
                              Choose an image
                            </p>

                          </div>
                        )}

                        {/* FARMING TYPE */}

                        <div
                          className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                            formData.farmingType === 'Organic'
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-800'
                          }`}
                        >
                          {formData.farmingType === 'Organic'
                            ? '🌱 Organic'
                            : '🌾 Non-Organic'}
                        </div>

                        {/* CATEGORY */}

                        <div className="absolute top-4 right-4 bg-gray-800/80 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                          {formData.category || 'Category'}
                        </div>

                      </div>

                      {/* CONTENT */}

                      <div className="p-5">

                        <h3 className="text-xl font-bold text-gray-900">
                          {formData.name ||
                            'Your Product Name'}
                        </h3>

                        <p className="text-gray-500 text-sm mt-2 min-h-[40px]">
                          {formData.description ||
                            'Your product description will appear here.'}
                        </p>

                        <div className="flex items-end justify-between mt-5">

                          <div>

                            <div className="flex items-center gap-1">

                              <IndianRupee className="w-5 h-5 text-green-700" />

                              <span className="text-2xl font-bold text-green-700">
                                {formData.pricePerKg
                                  ? Number(
                                      formData.pricePerKg
                                    ).toLocaleString(
                                      'en-IN'
                                    )
                                  : '0'}
                              </span>

                              <span className="text-sm text-gray-500">
                                / kg
                              </span>

                            </div>

                          </div>

                          <div className="text-right">

                            <p className="text-sm text-gray-500">
                              Available
                            </p>

                            <p className="font-bold text-gray-900">
                              {formData.quantity || 0} kg
                            </p>

                          </div>

                        </div>

                        <div className="mt-5 bg-green-50 rounded-xl p-4 flex items-center gap-3">

                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-green-700" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Your Farm
                            </p>

                            <p className="text-xs text-gray-500">
                              Farm location will appear here
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          disabled
                          className="w-full mt-4 bg-green-600 text-white font-semibold py-3 rounded-xl opacity-80"
                        >
                          Add to Cart
                        </button>

                      </div>

                    </div>

                    {/* PREVIEW INFORMATION */}

                    <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4">

                      <div className="flex items-start gap-3">

                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />

                        <div>

                          <p className="font-semibold text-green-800 text-sm">
                            Live Preview
                          </p>

                          <p className="text-xs text-green-700 mt-1">
                            The preview updates automatically while
                            you enter the product details.
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =======================================================
// STAT CARD
// =======================================================

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
          {icon}
        </div>

        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
        </div>

      </div>

    </div>
  );
}

// =======================================================
// PRODUCT CARD
// =======================================================

function ProductCard({
  product,
  onEdit,
  onDelete,
  onStockUpdate,
  deleting,
  updatingStock,
  formatCurrency,
}) {
  const lowStock =
    Number(product.quantity || 0) <= 5;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">

      {/* IMAGE */}

      <div className="h-52 bg-gray-100 relative">

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* FARMING TYPE */}

        <div
          className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold ${
            product.farmingType === 'Organic'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-800'
          }`}
        >
          {product.farmingType === 'Organic'
            ? '🌱 Organic'
            : '🌾 Non-Organic'}
        </div>

        {/* CATEGORY */}

        <div className="absolute top-3 right-3 bg-gray-800/80 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
          {product.category || 'Other'}
        </div>

      </div>

      {/* CONTENT */}

      <div className="p-5">

        <h3 className="text-xl font-bold text-gray-900 truncate">
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">
          {product.description || 'No description available.'}
        </p>

        <div className="flex items-end justify-between mt-4">

          <div>

            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(product.pricePerKg)}
            </p>

            <p className="text-xs text-gray-500">
              per kg
            </p>

          </div>

          <div className="text-right">

            <p className="text-xs text-gray-500">
              Stock
            </p>

            <p
              className={`font-bold ${
                lowStock
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}
            >
              {Number(product.quantity || 0).toFixed(1)} kg
            </p>

          </div>

        </div>

        {lowStock && (
          <div className="mt-3 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-xs font-semibold">
            ⚠️ Low stock
          </div>
        )}

        {/* ACTIONS */}

        <div className="grid grid-cols-2 gap-2 mt-5">

          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 border border-green-200 text-green-700 hover:bg-green-50 font-semibold py-2.5 rounded-xl transition"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {deleting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}

            Delete
          </button>

        </div>

        <button
          onClick={onStockUpdate}
          disabled={updatingStock}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
        >
          {updatingStock ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Package className="w-4 h-4" />
          )}

          Update Stock
        </button>

      </div>

    </div>
  );
}

// =======================================================
// LOADING GRID
// =======================================================

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse"
        >

          <div className="h-52 bg-gray-200" />

          <div className="p-5 space-y-4">

            <div className="h-6 bg-gray-200 rounded" />

            <div className="h-4 bg-gray-200 rounded w-3/4" />

            <div className="h-8 bg-gray-200 rounded w-1/2" />

            <div className="h-10 bg-gray-200 rounded" />

          </div>

        </div>
      ))}

    </div>
  );
}

export default FarmerProducts;