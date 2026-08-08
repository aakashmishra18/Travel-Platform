const ApiError = require("../utils/ApiError");
const OfferRepository = require("../repositories/offer.repository");
const providerRegistry = require("../providers/providerRegistry");

async function loadOffer(offerId) {
  const offer = await OfferRepository.findById(offerId);
  if (!offer) throw ApiError.notFound("Offer not found");
  return offer;
}

function isExpired(offer) {
  return new Date(offer.expires_at) < new Date();
}

const OfferService = {
  async getDetails(offerId) {
    const offer = await loadOffer(offerId);
    if (offer.status === "ACTIVE" && isExpired(offer)) {
      await OfferRepository.updateStatus(null, offer.id, "EXPIRED");
      offer.status = "EXPIRED";
    }
    return { ...offer.payload, status: offer.status };
  },

  async revalidate(offerId) {
    const offer = await loadOffer(offerId);

    if (offer.status !== "ACTIVE" || isExpired(offer)) {
      if (offer.status === "ACTIVE") await OfferRepository.updateStatus(null, offer.id, "EXPIRED");
      return { valid: false, reason: "Offer has expired", currentPrice: null, priceChanged: false };
    }

    const provider = providerRegistry.getProviderByName(offer.provider);
    const result = await provider.revalidateOffer(offer);

    if (result.priceChanged) {
      await OfferRepository.updatePrice(null, offer.id, result.currentPrice.amount);
    }

    return result;
  },

  async checkAvailability(offerId) {
    const offer = await loadOffer(offerId);

    if (offer.status !== "ACTIVE" || isExpired(offer)) {
      if (offer.status === "ACTIVE") await OfferRepository.updateStatus(null, offer.id, "EXPIRED");
      return { available: false, remainingSeats: 0 };
    }

    const provider = providerRegistry.getProviderByName(offer.provider);
    return provider.checkAvailability(offer);
  },

  /**
   * Fare rules are captured during search (normalizeOffer on each
   * provider already extracts them into the standard shape) and stored
   * in the payload — no extra provider call needed for this one. This
   * matches the design doc's grouping (refundable / cancellation
   * charges / change charges / baggage) exactly.
   */
  async getFareRules(offerId) {
    const offer = await loadOffer(offerId);
    return {
      ...offer.payload.fareRules,
      baggage: offer.payload.baggage,
    };
  },
};

module.exports = OfferService;
