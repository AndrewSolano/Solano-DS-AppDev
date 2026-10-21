const router = require('express').Router();
const c = require('../controllers/postController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', c.list); //Lets anyone view all posts or view one post.
router.get('/:id', c.getOne); //get individual post by ID
router.post('/', authenticate, authorize('author', 'admin'), c.create); //Allows authors and admins to create posts.
router.put('/:id', authenticate, c.update);//Allows logged-in users to attempt updates
router.delete('/:id', authenticate, authorize('admin'), c.remove);//delete

module.exports = router;