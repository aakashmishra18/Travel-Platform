const env = require("../config/env");
const { withRetry } = require("../utils/retry");
const providerRateLimiter = require("../utils/rateLimiter");

/**
 * REAL AMADEUS INTEGRATION — not a stub. Written against Amadeus's
 * publicly documented Self-Service Flight Offers Search API, without a
 * live key to test against. Same caveat as duffel.provider.js: verify
 * field names against current docs once you have real credentials.
 * Docs: https://developers.amadeus.com/self-service/category/flights
 *
 * Unlike Duffel's simple bearer-token auth, Amadeus uses OAuth2
 * client-credentials — this file handles fetching and caching that
 * access token (they expire, typically ~30 minutes) so every search
 * doesn't re-authenticate from scratch.
 */

let cachedToken = null; // { accessToken, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.accessToken;
  }

  const res = await fetch(`${env.amadeus.apiUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.amadeus.apiKey,
      client_secret: env.amadeus.apiSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Amadeus OAuth token request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

function cabinClassToAmadeus(cabinClass) {
  return { ECONOMY: "ECONOMY", PREMIUM_ECONOMY: "PREMIUM_ECONOMY", BUSINESS: "BUSINESS" }[cabinClass] || "ECONOMY";
}

async function amadeusRequest(path, options = {}) {
  providerRateLimiter.consume("AMADEUS", env.providerRateLimits.amadeusPerMinute);

  const start = Date.now();
  const providerHealthTracker = require("../utils/providerHealthTracker");

  try {
    const response = await withRetry(
      async () => {
        const token = await getAccessToken();
        const res = await fetch(`${env.amadeus.apiUrl}${path}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const err = new Error(
            `Amadeus API error ${res.status}: ${body.errors?.[0]?.detail || res.statusText}`
          );
          err.retryable = res.status >= 500 || res.status === 429;
          if (res.status === 401) cachedToken = null;
          throw err;
        }
        return res.json();
      },
      { context: "Amadeus API call" }
    );

    providerHealthTracker.record("AMADEUS", true, Date.now() - start);
    return response;
  } catch (err) {
    providerHealthTracker.record("AMADEUS", false, Date.now() - start);
    throw err;
  }
}

function parseISODurationToMinutes(isoDuration) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(isoDuration || "");
  if (!match) return null;
  return parseInt(match[1] || "0", 10) * 60 + parseInt(match[2] || "0", 10);
}

function normalizeOffer(offer, cabinClass) {
  const itinerary = offer.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return {
    provider: "AMADEUS",
    providerOfferId: offer.id,
    airlineCode: firstSegment?.carrierCode || "??",
    // Amadeus returns carrier codes, not names, in the base search
    // response — a full integration would cross-reference the
    // /reference-data/airlines endpoint for the display name. Left as
    // the code alone here to avoid an extra untested API call.
    airlineName: firstSegment?.carrierCode || "Unknown",
    flightNumber: `${firstSegment?.carrierCode || ""}${firstSegment?.number || ""}`,
    origin: firstSegment?.departure?.iataCode,
    destination: lastSegment?.arrival?.iataCode,
    departureTime: firstSegment?.departure?.at,
    arrivalTime: lastSegment?.arrival?.at,
    durationMinutes: parseISODurationToMinutes(itinerary?.duration),
    stops: segments.length - 1,
    cabinClass,
    price: { amount: Math.round(Number(offer.price?.total)), currency: offer.price?.currency },
    availableSeats: offer.numberOfBookableSeats ?? null,
    aircraft: firstSegment?.aircraft?.code || null,
    terminal: {
      departure: firstSegment?.departure?.terminal || null,
      arrival: lastSegment?.arrival?.terminal || null,
    },
    baggage: {
      checkIn: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity
        ? `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity} bag(s)`
        : "See fare rules",
      cabin: "1 bag",
    },
    meal: "See fare rules",
    wifi: null,
    fareRules: {
      // Full fare rules require Amadeus's separate Flight Offers Price
      // / Branded Fares Upsell endpoints — not included in the base
      // search response. Defaulting conservatively; wire up
      // GET /v1/shopping/flight-offers/upselling for real rule detail.
      refundable: false,
      cancellationFee: null,
      changeFee: null,
    },
  };
}

const amadeusProvider = {
  name: "AMADEUS",
  isEnabled: () => Boolean(env.amadeus.apiKey && env.amadeus.apiSecret),

  async searchFlights({ origin, destination, departureDate, returnDate, cabinClass, adults, children, infants }) {
    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: String(adults || 1),
      travelClass: cabinClassToAmadeus(cabinClass),
      currencyCode: "INR",
      max: "10",
    });
    if (returnDate) params.set("returnDate", returnDate);
    if (children) params.set("children", String(children));
    if (infants) params.set("infants", String(infants));

    const data = await amadeusRequest(`/v2/shopping/flight-offers?${params.toString()}`);
    const offers = data.data || [];
    return offers.map((o) => normalizeOffer(o, cabinClass));
  },

  /**
   * Amadeus's real revalidation path is the Flight Offers Price API
   * (POST /v1/shopping/flight-offers/pricing with the full offer object
   * re-submitted) — it needs the ORIGINAL raw offer payload, not just
   * an id, since Amadeus offers aren't independently fetchable by id
   * the way Duffel's are. supplier_offers.payload currently stores the
   * normalized (not raw) offer — a real implementation would need a
   * `raw_provider_payload` column added to retain the full Amadeus
   * response for resubmission here.
   */
  async revalidateOffer(offer) {
    throw new Error(
      "Amadeus revalidation requires the original raw offer payload to be retained — " +
      "not yet wired. See the comment on this method before activating AMADEUS_API_KEY."
    );
  },

  async checkAvailability(offer) {
    throw new Error("Amadeus availability check requires the same raw-payload retention as revalidateOffer.");
  },

  async bookFlight(offer, passengers) {
    throw new Error(
      "Amadeus booking (POST /v1/booking/flight-orders) requires the raw priced offer from " +
      "Flight Offers Price, plus real traveler documents and payment — not yet wired."
    );
  },

  async cancelBooking(booking) {
    throw new Error("Amadeus order cancellation not yet wired — requires the real booking flow above first.");
  },
};

module.exports = amadeusProvider;
