const mongoose = require("mongoose");
const { Schema } = mongoose;

const vehicleSchema = new Schema(
  {
    regNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["available", "assigned", "in_transit", "maintenance", "out_of_service"],
      default: "available",
      index: true,
    },
    currentLocation: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
