const env = require("../config/env");
const logger = require("../utils/logger");
const { withRetry } = require("../utils/retry");
const providerRateLimiter = require("../utils/rateLimiter");

/**
 * REAL DUFFEL INTEGRATION — not a stub. This calls Duffel's actual
 * API. It only gets registered (see providerRegistry.js) once
 * DUFFEL_API_KEY is set in .env — until then it's simply never called.
 *
 * IMPORTANT: this was written against Duffel's publicly documented API
 * shape as of when this file was generated, without a live key to test
 * against. Field names on THEIR side can change between API versions —
 * once you have a real key, run one search and compare the actual
 * response against what `normalizeOffer` below expects; adjust the
 * field mappings if Duffel's docs have moved since. Their docs:
 * https://duffel.com/docs/api
 */

function cabinClassToDuffel(cabinClass) {
  return { ECONOMY: "economy", PREMIUM_ECONOMY: "premium_economy", BUSINESS: "business" }[cabinClass] || "economy";
}

function buildPassengers({ adults, children, infants }) {
  const passengers = [];
  for (let i = 0; i < (adults || 1); i++) passengers.push({ type: "adult" });
  for (let i = 0; i < (children || 0); i++) passengers.push({ type: "child" });
  for (let i = 0; i < (infants || 0); i++) passengers.push({ type: "infant_without_seat" });
  return passengers;
}

async function duffelRequest(path, options = {}) {
  providerRateLimiter.consume("DUFFEL", env.providerRateLimits.duffelPerMinute);

  const start = Date.now();
  const providerHealthTracker = require("../utils/providerHealthTracker");

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(`${env.duffel.apiUrl}${path}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${env.duffel.apiKey}`,
            "Content-Type": "application/json",
            "Duffel-Version": env.duffel.apiVersion,
            Accept: "application/json",
            ...options.headers,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const err = new Error(
            `Duffel API error ${res.status}: ${body.errors?.[0]?.message || res.statusText}`
          );
          err.retryable = res.status >= 500 || res.status === 429;
          throw err;
        }
        return res.json();
      },
      { context: "Duffel API call" }
    );

    providerHealthTracker.record("DUFFEL", true, Date.now() - start);
    return response;
  } catch (err) {
    providerHealthTracker.record("DUFFEL", false, Date.now() - start);
    throw err;
  }
}

function normalizeOffer(offer, cabinClass) {
  const slice = offer.slices?.[0];
  const segment = slice?.segments?.[0];
  const lastSegment = slice?.segments?.[slice.segments.length - 1];

  return {
    provider: "DUFFEL",
    providerOfferId: offer.id,
    airlineCode: segment?.operating_carrier?.iata_code || segment?.marketing_carrier?.iata_code || "??",
    airlineName: segment?.operating_carrier?.name || segment?.marketing_carrier?.name || "Unknown",
    flightNumber: `${segment?.marketing_carrier?.iata_code || ""}${segment?.marketing_carrier_flight_number || ""}`,
    origin: segment?.origin?.iata_code,
    destination: lastSegment?.destination?.iata_code,
    departureTime: segment?.departing_at,
    arrivalTime: lastSegment?.arriving_at,
    durationMinutes: slice?.duration ? parseDurationToMinutes(slice.duration) : null,
    stops: (slice?.segments?.length || 1) - 1,
    cabinClass,
    price: { amount: Math.round(Number(offer.total_amount)), currency: offer.total_currency },
    availableSeats: null,
    aircraft: segment?.aircraft?.name || null,
    terminal: {
      departure: segment?.origin_terminal || null,
      arrival: lastSegment?.destination_terminal || null,
    },
    baggage: {
      checkIn: offer.passengers?.[0]?.baggages?.find((b) => b.type === "checked")?.quantity
        ? `${offer.passengers[0].baggages.find((b) => b.type === "checked").quantity} bag(s)`
        : "See fare rules",
      cabin: "1 bag",
    },
    meal: "See fare rules",
    wifi: null,
    fareRules: {
      refundable: offer.conditions?.refund_before_departure?.allowed ?? false,
      cancellationFee: offer.conditions?.refund_before_departure?.penalty_amount
        ? Math.round(Number(offer.conditions.refund_before_departure.penalty_amount))
        : null,
      changeFee: offer.conditions?.change_before_departure?.penalty_amount
        ? Math.round(Number(offer.conditions.change_before_departure.penalty_amount))
        : null,
    },
  };
}

// Duffel durations come back as ISO 8601 durations, e.g. "PT2H15M".
function parseDurationToMinutes(isoDuration) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(isoDuration);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

const duffelProvider = {
  name: "DUFFEL",
  isEnabled: () => Boolean(env.duffel.apiKey),

  async searchFlights({ origin, destination, departureDate, returnDate, cabinClass, adults, children, infants }) {
    const slices = [{ origin, destination, departure_date: departureDate }];
    if (returnDate) {
      slices.push({ origin: destination, destination: origin, departure_date: returnDate });
    }

    const data = await duffelRequest("/air/offer_requests?return_offers=true", {
      method: "POST",
      body: JSON.stringify({
        data: {
          slices,
          passengers: buildPassengers({ adults, children, infants }),
          cabin_class: cabinClassToDuffel(cabinClass),
        },
      }),
    });

    const offers = data.data?.offers || [];
    return offers.map((o) => normalizeOffer(o, cabinClass));
  },

  async revalidateOffer(offer) {
    const data = await duffelRequest(`/air/offers/${offer.provider_offer_id}`);
    const current = data.data;
    const currentAmount = Math.round(Number(current.total_amount));
    return {
      valid: true,
      priceChanged: currentAmount !== Number(offer.price_amount),
      currentPrice: { amount: currentAmount, currency: current.total_currency },
    };
  },

  async checkAvailability(offer) {
    try {
      await duffelRequest(`/air/offers/${offer.provider_offer_id}`);
      return { available: true, remainingSeats: null };
    } catch (err) {
      return { available: false, remainingSeats: 0 };
    }
  },

  /**
   * Real booking requires a funded payment source (`payments` array)
   * in Duffel's order-creation call — that doesn't exist until Payment
   * Service is built. This method is wired correctly and ready, but
   * nothing should call it for real until that payment flow exists;
   * calling it today with a real key would attempt a real order and
   * fail on the missing payment step.
   */
  async bookFlight(offer, passengers) {
    logger.warn("Duffel bookFlight called — this requires a real payment source, not yet wired");
    const data = await duffelRequest("/air/orders", {
      method: "POST",
      body: JSON.stringify({
        data: {
          selected_offers: [offer.provider_offer_id],
          passengers,
          type: "instant",
        },
      }),
    });
    return {
      pnr: data.data?.booking_reference,
      ticketNumber: data.data?.id,
      status: "CONFIRMED",
    };
  },

  async cancelBooking(booking) {
    const cancellation = await duffelRequest("/air/order_cancellations", {
      method: "POST",
      body: JSON.stringify({ data: { order_id: booking.ticket_number } }),
    });
    const confirmed = await duffelRequest(
      `/air/order_cancellations/${cancellation.data.id}/actions/confirm`,
      { method: "POST" }
    );
    return {
      status: "CANCELLED",
      refundAmount: Math.round(Number(confirmed.data.refund_amount || 0)),
      cancellationFee: Math.round(
        Number(booking.price_amount || 0) - Number(confirmed.data.refund_amount || 0)
      ),
    };
  },
};

module.exports = duffelProvider;
