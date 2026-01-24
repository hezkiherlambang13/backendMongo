import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  package: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
  date: String,
  time: String,
  name: String,
  email: String,
  whatsapp: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
