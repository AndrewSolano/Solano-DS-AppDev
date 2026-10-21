const router = require('express').Router();  //tells the server which function to run register, log in, log out.
const c = require('../controllers/authController'); //imports authController file

router.post('/register', c.register); //run c.register when someone sends a POST request to /register
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);

module.exports = router; //makes the router available to other files to server.js or app.js