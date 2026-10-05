const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventoryMovementSchema = new Schema({
  lotId: {
    type: Schema.Types.ObjectId,
    ref: "Lot",
    required: true,
  },
  warehouseId: {
    type: Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  type: {
    type: String,
    enum: ["in", "out"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InventoryMovement", inventoryMovementSchema);
