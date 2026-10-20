const path = require('path');
const { LocalStorage } = require('node-localstorage');

const ls = new LocalStorage(path.join(__dirname, '..', '..', 'storage'));
const users = JSON.parse(ls.getItem('users') || '[]');

const save = () => ls.setItem('users', JSON.stringify(users));

module.exports = { users, save };