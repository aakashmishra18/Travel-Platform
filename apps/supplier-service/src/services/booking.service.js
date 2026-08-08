const { withTransaction } = require("../config/db");
const ApiError = require("../utils/ApiError");
const OfferRepository = require("../repositories/offer.repository");
const BookingRepository = require("../repositories/booking.repository");
const providerRegistry = require("../providers/providerRegistry");

const BookingService = {
  /**
   * "(Later)" per the design doc — this exists and works end-to-end
   * against the MOCK provider today, but real callers of this endpoint
   * don't exist yet: Booking Service (the platform-level one, distinct
   * from this method) hasn't been built, and there's no payment
   * confirmation gating a call to this. Treat this as the tested,
   * ready building block Booking Service will call once it exists —
   * not as something safe to expose to end users directly yet.
   */
  async book(offerId, passengers) {
    const offer = await OfferRepository.findById(offerId);
    if (!offer) throw ApiError.notFound("Offer not found");
    if (offer.status !== "ACTIVE") {
      throw ApiError.conflict(`Cannot book an offer with status ${offer.status}`);
    }
    if (new Date(offer.expires_at) < new Date()) {
      await OfferRepository.updateStatus(null, offer.id, "EXPIRED");
      throw ApiError.conflict("Offer has expired — search again for current pricing");
    }

    const provider = providerRegistry.getProviderByName(offer.provider);
    const result = await provider.bookFlight(offer, passengers);

    return withTransaction(async (client) => {
      const booking = await BookingRepository.create(client, {
        offerId: offer.id,
        provider: offer.provider,
        pnr: result.pnr,
        ticketNumber: result.ticketNumber,
        passengers,
      });
      await OfferRepository.updateStatus(client, offer.id, "BOOKED");
      return { bookingId: booking.id, pnr: result.pnr, ticketNumber: result.ticketNumber, status: result.status };
    });
  },

  async cancel(bookingId) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw ApiError.notFound("Booking not found");
    if (booking.status !== "CONFIRMED") {
      throw ApiError.conflict(`Cannot cancel a booking with status ${booking.status}`);
    }

    const offer = await OfferRepository.findById(booking.offer_id);
    const provider = providerRegistry.getProviderByName(booking.provider);
    const result = await provider.cancelBooking({ ...booking, price_amount: offer?.price_amount });

    return withTransaction(async (client) => {
      await BookingRepository.updateStatus(client, booking.id, "CANCELLED", {
        cancellationFee: result.cancellationFee,
        refundAmount: result.refundAmount,
      });
      if (offer) await OfferRepository.updateStatus(client, offer.id, "CANCELLED");
      return result;
    });
  },
};

module.exports = BookingService;
