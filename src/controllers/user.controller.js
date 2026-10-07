const User = require("../models/user.model");

// GET /api/users/me  -> small payload used by the dashboard greeting
exports.getMe = (req, res) => {
  const user = User.findById(req.user.userId); // req.user was set by the auth middleware
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ id: user.id, username: user.username, email: user.email });
};

// GET /api/users/about-me  -> full profile of the logged-in user
exports.getAboutMe = (req, res) => {
  const user = User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { username, email, bio } = user; // pick fields explicitly, never send passwordHash
  res.json({ username, email, bio });
};

// GET /api/users  -> every registered user (public fields only)
exports.getAllUsers = (req, res) => {
  res.json(User.findAll());
};
