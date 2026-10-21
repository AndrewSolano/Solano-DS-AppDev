module.exports = (...roles) => (req, res, next) => { // checks if user is reader, author, or admin
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  next();
};