const Farmer = require("../models/Farmer");

const findFarmerProfile = (user) => {
  if (user?.role !== "farmer" || !user.phone) return null;
  return Farmer.findOne({ phone: user.phone }).select("_id").lean();
};

module.exports = { findFarmerProfile };
