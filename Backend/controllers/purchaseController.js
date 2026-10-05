const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Lot = require("../models/Lot");
const { successResponse } = require("../utils/apiResponse");

const populateOrder = (query) => query.populate("buyerId", "name email phone");
const findOrderForUser = (req, id) => {
  const filter = { _id: id };
  if (req.user?.role === "buyer") filter.buyerId = req.user.id;
  return PurchaseOrder.findOne(filter);
};
const createPurchaseOrder = async (req, res) => {
  const { deliveryDeadline, items = [] } = req.body;
  const buyerId =
    req.user.role === "buyer" ? req.user.id : req.body.buyerId || req.user.id;
  if (!deliveryDeadline)
    return res
      .status(400)
      .json({ success: false, message: "deliveryDeadline is required." });
  if (!Array.isArray(items) || !items.length)
    return res
      .status(400)
      .json({
        success: false,
        message: "At least one order item is required.",
      });
  const order = await PurchaseOrder.create({
    buyerId,
    deliveryDeadline,
    status: "pending",
  });
  await PurchaseOrderItem.insertMany(
    items.map((i) => ({
      purchaseOrderId: order._id,
      produceCategoryId: i.produceCategoryId,
      quantityRequested: i.quantityRequested,
    })),
  );
  return successResponse(
    res,
    201,
    "Purchase order created successfully.",
    await populateOrder(PurchaseOrder.findById(order._id)).lean(),
  );
};
const getPurchaseOrders = async (req, res) => {
  const filter =
    req.user?.role === "buyer"
      ? { buyerId: req.user.id }
      : req.query.buyer
        ? { buyerId: req.query.buyer }
        : {};
  const orders = await populateOrder(
    PurchaseOrder.find(filter).sort({ createdAt: -1 }),
  ).lean();
  const ids = orders.map((x) => x._id);
  const items = ids.length
    ? await PurchaseOrderItem.find({ purchaseOrderId: { $in: ids } })
        .populate("produceCategoryId", "name unit")
        .lean()
    : [];
  const grouped = new Map(ids.map((id) => [String(id), []]));
  items.forEach((i) => grouped.get(String(i.purchaseOrderId))?.push(i));
  orders.forEach((o) => {
    o.items = grouped.get(String(o._id)) || [];
  });
  return successResponse(
    res,
    200,
    "Purchase orders retrieved successfully.",
    orders,
    { count: orders.length },
  );
};
const getPurchaseOrderById = async (req, res) => {
  const order = await populateOrder(
    findOrderForUser(req, req.params.id),
  ).lean();
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  order.items = await PurchaseOrderItem.find({ purchaseOrderId: order._id })
    .populate("produceCategoryId", "name unit")
    .populate("allocatedLots")
    .lean();
  return successResponse(
    res,
    200,
    "Purchase order retrieved successfully.",
    order,
  );
};
const allocatePurchaseOrder = async (req, res) => {
  const order = await findOrderForUser(req, req.params.id);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  if (["cancelled", "fulfilled"].includes(order.status))
    return res
      .status(409)
      .json({
        success: false,
        message: "This purchase order cannot be allocated.",
      });
  const items = await PurchaseOrderItem.find({ purchaseOrderId: order._id });
  for (const item of items) {
    let remaining = item.quantityRequested - item.quantityFulfilled;
    if (remaining <= 0) continue;
    const lots = await Lot.find({
      produceCategoryId: item.produceCategoryId,
      status: { $in: ["available", "inspected"] },
      quantity: { $gt: 0 },
    }).sort({ expiryEstimate: 1 });
    for (const lot of lots) {
      if (remaining <= 0) break;
      const allocated = Math.min(remaining, lot.quantity);
      lot.quantity -= allocated;
      if (lot.quantity === 0) lot.status = "reserved";
      else if (lot.status === "available") lot.status = "reserved";
      await lot.save();
      item.quantityFulfilled += allocated;
      remaining -= allocated;
      item.allocatedLots.push(lot._id);
    }
    await item.save();
  }
  order.status = items.every((i) => i.quantityFulfilled >= i.quantityRequested)
    ? "approved"
    : "pending";
  await order.save();
  return successResponse(
    res,
    200,
    "Purchase order allocation completed.",
    await getPurchaseOrderData(order._id),
  );
};
const getPurchaseOrderData = async (id) => {
  const order = await populateOrder(PurchaseOrder.findById(id)).lean();
  order.items = await PurchaseOrderItem.find({ purchaseOrderId: id })
    .populate("produceCategoryId", "name unit")
    .populate("allocatedLots")
    .lean();
  return order;
};
const cancelPurchaseOrder = async (req, res) => {
  const order = await findOrderForUser(req, req.params.id);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  if (order.status === "fulfilled")
    return res
      .status(409)
      .json({
        success: false,
        message: "A fulfilled order cannot be cancelled.",
      });
  order.status = "cancelled";
  await order.save();
  return successResponse(
    res,
    200,
    "Purchase order cancelled successfully.",
    order,
  );
};
const confirmDelivery = async (req, res) => {
  const order = await findOrderForUser(req, req.params.id);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  order.status = "fulfilled";
  await order.save();
  return successResponse(res, 200, "Purchase order delivery confirmed.", order);
};
module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  allocatePurchaseOrder,
  cancelPurchaseOrder,
  confirmDelivery,
};
