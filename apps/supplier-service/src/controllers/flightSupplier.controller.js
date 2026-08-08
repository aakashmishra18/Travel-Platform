const FlightSupplierService = require("../services/flightSupplier.service");
const OfferService = require("../services/offer.service");
const BookingService = require("../services/booking.service");

const FlightSupplierController = {
  async search(req, res) {
    const result = await FlightSupplierService.search(req.body);
    res.status(200).json(result);
  },

  async getOffer(req, res) {
    const offer = await OfferService.getDetails(req.params.offerId);
    res.status(200).json({ offer });
  },

  async revalidateOffer(req, res) {
    const result = await OfferService.revalidate(req.params.offerId);
    res.status(200).json(result);
  },

  async checkAvailability(req, res) {
    const result = await OfferService.checkAvailability(req.params.offerId);
    res.status(200).json(result);
  },

  async getFareRules(req, res) {
    const rules = await OfferService.getFareRules(req.params.offerId);
    res.status(200).json({ fareRules: rules });
  },

  async book(req, res) {
    const result = await BookingService.book(req.body.offerId, req.body.passengers);
    res.status(201).json(result);
  },

  async cancel(req, res) {
    const result = await BookingService.cancel(req.params.bookingId);
    res.status(200).json(result);
  },
};

module.exports = FlightSupplierController;
