/* ============================================================
   MaternaCheck — Doctor Authentication & Dashboard Routes
   ============================================================ */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getStats, getSubmissions } = require('../logic/store');

// In-memory doctor accounts (hackathon-level, no DB)
// In production, use a proper database + bcrypt
const DOCTORS = [
  { id: 1, username: 'doctor', password: hashPassword('doctor123'), name: 'Dr. Admin' },
  { id: 2, username: 'research', password: hashPassword('research123'), name: 'Dr. Research' }
];

// Active sessions (token -> doctor)
const sessions = new Map();

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.slice(7);
  const doctor = sessions.get(token);
  if (!doctor) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
  req.doctor = doctor;
  next();
}

/**
 * POST /api/doctor/login
 * Input:  { username, password }
 * Output: { token, doctor: { id, name } }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const hashed = hashPassword(password);
  const doctor = DOCTORS.find(d => d.username === username && d.password === hashed);

  if (!doctor) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = generateToken();
  sessions.set(token, { id: doctor.id, name: doctor.name });

  res.json({
    token,
    doctor: { id: doctor.id, name: doctor.name }
  });
});

/**
 * POST /api/doctor/logout
 */
router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization.slice(7);
  sessions.delete(token);
  res.json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/doctor/me
 * Returns the logged-in doctor's info
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ doctor: req.doctor });
});

/**
 * GET /api/doctor/stats
 * Returns aggregated statistics for the dashboard
 */
router.get('/stats', requireAuth, async (req, res) => {
  const stats = await getStats();
  res.json(stats);
});

/**
 * GET /api/doctor/submissions
 * Returns all raw submissions for research
 */
router.get('/submissions', requireAuth, async (req, res) => {
  const all = await getSubmissions();
  // Return newest first, wrapped in { submissions: [...] }
  res.json({ submissions: all.slice().reverse() });
});

module.exports = router;
