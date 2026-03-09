/* ============================================================
   MaternaCheck — Express Backend Server
   ============================================================ */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const checkRoutes = require('./routes/checkRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', checkRoutes);
app.use('/api/doctor', doctorRoutes);

// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  🌸 MaternaCheck server running at http://localhost:${PORT}\n`);
});
