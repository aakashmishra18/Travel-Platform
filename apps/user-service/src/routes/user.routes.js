const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validation/schemas");

const ProfileController = require("../controllers/profile.controller");
const TravellerController = require("../controllers/traveller.controller");
const DocumentController = require("../controllers/document.controller");
const AddressController = require("../controllers/address.controller");
const ContactController = require("../controllers/contact.controller");
const PreferenceController = require("../controllers/preference.controller");
const LoyaltyController = require("../controllers/loyalty.controller");
const ConsentController = require("../controllers/consent.controller");

const router = express.Router();

// Every route here needs a valid access token — this whole service is
// "my own data", there are no public routes like auth-service has.
router.use(requireAuth);

// ---------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------
router.get("/profile", asyncHandler(ProfileController.getMyProfile));
router.put("/profile", validate(schemas.updateProfile), asyncHandler(ProfileController.updateMyProfile));
router.post("/profile/request-deletion", asyncHandler(ProfileController.requestDeletion));

// ---------------------------------------------------------------------
// Travellers
// ---------------------------------------------------------------------
router.get("/travellers", asyncHandler(TravellerController.list));
router.post("/travellers", validate(schemas.createTraveller), asyncHandler(TravellerController.create));
router.get("/travellers/:travellerId", validate(schemas.travellerIdParam, "params"), asyncHandler(TravellerController.get));
router.put("/travellers/:travellerId", validate(schemas.travellerIdParam, "params"), validate(schemas.updateTraveller), asyncHandler(TravellerController.update));
router.delete("/travellers/:travellerId", validate(schemas.travellerIdParam, "params"), asyncHandler(TravellerController.remove));

// ---------------------------------------------------------------------
// Traveller documents (nested under traveller)
// ---------------------------------------------------------------------
router.get("/travellers/:travellerId/documents", validate(schemas.travellerIdParam, "params"), asyncHandler(DocumentController.list));
router.post("/travellers/:travellerId/documents", validate(schemas.travellerIdParam, "params"), validate(schemas.createDocument), asyncHandler(DocumentController.create));
router.delete("/travellers/:travellerId/documents/:documentId", validate(schemas.documentIdParams, "params"), asyncHandler(DocumentController.remove));

// ---------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------
router.get("/addresses", asyncHandler(AddressController.list));
router.post("/addresses", validate(schemas.createAddress), asyncHandler(AddressController.create));
router.put("/addresses/:addressId", validate(schemas.addressIdParam, "params"), validate(schemas.updateAddress), asyncHandler(AddressController.update));
router.delete("/addresses/:addressId", validate(schemas.addressIdParam, "params"), asyncHandler(AddressController.remove));

// ---------------------------------------------------------------------
// Saved contacts
// ---------------------------------------------------------------------
router.get("/contacts", asyncHandler(ContactController.list));
router.post("/contacts", validate(schemas.createContact), asyncHandler(ContactController.create));
router.delete("/contacts/:contactId", validate(schemas.contactIdParam, "params"), asyncHandler(ContactController.remove));

// ---------------------------------------------------------------------
// Preferences & settings
// ---------------------------------------------------------------------
router.get("/preferences", asyncHandler(PreferenceController.getPreferences));
router.put("/preferences", validate(schemas.updatePreferences), asyncHandler(PreferenceController.updatePreferences));
router.get("/settings", asyncHandler(PreferenceController.getSettings));
router.put("/settings", validate(schemas.updateSettings), asyncHandler(PreferenceController.updateSettings));

// ---------------------------------------------------------------------
// Loyalty programs
// ---------------------------------------------------------------------
router.get("/loyalty-programs", asyncHandler(LoyaltyController.list));
router.post("/loyalty-programs", validate(schemas.createLoyalty), asyncHandler(LoyaltyController.create));
router.delete("/loyalty-programs/:loyaltyId", validate(schemas.loyaltyIdParam, "params"), asyncHandler(LoyaltyController.remove));

// ---------------------------------------------------------------------
// Consents
// ---------------------------------------------------------------------
router.get("/consents", asyncHandler(ConsentController.list));
router.post("/consents", validate(schemas.recordConsent), asyncHandler(ConsentController.record));

module.exports = router;
