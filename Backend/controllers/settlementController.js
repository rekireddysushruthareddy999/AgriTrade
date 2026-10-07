const Settlement = require("../models/Settlement");
const Lot = require("../models/Lot");
const Farmer = require("../models/Farmer");
const { SettlementUnionFind } = require("../dsa/settlementUnionFind");
const { calculateSettlementBreakdown } = require("../utils/settlementCalculator");
const { successResponse } = require("../utils/apiResponse");
const { findFarmerProfile } = require("../utils/farmerAccess");

const getSettlements = async (req, res) => {
  const filter = {};
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile) {
      return successResponse(
        res,
        200,
        "Settlements retrieved successfully.",
        [],
        { count: 0 }
      );
    }
    filter.farmerId = profile._id;
  } else if (req.query.farmer) {
    filter.farmerId = req.query.farmer;
  }

  if (req.query.cycle) {
    filter.cycle = Number(req.query.cycle);
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const settlements = await Settlement.find(filter)
    .populate("farmerId", "name phone regionId")
    .populate({
      path: "lotIds",
      select: "quantity status grade harvestDate expiryEstimate produceCategoryId pricePerUnit",
      populate: { path: "produceCategoryId", select: "name unit basePrice" },
    })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(
    res,
    200,
    "Settlements retrieved successfully.",
    settlements,
    { count: settlements.length }
  );
};

const generateSettlement = async (req, res) => {
  const {
    farmerId,
    lotIds = [],
    cycle,
    grossAmount,
    deductions = 0,
    taxRate = 2,
    commissionRate = 1.5,
    freightRate = 1,
  } = req.body;

  if (!farmerId || !cycle) {
    return res.status(400).json({
      success: false,
      message: "farmerId and cycle are required.",
    });
  }

  // Calculate breakdown
  const breakdown = calculateSettlementBreakdown({
    grossAmount: Number(grossAmount || 0),
    deductions: Number(deductions || 0),
    taxRate,
    commissionRate,
    freightRate,
  });

  const settlement = await Settlement.create({
    farmerId,
    lotIds,
    cycle: Number(cycle),
    grossAmount: breakdown.grossAmount,
    deductions: breakdown.deductions,
    netAmount: breakdown.netAmount,
    breakdown: {
      taxValue: breakdown.taxValue,
      commissionValue: breakdown.commissionValue,
      freightValue: breakdown.freightValue,
    },
    status: "pending",
  });

  if (lotIds.length) {
    await Lot.updateMany(
      { _id: { $in: lotIds } },
      { status: "settled", updatedAt: new Date() }
    );
  }

  return successResponse(
    res,
    201,
    "Settlement generated successfully.",
    settlement
  );
};

/**
 * DSA 4.5 Integration: Batch Settlement Generation via Union-Find (Disjoint Set)
 * Clusters all accepted/stored lots for each farmer in the given payment cycle,
 * creating a single aggregated settlement batch per farmer.
 */
const batchGenerateSettlements = async (req, res) => {
  const {
    cycle = 1,
    taxRate = 2,
    commissionRate = 1.5,
    freightRate = 1,
  } = req.body;

  // Retrieve all eligible lots that are accepted or stored and not yet settled
  const eligibleLots = await Lot.find({
    status: { $in: ["accepted", "stored", "delivered"] },
  })
    .populate("farmerId", "name phone")
    .populate("produceCategoryId", "name unit basePrice")
    .lean();

  if (eligibleLots.length === 0) {
    return successResponse(
      res,
      200,
      "No eligible lots available for batch settlement.",
      []
    );
  }

  // Use Union-Find to group lots by farmer
  const batches = SettlementUnionFind.batchFarmerLots(eligibleLots, cycle);
  const createdSettlements = [];

  for (const batch of batches) {
    // Calculate total gross amount for all lots in this union group
    let batchGross = 0;
    for (const lot of batch.lots) {
      const unitPrice = lot.pricePerUnit || lot.produceCategoryId?.basePrice || 25;
      batchGross += Number(lot.quantity || 0) * unitPrice;
    }

    const breakdown = calculateSettlementBreakdown({
      grossAmount: batchGross,
      taxRate,
      commissionRate,
      freightRate,
    });

    const settlement = await Settlement.create({
      farmerId: batch.farmerId,
      lotIds: batch.lotIds,
      cycle: Number(cycle),
      batchGroupId: batch.batchGroupId,
      grossAmount: breakdown.grossAmount,
      deductions: breakdown.deductions,
      netAmount: breakdown.netAmount,
      breakdown: {
        taxValue: breakdown.taxValue,
        commissionValue: breakdown.commissionValue,
        freightValue: breakdown.freightValue,
      },
      status: "pending",
    });

    // Mark member lots with batch group ID and status
    await Lot.updateMany(
      { _id: { $in: batch.lotIds } },
      {
        groupId: batch.batchGroupId,
        status: "settled",
        updatedAt: new Date(),
      }
    );

    createdSettlements.push(settlement);
  }

  return successResponse(
    res,
    201,
    `Batch settlements generated for ${batches.length} farmer groups using Union-Find algorithm.`,
    {
      totalBatches: batches.length,
      totalLotsSettled: eligibleLots.length,
      settlements: createdSettlements,
      algorithm: "Disjoint Set Union (Union-Find) Batch Clustering",
    }
  );
};

const paySettlement = async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement) {
    return res
      .status(404)
      .json({ success: false, message: "Settlement not found." });
  }

  if (settlement.status === "paid") {
    return res
      .status(409)
      .json({ success: false, message: "Settlement is already paid." });
  }

  settlement.status = "paid";
  settlement.paidAt = new Date();
  await settlement.save();

  return successResponse(res, 200, "Settlement paid successfully.", settlement);
};

module.exports = {
  getSettlements,
  generateSettlement,
  batchGenerateSettlements,
  paySettlement,
};
