const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { users, save } = require('../data/store');

const ROLES = ['reader', 'author', 'admin'];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, 'hex'));
}

exports.register = (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role)
    return res.status(400).json({ error: 'username, password and role are required' });
  if (!ROLES.includes(role))
    return res.status(400).json({ error: 'role must be reader, author or admin' });
  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'Username already taken' });

  const user = {
    id: users.reduce((max, u) => Math.max(max, u.id), 0) + 1,
    username,
    hashed_password: hashPassword(password),
    role,
    refresh_token: null,
    created_at: new Date().toISOString(),
    revoked_at: null,
  };
  users.push(user);
  save();
  res.status(201).json({ id: user.id, username: user.username, role: user.role });
};

exports.login = (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'username and password are required' });

  const user = users.find(u => u.username === username);
  if (!user || !verifyPassword(password, user.hashed_password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  user.refresh_token = refreshToken;
  user.revoked_at = null;
  save();
  res.status(200).json({ accessToken, refreshToken });
};

exports.refresh = (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  if (payload.type !== 'refresh')
    return res.status(401).json({ error: 'Not a refresh token' });

  const user = users.find(u => u.id === payload.id);
  if (!user || user.refresh_token !== refreshToken)
    return res.status(401).json({ error: 'Refresh token revoked' });

  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.status(200).json({ accessToken });
};

exports.logout = (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  const user = users.find(u => u.refresh_token === refreshToken);
  if (user) {
    user.refresh_token = null;
    user.revoked_at = new Date().toISOString();
    save();
  }
  res.status(200).json({ message: 'Logged out' });
};