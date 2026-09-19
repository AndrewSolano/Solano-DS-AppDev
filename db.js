// db.js
let users = [];
let nextId = 1;

module.exports = { users, getNextId: () => nextId++ };