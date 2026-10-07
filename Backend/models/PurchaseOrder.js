const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseOrderSchema = new Schema(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "allocated",
        "partially_fulfilled",
        "fulfilled",
        "cancelled",
        "delivered",
      ],
      default: "pending",
      index: true,
    },
    deliveryDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    deliveryLocation: {
      address: {
        type: String,
        default: "",
        trim: true,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
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

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
