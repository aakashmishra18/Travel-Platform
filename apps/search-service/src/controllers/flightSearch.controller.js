const FlightSearchService = require("../services/flightSearch.service");

const FlightSearchController = {
  async search(req, res) {
    const result = await FlightSearchService.search(req.body, req.user?.id || null);
    res.status(200).json(result);
  },

  async recentSearches(req, res) {
    const searches = await FlightSearchService.recentSearches(req.user.id);
    res.status(200).json({ searches });
  },

  async popularRoutes(req, res) {
    const routes = await FlightSearchService.popularRoutes();
    res.status(200).json({ routes });
  },
};

module.exports = FlightSearchController;
