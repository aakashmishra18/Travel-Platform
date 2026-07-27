const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const authProxy = require("../proxies/auth.proxy");

const router = express.Router();

// Routes below need a valid access token BEFORE we bother proxying to
// auth-service. Public routes (register/login/refresh/forgot-password/
// etc) skip straight to the proxy.
// Registered individually (instead of one router.use([...paths], fn) call)
// to avoid any Express-version-specific quirks with array-of-paths + a
// path containing a route param like ":sessionId".
const PROTECTED_PATHS = [
  "/logout",
  "/logout-all",
  "/me",
  "/change-password",
  "/sessions",
  "/sessions/:sessionId",
];

for (const path of PROTECTED_PATHS) {
  router.use(path, requireAuth);
}

// Everything under /v1/auth/* forwards to auth-service's
// /internal/v1/auth/* (see src/proxies/auth.proxy.js for the rewrite).
router.use("/", authProxy);

module.exports = router;