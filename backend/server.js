// backend/server.js

const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');

const app = express();

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  express.json({
    extended: false,
  })
);


const allowedOrigins = [
  'http://localhost:3000',
  'https://farmdirect-frontend-ecru.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));


// =====================================================
// ROUTES
// =====================================================

app.use(
  '/api/users',
  require('./routes/users')
);

app.use(
  '/api/auth',
  require('./routes/auth')
);

app.use(
  '/api/products',
  require('./routes/products')
);

app.use(
  '/api/orders',
  require('./routes/orders')
);

app.use(
  '/api/customer-spending',
  require('./routes/customerSpending')
);

app.use(
  '/api/budget',
  require('./routes/budget')
);

app.use(
  '/api/cart',
  require('./routes/cart')
);

// NEW CUSTOMER ROUTES

app.use(
  '/api/customer',
  require('./routes/customer')
);

app.use(
  '/api/addresses',
  require('./routes/addresses')
);

app.use(
  '/api/notifications',
  require('./routes/notifications')
);

app.use(
  '/api/wishlist',
  require('./routes/wishlist')
);

app.use(
  '/api/recommendations',
  require('./routes/recommendations')
);
app.use('/api/reviews', require('./routes/reviews'));

app.use('/api/ai', require('./routes/ai'));
app.use('/api/farmers', require('./routes/farmers'));

app.use('/api/ai', require('./routes/customerAI'));
app.use('/api/ai', require('./routes/customerSmartRecommendations'));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/', (req, res) => {
  res.json({
    message: 'FarmDirect API is running',
  });
});

// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `FarmDirect backend running on port ${PORT}`
  );

  console.log(
    `API: http://localhost:${PORT}`
  );
});