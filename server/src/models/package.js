import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  date: String,
  time: String,
  duration: String,
}, { timestamps: true });

export default mongoose.model("Package", packageSchema);
