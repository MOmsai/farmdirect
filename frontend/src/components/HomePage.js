import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, Sprout, TrendingUp, Calculator, MessageSquare, CheckCircle2, Wheat } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  const stats = [
    { number: '500+', label: 'Verified Farmers' },
    { number: '10,000+', label: 'Happy Customers' },
    { number: '50,000+', label: 'Orders Delivered' },
    { number: '₹2Cr+', label: 'Paid to Farmers' }
  ];

  const features = [
    { icon: <Sprout className="w-7 h-7" />, title: 'Direct from Farm', desc: 'No middlemen — produce comes straight from the grower to your door.' },
    { icon: <TrendingUp className="w-7 h-7" />, title: 'AI Crop Guidance', desc: 'Farmers get weather-aware crop and pricing recommendations.' },
    { icon: <Calculator className="w-7 h-7" />, title: 'Budget Calculator', desc: 'Plan expenses and forecast profits before you plant.' },
    { icon: <MessageSquare className="w-7 h-7" />, title: '24/7 AI Assistant', desc: 'Instant answers on crops, pests, pricing and weather.' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f9f1] text-[#16241a]">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-[#f4f9f1]/90 backdrop-blur-md border-b border-[#d9e8d3] z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#1b4d32] p-2 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">FarmDirect</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4a5c46]">
            <a href="#features" className="hover:text-[#1b4d32] transition">Features</a>
            <a href="#how" className="hover:text-[#1b4d32] transition">How it Works</a>
            <button onClick={() => navigate('/login')} className="hover:text-[#1b4d32] transition">Login</button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/register?role=customer')}
              className="text-sm font-semibold text-[#1b4d32] border border-[#1b4d32] px-4 py-2 rounded-full hover:bg-[#1b4d32] hover:text-white transition"
            >
              Shop Now
            </button>
            <button
              onClick={() => navigate('/register?role=farmer')}
              className="text-sm font-semibold bg-[#8b5e34] text-white px-4 py-2 rounded-full hover:bg-[#6f4a29] transition"
            >
              Sell Produce
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 border-b border-[#d9e8d3] overflow-hidden">
        <LeafField className="absolute inset-0 opacity-[0.08] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#d8f3dc] text-[#1b4d32] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Leaf className="w-4 h-4" /> AI-powered farm to table
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-[1.1] mb-6">
              Fresh produce,<br/>
              <span className="text-[#2d6a4f]">honestly grown.</span>
            </h1>
            <p className="text-lg text-[#4a5c46] mb-10 leading-relaxed max-w-md">
              FarmDirect connects local farmers directly with customers — fair prices, full transparency, and AI tools that help both sides succeed.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/register?role=customer')}
                className="bg-[#1b4d32] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#123a24] transition flex items-center gap-2"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/register?role=farmer')}
                className="bg-white border border-[#cfe0c8] text-[#16241a] px-8 py-3.5 rounded-full font-semibold hover:border-[#1b4d32] transition"
              >
                Join as Farmer
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden border border-[#d9e8d3] shadow-xl">
              <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=700" alt="Farm produce" className="w-full h-[420px] object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-5 border border-[#d9e8d3] flex items-center gap-3">
              <div className="bg-[#d8f3dc] p-2.5 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-[#1b4d32]" />
              </div>
              <div>
                <p className="font-bold text-sm">100% Organic Verified</p>
                <p className="text-xs text-[#6b7d66]">Certified fresh daily</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative bg-gradient-to-br from-[#123a24] to-[#1b4d32] py-14 overflow-hidden">
        <LeafField className="absolute inset-0 opacity-10 pointer-events-none" light />
        <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-serif font-bold text-white mb-1">{s.number}</p>
              <p className="text-[#a8d5bb] text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-3">Built for both sides of the harvest</h2>
            <p className="text-[#4a5c46] text-lg">Practical tools, not gimmicks.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-[#d9e8d3] rounded-2xl p-7 hover:border-[#1b4d32] hover:shadow-md transition">
                <div className="bg-[#d8f3dc] text-[#1b4d32] w-14 h-14 rounded-xl flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-[#4a5c46] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-[#eaf4e5] border-y border-[#d9e8d3]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: <Sprout className="w-8 h-8" />, t: 'Browse or List', d: 'Customers explore fresh listings; farmers list produce with AI-suggested pricing.' },
              { icon: <Leaf className="w-8 h-8" />, t: 'Order Transparently', d: 'Every order shows the farmer, harvest date, and price breakdown — no hidden markup.' },
              { icon: <Wheat className="w-8 h-8" />, t: 'Grow with Data', d: 'Farmers use weather forecasts and the budget calculator to plan the next season.' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-[#d9e8d3]">
                <div className="text-[#2d6a4f]">{s.icon}</div>
                <h3 className="text-xl font-bold mt-4 mb-2">{s.t}</h3>
                <p className="text-[#4a5c46] text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-serif font-bold mb-4">Ready to taste the difference?</h2>
          <p className="text-[#4a5c46] mb-8">Join thousands already growing and shopping with FarmDirect.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/register?role=customer')}
              className="bg-[#1b4d32] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#123a24] transition"
            >
              Register as Customer
            </button>
            <button
              onClick={() => navigate('/register?role=farmer')}
              className="bg-[#8b5e34] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#6f4a29] transition"
            >
              Register as Farmer
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2b1d] text-[#a8c5ab] py-14 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-6 h-6 text-[#95d5b2]" />
              <span className="text-white font-serif font-bold text-lg">FarmDirect</span>
            </div>
            <p className="text-sm leading-relaxed">Connecting farmers and customers for a transparent, sustainable food system.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition">Login</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-white transition">Register</button></li>
              <li>Marketplace</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">For Farmers</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/register?role=farmer')} className="hover:text-white transition">Join as Farmer</button></li>
              <li>Budget Calculator</li>
              <li>AI Crop Guide</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@farmdirect.com</li><li>+91 98765 43210</li><li>New Delhi, India</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 text-xs text-center">
          © 2026 FarmDirect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Decorative scattered-leaf background, reused across sections
function LeafField({ className = '', light = false }) {
  const stroke = light ? '#ffffff' : '#1b4d32';
  return (
    <svg className={className} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
      {[...Array(24)].map((_, i) => {
        const x = (i * 137) % 1200;
        const y = (i * 211) % 600;
        const r = 16 + (i % 5) * 8;
        const rot = (i * 53) % 360;
        return (
          <path
            key={i}
            transform={`translate(${x},${y}) rotate(${rot})`}
            d={`M0,0 C${r},-${r} ${r * 1.6},${r * 0.4} 0,${r * 1.8} C-${r * 1.6},${r * 0.4} -${r},-${r} 0,0 Z`}
            stroke={stroke}
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}