// src/components/AddProduct.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Package,
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

const EMPTY_FORM = {
  name: '',
  description: '',
  pricePerKg: '',
  quantity: '',
  category: 'Vegetables',
  farmingType: 'Organic',
};

function AddProduct() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ---------------------------------------------------------
  // FORM CHANGE
  // ---------------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------------------------
  // IMAGE
  // ---------------------------------------------------------

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.');
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // ---------------------------------------------------------
  // IMAGE UPLOAD
  // ---------------------------------------------------------

  const uploadImage = async (file) => {
    if (!file) return '';

    const imageData = new FormData();
    imageData.append('image', file);

    try {
      const response = await axios.post(
        'https://api.imgbb.com/1/upload?key=2e01dc8e38a1f9536c0c5cc64a43839c',
        imageData
      );

      return response.data.data.url;
    } catch (err) {
      console.error('Image upload error:', err);
      throw new Error('Image upload failed.');
    }
  };

  // ---------------------------------------------------------
  // ADD PRODUCT
  // ---------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate('/login');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter product name.');
      return;
    }

    if (
      formData.pricePerKg === '' ||
      Number(formData.pricePerKg) <= 0
    ) {
      alert('Please enter a valid price per kg.');
      return;
    }

    if (
      formData.quantity === '' ||
      Number(formData.quantity) < 0
    ) {
      alert('Please enter a valid stock quantity.');
      return;
    }

    try {
      setUploading(true);
      setSuccess(false);

      let imageUrl = '';

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pricePerKg: Number(formData.pricePerKg),
        quantity: Number(formData.quantity),
        category: formData.category,
        farmingType: formData.farmingType,
        imageUrl,
      };

      await axios.post(
        `${API_URL}/products`,
        productData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess(true);

      setFormData(EMPTY_FORM);
      setImageFile(null);
      setImagePreview('');

    } catch (err) {
      console.error('Add product error:', err);

      alert(
        err.response?.data?.msg ||
          err.message ||
          'Failed to add product.'
      );
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* BACK */}

        <button
          onClick={() => navigate('/farmer-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-green-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="bg-white border rounded-2xl p-6 mb-6 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <Package className="w-7 h-7 text-green-700" />
            </div>

            <div>
              <p className="text-green-700 text-sm font-semibold uppercase">
                FARMDIRECT • FARMER CENTER
              </p>

              <h1 className="text-3xl font-bold text-gray-900">
                Add New Product
              </h1>

              <p className="text-gray-500 mt-1">
                List your fresh produce for customers to discover.
              </p>
            </div>

          </div>

        </div>

        {/* SUCCESS */}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <CheckCircle className="w-6 h-6 text-green-600" />

              <div>
                <p className="font-semibold text-green-800">
                  Product added successfully!
                </p>

                <p className="text-sm text-green-700">
                  Your product is now available in the marketplace.
                </p>
              </div>

            </div>

            <button
              onClick={() => navigate('/farmer-products')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Manage Products
            </button>

          </div>
        )}

        {/* MAIN */}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* FORM */}

          <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm">

            <h2 className="text-xl font-bold mb-6">
              Product Information
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* NAME */}

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Product Name
                </label>

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Fresh Tomatoes"
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              {/* CATEGORY + FARMING */}

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
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
                  <label className="block font-semibold text-gray-700 mb-2">
                    Farming Type
                  </label>

                  <select
                    name="farmingType"
                    value={formData.farmingType}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl"
                  >
                    <option value="Organic">
                      Organic
                    </option>

                    <option value="Non-Organic">
                      Non-Organic
                    </option>
                  </select>
                </div>

              </div>

              {/* PRICE + QUANTITY */}

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Price per Kg
                  </label>

                  <div className="relative">

                    <span className="absolute left-3 top-3 text-gray-500">
                      ₹
                    </span>

                    <input
                      name="pricePerKg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerKg}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full p-3 pl-8 border rounded-xl"
                      required
                    />

                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Available Stock (Kg)
                  </label>

                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className="w-full p-3 border rounded-xl"
                    required
                  />
                </div>

              </div>

              {/* IMAGE */}

              <div>

                <label className="block font-semibold text-gray-700 mb-2">
                  Product Image
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-green-400 transition">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>

                    <div className="flex-1">

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageChange}
                        className="w-full"
                      />

                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG or WebP • Maximum 5MB
                      </p>

                    </div>

                  </div>

                  {imageFile && (
                    <p className="text-sm text-green-600 mt-3">
                      ✓ {imageFile.name}
                    </p>
                  )}

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block font-semibold text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your product..."
                  rows="5"
                  className="w-full p-3 border rounded-xl resize-none"
                />

              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 disabled:opacity-60 transition"
              >
                {uploading
                  ? 'Uploading & Saving...'
                  : 'Add Product'}
              </button>

            </form>

          </div>

          {/* PREVIEW */}

          <div className="bg-white border rounded-2xl p-5 shadow-sm h-fit">

            <h2 className="text-xl font-bold mb-4">
              Product Preview
            </h2>

            <div className="border rounded-2xl overflow-hidden">

              <div className="h-56 bg-gray-100 flex items-center justify-center">

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No image selected</p>
                  </div>
                )}

              </div>

              <div className="p-5">

                <div className="flex gap-2 mb-3">

                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {formData.category}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      formData.farmingType === 'Organic'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {formData.farmingType}
                  </span>

                </div>

                <h3 className="text-xl font-bold">
                  {formData.name || 'Product Name'}
                </h3>

                <p className="text-green-700 text-xl font-bold mt-3">
                  ₹{formData.pricePerKg || '0'} / kg
                </p>

                <p className="text-gray-500 mt-2">
                  {formData.quantity || '0'} kg available
                </p>

                <p className="text-gray-500 text-sm mt-4">
                  {formData.description ||
                    'Your product description will appear here.'}
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AddProduct;