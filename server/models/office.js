
import mongoose from "mongoose";
import crypto from "crypto";

const officeSchema = new mongoose.Schema(
  {
    officeId: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(4).toString("hex").toUpperCase(),
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
      },
    ],

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    roomId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Office = mongoose.model("Office", officeSchema);

export default Office;
