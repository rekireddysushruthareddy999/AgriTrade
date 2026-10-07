const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        "admin",
        "collection_center",
        "collection_center_staff",
        "inspector",
        "quality_inspector",
        "buyer",
        "logistics",
        "logistics_coordinator",
        "farmer",
        "warehouse_manager",
      ],
      default: "farmer",
      required: true,
      index: true,
    },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
      index: true,
    },
    organizationId: {
      type: String,
      default: null,
      trim: true,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
