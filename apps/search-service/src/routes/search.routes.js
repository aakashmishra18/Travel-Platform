const express = require("express");
const optionalAuth = require("../middleware/optionalAuth.middleware");
const requireAuth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validation/schemas");

const FlightSearchController = require("../controllers/flightSearch.controller");
const AirportController = require("../controllers/airport.controller");

const router = express.Router();

// ---------------------------------------------------------------------
// Public — no login required to search or browse airports
// ---------------------------------------------------------------------
router.post(
  "/flights",
  optionalAuth,
  validate(schemas.flightSearch),
  asyncHandler(FlightSearchController.search)
);

router.get(
  "/airports",
  validate(schemas.airportSearchQuery, "query"),
  asyncHandler(AirportController.search)
);

router.get("/popular-routes", asyncHandler(FlightSearchController.popularRoutes));

// ---------------------------------------------------------------------
// Requires login — tied to a specific account's search history
// ---------------------------------------------------------------------
router.get("/recent-searches", requireAuth, asyncHandler(FlightSearchController.recentSearches));

module.exports = router;
