const mongoose = require("mongoose");
const { Schema } = mongoose;

const lotSchema = new Schema(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },
    produceCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProduceCategory",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        // Standard AgriTrade produce lifecycle states:
        "created",
        "received",
        "inspected",
        "accepted",
        "rejected",
        "stored",
        "allocated",
        "dispatched",
        "delivered",
        // Legacy/compatibility states:
        "available",
        "reserved",
        "shipped",
        "settled",
        "expired",
      ],
      default: "created",
      index: true,
    },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "F", null],
      default: null,
    },
    pricePerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageUrl: {
      type: String,
      required: [true, "Product image is mandatory while uploading a lot."],
      trim: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    expiryEstimate: {
      type: Date,
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
      index: true,
    },
    // From: Farm gate or collection center origin location
    originLocation: {
      type: String,
      default: "",
      trim: true,
    },
    // To: Target warehouse or storage facility destination location
    destinationLocation: {
      type: String,
      default: "",
      trim: true,
    },
    // Union-Find settlement batch group identifier
    groupId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

lotSchema.index({ status: 1, expiryEstimate: 1 });
lotSchema.index({ farmerId: 1, status: 1 });
lotSchema.index({ warehouseId: 1, produceCategoryId: 1 });

module.exports = mongoose.model("Lot", lotSchema);
