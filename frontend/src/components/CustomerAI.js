import React, { useState } from 'react';
import axios from 'axios';
import {
  Bot, Send, Sparkles, ShoppingCart, Loader2, ArrowLeft,
  Leaf, Wallet, Star, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const QUICK_QUESTIONS = [
  'Find organic vegetables under ₹500',
  'What can I buy with ₹300?',
  'Suggest healthy vegetables for this week',
  'What should I buy based on my previous orders?',
  'Help me stay within my monthly budget',
  'Suggest products from nearby farmers',
];

function CustomerAI() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [budgetNote, setBudgetNote] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingProduct, setAddingProduct] = useState(null);
  const [addedProducts, setAddedProducts] = useState({});
  const [error, setError] = useState('');

  const askAI = async (preset = null) => {
    const finalQuestion = String(preset !== null ? preset : question).trim();
    if (!finalQuestion) return setError('Please enter a question.');

    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      setLoading(true);
      setError('');
      setAnswer('');
      setBudgetNote('');
      setRecommendedProducts([]);
      setContext(null);

      const res = await axios.post(
        `${API_URL}/ai/customer-assistant`,
        { question: finalQuestion },
        { headers: { 'x-auth-token': token } }
      );

      setAnswer(res.data.answer || '');
      setBudgetNote(res.data.budgetNote || '');
      setRecommendedProducts(res.data.recommendedProducts || []);
      setContext(res.data.context || null);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        return navigate('/login');
      }
      setError(err.response?.data?.msg || err.response?.data?.message || 'Unable to generate AI response.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      setAddingProduct(product._id);
      setError('');

      await axios.post(
        `${API_URL}/cart/add`,
        { productId: product._id, quantity: 1 },
        { headers: { 'x-auth-token': token } }
      );

      setAddedProducts(prev => ({ ...prev, [product._id]: true }));
      window.dispatchEvent(new Event('cartUpdated'));

      setTimeout(() => {
        setAddedProducts(prev => ({ ...prev, [product._id]: false }));
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.msg || 'Unable to add product to cart.');
    } finally {
      setAddingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f1]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/customer-dashboard')} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm">
            <ArrowLeft className="h-4 w-4" /> Marketplace
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <Leaf className="h-5 w-5" /> FarmDirect AI
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-800 via-green-700 to-emerald-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">FarmDirect AI Shopping Assistant</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50">
                Ask about products, budgets, organic choices, previous purchases,
                wishlists, and what to buy next using live FarmDirect data.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-700" />
            <h2 className="font-bold text-gray-900">What can I help you find?</h2>
          </div>

          <textarea
            value={question}
            onChange={e => { setQuestion(e.target.value); setError(''); }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                askAI();
              }
            }}
            rows={4}
            maxLength={1000}
            placeholder="Example: I have ₹500. Suggest organic vegetables for this week."
            className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />

          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>Press Ctrl + Enter to ask</span>
            <span>{question.length}/1000</span>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-gray-700">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map(item => (
                <button
                  key={item}
                  onClick={() => { setQuestion(item); askAI(item); }}
                  disabled={loading}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={() => askAI()}
            disabled={loading || !question.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3.5 font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> FarmDirect AI is thinking...</> : <><Send className="h-5 w-5" /> Ask FarmDirect AI</>}
          </button>
        </section>

        {context && (
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500"><Wallet className="h-4 w-4 text-green-700" /> Monthly Budget</div>
              <p className="text-2xl font-bold">₹{Number(context.monthlyBudget || 0).toFixed(0)}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-sm text-gray-500">This Month's Spending</p>
              <p className="text-2xl font-bold">₹{Number(context.currentMonthSpending || 0).toFixed(0)}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-sm text-gray-500">Remaining Budget</p>
              <p className="text-2xl font-bold text-green-700">₹{Number(context.remainingBudget || 0).toFixed(0)}</p>
            </div>
          </section>
        )}

        {answer && (
          <section className="mt-6 rounded-3xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100"><Sparkles className="h-5 w-5 text-green-700" /></div>
              <div><h2 className="font-bold">FarmDirect AI</h2><p className="text-xs text-gray-500">Based on your FarmDirect shopping data</p></div>
            </div>
            <div className="whitespace-pre-wrap rounded-2xl bg-[#f4f9f1] p-5 text-sm leading-7 text-gray-700">{answer}</div>
            {budgetNote && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Budget note:</strong> {budgetNote}</div>}
          </section>
        )}

        {recommendedProducts.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xl font-bold text-gray-900">Suggested Products</h2>
            <p className="mb-4 text-sm text-gray-500">Selected from currently available FarmDirect products.</p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProducts.map(product => {
                const added = addedProducts[product._id];
                return (
                  <article key={product._id} className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
                    <button onClick={() => navigate(`/product/${product._id}`)} className="block w-full text-left">
                      <div className="relative h-44 bg-gray-100">
                        {product.imageUrl
                          ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          : <div className="flex h-full items-center justify-center"><Leaf className="h-10 w-10 text-green-300" /></div>}
                        <div className="absolute left-3 top-3 flex gap-2">
                          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-green-700">{product.farmingType}</span>
                          <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] text-white">{product.category}</span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="truncate text-lg font-bold">{product.name}</h3>
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round(Number(product.averageRating || 0)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{Number(product.averageRating || 0).toFixed(1)} ({Number(product.reviewCount || 0)})</span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <div><span className="text-2xl font-bold text-green-700">₹{Number(product.pricePerKg || 0).toFixed(0)}</span><span className="text-sm text-gray-500"> / kg</span></div>
                          <span className="text-xs text-gray-500">{Number(product.quantity || 0)} kg available</span>
                        </div>
                        <p className="mt-2 truncate text-xs text-gray-500">{product.farmer?.farmName || product.farmer?.name || 'Local Farmer'}</p>
                      </div>
                    </button>

                    <div className="px-4 pb-4">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={addingProduct === product._id || Number(product.quantity || 0) <= 0}
                        className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold ${added ? 'bg-green-700 text-white' : 'bg-green-600 text-white hover:bg-green-700'} disabled:opacity-50`}
                      >
                        {addingProduct === product._id
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                          : added
                            ? <><CheckCircle2 className="h-4 w-4" /> Added to Cart</>
                            : <><ShoppingCart className="h-4 w-4" /> Add 1 kg to Cart</>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default CustomerAI;
