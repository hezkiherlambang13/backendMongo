import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  title: String,
  price: Number,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }
});

export default mongoose.model("Package", packageSchema);
