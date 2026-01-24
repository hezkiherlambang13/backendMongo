const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);