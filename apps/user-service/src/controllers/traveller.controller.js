const TravellerService = require("../services/traveller.service");

const TravellerController = {
  async list(req, res) {
    const travellers = await TravellerService.list(req.user.id);
    res.status(200).json({ travellers });
  },

  async get(req, res) {
    const traveller = await TravellerService.get(req.user.id, req.params.travellerId);
    res.status(200).json({ traveller });
  },

  async create(req, res) {
    const traveller = await TravellerService.create(req.user.id, req.body);
    res.status(201).json({ traveller });
  },

  async update(req, res) {
    const traveller = await TravellerService.update(req.user.id, req.params.travellerId, req.body);
    res.status(200).json({ traveller });
  },

  async remove(req, res) {
    await TravellerService.remove(req.user.id, req.params.travellerId);
    res.status(204).send();
  },
};

module.exports = TravellerController;
