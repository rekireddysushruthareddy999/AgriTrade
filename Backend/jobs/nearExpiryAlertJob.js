const Lot = require("../models/Lot");
const { getNearExpiryLotsFromHeap } = require("../dsa/warehouseAllocationHeap");

const defaultAlertWindowDays = 5;

/**
 * DSA 4.1 Integration:
 * Extracts near-expiry lots using the Warehouse Allocation Min-Heap.
 */
async function findLotsNearExpiry({
  lotModel = Lot,
  daysAhead = defaultAlertWindowDays,
  includeStatuses = ["stored", "accepted", "available", "received"],
} = {}) {
  if (!lotModel || typeof lotModel.find !== "function") {
    throw new Error("A valid Lot model is required.");
  }

  const currentDate = new Date();
  const latestExpiryDate = new Date(currentDate);
  latestExpiryDate.setDate(currentDate.getDate() + Number(daysAhead));

  const rawLots = await lotModel
    .find({
      status: { $in: includeStatuses },
      quantity: { $gt: 0 },
      expiryEstimate: {
        $gte: currentDate,
        $lte: latestExpiryDate,
      },
    })
    .populate("farmerId", "name email phone")
    .populate("produceCategoryId", "name unit basePrice")
    .populate("warehouseId", "name location capacity")
    .lean();

  // Use Min-Heap to extract soonest-expiring lots in O(k log n)
  const prioritizedExpiringLots = getNearExpiryLotsFromHeap(rawLots, daysAhead);

  return prioritizedExpiringLots.map((lot) => ({
    id: lot._id || lot.id,
    farmer: lot.farmerId || null,
    produceCategory: lot.produceCategoryId || null,
    warehouse: lot.warehouseId || null,
    quantity: lot.quantity,
    status: lot.status,
    grade: lot.grade,
    harvestDate: lot.harvestDate,
    expiryEstimate: lot.expiryEstimate,
    daysRemaining: lot.daysRemaining,
  }));
}

async function nearExpiryAlertJob({
  lotModel = Lot,
  daysAhead = defaultAlertWindowDays,
  includeStatuses,
  logger = console,
} = {}) {
  const lots = await findLotsNearExpiry({
    lotModel,
    daysAhead,
    includeStatuses,
  });

  const alertSummary = {
    checkedAt: new Date(),
    windowDays: Number(daysAhead),
    total: lots.length,
    lots,
    algorithm: "WarehouseAllocationHeap (FEFO Min-Heap)",
  };

  if (logger && typeof logger.info === "function") {
    logger.info("Near-expiry lot alert job completed using Min-Heap", {
      total: alertSummary.total,
      windowDays: alertSummary.windowDays,
    });
  }

  return alertSummary;
}

function startNearExpiryAlertJob({
  cronExpression = "0 9 * * *",
  daysAhead = defaultAlertWindowDays,
  includeStatuses,
  logger = console,
} = {}) {
  try {
    const cron = require("node-cron");

    const job = cron.schedule(cronExpression, async () => {
      try {
        const result = await nearExpiryAlertJob({
          daysAhead,
          includeStatuses,
          logger,
        });

        if (logger && typeof logger.info === "function") {
          logger.info("Scheduled near-expiry alert triggered", {
            total: result.total,
          });
        }
      } catch (error) {
        if (logger && typeof logger.error === "function") {
          logger.error(`Near-expiry alert job failed: ${error.message}`);
        }
      }
    });

    return job;
  } catch (error) {
    if (logger && typeof logger.warn === "function") {
      logger.warn(`Could not start cron job: ${error.message}`);
    }
    return null;
  }
}

module.exports = {
  findLotsNearExpiry,
  nearExpiryAlertJob,
  startNearExpiryAlertJob,
};
