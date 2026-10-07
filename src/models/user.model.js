// In-memory "database" for demo purposes. Data resets when the server restarts.
// Swap this file for MongoDB/Postgres later; the controllers won't need to change much.
const users = [];
let nextId = 1;

// Strip secrets before a user object ever leaves the server.
const toPublic = ({ id, username, email, bio }) => ({ id, username, email, bio });

module.exports = {
  findByEmail: (email) => users.find((u) => u.email === email),
  findByUsername: (username) => users.find((u) => u.username === username),
  findById: (id) => users.find((u) => u.id === id),
  findAll: () => users.map(toPublic),
  create: ({ username, email, passwordHash, bio = "" }) => {
    const user = { id: nextId++, username, email, passwordHash, bio };
    users.push(user);
    return user;
  },
  toPublic,
};
