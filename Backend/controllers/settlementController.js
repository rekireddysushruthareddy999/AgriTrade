const Settlement = require("../models/Settlement");
const Lot = require("../models/Lot");
const { successResponse } = require("../utils/apiResponse");
const { findFarmerProfile } = require("../utils/farmerAccess");
const getSettlements = async (req, res) => {
  const filter = {};
  if (req.user?.role === "farmer") {
    const profile = await findFarmerProfile(req.user);
    if (!profile)
      return successResponse(
        res,
        200,
        "Settlements retrieved successfully.",
        [],
        { count: 0 },
      );
    filter.farmerId = profile._id;
  } else if (req.query.farmer) filter.farmerId = req.query.farmer;
  if (req.query.cycle) filter.cycle = Number(req.query.cycle);
  const settlements = await Settlement.find(filter)
    .populate("farmerId", "name phone")
    .populate("lotIds", "quantity status")
    .sort({ cycle: -1 })
    .lean();
  return successResponse(
    res,
    200,
    "Settlements retrieved successfully.",
    settlements,
    { count: settlements.length },
  );
};
const generateSettlement = async (req, res) => {
  const {
    farmerId,
    lotIds = [],
    cycle,
    grossAmount,
    deductions = 0,
  } = req.body;
  if (!farmerId || !cycle || grossAmount === undefined)
    return res
      .status(400)
      .json({
        success: false,
        message: "farmerId, cycle and grossAmount are required.",
      });
  const netAmount = Math.max(0, Number(grossAmount) - Number(deductions));
  const settlement = await Settlement.create({
    farmerId,
    lotIds,
    cycle,
    grossAmount,
    deductions,
    netAmount,
    status: "pending",
  });
  if (lotIds.length)
    await Lot.updateMany(
      { _id: { $in: lotIds } },
      { status: "settled", updatedAt: new Date() },
    );
  return successResponse(
    res,
    201,
    "Settlement generated successfully.",
    settlement,
  );
};
const paySettlement = async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement)
    return res
      .status(404)
      .json({ success: false, message: "Settlement not found." });
  if (settlement.status === "paid")
    return res
      .status(409)
      .json({ success: false, message: "Settlement is already paid." });
  settlement.status = "paid";
  settlement.paidAt = new Date();
  await settlement.save();
  return successResponse(res, 200, "Settlement paid successfully.", settlement);
};
module.exports = { getSettlements, generateSettlement, paySettlement };
