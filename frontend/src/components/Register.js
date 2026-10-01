// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Leaf, User, Mail, Lock, ArrowRight, Wheat, MapPin, Home as HomeIcon } from 'lucide-react';

function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'farmer' ? 'farmer' : 'customer';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: initialRole,
    farmName: '',
  });
  const [farmLocation, setFarmLocation] = useState({
    village: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const onLocationChange = (e) => {
    setFarmLocation({ ...farmLocation, [e.target.name]: e.target.value });
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'farmer') {
      if (!formData.farmName || !farmLocation.village || !farmLocation.city || !farmLocation.state || !farmLocation.pincode) {
        setError('Please fill in your farm name and full location');
        return;
      }
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'farmer' && {
          farmName: formData.farmName,
          farmLocation,
        }),
      });

      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFarmer = formData.role === 'farmer';

  return (
    <div className="min-h-screen bg-[#f4f9f1] flex">
      {/* Left: leafy brand panel (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-[#123a24] via-[#1b4d32] to-[#2d6a4f] overflow-hidden">
        <LeafField />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="inline-flex items-center gap-2 w-fit">
            <div className="bg-white/15 backdrop-blur p-2 rounded-lg border border-white/20">
              <Leaf className="w-5 h-5 text-[#95d5b2]" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">FarmDirect</span>
          </Link>

          <div>
            <Wheat className="w-10 h-10 text-[#95d5b2] mb-5" />
            <h1 className="text-4xl font-serif font-bold leading-tight mb-4">
              Plant your place in the harvest.
            </h1>
            <p className="text-[#cfe8db] text-sm leading-relaxed max-w-sm">
              Whether you're growing it or buying it, FarmDirect keeps every
              transaction transparent and fair.
            </p>
          </div>

          <p className="text-xs text-[#9cc5ab]">© 2026 FarmDirect. Grown with care.</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden pt-10 px-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-[#1b4d32] p-2 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#16241a]">FarmDirect</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-serif font-bold mb-1 text-[#16241a]">Join FarmDirect</h2>
            <p className="text-[#5c6b58] text-sm mb-6">
              Fair prices, full transparency — from farm to table.
            </p>

            {error && (
              <div className="mb-5 p-3 bg-[#fdf0e8] border border-[#e8c2ab] text-[#a84f21] text-sm rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3.5">
              {/* Role toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#e6f2e1] rounded-full">
                {['customer', 'farmer'].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setFormData({ ...formData, role: r })}
                    disabled={loading}
                    className={`py-2 rounded-full text-sm font-semibold capitalize transition ${
                      formData.role === r
                        ? 'bg-[#1b4d32] text-white shadow-sm'
                        : 'text-[#4a5c46] hover:text-[#1b4d32]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div className="relative">
                <User className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={onChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={onChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={onChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password2"
                  placeholder="Confirm password"
                  value={formData.password2}
                  onChange={onChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  required
                  disabled={loading}
                />
              </div>

              {/* Farm details — only for farmers */}
              {isFarmer && (
                <div className="pt-2 border-t border-[#e0ecd9] space-y-3.5">
                  <p className="text-xs font-semibold text-[#4a5c46] uppercase tracking-wide pt-2">
                    Farm details
                  </p>

                  <div className="relative">
                    <Wheat className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="farmName"
                      placeholder="Farm name"
                      value={formData.farmName}
                      onChange={onChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                      required={isFarmer}
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <HomeIcon className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="village"
                      placeholder="Village / area"
                      value={farmLocation.village}
                      onChange={onLocationChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                      required={isFarmer}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="city"
                      placeholder="City / district"
                      value={farmLocation.city}
                      onChange={onLocationChange}
                      className="w-full px-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                      required={isFarmer}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={farmLocation.state}
                      onChange={onLocationChange}
                      className="w-full px-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                      required={isFarmer}
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#8fa389] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode"
                      value={farmLocation.pincode}
                      onChange={onLocationChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                      required={isFarmer}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1b4d32] text-white py-3 rounded-full font-semibold hover:bg-[#123a24] transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating account...' : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-sm text-[#5c6b58]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1b4d32] font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Decorative leaf-field background used on the brand panel
function LeafField() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-20"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {[...Array(14)].map((_, i) => {
        const x = (i * 53) % 400;
        const y = (i * 97) % 800;
        const r = 20 + (i % 4) * 10;
        const rot = (i * 37) % 360;
        return (
          <path
            key={i}
            transform={`translate(${x},${y}) rotate(${rot})`}
            d={`M0,0 C${r},-${r} ${r * 1.6},${r * 0.4} 0,${r * 1.8} C-${r * 1.6},${r * 0.4} -${r},-${r} 0,0 Z`}
            stroke="#95d5b2"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

export default Register;