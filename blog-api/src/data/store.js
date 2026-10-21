const path = require('path'); //handles saving and loading blog posts
const { LocalStorage } = require('node-localstorage'); //Loads LocalStorage from the node-localstorage package

const ls = new LocalStorage(path.join(__dirname, '..', '..', 'storage'));
const posts = JSON.parse(ls.getItem('posts') || '[]');

const save = () => ls.setItem('posts', JSON.stringify(posts)); //stores the current posts.

module.exports = { posts, save }; //Makes posts and save available to other JavaScript files.