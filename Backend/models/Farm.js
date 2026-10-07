const mongoose = require("mongoose");
const { Schema } = mongoose;

const farmSchema = new Schema(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    sizeAcres: {
      type: Number,
      required: true,
      min: 0,
    },
    produceGrown: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProduceCategory",
      },
    ],
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

module.exports = mongoose.model("Farm", farmSchema);
