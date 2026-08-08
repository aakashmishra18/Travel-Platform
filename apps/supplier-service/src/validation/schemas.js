const Joi = require("joi");

const airportCode = Joi.string().length(3).uppercase().pattern(/^[A-Z]{3}$/);
const uuid = Joi.string().uuid();

const schemas = {
  flightSearch: Joi.object({
    origin: airportCode.required(),
    destination: airportCode.required(),
    departureDate: Joi.date().iso().min("now").raw().required(),
    returnDate: Joi.date().iso().min(Joi.ref("departureDate")).raw().allow(null),
    adults: Joi.number().integer().min(1).max(9).default(1),
    children: Joi.number().integer().min(0).max(8).default(0),
    infants: Joi.number().integer().min(0).max(4).default(0),
    cabinClass: Joi.string().valid("ECONOMY", "PREMIUM_ECONOMY", "BUSINESS").default("ECONOMY"),
  }),

  offerIdParam: Joi.object({ offerId: uuid.required() }),
  bookingIdParam: Joi.object({ bookingId: uuid.required() }),

  bookFlight: Joi.object({
    offerId: uuid.required(),
    passengers: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().valid("adult", "child", "infant_without_seat").default("adult"),
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          dateOfBirth: Joi.date().iso(),
        })
      )
      .min(1)
      .required(),
  }),
};

module.exports = schemas;
