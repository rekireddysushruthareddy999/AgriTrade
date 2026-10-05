const mongoose = require("mongoose");
const { Schema } = mongoose;

const regionSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
});

module.exports = mongoose.model("Region", regionSchema);
