import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String },
  password: { type: String }, // untuk login biasa
  role: {
    type: String,
    enum: ['customer', 'admin', 'manager'],
    default: 'customer'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;