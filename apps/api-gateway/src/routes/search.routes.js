const express = require("express");
const searchProxy = require("../proxies/search.proxy");

const router = express.Router();

// Unlike auth and users, search is entirely public at the gateway
// level — no requireAuth here. search-service's own optionalAuth
// middleware handles the "personalize if logged in" behavior
// internally, using whatever Authorization header the client sent.
router.use("/", searchProxy);

module.exports = router;