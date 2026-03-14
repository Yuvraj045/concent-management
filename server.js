require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const bannerRoutes = require('./routes/banners');
const consentRoutes = require('./routes/consent');

const app = express();

// Connect to MongoDB
connectDB();

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', authRoutes);
app.use('/', bannerRoutes);
app.use('/', consentRoutes);

// Root redirect
app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (token) return res.redirect('/dashboard');
  res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
