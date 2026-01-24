import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  duration: { 
    type: String, 
    required: true 
  }, // contoh: "2 hours", "Half day"
  features: [{ 
    type: String 
  }], // array fitur: ["10 edited photos", "1 outfit change"]
  category: {
    type: String,
    enum: ['wedding', 'portrait', 'graduation', 'family', 'product', 'event'],
    required: true
  },
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  availableTimeStart: {
    type: String,
    default: '08:00'
  },
  availableTimeEnd: {
    type: String,
    default: '17:00'
  },
  images: [{
    url: String,
    public_id: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Package = mongoose.model('Package', packageSchema);

export default Package;



// const mongoose = require('mongoose');

// const packageSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   price: { type: Number, required: true },
//   description: { type: String, required: true },
//   image: { type: String, required: true }
// }, { timestamps: true });

// module.exports = mongoose.model('Package', packageSchema);