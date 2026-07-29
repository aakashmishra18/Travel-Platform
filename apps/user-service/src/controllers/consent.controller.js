const ConsentService = require("../services/consent.service");

const ConsentController = {
  async list(req, res) {
    const consents = await ConsentService.list(req.user.id);
    res.status(200).json({ consents });
  },
  async record(req, res) {
    const consent = await ConsentService.record(req.user.id, req.body);
    res.status(201).json({ consent });
  },
};

module.exports = ConsentController;
