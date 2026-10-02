// src/components/FarmProfile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Wheat, MapPin, Home as HomeIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://farmdirect-backend-gd6o.onrender.com/api';

function FarmProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [farmer, setFarmer] = useState({ name: '', email: '' });
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState({
    village: '',
    city: '',
    state: '',
    pincode: '',
  });

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/auth/farm-profile`, {
        headers: { 'x-auth-token': token },
      })
      .then((res) => {
        setFarmer({ name: res.data.name, email: res.data.email });
        setFarmName(res.data.farmName || '');
        setFarmLocation({
          village: res.data.farmLocation?.village || '',
          city: res.data.farmLocation?.city || '',
          state: res.data.farmLocation?.state || '',
          pincode: res.data.farmLocation?.pincode || '',
        });
      })
      .catch((err) => {
        setError(err.response?.data?.msg || 'Failed to load farm profile');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const onLocationChange = (e) => {
    setFarmLocation({ ...farmLocation, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!farmName || !farmLocation.village || !farmLocation.city || !farmLocation.state || !farmLocation.pincode) {
      setError('Please fill in your farm name and full location');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        'http://localhost:5000/api/auth/farm-profile',
        { farmName, farmLocation },
        { headers: { 'x-auth-token': token } }
      );
      setFarmName(res.data.farmName);
      setFarmLocation(res.data.farmLocation);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f9f1] flex items-center justify-center">
        <p className="text-[#5c6b58]">Loading farm profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f9f1] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/farmer-dashboard')}
          className="flex items-center gap-1.5 text-sm text-[#4a5c46] hover:text-[#1b4d32] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>

        <div className="bg-white border border-[#d9e8d3] rounded-2xl shadow-sm p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-[#d8f3dc] text-[#1b4d32] w-11 h-11 rounded-xl flex items-center justify-center">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#16241a]">Farm Profile</h2>
              <p className="text-sm text-[#5c6b58]">{farmer.name} · {farmer.email}</p>
            </div>
          </div>

          <p className="text-sm text-[#5c6b58] mt-4 mb-6">
            This is what customers see on your product listings. Keep it accurate so
            people know exactly where their food is coming from.
          </p>

          {error && (
            <div className="mb-5 p-3 bg-[#fdf0e8] border border-[#e8c2ab] text-[#a84f21] text-sm rounded-xl">
              {error}
            </div>
          )}

          {saved && (
            <div className="mb-5 p-3 bg-[#e6f2e1] border border-[#bcdcb0] text-[#1b4d32] text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Farm profile updated
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a5c46] mb-1.5">Farm name</label>
              <div className="relative">
                <Wheat className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => { setFarmName(e.target.value); setSaved(false); }}
                  placeholder="e.g. Green Valley Farm"
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4a5c46] mb-1.5">Village / area</label>
              <div className="relative">
                <HomeIcon className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="village"
                  value={farmLocation.village}
                  onChange={onLocationChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4a5c46] mb-1.5">City / district</label>
                <input
                  type="text"
                  name="city"
                  value={farmLocation.city}
                  onChange={onLocationChange}
                  className="w-full px-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5c46] mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={farmLocation.state}
                  onChange={onLocationChange}
                  className="w-full px-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4a5c46] mb-1.5">Pincode</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="pincode"
                  value={farmLocation.pincode}
                  onChange={onLocationChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  disabled={saving}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-[#1b4d32] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#123a24] transition disabled:opacity-60 mt-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FarmProfile;