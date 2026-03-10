/* ============================================================
   MaternaCheck — Vercel Serverless API Entry Point
   Wraps the Express app for Vercel's serverless environment
   ============================================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const checkRoutes = require('../backend/routes/checkRoutes');
const doctorRoutes = require('../backend/routes/doctorRoutes');

const app = express();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.options('*', cors());
app.use(express.json());

// API routes
app.use('/api', checkRoutes);
app.use('/api/doctor', doctorRoutes);

// Export for Vercel
module.exports = app;
