const { createSeededRandom } = require("../../utils/seededRandom");
const env = require("../../config/env");

/**
 * STUB SUPPLIER CLIENT — search-service's equivalent of the email
 * stub we built for auth-service. Right now this generates realistic
 * mock flight inventory instead of calling a real Supplier Service
 * (which doesn't exist yet in the pipeline). When Supplier Service is
 * built, replace the body of `searchFlights` below with an HTTP call
 * to it — the function signature and return shape are the contract;
 * nothing calling this file needs to change.
 *
 * TODO: replace with real integration, e.g.
 *   const res = await axios.post(`${env.services.supplier}/flights/search`, params);
 *   return res.data.flights;
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

const CABIN_BASE_MULTIPLIER = {
  ECONOMY: 1,
  PREMIUM_ECONOMY: 1.6,
  BUSINESS: 3.2,
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Rough distance-driven base duration — not geographically accurate,
 * just varies enough by route to feel plausible for mock data. Uses
 * the airport codes' char codes as a stable-but-arbitrary "distance"
 * proxy so the same route always gets a similar base duration.
 */
function estimateBaseDurationMinutes(origin, destination) {
  const a = origin.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const b = destination.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const spread = Math.abs(a - b);
  return 60 + (spread % 12) * 25; // ~60 to ~335 minutes
}

const flightSupplierClient = {
  async searchFlights({ origin, destination, departureDate, cabinClass, adults, children, infants }) {
    const seedKey = `${origin}-${destination}-${departureDate}-${cabinClass}`;
    const rand = createSeededRandom(seedKey);

    const resultCount = env.mockSupplier.minResults +
      Math.floor(rand() * (env.mockSupplier.maxResults - env.mockSupplier.minResults + 1));

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
      const stopDiscount = stops > 0 ? 0.85 : 1; // connecting flights slightly cheaper
      const price = Math.round(basePrice * cabinMultiplier * stopDiscount * totalPassengers);

      const availableSeats = 1 + Math.floor(rand() * 9);

      results.push({
        id: `${flightNumber}-${departureDate}-${i}`,
        airline,
        flightNumber,
        origin,
        destination,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        durationMinutes,
        stops,
        cabinClass,
        price: { amount: price, currency: "INR" },
        availableSeats,
        baggage: { checkIn: stops > 0 ? "20kg" : "15kg", cabin: "7kg" },
      });
    }

    // Sort cheapest-first — the most common default sort for flight search.
    results.sort((a, b) => a.price.amount - b.price.amount);
    return results;
  },
};

module.exports = flightSupplierClient;
