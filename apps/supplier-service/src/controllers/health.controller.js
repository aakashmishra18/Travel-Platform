const HealthService = require("../services/health.service");

const HealthController = {
  async getProviderHealth(req, res) {
    const providers = HealthService.getProviderHealth();
    res.status(200).json({ providers });
  },
};

module.exports = HealthController;
