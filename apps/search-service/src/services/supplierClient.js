const env = require("../config/env");
const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");

/**
 * search-service's client to supplier-service — replaces what used to
 * be local mock-data generation (src/services/supplier/flightSupplierClient.js,
 * now removed). Per the pipeline design, search-service no longer
 * knows or cares which real provider (Mock/Duffel/Amadeus) answered —
 * that's entirely supplier-service's concern. This file only knows one
 * thing: how to call supplier-service's internal API and surface a
 * clear error if it's unreachable.
 */
async function callSupplierService(path, options = {}) {
  const url = `${env.supplierServiceUrl}${path}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Token": env.internalServiceToken,
        ...options.headers,
      },
    });
  } catch (err) {
    logger.error("supplier-service unreachable", { error: err.message, url });
    throw new ApiError(502, "BAD_GATEWAY", "Supplier service is currently unavailable");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || `Supplier service returned ${response.status}`;
    logger.error("supplier-service returned an error", { status: response.status, message });
    throw new ApiError(response.status, data.error?.code || "SUPPLIER_ERROR", message);
  }

  return data;
}

const supplierClient = {
  /**
   * Mirrors supplier-service's own searchFlights contract — one
   * direction at a time. Round trips are handled by calling this
   * twice (see flightSearch.service.js), origin/destination swapped
   * for the return leg, same as before. Real providers CAN combine
   * both legs into one bookable round-trip fare (Duffel/Amadeus both
   * support a `returnDate`/second slice), which is usually cheaper
   * than two one-ways — that's a worthwhile upgrade later, but it
   * changes the offer shape (one offer covering both legs instead of
   * two independently selectable ones) and isn't done here yet.
   */
  async searchFlights({ origin, destination, departureDate, cabinClass, adults, children, infants }) {
    const data = await callSupplierService("/internal/flights/search", {
      method: "POST",
      body: JSON.stringify({ origin, destination, departureDate, cabinClass, adults, children, infants }),
    });
    return data.offers || [];
  },
};

module.exports = supplierClient;
