const Lot = require("../models/Lot");
const Farmer = require("../models/Farmer");
const ProduceCategory = require("../models/ProduceCategory");
const Inspection = require("../models/Inspection");
const Warehouse = require("../models/Warehouse");
const { successResponse, isValidObjectId } = require("../utils/apiResponse");
const { buildLotStateGraph } = require("../dsa/lotStateGraph");
const { findFarmerProfile } = require("../utils/farmerAccess");

const graph = buildLotStateGraph();

const populateLot = (query) =>
  query
    .populate("farmerId", "name phone regionId")
    .populate("produceCategoryId", "name unit gradingCriteria basePrice")
    .populate("warehouseId", "name location capacity currentStock");

const createLot = async (req, res) => {
  const {
    farmerId,
    produceCategoryId,
    quantity,
    harvestDate,
    expiryEstimate,
    warehouseId,
    groupId,
    pricePerUnit,
    notes,
  } = req.body;

  if (
    !farmerId ||
    !produceCategoryId ||
    quantity === undefined ||
    !harvestDate ||
    !expiryEstimate
  ) {
    return res.status(400).json({
      success: false,
      message:
        "farmerId, produceCategoryId, quantity, harvestDate and expiryEstimate are required.",
    });
  }

  if (!isValidObjectId(farmerId) || !isValidObjectId(produceCategoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid farmerId or produceCategoryId.",
    });
  }

  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Farmer profile not found." });
    }
    if (String(profile._id) !== String(farmerId)) {
      return res.status(403).json({
        success: false,
        message: "You can only create lots for your own farmer profile.",
      });
    }
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    return res
      .status(404)
      .json({ success: false, message: "Farmer not found." });
  }

  const category = await ProduceCategory.findById(produceCategoryId);
  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "Produce category not found." });
  }

  // Region-based check: collection center staff can only create lots in their assigned region
  if (
    ["collection_center", "collection_center_staff"].includes(req.user?.role) &&
    req.user.regionId &&
    String(farmer.regionId) !== String(req.user.regionId)
  ) {
    return res.status(403).json({
      success: false,
      message: "You can only handle lots for farmers within your assigned region.",
    });
  }

  const lot = await Lot.create({
    farmerId,
    produceCategoryId,
    quantity: Number(quantity),
    status: "created",
    pricePerUnit: Number(pricePerUnit || category.basePrice || 0),
    harvestDate: new Date(harvestDate),
    expiryEstimate: new Date(expiryEstimate),
    warehouseId: warehouseId || null,
    groupId: groupId || null,
    notes: notes || "",
  });

  const created = await populateLot(Lot.findById(lot._id)).lean();
  return successResponse(res, 201, "Lot created successfully.", created);
};

const getLots = async (req, res) => {
  const filter = {};

  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile) {
      return successResponse(res, 200, "Lots retrieved successfully.", [], {
        count: 0,
      });
    }
    filter.farmerId = profile._id;
  } else if (
    ["collection_center", "collection_center_staff"].includes(req.user?.role) &&
    req.user?.regionId
  ) {
    // Scoped to farmers in the collection center's region
    const regionalFarmers = await Farmer.find({ regionId: req.user.regionId }).select("_id");
    filter.farmerId = { $in: regionalFarmers.map((f) => f._id) };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.farmerId && req.user?.role !== "farmer") {
    filter.farmerId = req.query.farmerId;
  }
  if (req.query.produceCategoryId) {
    filter.produceCategoryId = req.query.produceCategoryId;
  }
  if (req.query.warehouseId) {
    filter.warehouseId = req.query.warehouseId;
  }

  const lots = await populateLot(
    Lot.find(filter).sort({ createdAt: -1 })
  ).lean();

  // Attach dynamic valid transitions from directed graph
  const enhancedLots = lots.map((lot) => ({
    ...lot,
    allowedTransitions: graph.getNextStates(lot.status),
    availableActions: graph.getAvailableActions(lot.status),
  }));

  return successResponse(res, 200, "Lots retrieved successfully.", enhancedLots, {
    count: enhancedLots.length,
  });
};

const getLotById = async (req, res) => {
  const lot = await populateLot(Lot.findById(req.params.id)).lean();
  if (!lot) {
    return res.status(404).json({ success: false, message: "Lot not found." });
  }

  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile || String(profile._id) !== String(lot.farmerId?._id)) {
      return res
        .status(404)
        .json({ success: false, message: "Lot not found." });
    }
  }

  // Get inspections for this lot
  const inspections = await Inspection.find({ lotId: lot._id })
    .populate("inspectorId", "name email role")
    .sort({ inspectedAt: -1 })
    .lean();

  const nextStates = graph.getNextStates(lot.status);
  const actions = graph.getAvailableActions(lot.status);
  const reachable = graph.getReachableStates(lot.status);

  return successResponse(res, 200, "Lot retrieved successfully.", {
    ...lot,
    inspections,
    allowedTransitions: nextStates,
    availableActions: actions,
    futureReachableStates: reachable,
  });
};

/**
 * Validates transition against the Directed Graph FSM before saving.
 */
const updateLotStatus = async (req, res) => {
  const { status, warehouseId, notes } = req.body;
  if (!status) {
    return res
      .status(400)
      .json({ success: false, message: "status is required." });
  }

  const lot = await Lot.findById(req.params.id);
  if (!lot) {
    return res.status(404).json({ success: false, message: "Lot not found." });
  }

  const currentStatus = lot.status;
  const targetStatus = String(status).toLowerCase().trim();

  // O(1) Directed Graph Edge Lookup
  if (!graph.canTransition(currentStatus, targetStatus)) {
    return res.status(409).json({
      success: false,
      message: `Invalid lot status transition from "${currentStatus}" to "${targetStatus}". Permitted next states: [${graph.getNextStates(currentStatus).join(", ")}].`,
      allowedNextStates: graph.getNextStates(currentStatus),
    });
  }

  lot.status = targetStatus;
  if (warehouseId) lot.warehouseId = warehouseId;
  if (notes) lot.notes = notes;

  await lot.save();

  return successResponse(res, 200, `Lot status transitioned to "${targetStatus}".`, {
    ...lot.toObject(),
    allowedTransitions: graph.getNextStates(lot.status),
    availableActions: graph.getAvailableActions(lot.status),
  });
};

/**
 * Inspection workflow: grades lot against configurable criteria and transitions state.
 */
const addInspectionToLot = async (req, res) => {
  const lot = await Lot.findById(req.params.id).populate("produceCategoryId");
  if (!lot) {
    return res.status(404).json({ success: false, message: "Lot not found." });
  }

  const { criteriaScores = [], notes = "" } = req.body;

  // Compute weighted score based on criteria weights if available
  const scores = criteriaScores
    .map((x) => ({
      name: String(x.name || "").trim(),
      score: Number(x.score),
      weight: Number(x.weight || 1),
    }))
    .filter((x) => x.name && Number.isFinite(x.score));

  let finalScore = 0;
  if (scores.length > 0) {
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
    finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Grade calculation
  const grade =
    finalScore >= 85
      ? "A"
      : finalScore >= 70
        ? "B"
        : finalScore >= 55
          ? "C"
          : finalScore >= 40
            ? "D"
            : "F";

  const inspection = await Inspection.create({
    lotId: lot._id,
    inspectorId: req.user.id,
    criteriaScores: scores.map((s) => ({ name: s.name, score: s.score })),
    grade,
    notes,
    inspectedAt: new Date(),
  });

  lot.grade = grade;

  // Update lot status using FSM transition
  // created -> received -> inspected -> accepted/rejected
  if (grade === "F") {
    if (graph.canTransition(lot.status, "rejected")) {
      lot.status = "rejected";
    } else if (graph.canTransition(lot.status, "inspected")) {
      lot.status = "rejected";
    }
  } else {
    // Passing grade (A, B, C, D) leads to accepted
    if (graph.canTransition(lot.status, "accepted")) {
      lot.status = "accepted";
    } else if (graph.canTransition("inspected", "accepted")) {
      lot.status = "accepted";
    }
  }

  await lot.save();

  return successResponse(res, 201, "Inspection completed and lot graded.", {
    inspection,
    lot: {
      id: lot._id,
      status: lot.status,
      grade: lot.grade,
      allowedTransitions: graph.getNextStates(lot.status),
    },
  });
};

/**
 * Get valid next transitions and actions for a lot.
 */
const getLotTransitions = async (req, res) => {
  const lot = await Lot.findById(req.params.id);
  if (!lot) {
    return res.status(404).json({ success: false, message: "Lot not found." });
  }

  return successResponse(res, 200, "Lot transitions retrieved.", {
    lotId: lot._id,
    currentState: lot.status,
    allowedNextStates: graph.getNextStates(lot.status),
    availableActions: graph.getAvailableActions(lot.status),
    reachableStates: graph.getReachableStates(lot.status),
  });
};

/**
 * Returns the full Directed Graph state map for visualization in the UI.
 */
const getLifecycleGraph = async (req, res) => {
  const graphData = graph.getGraphVisualizationData();
  return successResponse(res, 200, "Lifecycle directed graph structure retrieved.", graphData);
};

module.exports = {
  createLot,
  getLots,
  getLotById,
  updateLotStatus,
  addInspectionToLot,
  getLotTransitions,
  getLifecycleGraph,
};
