const router = require('express').Router();
const c = require('../controllers/postController');
const authenticate = require('../middleware/authenticate');

router.get('/posts', authenticate, c.mine);

module.exports = router;