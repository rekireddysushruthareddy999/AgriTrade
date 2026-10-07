const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Lot = require("../models/Lot");
const InventoryMovement = require("../models/InventoryMovement");
const { successResponse } = require("../utils/apiResponse");
const { allocateLotsFEFO } = require("../dsa/warehouseAllocationHeap");

const populateOrder = (query) =>
  query
    .populate("buyerId", "name email phone role")
    .populate("regionId", "name code");

const findOrderForUser = (req, id) => {
  return PurchaseOrder.findById(id);
};

const createPurchaseOrder = async (req, res) => {
  const { deliveryDeadline, items = [], deliveryLocation, regionId, notes } = req.body;
  const buyerId =
    req.user.role === "buyer" ? req.user.id : req.body.buyerId || req.user.id;

  if (!deliveryDeadline) {
    return res
      .status(400)
      .json({ success: false, message: "deliveryDeadline is required." });
  }

  if (!Array.isArray(items) || !items.length) {
    return res
      .status(400)
      .json({
        success: false,
        message: "At least one order item is required.",
      });
  }

  const order = await PurchaseOrder.create({
    buyerId,
    deliveryDeadline: new Date(deliveryDeadline),
    deliveryLocation: deliveryLocation || {},
    regionId: regionId || null,
    notes: notes || "",
    status: "pending",
  });

  const createdItems = await PurchaseOrderItem.insertMany(
    items.map((i) => ({
      purchaseOrderId: order._id,
      produceCategoryId: i.produceCategoryId,
      quantityRequested: Number(i.quantityRequested || 0),
      quantityFulfilled: 0,
      allocatedLots: [],
    }))
  );

  // Auto-allocate via FEFO Min-Heap if requested (1-click purchase)
  if (req.body.autoAllocate) {
    for (const item of createdItems) {
      const availableLots = await Lot.find({
        produceCategoryId: item.produceCategoryId,
        status: { $in: ["stored", "accepted", "available"] },
        quantity: { $gt: 0 },
      }).lean();

      if (availableLots.length > 0) {
        const fefoResult = allocateLotsFEFO(availableLots, item.quantityRequested);
        for (const alloc of fefoResult.allocations) {
          const lot = await Lot.findById(alloc.lotId);
          if (!lot) continue;
          lot.quantity = alloc.remainingLotQuantity;
          if (lot.quantity === 0) lot.status = "allocated";
          await lot.save();

          if (lot.warehouseId) {
            await InventoryMovement.create({
              lotId: lot._id,
              warehouseId: lot.warehouseId,
              type: "out",
              quantity: alloc.allocatedQuantity,
              timestamp: new Date(),
            });
          }

          item.quantityFulfilled += alloc.allocatedQuantity;
          if (!item.allocatedLots.some((id) => String(id) === String(lot._id))) {
            item.allocatedLots.push(lot._id);
          }
        }
        await item.save();
      }
    }
    const refreshed = await PurchaseOrderItem.find({ purchaseOrderId: order._id });
    if (refreshed.every((i) => i.quantityFulfilled >= i.quantityRequested)) {
      order.status = "allocated";
    } else if (refreshed.some((i) => i.quantityFulfilled > 0)) {
      order.status = "partially_fulfilled";
    }
    await order.save();
  }

  return successResponse(
    res,
    201,
    "Purchase order created successfully.",
    await getPurchaseOrderData(order._id)
  );
};

const getPurchaseOrders = async (req, res) => {
  const filter = {};
  if (req.user?.role === "buyer") {
    filter.buyerId = req.user.id;
  } else if (req.query.buyer) {
    filter.buyerId = req.query.buyer;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await populateOrder(
    PurchaseOrder.find(filter).sort({ createdAt: -1 })
  ).lean();

  const ids = orders.map((x) => x._id);
  const items = ids.length
    ? await PurchaseOrderItem.find({ purchaseOrderId: { $in: ids } })
        .populate("produceCategoryId", "name unit basePrice")
        .populate({
          path: "allocatedLots",
          select: "quantity expiryEstimate status grade warehouseId",
          populate: { path: "warehouseId", select: "name location" },
        })
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
    { count: orders.length }
  );
};

const getPurchaseOrderById = async (req, res) => {
  const order = await populateOrder(
    findOrderForUser(req, req.params.id)
  ).lean();

  if (!order) {
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  }

  order.items = await PurchaseOrderItem.find({ purchaseOrderId: order._id })
    .populate("produceCategoryId", "name unit basePrice")
    .populate({
      path: "allocatedLots",
      select: "quantity expiryEstimate status grade warehouseId",
      populate: { path: "warehouseId", select: "name location" },
    })
    .lean();

  return successResponse(
    res,
    200,
    "Purchase order retrieved successfully.",
    order
  );
};

/**
 * DSA 4.1 Integration: Allocate Purchase Order using FEFO Min-Heap
 * Allocates available lots closest to expiry first to minimize spoilage.
 */
const allocatePurchaseOrder = async (req, res) => {
  const order = await findOrderForUser(req, req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  }

  if (["cancelled", "fulfilled", "delivered"].includes(order.status)) {
    return res.status(409).json({
      success: false,
      message: `Purchase order cannot be allocated in status "${order.status}".`,
    });
  }

  const items = await PurchaseOrderItem.find({ purchaseOrderId: order._id });
  const allocationSummary = [];

  for (const item of items) {
    const remainingNeeded = item.quantityRequested - item.quantityFulfilled;
    if (remainingNeeded <= 0) continue;

    // Retrieve active warehouse inventory lots for this produce category
    const availableLots = await Lot.find({
      produceCategoryId: item.produceCategoryId,
      status: { $in: ["stored", "accepted", "available"] },
      quantity: { $gt: 0 },
    }).lean();

    if (availableLots.length === 0) {
      allocationSummary.push({
        produceCategoryId: item.produceCategoryId,
        requested: remainingNeeded,
        allocated: 0,
        status: "out_of_stock",
      });
      continue;
    }

    // Call DSA FEFO Min-Heap allocation engine
    const fefoResult = allocateLotsFEFO(availableLots, remainingNeeded);

    for (const alloc of fefoResult.allocations) {
      const lot = await Lot.findById(alloc.lotId);
      if (!lot) continue;

      lot.quantity = alloc.remainingLotQuantity;
      if (lot.quantity === 0) {
        lot.status = "allocated";
      } else {
        // Still has remaining stock, stays stored
      }
      await lot.save();

      // Record inventory movement if stored in warehouse
      if (lot.warehouseId) {
        await InventoryMovement.create({
          lotId: lot._id,
          warehouseId: lot.warehouseId,
          type: "out",
          quantity: alloc.allocatedQuantity,
          timestamp: new Date(),
        });
      }

      item.quantityFulfilled += alloc.allocatedQuantity;
      if (!item.allocatedLots.some((id) => String(id) === String(lot._id))) {
        item.allocatedLots.push(lot._id);
      }
    }

    await item.save();

    allocationSummary.push({
      produceCategoryId: item.produceCategoryId,
      requested: remainingNeeded,
      fulfilledThisRun: fefoResult.totalFulfilled,
      isFullyFulfilled: fefoResult.isFullyFulfilled,
      allocatedLots: fefoResult.allocations.map((a) => ({
        lotId: a.lotId,
        quantity: a.allocatedQuantity,
        expiryEstimate: a.expiryEstimate,
        freshnessDays: a.freshnessDays,
      })),
    });
  }

  // Update order status based on item fulfillments
  const refreshedItems = await PurchaseOrderItem.find({ purchaseOrderId: order._id });
  const allFulfilled = refreshedItems.every((i) => i.quantityFulfilled >= i.quantityRequested);
  const anyFulfilled = refreshedItems.some((i) => i.quantityFulfilled > 0);

  order.status = allFulfilled
    ? "allocated"
    : anyFulfilled
      ? "partially_fulfilled"
      : "pending";

  await order.save();

  return successResponse(
    res,
    200,
    "Purchase order allocated via FEFO Min-Heap engine successfully.",
    {
      order: await getPurchaseOrderData(order._id),
      allocationSummary,
      fefoApplied: true,
    }
  );
};

const getPurchaseOrderData = async (id) => {
  const order = await populateOrder(PurchaseOrder.findById(id)).lean();
  order.items = await PurchaseOrderItem.find({ purchaseOrderId: id })
    .populate("produceCategoryId", "name unit basePrice")
    .populate({
      path: "allocatedLots",
      select: "quantity expiryEstimate status grade warehouseId",
      populate: { path: "warehouseId", select: "name location" },
    })
    .lean();
  return order;
};

const cancelPurchaseOrder = async (req, res) => {
  const order = await findOrderForUser(req, req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  }

  if (req.user?.role !== "admin" && String(order.buyerId) !== String(req.user.id)) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized to cancel this order." });
  }

  if (["fulfilled", "delivered"].includes(order.status)) {
    return res.status(409).json({
      success: false,
      message: "A delivered or fulfilled order cannot be cancelled.",
    });
  }

  order.status = "cancelled";
  await order.save();

  return successResponse(
    res,
    200,
    "Purchase order cancelled successfully.",
    order
  );
};

const confirmDelivery = async (req, res) => {
  const order = await findOrderForUser(req, req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ success: false, message: "Purchase order not found." });
  }

  order.status = "delivered";
  await order.save();

  // Mark all allocated lots as delivered
  const items = await PurchaseOrderItem.find({ purchaseOrderId: order._id });
  const lotIds = items.flatMap((i) => i.allocatedLots);
  if (lotIds.length > 0) {
    await Lot.updateMany(
      { _id: { $in: lotIds } },
      { status: "delivered", updatedAt: new Date() }
    );
  }

  return successResponse(res, 200, "Purchase order delivery confirmed.", order);
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  allocatePurchaseOrder,
  cancelPurchaseOrder,
  confirmDelivery,
  getPurchaseOrderData,
};
