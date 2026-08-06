const AirportRepository = require("../repositories/airport.repository");
const SearchLogRepository = require("../repositories/searchLog.repository");
const flightSupplierClient = require("./supplier/flightSupplierClient");
const cache = require("../config/redis");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

function cacheKey(params) {
  const { origin, destination, departureDate, returnDate, cabinClass, adults, children, infants } = params;
  return `flight-search:${origin}:${destination}:${departureDate}:${returnDate || "oneway"}:${cabinClass}:${adults}.${children}.${infants}`;
}

const FlightSearchService = {
  async search(params, userId) {
    const { origin, destination, departureDate, returnDate, cabinClass, adults, children, infants } = params;

    if (origin === destination) {
      throw ApiError.badRequest("Origin and destination cannot be the same");
    }

    // Validate both airports exist — fail fast with a clear message
    // rather than silently returning an empty/nonsense result set.
    const [originAirport, destinationAirport] = await Promise.all([
      AirportRepository.findByCode(origin),
      AirportRepository.findByCode(destination),
    ]);
    if (!originAirport) throw ApiError.badRequest(`Unknown origin airport code: ${origin}`);
    if (!destinationAirport) throw ApiError.badRequest(`Unknown destination airport code: ${destination}`);

    const key = cacheKey(params);
    const cached = await cache.get(key);

    let outbound;
    if (cached) {
      outbound = cached.outbound;
    } else {
      outbound = await flightSupplierClient.searchFlights({
        origin, destination, departureDate, cabinClass, adults, children, infants,
      });
    }

    let inbound = null;
    if (returnDate) {
      inbound = cached?.inbound || (await flightSupplierClient.searchFlights({
        origin: destination, destination: origin, departureDate: returnDate,
        cabinClass, adults, children, infants,
      }));
    }

    if (!cached) {
      await cache.set(key, { outbound, inbound }, env.searchCacheTtlSeconds);
    }

    // Fire-and-forget logging — a failed log write shouldn't fail the
    // search itself, so this runs after the response data is ready
    // and errors here are swallowed rather than thrown.
    SearchLogRepository.create(null, {
      userId,
      origin, destination, departureDate, returnDate,
      adults, children, infants, cabinClass,
      resultCount: outbound.length + (inbound?.length || 0),
    }).catch(() => {});

    return {
      origin: { code: originAirport.code, city: originAirport.city, name: originAirport.name },
      destination: { code: destinationAirport.code, city: destinationAirport.city, name: destinationAirport.name },
      departureDate,
      returnDate: returnDate || null,
      passengers: { adults, children, infants },
      cabinClass,
      outboundFlights: outbound,
      returnFlights: inbound,
      fromCache: Boolean(cached),
    };
  },

  async recentSearches(userId) {
    const rows = await SearchLogRepository.recentByUser(userId);
    return rows.map((r) => ({
      origin: r.origin,
      destination: r.destination,
      departureDate: r.departure_date,
      returnDate: r.return_date,
      cabinClass: r.cabin_class,
      searchedAt: r.created_at,
    }));
  },

  async popularRoutes() {
    const rows = await SearchLogRepository.popularRoutes();
    return rows.map((r) => ({
      origin: r.origin,
      destination: r.destination,
      searchCount: Number(r.search_count),
    }));
  },
};

module.exports = FlightSearchService;
