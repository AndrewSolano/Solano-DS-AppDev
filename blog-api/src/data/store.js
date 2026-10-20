const path = require('path');
const { LocalStorage } = require('node-localstorage');

const ls = new LocalStorage(path.join(__dirname, '..', '..', 'storage'));
const posts = JSON.parse(ls.getItem('posts') || '[]');

const save = () => ls.setItem('posts', JSON.stringify(posts));

module.exports = { posts, save };