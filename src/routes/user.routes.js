const router = require("express").Router();
const auth = require("../middleware/auth");
const { getMe, getAboutMe, getAllUsers } = require("../controllers/user.controller");

router.use(auth); // every route below this line requires a valid, unexpired token

router.get("/me", getMe);             // GET /api/users/me
router.get("/about-me", getAboutMe);  // GET /api/users/about-me
router.get("/", getAllUsers);         // GET /api/users

module.exports = router;
