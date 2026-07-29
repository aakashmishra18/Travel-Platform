const PreferenceService = require("../services/preference.service");

const PreferenceController = {
  async getPreferences(req, res) {
    const preferences = await PreferenceService.getPreferences(req.user.id);
    res.status(200).json({ preferences });
  },
  async updatePreferences(req, res) {
    const preferences = await PreferenceService.updatePreferences(req.user.id, req.body);
    res.status(200).json({ preferences });
  },
  async getSettings(req, res) {
    const settings = await PreferenceService.getSettings(req.user.id);
    res.status(200).json({ settings });
  },
  async updateSettings(req, res) {
    const settings = await PreferenceService.updateSettings(req.user.id, req.body);
    res.status(200).json({ settings });
  },
};

module.exports = PreferenceController;
