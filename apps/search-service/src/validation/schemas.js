const Joi = require("joi");

const airportCode = Joi.string().length(3).uppercase().pattern(/^[A-Z]{3}$/);

const schemas = {
  flightSearch: Joi.object({
    origin: airportCode.required(),
    destination: airportCode.required(),
    // .raw() is the fix here: Joi.date() validates the format but by
    // default ALSO converts the value into a JS Date object. Everything
    // downstream (flightSupplierClient, the cache key, search_logs)
    // expects a plain "YYYY-MM-DD" string — without .raw(), the
    // converted Date object gets string-interpolated into
    // `${departureDate}T10:05:00`, producing something unparseable and
    // throwing "Invalid time value" deep in the mock supplier client.
    departureDate: Joi.date().iso().min("now").raw().required(),
    returnDate: Joi.date().iso().min(Joi.ref("departureDate")).raw().allow(null),
    adults: Joi.number().integer().min(1).max(9).default(1),
    children: Joi.number().integer().min(0).max(8).default(0),
    infants: Joi.number().integer().min(0).max(4).default(0),
    cabinClass: Joi.string().valid("ECONOMY", "PREMIUM_ECONOMY", "BUSINESS").default("ECONOMY"),
  }),

  airportSearchQuery: Joi.object({
    q: Joi.string().min(2).required(),
  }),
};

module.exports = schemas;
