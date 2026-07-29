const ProfileService = require("../services/profile.service");

const ProfileController = {
  async getMyProfile(req, res) {
    const profile = await ProfileService.getProfile(req.user.id);
    res.status(200).json({ profile });
  },

  async updateMyProfile(req, res) {
    const profile = await ProfileService.updateProfile(req.user.id, req.body);
    res.status(200).json({ profile });
  },

  async requestDeletion(req, res) {
    const result = await ProfileService.requestDeletion(req.user.id);
    res.status(200).json({ message: "Profile anonymized and marked for deletion", ...result });
  },
};

module.exports = ProfileController;
