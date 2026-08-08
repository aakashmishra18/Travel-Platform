const { createSeededRandom } = require("../utils/seededRandom");

/**
 * MOCK PROVIDER — always registered, requires no credentials. This is
 * what search-service's earlier standalone stub becomes once Supplier
 * Service exists as its own layer: the same realistic-mock-data
 * generation, just now living at the correct architectural spot, and
 * producing the FULL normalized shape (aircraft, terminal, meal, wifi,
 * fare rules) that real providers below also produce.
 */

const AIRLINES = [
  { code: "6E", name: "IndiGo" },
  { code: "AI", name: "Air India" },
  { code: "SG", name: "SpiceJet" },
  { code: "UK", name: "Vistara" },
  { code: "G8", name: "GoAir" },
  { code: "EK", name: "Emirates" },
  { code: "SQ", name: "Singapore Airlines" },
];

const AIRCRAFT = ["Airbus A320", "Airbus A321neo", "Boeing 737-800", "Boeing 787-8", "Airbus A350-900"];
const TERMINALS = ["T1", "T2", "T3", null];
const MEALS = ["Included", "Buy on board", "Not available"];
const CABIN_BASE_MULTIPLIER = { ECONOMY: 1, PREMIUM_ECONOMY: 1.6, BUSINESS: 3.2 };

function pad(n) {
  return String(n).padStart(2, "0");
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function estimateBaseDurationMinutes(origin, destination) {
  const a = origin.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const b = destination.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const spread = Math.abs(a - b);
  return 60 + (spread % 12) * 25;
}

const mockProvider = {
  name: "MOCK",
  isEnabled: () => true,

  async searchFlights({ origin, destination, departureDate, cabinClass, adults, children, infants }) {
    const seedKey = `${origin}-${destination}-${departureDate}-${cabinClass}`;
    const rand = createSeededRandom(seedKey);

    const resultCount = 4 + Math.floor(rand() * 5); // 4-8 results
    const baseDuration = estimateBaseDurationMinutes(origin, destination);
    const totalPassengers = (adults || 1) + (children || 0) + (infants || 0);
    const cabinMultiplier = CABIN_BASE_MULTIPLIER[cabinClass] || 1;

    const results = [];
    for (let i = 0; i < resultCount; i++) {
      const airline = AIRLINES[Math.floor(rand() * AIRLINES.length)];
      const flightNumber = `${airline.code}${100 + Math.floor(rand() * 899)}`;

      const departureHour = Math.floor(rand() * 24);
      const departureMinute = Math.floor(rand() * 12) * 5;
      const departureTime = new Date(`${departureDate}T${pad(departureHour)}:${pad(departureMinute)}:00`);

      const stops = rand() < 0.65 ? 0 : rand() < 0.9 ? 1 : 2;
      const stopPenaltyMinutes = stops * (45 + Math.floor(rand() * 60));
      const durationMinutes = Math.round(baseDuration + stopPenaltyMinutes + (rand() * 30 - 15));
      const arrivalTime = addMinutes(departureTime, durationMinutes);

      const basePrice = 2500 + Math.round(rand() * 7000);
      const stopDiscount = stops > 0 ? 0.85 : 1;
      const price = Math.round(basePrice * cabinMultiplier * stopDiscount * totalPassengers);

      const refundable = rand() > 0.4;

      results.push({
        provider: "MOCK",
        providerOfferId: null,
        airlineCode: airline.code,
        airlineName: airline.name,
        flightNumber,
        origin,
        destination,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        durationMinutes,
        stops,
        cabinClass,
        price: { amount: price, currency: "INR" },
        availableSeats: 1 + Math.floor(rand() * 9),
        aircraft: AIRCRAFT[Math.floor(rand() * AIRCRAFT.length)],
        terminal: {
          departure: TERMINALS[Math.floor(rand() * TERMINALS.length)],
          arrival: TERMINALS[Math.floor(rand() * TERMINALS.length)],
        },
        baggage: { checkIn: stops > 0 ? "20kg" : "15kg", cabin: "7kg" },
        meal: MEALS[Math.floor(rand() * MEALS.length)],
        wifi: rand() > 0.5,
        fareRules: {
          refundable,
          cancellationFee: refundable ? Math.round(price * 0.15) : null,
          changeFee: Math.round(price * 0.1),
        },
      });
    }

    results.sort((a, b) => a.price.amount - b.price.amount);
    return results;
  },

  /**
   * Simulates realistic price drift for revalidation: seeded by
   * offerId + a 5-minute time bucket, so repeated revalidate calls
   * within the same short window return the same "current" price
   * (consistent, like a real cached quote would be), while calls in a
   * later bucket may show the price having moved.
   */
  async revalidateOffer(offer) {
    const bucket = Math.floor(Date.now() / (5 * 60000));
    const rand = createSeededRandom(`revalidate-${offer.provider_offer_id || offer.id}-${bucket}`);
    const drifted = rand() < 0.3; // 30% chance price has moved since search
    const changePercent = drifted ? (rand() * 0.15 + 0.05) * (rand() > 0.5 ? 1 : -1) : 0;
    const currentAmount = Math.max(1, Math.round(Number(offer.price_amount) * (1 + changePercent)));

    return {
      valid: true,
      priceChanged: drifted,
      currentPrice: { amount: currentAmount, currency: offer.price_currency },
    };
  },

  async checkAvailability(offer) {
    const bucket = Math.floor(Date.now() / (5 * 60000));
    const rand = createSeededRandom(`availability-${offer.provider_offer_id || offer.id}-${bucket}`);
    const stillAvailable = rand() > 0.05; // small chance the mock inventory "sold out"
    const remainingSeats = stillAvailable ? Math.max(1, Math.round(rand() * 9)) : 0;
    return { available: stillAvailable, remainingSeats };
  },

  async bookFlight(offer, passengers) {
    const pnr = Array.from({ length: 6 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
    ).join("");
    return {
      pnr,
      ticketNumber: `MOCK-${Date.now()}`,
      status: "CONFIRMED",
    };
  },

  async cancelBooking(booking) {
    const refundable = booking.passengers?.fareRules?.refundable ?? true;
    const price = Number(booking.price_amount || 0);
    const cancellationFee = refundable ? Math.round(price * 0.15) : price;
    const refundAmount = Math.max(0, price - cancellationFee);
    return { status: "CANCELLED", cancellationFee, refundAmount };
  },
};

module.exports = mockProvider;
