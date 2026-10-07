const mongoose = require("mongoose");
const { Schema } = mongoose;

const shipmentSchema = new Schema(
  {
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
      index: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },
    stops: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "dispatched",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    routeDetails: {
      totalDistanceKm: { type: Number, default: 0 },
      optimalSequence: [{ type: Schema.Types.Mixed }],
      legDetails: [{ type: Schema.Types.Mixed }],
      fullPathNodes: [{ type: Schema.Types.Mixed }],
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
