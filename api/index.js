/* ============================================================
   MaternaCheck — Vercel Serverless API Entry Point
   Wraps the Express app for Vercel's serverless environment
   ============================================================ */

require('dotenv').config();
const express = require('express');

const checkRoutes = require('../backend/routes/checkRoutes');
const doctorRoutes = require('../backend/routes/doctorRoutes');

const app = express();

// Manual CORS — runs before everything else
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// API routes
app.use('/api', checkRoutes);
app.use('/api/doctor', doctorRoutes);

// Export for Vercel
module.exports = app;
