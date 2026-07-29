const LoyaltyService = require("../services/loyalty.service");

const LoyaltyController = {
  async list(req, res) {
    const programs = await LoyaltyService.list(req.user.id);
    res.status(200).json({ programs });
  },
  async create(req, res) {
    const program = await LoyaltyService.create(req.user.id, req.body);
    res.status(201).json({ program });
  },
  async remove(req, res) {
    await LoyaltyService.remove(req.user.id, req.params.loyaltyId);
    res.status(204).send();
  },
};

module.exports = LoyaltyController;
