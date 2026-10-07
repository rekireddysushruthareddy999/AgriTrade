const Shipment = require("../models/Shipment");
const Vehicle = require("../models/Vehicle");
const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Lot = require("../models/Lot");
const { RouteOptimizer } = require("../dsa/routeOptimizer");
const { successResponse } = require("../utils/apiResponse");

const getShipments = async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const shipments = await Shipment.find(filter)
    .populate({
      path: "purchaseOrderId",
      select: "buyerId status deliveryDeadline deliveryLocation",
      populate: { path: "buyerId", select: "name phone email" },
    })
    .populate("vehicleId", "regNumber capacity status currentLocation")
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(
    res,
    200,
    "Shipments retrieved successfully.",
    shipments,
    { count: shipments.length }
  );
};

const getShipmentById = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id)
    .populate({
      path: "purchaseOrderId",
      select: "buyerId status deliveryDeadline deliveryLocation",
      populate: { path: "buyerId", select: "name phone email" },
    })
    .populate("vehicleId", "regNumber capacity status currentLocation")
    .lean();

  if (!shipment) {
    return res.status(404).json({ success: false, message: "Shipment not found." });
  }

  return successResponse(res, 200, "Shipment retrieved successfully.", shipment);
};

const createShipment = async (req, res) => {
  const { purchaseOrderId, vehicleId, stops = [], startPoint = null } = req.body;

  if (!purchaseOrderId || !vehicleId) {
    return res.status(400).json({
      success: false,
      message: "purchaseOrderId and vehicleId are required.",
    });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: "Vehicle not found." });
  }
  if (vehicle.status !== "available") {
    return res.status(409).json({ success: false, message: "Vehicle is not available." });
  }

  const po = await PurchaseOrder.findById(purchaseOrderId);
  if (!po) {
    return res.status(404).json({ success: false, message: "Purchase order not found." });
  }

  // Optimize route across stops using Dijkstra if stops provided
  let routeDetails = { totalDistanceKm: 0, optimalSequence: stops, legDetails: [] };
  if (Array.isArray(stops) && stops.length > 0) {
    const origin = startPoint || vehicle.currentLocation || "HYD_HUB";
    routeDetails = RouteOptimizer.optimizeWithDijkstra({
      stops,
      startPoint: origin,
      endPoint: po.deliveryLocation?.address || null,
    });
  }

  const shipment = await Shipment.create({
    purchaseOrderId,
    vehicleId,
    stops: routeDetails.optimalSequence || stops,
    routeDetails: {
      totalDistanceKm: routeDetails.totalDistanceKm || 0,
      optimalSequence: routeDetails.optimalSequence || [],
      legDetails: routeDetails.legDetails || [],
      fullPathNodes: routeDetails.fullPathNodes || [],
    },
    status: "pending",
  });

  await Vehicle.findByIdAndUpdate(vehicleId, { status: "assigned" });

  return successResponse(res, 201, "Shipment created and route optimized.", shipment);
};

const dispatchShipment = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) {
    return res.status(404).json({ success: false, message: "Shipment not found." });
  }

  if (shipment.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: "Only pending shipments can be dispatched.",
    });
  }

  shipment.status = "in_transit";
  shipment.dispatchedAt = new Date();
  await shipment.save();

  await Vehicle.findByIdAndUpdate(shipment.vehicleId, { status: "in_transit" });

  // Update purchase order lots to "dispatched"
  const poItems = await PurchaseOrderItem.find({ purchaseOrderId: shipment.purchaseOrderId });
  const lotIds = poItems.flatMap((i) => i.allocatedLots);
  if (lotIds.length > 0) {
    await Lot.updateMany(
      { _id: { $in: lotIds } },
      { status: "dispatched", updatedAt: new Date() }
    );
  }

  return successResponse(res, 200, "Shipment dispatched successfully.", shipment);
};

const updateShipmentTransit = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) {
    return res.status(404).json({ success: false, message: "Shipment not found." });
  }

  if (shipment.status !== "in_transit") {
    return res.status(409).json({
      success: false,
      message: "Shipment is not in transit.",
    });
  }

  if (Array.isArray(req.body.stops)) shipment.stops = req.body.stops;
  if (req.body.currentLocation) {
    await Vehicle.findByIdAndUpdate(shipment.vehicleId, {
      currentLocation: req.body.currentLocation,
    });
  }

  await shipment.save();
  return successResponse(res, 200, "Shipment transit updated successfully.", shipment);
};

const deliverShipment = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) {
    return res.status(404).json({ success: false, message: "Shipment not found." });
  }

  if (shipment.status !== "in_transit") {
    return res.status(409).json({
      success: false,
      message: "Only in-transit shipments can be delivered.",
    });
  }

  shipment.status = "delivered";
  shipment.deliveredAt = new Date();
  await shipment.save();

  await Vehicle.findByIdAndUpdate(shipment.vehicleId, { status: "available" });

  // Mark Purchase Order fulfilled and lots delivered
  await PurchaseOrder.findByIdAndUpdate(shipment.purchaseOrderId, {
    status: "delivered",
  });

  const poItems = await PurchaseOrderItem.find({ purchaseOrderId: shipment.purchaseOrderId });
  const lotIds = poItems.flatMap((i) => i.allocatedLots);
  if (lotIds.length > 0) {
    await Lot.updateMany(
      { _id: { $in: lotIds } },
      { status: "delivered", updatedAt: new Date() }
    );
  }

  return successResponse(res, 200, "Shipment delivered and lots marked delivered.", shipment);
};

module.exports = {
  getShipments,
  getShipmentById,
  createShipment,
  dispatchShipment,
  updateShipmentTransit,
  deliverShipment,
};
