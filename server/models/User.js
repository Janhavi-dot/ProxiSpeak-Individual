
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
      unique: true,
    },
    position: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates) =>
            coordinates.length === 2 &&
            coordinates.every(Number.isFinite),
          message: "Coordinates must contain [x, y].",
        },
      },
    },
  },
  { timestamps: true }
);

// Use a planar index for 2D canvas pixel coordinates.
userSchema.index({ position: "2d" });

const User = mongoose.model(
  "User",
  userSchema,
  "user_positions"
);

export default User;
