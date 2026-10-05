const Lot = require("../models/Lot");
const Farmer = require("../models/Farmer");
const ProduceCategory = require("../models/ProduceCategory");
const { successResponse, isValidObjectId } = require("../utils/apiResponse");
const { buildLotStateGraph } = require("../dsa/lotStateGraph");
const { findFarmerProfile } = require("../utils/farmerAccess");

const graph = buildLotStateGraph();

const populateLot = (query) =>
  query
    .populate("farmerId", "name phone")
    .populate("produceCategoryId", "name unit")
    .populate("warehouseId", "name location capacity");

const createLot = async (req, res) => {
  const {
    farmerId,
    produceCategoryId,
    quantity,
    harvestDate,
    expiryEstimate,
    warehouseId,
    groupId,
  } = req.body;
  if (
    !farmerId ||
    !produceCategoryId ||
    quantity === undefined ||
    !harvestDate ||
    !expiryEstimate
  )
    return res.status(400).json({
      success: false,
      message:
        "farmerId, produceCategoryId, quantity, harvestDate and expiryEstimate are required.",
    });
  if (!isValidObjectId(farmerId) || !isValidObjectId(produceCategoryId))
    return res.status(400).json({
      success: false,
      message: "Invalid farmerId or produceCategoryId.",
    });
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Farmer profile not found." });
    if (String(profile._id) !== String(farmerId))
      return res.status(403).json({
        success: false,
        message: "You can only create lots for your own farmer profile.",
      });
  }
  if (!(await Farmer.exists({ _id: farmerId })))
    return res
      .status(404)
      .json({ success: false, message: "Farmer not found." });
  if (!(await ProduceCategory.exists({ _id: produceCategoryId })))
    return res
      .status(404)
      .json({ success: false, message: "Produce category not found." });
  const lot = await Lot.create({
    farmerId,
    produceCategoryId,
    quantity,
    harvestDate,
    expiryEstimate,
    warehouseId: warehouseId || null,
    groupId: groupId || null,
  });
  return successResponse(
    res,
    201,
    "Lot created successfully.",
    await populateLot(Lot.findById(lot._id)).lean(),
  );
};
const getLots = async (req, res) => {
  const filter = {};
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile)
      return successResponse(res, 200, "Lots retrieved successfully.", [], {
        count: 0,
      });
    filter.farmerId = profile._id;
  }
  if (req.query.region) {
    /* region filtering is handled through farmer population below when needed */
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.farmerId && req.user?.role !== "farmer") {
    filter.farmerId = req.query.farmerId;
  }
  if (req.query.produceCategoryId)
    filter.produceCategoryId = req.query.produceCategoryId;
  const lots = await populateLot(
    Lot.find(filter).sort({ createdAt: -1 }),
  ).lean();
  return successResponse(res, 200, "Lots retrieved successfully.", lots, {
    count: lots.length,
  });
};
const getLotById = async (req, res) => {
  const lot = await populateLot(Lot.findById(req.params.id)).lean();
  if (!lot)
    return res.status(404).json({ success: false, message: "Lot not found." });
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile || String(profile._id) !== String(lot.farmerId?._id))
      return res
        .status(404)
        .json({ success: false, message: "Lot not found." });
  }
  return successResponse(res, 200, "Lot retrieved successfully.", lot);
};
const updateLotStatus = async (req, res) => {
  const { status } = req.body;
  if (!status)
    return res
      .status(400)
      .json({ success: false, message: "status is required." });
  const lot = await Lot.findById(req.params.id);
  if (!lot)
    return res.status(404).json({ success: false, message: "Lot not found." });
  if (!graph.canTransition(lot.status, status))
    return res.status(409).json({
      success: false,
      message: `Invalid lot status transition from ${lot.status} to ${status}.`,
    });
  lot.status = status;
  await lot.save();
  return successResponse(res, 200, "Lot status updated successfully.", lot);
};
const addInspectionToLot = async (req, res) => {
  const Inspection = require("../models/Inspection");
  const lot = await Lot.findById(req.params.id);
  if (!lot)
    return res.status(404).json({ success: false, message: "Lot not found." });
  const { criteriaScores = [], notes = "" } = req.body;
  const scores = criteriaScores
    .map((x) => ({ name: String(x.name || "").trim(), score: Number(x.score) }))
    .filter((x) => x.name && Number.isFinite(x.score));
  const average = scores.length
    ? scores.reduce((a, b) => a + b.score, 0) / scores.length
    : 0;
  const grade =
    average >= 85
      ? "A"
      : average >= 70
        ? "B"
        : average >= 55
          ? "C"
          : average >= 40
            ? "D"
            : "F";
  const inspection = await Inspection.create({
    lotId: lot._id,
    inspectorId: req.user.id,
    criteriaScores: scores,
    grade,
    notes,
  });
  if (graph.canTransition(lot.status, "inspected")) {
    lot.status = "inspected";
    await lot.save();
  }
  return successResponse(res, 201, "Inspection added to lot.", inspection);
};
module.exports = {
  createLot,
  getLots,
  getLotById,
  updateLotStatus,
  addInspectionToLot,
};
