const env = require("../config/env");
const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");
const providerRegistry = require("../providers/providerRegistry");
const providerHealthTracker = require("../utils/providerHealthTracker");
const OfferRepository = require("../repositories/offer.repository");

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function callProviderWithTracking(provider, params) {
  const start = Date.now();
  try {
    const offers = await provider.searchFlights(params);
    // Duffel/Amadeus already record their own health inside their HTTP
    // wrapper (duffelRequest/amadeusRequest); Mock has no HTTP call to
    // wrap, so it's tracked here instead — keeps all three providers
    // showing up consistently in the health endpoint.
    if (provider.name === "MOCK") {
      providerHealthTracker.record("MOCK", true, Date.now() - start);
    }
    return offers;
  } catch (err) {
    if (provider.name === "MOCK") {
      providerHealthTracker.record("MOCK", false, Date.now() - start);
    }
    throw err;
  }
}

const FlightSupplierService = {
  /**
   * Calls every enabled provider in parallel (Promise.allSettled — one
   * provider failing never blocks the others), normalizes and persists
   * every returned offer so it has a stable offerId for later lookups,
   * and returns the merged, price-sorted list. "The rest of your
   * platform never knows which provider returned the data" — this is
   * the function that makes that true.
   */
  async search(params) {
    const providers = providerRegistry.getEnabledProviders();
    if (providers.length === 0) {
      throw ApiError.serviceUnavailable("No supplier providers are currently enabled");
    }

    const settled = await Promise.allSettled(
      providers.map((p) => callProviderWithTracking(p, params))
    );

    const rawOffers = [];
    const providersQueried = [];
    const providersFailed = [];

    settled.forEach((result, i) => {
      const provider = providers[i];
      providersQueried.push(provider.name);
      if (result.status === "fulfilled") {
        rawOffers.push(...result.value);
      } else {
        providersFailed.push({ provider: provider.name, error: result.reason.message });
        logger.error(`Provider ${provider.name} search failed`, { error: result.reason.message });
      }
    });

    if (rawOffers.length === 0) {
      throw ApiError.serviceUnavailable(
        providersFailed.length > 0
          ? `All providers failed: ${providersFailed.map((f) => f.provider).join(", ")}`
          : "No offers found for this search"
      );
    }

    const expiresAt = addMinutes(new Date(), env.offerTtlMinutes);

    const persisted = await Promise.all(
      rawOffers.map(async (offer) => {
        const row = await OfferRepository.create(null, {
          provider: offer.provider,
          providerOfferId: offer.providerOfferId,
          origin: offer.origin,
          destination: offer.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate || null,
          cabinClass: offer.cabinClass,
          priceAmount: offer.price.amount,
          priceCurrency: offer.price.currency,
          payload: offer,
          expiresAt,
        });

        const finalPayload = { ...offer, offerId: row.id, expiresAt: row.expires_at.toISOString() };
        await OfferRepository.setPayload(null, row.id, finalPayload);
        return finalPayload;
      })
    );

    persisted.sort((a, b) => a.price.amount - b.price.amount);

    return { offers: persisted, providersQueried, providersFailed };
  },
};

module.exports = FlightSupplierService;
