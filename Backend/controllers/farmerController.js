const Farmer = require("../models/Farmer");
const { successResponse, isValidObjectId } = require("../utils/apiResponse");
const { findFarmerProfile } = require("../utils/farmerAccess");

const getFarmers = async (req, res) => {
  const filter = {};
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile) {
      return successResponse(res, 200, "Farmers retrieved successfully.", [], {
        count: 0,
      });
    }
    filter._id = profile._id;
  } else if (req.query.regionId) {
    filter.regionId = req.query.regionId;
  }
  const farmers = await Farmer.find(filter)
    .populate("regionId", "name code")
    .populate("farmIds", "location sizeAcres produceGrown")
    .sort({ createdAt: -1 })
    .lean();
  return successResponse(res, 200, "Farmers retrieved successfully.", farmers, {
    count: farmers.length,
  });
};

const createFarmer = async (req, res) => {
  const { name, phone, regionId } = req.body;
  if (!name || !phone || !regionId)
    return res
      .status(400)
      .json({
        success: false,
        message: "Name, phone and regionId are required.",
      });
  if (!isValidObjectId(regionId))
    return res
      .status(400)
      .json({ success: false, message: "Invalid regionId." });
  const farmer = await Farmer.create({
    name: String(name).trim(),
    phone: String(phone).trim(),
    regionId,
  });
  return successResponse(res, 201, "Farmer created successfully.", farmer);
};

const getFarmerById = async (req, res) => {
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile || String(profile._id) !== req.params.id) {
      return res
        .status(404)
        .json({ success: false, message: "Farmer not found." });
    }
  }
  const farmer = await Farmer.findById(req.params.id)
    .populate("regionId", "name code")
    .populate("farmIds")
    .lean();
  if (!farmer)
    return res
      .status(404)
      .json({ success: false, message: "Farmer not found." });
  return successResponse(res, 200, "Farmer retrieved successfully.", farmer);
};

const updateFarmer = async (req, res) => {
  const farmer = await Farmer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("regionId", "name code");
  if (!farmer)
    return res
      .status(404)
      .json({ success: false, message: "Farmer not found." });
  return successResponse(res, 200, "Farmer updated successfully.", farmer);
};

const deleteFarmer = async (req, res) => {
  const farmer = await Farmer.findByIdAndDelete(req.params.id);
  if (!farmer)
    return res
      .status(404)
      .json({ success: false, message: "Farmer not found." });
  return successResponse(res, 200, "Farmer deleted successfully.", {
    id: farmer._id,
  });
};
module.exports = {
  getFarmers,
  createFarmer,
  getFarmerById,
  updateFarmer,
  deleteFarmer,
};
