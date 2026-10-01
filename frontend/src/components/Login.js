// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Leaf, Mail, Lock, ArrowRight, Sprout } from 'lucide-react';

function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'farmer' ? 'farmer' : 'customer';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        formData
      );

      localStorage.setItem('token', res.data.token);

      if (formData.role === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Sprout className="w-10 h-10 text-[#95d5b2] mb-5" />
            <h1 className="text-4xl font-serif font-bold leading-tight mb-4">
              Straight from the soil to your door.
            </h1>
            <p className="text-[#cfe8db] text-sm leading-relaxed max-w-sm">
              Every login connects you to a growing network of real farmers and
              the customers who trust them.
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

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-serif font-bold mb-1 text-[#16241a]">Welcome back</h2>
            <p className="text-[#5c6b58] text-sm mb-8">Log in to keep shopping or selling.</p>

            {error && (
              <div className="mb-5 p-3 bg-[#fdf0e8] border border-[#e8c2ab] text-[#a84f21] text-sm rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
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
                  placeholder="Password"
                  value={formData.password}
                  onChange={onChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#cfe0c8] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                  required
                  disabled={loading}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1b4d32] text-white py-3 rounded-full font-semibold hover:bg-[#123a24] transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Logging in...' : (
                  <>
                    Log In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-sm text-[#5c6b58]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#1b4d32] font-semibold hover:underline">
                Register
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

export default Login;