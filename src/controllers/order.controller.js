const Order = require('../models/Order.model');
const Package = require('../models/Package.model');
const User = require('../models/User.model');

const bookPackage = async (req, res) => {
  try {
    const { packageId, date, time } = req.body;
    const customerId = req.user.id;

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found.' });

    const order = new Order({ customer: customerId, package: packageId, date, time });
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to book package.' });
  }
};

module.exports = { bookPackage };