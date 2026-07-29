const ContactService = require("../services/contact.service");

const ContactController = {
  async list(req, res) {
    const contacts = await ContactService.list(req.user.id);
    res.status(200).json({ contacts });
  },
  async create(req, res) {
    const contact = await ContactService.create(req.user.id, req.body);
    res.status(201).json({ contact });
  },
  async remove(req, res) {
    await ContactService.remove(req.user.id, req.params.contactId);
    res.status(204).send();
  },
};

module.exports = ContactController;
