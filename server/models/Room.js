import mongoose from "mongoose";

const furnitureSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    rotation: { type: Number, default: 0 },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      default: "main-office",
    },
    width: {
      type: Number,
      required: true,
      default: 1000,
      min: 1,
    },
    height: {
      type: Number,
      required: true,
      default: 880,
      min: 1,
    },
    furniture: {
      type: [furnitureSchema],
      default: [],
    },
    obstacles: {
      type: [furnitureSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema, "rooms");

export default Room;