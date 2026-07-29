const Joi = require("joi");

const uuid = Joi.string().uuid();

const schemas = {
  updateProfile: Joi.object({
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    dateOfBirth: Joi.date().iso(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"),
    phone: Joi.string().max(20),
    profileImageUrl: Joi.string().uri(),
  }),

  createTraveller: Joi.object({
    type: Joi.string().valid("ADULT", "CHILD", "INFANT").required(),
    relationship: Joi.string().valid("SELF", "FAMILY", "FRIEND", "OTHER").required(),
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    dateOfBirth: Joi.date().iso(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"),
    nationality: Joi.string().max(2),
  }),

  updateTraveller: Joi.object({
    type: Joi.string().valid("ADULT", "CHILD", "INFANT"),
    relationship: Joi.string().valid("SELF", "FAMILY", "FRIEND", "OTHER"),
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    dateOfBirth: Joi.date().iso(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"),
    nationality: Joi.string().max(2),
  }),

  createDocument: Joi.object({
    documentType: Joi.string().valid("PASSPORT", "VISA", "NATIONAL_ID", "OTHER").required(),
    documentNumber: Joi.string().min(4).max(50).required(),
    issueCountry: Joi.string().max(2),
    nationality: Joi.string().max(2),
    issueDate: Joi.date().iso(),
    expiryDate: Joi.date().iso(),
  }),

  createAddress: Joi.object({
    type: Joi.string().valid("HOME", "BILLING", "WORK", "GST").required(),
    line1: Joi.string().max(200).required(),
    line2: Joi.string().max(200),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    postalCode: Joi.string().max(20),
    country: Joi.string().max(2),
    companyName: Joi.string().max(200),
    gstNumber: Joi.string().max(30),
    isDefault: Joi.boolean(),
  }),

  updateAddress: Joi.object({
    type: Joi.string().valid("HOME", "BILLING", "WORK", "GST"),
    line1: Joi.string().max(200),
    line2: Joi.string().max(200),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    postalCode: Joi.string().max(20),
    country: Joi.string().max(2),
    companyName: Joi.string().max(200),
    gstNumber: Joi.string().max(30),
    isDefault: Joi.boolean(),
  }),

  createContact: Joi.object({
    type: Joi.string().valid("EMAIL", "PHONE", "EMERGENCY").required(),
    value: Joi.string().max(200).required(),
    label: Joi.string().max(100),
    isDefault: Joi.boolean(),
  }),

  updatePreferences: Joi.object({
    language: Joi.string().max(10),
    currency: Joi.string().max(10),
    timezone: Joi.string().max(50),
    flightSeat: Joi.string().max(50),
    flightMeal: Joi.string().max(50),
    flightClass: Joi.string().max(50),
    hotelRoomPref: Joi.string().max(50),
    hotelAccessibility: Joi.string().max(200),
    railBerth: Joi.string().max(50),
    railClass: Joi.string().max(50),
  }),

  updateSettings: Joi.object({
    accessibility: Joi.object(),
    display: Joi.object(),
    regional: Joi.object(),
  }),

  createLoyalty: Joi.object({
    programType: Joi.string().valid("AIRLINE", "HOTEL", "RAIL").required(),
    providerName: Joi.string().max(100).required(),
    membershipNumber: Joi.string().max(50).required(),
  }),

  recordConsent: Joi.object({
    consentType: Joi.string().valid("TERMS_OF_SERVICE", "PRIVACY_POLICY", "MARKETING_EMAIL", "MARKETING_SMS").required(),
    status: Joi.string().valid("GRANTED", "REVOKED").required(),
    version: Joi.string().max(20).required(),
  }),

  travellerIdParam: Joi.object({ travellerId: uuid.required() }),
  documentIdParams: Joi.object({ travellerId: uuid.required(), documentId: uuid.required() }),
  addressIdParam: Joi.object({ addressId: uuid.required() }),
  contactIdParam: Joi.object({ contactId: uuid.required() }),
  loyaltyIdParam: Joi.object({ loyaltyId: uuid.required() }),
};

module.exports = schemas;
