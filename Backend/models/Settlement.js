const mongoose = require("mongoose");
const { Schema } = mongoose;

const settlementSchema = new Schema(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },
    lotIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lot",
      },
    ],
    cycle: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "paid"],
      default: "pending",
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    batchGroupId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    breakdown: {
      taxValue: { type: Number, default: 0 },
      commissionValue: { type: Number, default: 0 },
      freightValue: { type: Number, default: 0 },
      qualityBonus: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

settlementSchema.index({ farmerId: 1, cycle: 1 });

module.exports = mongoose.model("Settlement", settlementSchema);
