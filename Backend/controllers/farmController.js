const Farm = require("../models/Farm");
const Farmer = require("../models/Farmer");
const { successResponse, isValidObjectId } = require("../utils/apiResponse");
const { findFarmerProfile } = require("../utils/farmerAccess");

const canAccessFarm = async (farmId, user) => {
  if (user?.role !== "farmer") return true;
  const profile = await findFarmerProfile(user);
  if (!profile) return false;
  const farm = await Farm.findById(farmId).select("farmerId").lean();
  return farm && String(farm.farmerId) === String(profile._id);
};

const getFarms = async (req, res) => {
  const filter = req.query.farmerId ? { farmerId: req.query.farmerId } : {};
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile)
      return successResponse(res, 200, "Farms retrieved successfully.", [], {
        count: 0,
      });
    filter.farmerId = profile._id;
  }
  const farms = await Farm.find(filter)
    .populate("farmerId", "name phone")
    .populate("produceGrown", "name unit")
    .sort({ createdAt: -1 })
    .lean();
  return successResponse(res, 200, "Farms retrieved successfully.", farms, {
    count: farms.length,
  });
};
const createFarm = async (req, res) => {
  let { farmerId, location, sizeAcres, produceGrown = [] } = req.body;
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Farmer profile not found." });
    if (farmerId && String(farmerId) !== String(profile._id)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only create farms for your own profile.",
        });
    }
    farmerId = profile._id;
  }
  if (!farmerId || !location || sizeAcres === undefined)
    return res
      .status(400)
      .json({
        success: false,
        message: "farmerId, location and sizeAcres are required.",
      });
  if (!isValidObjectId(farmerId))
    return res
      .status(400)
      .json({ success: false, message: "Invalid farmerId." });
  if (!(await Farmer.exists({ _id: farmerId })))
    return res
      .status(404)
      .json({ success: false, message: "Farmer not found." });
  const farm = await Farm.create({
    farmerId,
    location,
    sizeAcres,
    produceGrown,
  });
  await Farmer.findByIdAndUpdate(farmerId, {
    $addToSet: { farmIds: farm._id },
  });
  return successResponse(res, 201, "Farm created successfully.", farm);
};
const getFarmById = async (req, res) => {
  const farm = await Farm.findById(req.params.id)
    .populate("farmerId", "name phone")
    .populate("produceGrown", "name unit")
    .lean();
  if (!farm || !(await canAccessFarm(req.params.id, req.user)))
    return res.status(404).json({ success: false, message: "Farm not found." });
  return successResponse(res, 200, "Farm retrieved successfully.", farm);
};
const updateFarm = async (req, res) => {
  if (!(await canAccessFarm(req.params.id, req.user)))
    return res.status(404).json({ success: false, message: "Farm not found." });
  const updates = { ...req.body };
  if (req.user?.role === "farmer") delete updates.farmerId;
  const farm = await Farm.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!farm)
    return res.status(404).json({ success: false, message: "Farm not found." });
  return successResponse(res, 200, "Farm updated successfully.", farm);
};
const deleteFarm = async (req, res) => {
  if (!(await canAccessFarm(req.params.id, req.user)))
    return res.status(404).json({ success: false, message: "Farm not found." });
  const farm = await Farm.findByIdAndDelete(req.params.id);
  if (!farm)
    return res.status(404).json({ success: false, message: "Farm not found." });
  await Farmer.findByIdAndUpdate(farm.farmerId, {
    $pull: { farmIds: farm._id },
  });
  return successResponse(res, 200, "Farm deleted successfully.", {
    id: farm._id,
  });
};
module.exports = { getFarms, createFarm, getFarmById, updateFarm, deleteFarm };
