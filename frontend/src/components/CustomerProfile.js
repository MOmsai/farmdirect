import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';

import {
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Bell,
  Check,
  X,
  Save,
  ArrowLeft,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const API_URL =
  'https://farmdirect-backend-gd6o.onrender.com/api';

export default function CustomerProfile() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem('token');

  const [profile, setProfile] =
    useState({
      name: '',
      email: '',
      phone: '',
      profileImage: '',
    });

  const [addresses, setAddresses] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState(null);

  const emptyAddress = {
    label: 'Home',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  };

  const [addressForm, setAddressForm] =
    useState(emptyAddress);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const headers = {
        'x-auth-token': token,
      };

      const [
        profileRes,
        addressRes,
        notificationRes,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/customer/profile`,
          { headers }
        ),

        axios.get(
          `${API_URL}/addresses`,
          { headers }
        ),

        axios.get(
          `${API_URL}/notifications`,
          { headers }
        ),
      ]);

      setProfile({
        name:
          profileRes.data.name || '',
        email:
          profileRes.data.email || '',
        phone:
          profileRes.data.phone || '',
        profileImage:
          profileRes.data.profileImage || '',
      });

      setAddresses(
        addressRes.data || []
      );

      setNotifications(
        notificationRes.data.notifications ||
          []
      );

      setUnreadCount(
        notificationRes.data.unreadCount ||
          0
      );
    } catch (err) {
      console.error(
        'Customer profile load error:',
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
          'Unable to load profile'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // PROFILE
  // =====================================================

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });

    setSuccess('');
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response =
        await axios.put(
          `${API_URL}/customer/profile`,
          profile,
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

      setProfile({
        name:
          response.data.user.name ||
          '',
        email:
          response.data.user.email ||
          '',
        phone:
          response.data.user.phone ||
          '',
        profileImage:
          response.data.user.profileImage ||
          '',
      });

      setSuccess(
        'Profile updated successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          'Unable to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ADDRESS
  // =====================================================

  const openAddAddress = () => {
    setEditingAddress(null);

    setAddressForm({
      ...emptyAddress,
      fullName: profile.name,
      phone: profile.phone,
    });

    setShowAddressForm(true);
    setError('');
  };

  const openEditAddress = (address) => {
    setEditingAddress(address._id);

    setAddressForm({
      label:
        address.label || 'Home',
      fullName:
        address.fullName || '',
      phone:
        address.phone || '',
      street:
        address.street || '',
      city:
        address.city || '',
      state:
        address.state || '',
      pincode:
        address.pincode || '',
      isDefault:
        Boolean(address.isDefault),
    });

    setShowAddressForm(true);
    setError('');
  };

  const handleAddressChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setAddressForm({
      ...addressForm,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    });
  };

  const saveAddress = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      if (
        !/^\d{10}$/.test(
          addressForm.phone
        )
      ) {
        setError(
          'Phone number must contain 10 digits.'
        );
        return;
      }

      if (
        !/^\d{6}$/.test(
          addressForm.pincode
        )
      ) {
        setError(
          'Pincode must contain 6 digits.'
        );
        return;
      }

      const config = {
        headers: {
          'x-auth-token': token,
        },
      };

      if (editingAddress) {
        await axios.put(
          `${API_URL}/addresses/${editingAddress}`,
          addressForm,
          config
        );
      } else {
        await axios.post(
          `${API_URL}/addresses`,
          addressForm,
          config
        );
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm(emptyAddress);

      await loadData();

      setSuccess(
        editingAddress
          ? 'Address updated successfully.'
          : 'Address added successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          'Unable to save address'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (
    addressId
  ) => {
    const confirmed =
      window.confirm(
        'Delete this address?'
      );

    if (!confirmed) return;

    try {
      setError('');

      await axios.delete(
        `${API_URL}/addresses/${addressId}`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await loadData();

      setSuccess(
        'Address deleted successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          'Unable to delete address'
      );
    }
  };

  const setDefaultAddress = async (
    addressId
  ) => {
    try {
      setError('');

      await axios.patch(
        `${API_URL}/addresses/${addressId}/default`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await loadData();

      setSuccess(
        'Default address updated.'
      );
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          'Unable to update default address'
      );
    }
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const markNotificationRead =
    async (notificationId) => {
      try {
        await axios.patch(
          `${API_URL}/notifications/${notificationId}/read`,
          {},
          {
            headers: {
              'x-auth-token': token,
            },
          }
        );

        await loadData();
      } catch (err) {
        console.error(err);
      }
    };

  const markAllRead = async () => {
    try {
      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          Loading your profile...
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* HEADER */}

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() =>
              navigate(
                '/customer-dashboard'
              )
            }
            className="p-2 rounded-xl border bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <p className="text-green-600 text-sm font-semibold">
              FarmDirect
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Customer Profile
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your account, addresses
              and notifications.
            </p>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* PROFILE */}

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                <User className="w-6 h-6 text-green-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Personal Information
                </h2>

                <p className="text-sm text-gray-500">
                  Keep your account information
                  up to date.
                </p>
              </div>
            </div>

            <form
              onSubmit={saveProfile}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <input
                    name="name"
                    value={profile.name}
                    onChange={
                      handleProfileChange
                    }
                    className="w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={
                      handleProfileChange
                    }
                    className="w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={
                      handleProfileChange
                    }
                    maxLength={10}
                    className="w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="10-digit phone number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />

                {saving
                  ? 'Saving...'
                  : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* NOTIFICATION SUMMARY */}

          <div className="bg-white rounded-2xl border border-gray-200 p-6">

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-700" />
                </div>

                <div>
                  <h2 className="font-bold">
                    Notifications
                  </h2>

                  <p className="text-sm text-gray-500">
                    {unreadCount} unread
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-green-600 font-semibold hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">

              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications
                  .slice(0, 8)
                  .map((notification) => (
                    <button
                      key={
                        notification._id
                      }
                      onClick={() =>
                        !notification.isRead &&
                        markNotificationRead(
                          notification._id
                        )
                      }
                      className={`w-full text-left rounded-xl p-3 border transition ${
                        notification.isRead
                          ? 'bg-white border-gray-100'
                          : 'bg-green-50 border-green-100'
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold text-sm">
                          {
                            notification.title
                          }
                        </p>

                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {
                          notification.message
                        }
                      </p>
                    </button>
                  ))
              )}

            </div>
          </div>
        </div>

        {/* ADDRESS SECTION */}

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-700" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Delivery Addresses
                </h2>

                <p className="text-sm text-gray-500">
                  Save addresses for faster checkout.
                </p>
              </div>
            </div>

            <button
              onClick={openAddAddress}
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="border border-dashed rounded-2xl p-10 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />

              <h3 className="font-semibold text-gray-700">
                No saved addresses
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Add an address to make checkout
                faster.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">

              {addresses.map(
                (address) => (
                  <div
                    key={address._id}
                    className={`rounded-2xl border p-5 ${
                      address.isDefault
                        ? 'border-green-400 bg-green-50/40'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">
                            {address.label}
                          </h3>

                          {address.isDefault && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-gray-800 mt-3">
                          {address.fullName}
                        </p>

                        <p className="text-sm text-gray-500">
                          {address.phone}
                        </p>

                        <p className="text-sm text-gray-600 mt-2 leading-6">
                          {address.street}
                          <br />
                          {address.city},{' '}
                          {address.state}
                          <br />
                          {address.pincode}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            openEditAddress(
                              address
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </button>

                        <button
                          onClick={() =>
                            deleteAddress(
                              address._id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {!address.isDefault && (
                      <button
                        onClick={() =>
                          setDefaultAddress(
                            address._id
                          )
                        }
                        className="mt-4 text-sm text-green-700 font-semibold hover:underline"
                      >
                        Make default
                      </button>
                    )}
                  </div>
                )
              )}

            </div>
          )}
        </div>
      </div>

      {/* ADDRESS MODAL */}

      {showAddressForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">
                  {editingAddress
                    ? 'Edit Address'
                    : 'Add New Address'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enter your delivery details.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddressForm(false)
                }
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={saveAddress}
              className="p-6 space-y-5"
            >

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Address Type
                </label>

                <select
                  name="label"
                  value={addressForm.label}
                  onChange={
                    handleAddressChange
                  }
                  className="w-full border rounded-xl px-4 py-3"
                >
                  <option value="Home">
                    Home
                  </option>

                  <option value="Work">
                    Work
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Full Name
                  </label>

                  <input
                    name="fullName"
                    value={
                      addressForm.fullName
                    }
                    onChange={
                      handleAddressChange
                    }
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={
                      addressForm.phone
                    }
                    onChange={
                      handleAddressChange
                    }
                    maxLength={10}
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Street / House / Area
                </label>

                <input
                  name="street"
                  value={
                    addressForm.street
                  }
                  onChange={
                    handleAddressChange
                  }
                  className="w-full border rounded-xl px-4 py-3"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    City
                  </label>

                  <input
                    name="city"
                    value={
                      addressForm.city
                    }
                    onChange={
                      handleAddressChange
                    }
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    State
                  </label>

                  <input
                    name="state"
                    value={
                      addressForm.state
                    }
                    onChange={
                      handleAddressChange
                    }
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Pincode
                  </label>

                  <input
                    name="pincode"
                    value={
                      addressForm.pincode
                    }
                    onChange={
                      handleAddressChange
                    }
                    maxLength={6}
                    className="w-full border rounded-xl px-4 py-3"
                    required
                  />
                </div>

              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={
                    addressForm.isDefault
                  }
                  onChange={
                    handleAddressChange
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm font-semibold text-gray-700">
                  Set as default address
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddressForm(false)
                  }
                  className="px-5 py-3 border rounded-xl font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingAddress
                    ? 'Update Address'
                    : 'Save Address'}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}