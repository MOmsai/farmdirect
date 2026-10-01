// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import HomePage from './components/HomePage';
import Register from './components/Register';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import FarmerDashboard from './components/FarmerDashboard';
import FarmerProducts from './components/FarmerProducts';
import FarmerOrders from './components/FarmerOrders';
import FarmerAnalytics from './components/FarmerAnalytics';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';
import Navbar from './components/Navbar';
import BudgetCalculator from './components/BudgetCalculator';
import FarmProfile from './components/FarmProfile';
import CustomerFarmProfile from './components/CustomerFarmProfile';
import ProductDetails from './components/ProductDetails';
import CustomerSpending from './components/CustomerSpending';
import CustomerAI from './components/CustomerAI';
import CustomerSmartRecommendations from './components/CustomerSmartRecommendations';
import Wishlist from './components/Wishlist';


function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');

    const payload = JSON.parse(atob(parts[1]));
    const userRole = payload?.user?.role;

    if (!userRole) throw new Error('Role missing');

    if (roleRequired && userRole !== roleRequired) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    console.error('Authentication error:', error);
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <Navbar />

      <div className="min-h-screen">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Customer */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute roleRequired="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute roleRequired="customer">
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute roleRequired="customer">
                <OrderHistory />
              </ProtectedRoute>
            }
          />

          {/* Farmer */}
          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute roleRequired="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer-products"
            element={
              <ProtectedRoute roleRequired="farmer">
                <FarmerProducts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer-orders"
            element={
              <ProtectedRoute roleRequired="farmer">
                <FarmerOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer-analytics"
            element={
              <ProtectedRoute roleRequired="farmer">
                <FarmerAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budget-calculator"
            element={
              <ProtectedRoute roleRequired="farmer">
                <BudgetCalculator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farm-profile"
            element={
              <ProtectedRoute roleRequired="farmer">
                <FarmProfile />
              </ProtectedRoute>
            }
          />

          <Route
  path="/farmer/:farmerId"
  element={
    <ProtectedRoute roleRequired="customer">
      <CustomerFarmProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer/farmer/:farmerId"
  element={
    <ProtectedRoute roleRequired="customer">
      <CustomerFarmProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/product/:id"
  element={
    <ProtectedRoute roleRequired="customer">
      <ProductDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer-spending"
  element={
    <ProtectedRoute roleRequired="customer">
      <CustomerSpending />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer-ai"
  element={
    <ProtectedRoute roleRequired="customer">
      <CustomerAI />
    </ProtectedRoute>
  }
/>
<Route
  path="/customer-smart-recommendations"
  element={
    <ProtectedRoute roleRequired="customer">
      <CustomerSmartRecommendations />
    </ProtectedRoute>
  }
/>
<Route
  path="/wishlist"
  element={
    <ProtectedRoute roleRequired="customer">
      <Wishlist />
    </ProtectedRoute>
  }
/>


          {/* Unknown route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
