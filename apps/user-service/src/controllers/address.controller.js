const AddressService = require("../services/address.service");

const AddressController = {
  async list(req, res) {
    const addresses = await AddressService.list(req.user.id);
    res.status(200).json({ addresses });
  },
  async create(req, res) {
    const address = await AddressService.create(req.user.id, req.body);
    res.status(201).json({ address });
  },
  async update(req, res) {
    const address = await AddressService.update(req.user.id, req.params.addressId, req.body);
    res.status(200).json({ address });
  },
  async remove(req, res) {
    await AddressService.remove(req.user.id, req.params.addressId);
    res.status(204).send();
  },
};

module.exports = AddressController;
