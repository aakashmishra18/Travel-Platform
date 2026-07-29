const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const userProxy = require("../proxies/user.proxy");

const router = express.Router();

// Unlike auth.routes.js, EVERY route here is protected — there's no
// public "register"/"login" equivalent for user-service, since you can
// only have profile/traveller/document data if you're already logged in.
router.use(requireAuth);
router.use("/", userProxy);

module.exports = router;
