const crypto = require('crypto');

// In-memory organizer sessions (cleared on server restart)
const tokens = new Set();

function login(req, res) {
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD || 'admin123';
  if (!password || password !== expected) {
    return res.status(401).json({ error: 'Invalid organizer password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  tokens.add(token);
  res.json({ token });
}

function requireOrganizer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ error: 'Organizer login required' });
  }
  next();
}

module.exports = { login, requireOrganizer };
