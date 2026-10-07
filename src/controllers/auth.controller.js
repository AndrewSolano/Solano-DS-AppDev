const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

function signToken(user) {
  return jwt.sign(
    { userId: user.id },                       // payload: keep it small, no secrets
    process.env.JWT_SECRET,                    // the server-only secret
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, bio } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (User.findByEmail(email)) {
      return res.status(409).json({ error: "Email is already registered" });
    }
    if (User.findByUsername(username)) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10); // never store plain passwords
    User.create({ username, email, passwordHash, bio: bio || "" });

    res.status(201).json({ message: "Account created. You can log in now." });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = User.findByEmail(email);

    // Same message for both cases so attackers can't tell which emails exist
    const valid = user && (await bcrypt.compare(password || "", user.passwordHash));
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ token: signToken(user) });
  } catch (err) {
    next(err);
  }
};
