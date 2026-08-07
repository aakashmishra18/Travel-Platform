const Joi = require("joi");

const airportCode = Joi.string().length(3).uppercase().pattern(/^[A-Z]{3}$/);

const schemas = {
  flightSearch: Joi.object({
    origin: airportCode.required(),
    destination: airportCode.required(),
    // departureDate: Joi.date().iso().min("now").required(),
    // returnDate: Joi.date().iso().min(Joi.ref("departureDate")).allow(null),
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
