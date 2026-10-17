
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
      unique: true,
    },
    position: {
      type: [Number],
      required: true,
      validate: {
        validator: (coordinates) =>
          coordinates.length === 2 &&
          coordinates.every(Number.isFinite),
        message: "Position must contain [x, y].",
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ position: "2d" });

const User = mongoose.model(
  "User",
  userSchema,
  "user_positions"
);

export default User;
