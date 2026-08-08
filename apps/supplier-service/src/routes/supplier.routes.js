const express = require("express");
const validate = require("../middleware/validate.middleware");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validation/schemas");

const FlightSupplierController = require("../controllers/flightSupplier.controller");
const HealthController = require("../controllers/health.controller");

const router = express.Router();

// POST /internal/flights/search
router.post("/flights/search", validate(schemas.flightSearch), asyncHandler(FlightSupplierController.search));

// GET /internal/flights/offers/:offerId
router.get(
  "/flights/offers/:offerId",
  validate(schemas.offerIdParam, "params"),
  asyncHandler(FlightSupplierController.getOffer)
);

// POST /internal/flights/offers/:offerId/revalidate
router.post(
  "/flights/offers/:offerId/revalidate",
  validate(schemas.offerIdParam, "params"),
  asyncHandler(FlightSupplierController.revalidateOffer)
);

// GET /internal/flights/offers/:offerId/availability
router.get(
  "/flights/offers/:offerId/availability",
  validate(schemas.offerIdParam, "params"),
  asyncHandler(FlightSupplierController.checkAvailability)
);

// GET /internal/flights/offers/:offerId/fare-rules
router.get(
  "/flights/offers/:offerId/fare-rules",
  validate(schemas.offerIdParam, "params"),
  asyncHandler(FlightSupplierController.getFareRules)
);

// POST /internal/flights/book
router.post("/flights/book", validate(schemas.bookFlight), asyncHandler(FlightSupplierController.book));

// POST /internal/flights/:bookingId/cancel
router.post(
  "/flights/:bookingId/cancel",
  validate(schemas.bookingIdParam, "params"),
  asyncHandler(FlightSupplierController.cancel)
);

// GET /internal/providers/health
router.get("/providers/health", asyncHandler(HealthController.getProviderHealth));

module.exports = router;
