/* ============================================================
   MaternaCheck — Doctor Authentication & Dashboard Routes
   Stateless auth using HMAC-signed tokens (works on serverless)
   ============================================================ */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getStats, getSubmissions } = require('../logic/store');

// In-memory doctor accounts (hackathon-level, no DB)
const DOCTORS = [
  { id: 1, username: 'doctor', password: hashPassword('doctor123'), name: 'Dr. Admin' },
  { id: 2, username: 'research', password: hashPassword('research123'), name: 'Dr. Research' }
];

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'materna-check-secret-key-2024';

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function createToken(doctor) {
  const payload = Buffer.from(JSON.stringify({ id: doctor.id, name: doctor.name })).toString('base64');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return payload + '.' + sig;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64').toString()); } catch { return null; }
}

// Auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const doctor = verifyToken(authHeader.slice(7));
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

  const token = createToken(doctor);

  res.json({
    token,
    doctor: { id: doctor.id, name: doctor.name }
  });
});

/**
 * POST /api/doctor/logout
 */
router.post('/logout', requireAuth, (req, res) => {
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
 */
router.get('/stats', requireAuth, async (req, res) => {
  const stats = await getStats();
  res.json(stats);
});

/**
 * GET /api/doctor/submissions
 */
router.get('/submissions', requireAuth, async (req, res) => {
  const all = await getSubmissions();
  res.json({ submissions: all.slice().reverse() });
});

module.exports = router;
