const mongoose = require("mongoose");
const { Schema } = mongoose;

const farmerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true,
    },
    farmIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Farm",
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Farmer", farmerSchema);
