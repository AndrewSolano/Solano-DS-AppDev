const router = require('express').Router();  //Shows only the blog posts created by the logged-in user 1 route
const c = require('../controllers/postController');  //imports functions for handling blog posts
const authenticate = require('../middleware/authenticate'); //checks whether the user has a valid access token

router.get('/posts', authenticate, c.mine); //checks whether the user has a valid access token

module.exports = router; //Exports the router so the main server file can use it