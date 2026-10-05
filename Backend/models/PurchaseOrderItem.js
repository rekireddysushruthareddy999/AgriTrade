const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseOrderItemSchema = new Schema({
  purchaseOrderId: {
    type: Schema.Types.ObjectId,
    ref: "PurchaseOrder",
    required: true,
  },
  produceCategoryId: {
    type: Schema.Types.ObjectId,
    ref: "ProduceCategory",
    required: true,
  },
  quantityRequested: {
    type: Number,
    required: true,
    min: 0,
  },
  quantityFulfilled: {
    type: Number,
    default: 0,
    min: 0,
  },
  allocatedLots: [
    {
      type: Schema.Types.ObjectId,
      ref: "Lot",
    },
  ],
});

module.exports = mongoose.model("PurchaseOrderItem", purchaseOrderItemSchema);
