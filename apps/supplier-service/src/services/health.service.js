const providerRegistry = require("../providers/providerRegistry");
const providerHealthTracker = require("../utils/providerHealthTracker");

const HealthService = {
  getProviderHealth() {
    return providerRegistry.ALL_PROVIDERS.map((provider) => ({
      name: provider.name,
      enabled: provider.isEnabled(),
      ...providerHealthTracker.getStats(provider.name),
    }));
  },
};

module.exports = HealthService;
