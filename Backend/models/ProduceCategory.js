const mongoose = require("mongoose");
const { Schema } = mongoose;

const gradingCriterionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const produceCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      default: 20,
      min: 0,
    },
    gradingCriteria: [gradingCriterionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProduceCategory", produceCategorySchema);
