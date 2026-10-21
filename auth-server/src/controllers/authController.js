const crypto = require('crypto'); //imports Node.js's built-in crypto
const jwt = require('jsonwebtoken');
const { users, save } = require('../data/store');

const ROLES = ['reader', 'author', 'admin'];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex'); //turn the password and salt into a hash
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, 'hex')); // compare the hash of the provided password with the stored hash in a timing-safe manner
}

exports.register = (req, res) => {  //handles registration of new users
  const { username, password, role } = req.body || {};
  if (!username || !password || !role)
    return res.status(400).json({ error: 'username, password and role are required' });
  if (!ROLES.includes(role))
    return res.status(400).json({ error: 'role must be reader, author or admin' });
  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'Username already taken' });

  const user = { //creates a new user, saves the user's information, and sends a success response
    id: users.reduce((max, u) => Math.max(max, u.id), 0) + 1, //if the highest ID is 3, the new user's ID will be 4
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

exports.login = (req, res) => { //function allows a registered user to log in to your website
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'username and password are required' });

  const user = users.find(u => u.username === username);
  if (!user || !verifyPassword(password, user.hashed_password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = jwt.sign( //create new accesstoken
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(//create refresh token
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  user.refresh_token = refreshToken; //stores the newly created refresh token
  user.revoked_at = null;
  save();
  res.status(200).json({ accessToken, refreshToken });
};

exports.refresh = (req, res) => { //creates a new access token when the user's old access token expires, as long as their refresh token is still valid.
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });//checks whether the refresh token is missing.

  let payload;//Check if the refresh token is valid
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  if (payload.type !== 'refresh') //Check whether it is a refresh token
    return res.status(401).json({ error: 'Not a refresh token' });

  const user = users.find(u => u.id === payload.id);//checks if the refresh token is still accepted or no longer accepted
  if (!user || user.refresh_token !== refreshToken)
    return res.status(401).json({ error: 'Refresh token revoked' });

  const accessToken = jwt.sign( // if refresh token is valid, create a new access token and send it back to the user
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.status(200).json({ accessToken });
};

exports.logout = (req, res) => { //logs the user out by removing their saved refresh token
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });//checks whether the refresh token is missing. If it is missing, the server sends a 400 error and stops the function.

  const user = users.find(u => u.refresh_token === refreshToken);
  if (user) { //clears the user's saved refresh token by setting it to null. The old token will no longer match the token saved for that user.
    user.refresh_token = null;
    user.revoked_at = new Date().toISOString();
    save();
  }
  res.status(200).json({ message: 'Logged out' });
};