const express = require("express");
const path = require("path");
const { users, getNextId } = require("./db");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/signup", (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = users.find((u) => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const newUser = { id: getNextId(), email, username, password };
  users.push(newUser);
  res.status(201).json({ message: "Signup successful", user: { id: newUser.id, username: newUser.username } });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(404).json({ message: "Invalid username or password" });
  }

  res.status(200).json({ message: "Login successful", user: { id: user.id, username: user.username } });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));