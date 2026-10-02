// src/components/BudgetCalculator.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Calculator, Trash2, Save, RefreshCw, Sprout, TrendingUp, Wallet, Target } from 'lucide-react';

const API = `${
  process.env.REACT_APP_API_URL ||
  'https://farmdirect-backend-gd6o.onrender.com/api'
}/budget`;

const emptyForm = {
  cropName: '',
  landSize: '',
  seedCost: '',
  fertilizerCost: '',
  laborCost: '',
  irrigationCost: '',
  otherCost: '',
  expectedYieldKg: '',
  expectedPricePerKg: '',
};

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function BudgetCalculator() {
  const token = localStorage.getItem('token');
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const headers = useMemo(() => ({ 'x-auth-token': token }), [token]);

  const loadPlans = async () => {
    if (!token) return;
    setLoadingPlans(true);
    try {
      const res = await axios.get(API, { headers });
      setSavedPlans(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not load saved plans.');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setMessage('');
  };

  const calculate = async e => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post(`${API}/calculate`, form, { headers });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not calculate the budget.');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!result) {
      setError('Calculate the budget before saving it.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(API, { ...form, ...result }, { headers });
      setSavedPlans(prev => [res.data, ...prev]);
      setMessage('Budget plan saved successfully.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not save the budget plan.');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async id => {
    if (!window.confirm('Delete this saved budget plan?')) return;
    try {
      await axios.delete(`${API}/${id}`, { headers });
      setSavedPlans(prev => prev.filter(plan => plan._id !== id));
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not delete the plan.');
    }
  };

  const loadPlan = plan => {
    setForm({
      cropName: plan.cropName || '',
      landSize: plan.landSize ?? '',
      seedCost: plan.seedCost ?? '',
      fertilizerCost: plan.fertilizerCost ?? '',
      laborCost: plan.laborCost ?? '',
      irrigationCost: plan.irrigationCost ?? '',
      otherCost: plan.otherCost ?? '',
      expectedYieldKg: plan.expectedYieldKg ?? '',
      expectedPricePerKg: plan.expectedPricePerKg ?? '',
    });
    setResult({
      totalCost: plan.totalCost,
      expectedRevenue: plan.expectedRevenue,
      expectedProfit: plan.expectedProfit,
      profitMargin: plan.profitMargin,
      breakEvenPrice: plan.breakEvenPrice,
      costPerAcre: plan.costPerAcre,
      isViable: plan.isViable,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setForm(emptyForm);
    setResult(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#f4f9f1] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-2xl">
              <Calculator className="w-7 h-7 text-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-950">Farm Budget Planner</h1>
              <p className="text-gray-600 mt-1">Estimate costs, revenue, profit and break-even price before planting.</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700">{message}</div>}

        <div className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={calculate} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Plan your crop</h2>
                <p className="text-sm text-gray-500">Enter your estimated farming costs and expected returns.</p>
              </div>
              <Sprout className="text-green-600" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Crop / Plan name" name="cropName" value={form.cropName} onChange={onChange} placeholder="e.g. Tomato Rabi Crop" />
              <Field label="Land size (acres) *" name="landSize" value={form.landSize} onChange={onChange} type="number" min="0.01" step="0.01" required />
              <Field label="Seed cost (₹)" name="seedCost" value={form.seedCost} onChange={onChange} type="number" min="0" step="0.01" />
              <Field label="Fertilizer cost (₹)" name="fertilizerCost" value={form.fertilizerCost} onChange={onChange} type="number" min="0" step="0.01" />
              <Field label="Labor cost (₹)" name="laborCost" value={form.laborCost} onChange={onChange} type="number" min="0" step="0.01" />
              <Field label="Irrigation cost (₹)" name="irrigationCost" value={form.irrigationCost} onChange={onChange} type="number" min="0" step="0.01" />
              <Field label="Other costs (₹)" name="otherCost" value={form.otherCost} onChange={onChange} type="number" min="0" step="0.01" />
              <Field label="Expected yield (kg) *" name="expectedYieldKg" value={form.expectedYieldKg} onChange={onChange} type="number" min="0.01" step="0.01" required />
              <Field label="Expected selling price (₹/kg) *" name="expectedPricePerKg" value={form.expectedPricePerKg} onChange={onChange} type="number" min="0" step="0.01" required />
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button disabled={loading} className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                {loading ? 'Calculating...' : 'Calculate Budget'}
              </button>
              <button type="button" onClick={savePlan} disabled={!result || loading} className="inline-flex items-center gap-2 border border-green-700 text-green-800 hover:bg-green-50 disabled:opacity-50 px-5 py-2.5 rounded-xl font-semibold">
                <Save className="w-4 h-4" /> Save Plan
              </button>
              <button type="button" onClick={reset} className="px-5 py-2.5 rounded-xl border text-gray-700 hover:bg-gray-50">Reset</button>
            </div>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Budget summary</h2>
            {result ? (
              <div className="space-y-4">
                <Metric icon={<Wallet />} label="Total Cost" value={money(result.totalCost)} />
                <Metric icon={<TrendingUp />} label="Expected Revenue" value={money(result.expectedRevenue)} />
                <Metric icon={<Target />} label="Expected Profit" value={money(result.expectedProfit)} valueClass={result.expectedProfit >= 0 ? 'text-green-700' : 'text-red-600'} />
                <Metric icon={<Calculator />} label="Break-even Price" value={`${money(result.breakEvenPrice)}/kg`} />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Profit Margin</p><p className="text-lg font-bold">{result.profitMargin}%</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Cost / Acre</p><p className="text-lg font-bold">{money(result.costPerAcre)}</p></div>
                </div>
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.isViable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
                  {result.isViable ? 'Estimated plan is profitable based on your inputs.' : 'Estimated plan is not profitable based on your inputs.'}
                </div>
                <p className="text-xs text-gray-500">These are estimates based only on the values you entered; actual farm results can differ.</p>
              </div>
            ) : (
              <div className="h-full min-h-64 flex items-center justify-center text-center text-gray-500 bg-gray-50 rounded-xl p-6">
                <div><Calculator className="w-10 h-10 mx-auto mb-3 text-green-500" /><p>Enter your crop details and calculate the plan.</p></div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-5">
            <div><h2 className="text-xl font-bold">Saved budget plans</h2><p className="text-sm text-gray-500">Reuse or compare your previous farm plans.</p></div>
            <button onClick={loadPlans} className="p-2 rounded-lg hover:bg-gray-100" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {loadingPlans ? <p className="text-gray-500">Loading plans...</p> : savedPlans.length === 0 ? <p className="text-gray-500">No saved plans yet.</p> : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {savedPlans.map(plan => (
                <div key={plan._id} className="border rounded-xl p-4 hover:shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div><h3 className="font-bold text-gray-900">{plan.cropName || 'Unnamed crop plan'}</h3><p className="text-xs text-gray-500">{plan.landSize} acres</p></div>
                    <span className={`text-xs px-2 py-1 rounded-full h-fit ${plan.isViable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{plan.isViable ? 'Profitable' : 'Review plan'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div><span className="text-gray-500">Cost</span><p className="font-semibold">{money(plan.totalCost)}</p></div>
                    <div><span className="text-gray-500">Profit</span><p className="font-semibold">{money(plan.expectedProfit)}</p></div>
                    <div><span className="text-gray-500">Revenue</span><p className="font-semibold">{money(plan.expectedRevenue)}</p></div>
                    <div><span className="text-gray-500">Break-even</span><p className="font-semibold">{money(plan.breakEvenPrice)}/kg</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => loadPlan(plan)} className="flex-1 border rounded-lg py-2 text-sm font-semibold hover:bg-gray-50">Load</button>
                    <button onClick={() => deletePlan(plan._id)} className="px-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return <label className="block"><span className="block text-sm font-medium text-gray-700 mb-1">{label}</span><input {...props} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-200 focus:border-green-600" /></label>;
}

function Metric({ icon, label, value, valueClass = 'text-gray-900' }) {
  return <div className="flex items-center justify-between gap-4 border-b pb-3"><div className="flex items-center gap-2 text-gray-600">{React.cloneElement(icon, { className: 'w-4 h-4 text-green-600' })}<span>{label}</span></div><strong className={valueClass}>{value}</strong></div>;
}

export default BudgetCalculator;
