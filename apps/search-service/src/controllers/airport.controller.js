const AirportService = require("../services/airport.service");

const AirportController = {
  async search(req, res) {
    const airports = await AirportService.search(req.query.q);
    res.status(200).json({ airports });
  },
};

module.exports = AirportController;
