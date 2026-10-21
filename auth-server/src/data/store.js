const path = require('path'); //handles saving and loading user data in the Auth Server
const { LocalStorage } = require('node-localstorage'); //allows program to save and retrieve data from local storage files.

const ls = new LocalStorage(path.join(__dirname, '..', '..', 'storage')); //'storage' is the folder where the data will be stored.
const users = JSON.parse(ls.getItem('users') || '[]'); //retrieves the saved user data using the key 'users'

const save = () => ls.setItem('users', JSON.stringify(users)); //saves the current users array

module.exports = { users, save }; //exports users and save so other JavaScript files can use them.