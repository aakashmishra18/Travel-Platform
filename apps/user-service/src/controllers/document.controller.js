const DocumentService = require("../services/document.service");

const DocumentController = {
  async list(req, res) {
    const documents = await DocumentService.list(req.user.id, req.params.travellerId);
    res.status(200).json({ documents });
  },

  async create(req, res) {
    const document = await DocumentService.create(req.user.id, req.params.travellerId, req.body);
    res.status(201).json({ document });
  },

  async remove(req, res) {
    await DocumentService.remove(req.user.id, req.params.travellerId, req.params.documentId);
    res.status(204).send();
  },
};

module.exports = DocumentController;
