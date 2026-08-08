const mockProvider = require("./mock.provider");
const duffelProvider = require("./duffel.provider");
const amadeusProvider = require("./amadeus.provider");
const logger = require("../utils/logger");

const ALL_PROVIDERS = [mockProvider, duffelProvider, amadeusProvider];

/**
 * The rest of the codebase never hardcodes "call Duffel" or "call
 * Amadeus" — it asks this registry for whichever providers are
 * currently enabled and calls all of them. Enabling a real provider is
 * purely a matter of setting its API key(s) in .env; no code changes
 * needed anywhere else.
 */
function getEnabledProviders() {
  return ALL_PROVIDERS.filter((p) => p.isEnabled());
}

function getProviderByName(name) {
  const provider = ALL_PROVIDERS.find((p) => p.name === name);
  if (!provider) throw new Error(`Unknown provider: ${name}`);
  return provider;
}

function logActiveProviders() {
  const enabled = getEnabledProviders().map((p) => p.name);
  logger.info(`Active providers: ${enabled.join(", ")}`, { providers: enabled });
}

module.exports = { getEnabledProviders, getProviderByName, logActiveProviders, ALL_PROVIDERS };
