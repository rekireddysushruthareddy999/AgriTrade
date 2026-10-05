const Lot = require("../models/Lot");

const defaultAlertWindowDays = 3;

async function findLotsNearExpiry({
  lotModel = Lot,
  daysAhead = defaultAlertWindowDays,
  includeStatuses = ["available", "reserved", "inspected", "shipped"],
} = {}) {
  if (!lotModel || typeof lotModel.find !== "function") {
    throw new Error("A valid Lot model is required.");
  }

  const currentDate = new Date();
  const latestExpiryDate = new Date(currentDate);
  latestExpiryDate.setDate(currentDate.getDate() + Number(daysAhead));

  const lots = await lotModel
    .find({
      status: { $in: includeStatuses },
      expiryEstimate: {
        $gte: currentDate,
        $lte: latestExpiryDate,
      },
    })
    .populate("farmerId", "name email phone")
    .populate("produceCategoryId", "name")
    .populate("warehouseId", "name location");

  return lots.map((lot) => ({
    id: lot._id,
    farmer: lot.farmerId || null,
    produceCategory: lot.produceCategoryId || null,
    warehouse: lot.warehouseId || null,
    quantity: lot.quantity,
    status: lot.status,
    harvestDate: lot.harvestDate,
    expiryEstimate: lot.expiryEstimate,
    daysRemaining: Math.max(
      0,
      Math.ceil(
        (new Date(lot.expiryEstimate) - currentDate) / (1000 * 60 * 60 * 24),
      ),
    ),
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
  };

  if (logger && typeof logger.info === "function") {
    logger.info("Near-expiry lot alert job completed", {
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
          logger.error("Near-expiry alert job failed", error);
        }
      }
    });

    return job;
  } catch (error) {
    if (logger && typeof logger.warn === "function") {
      logger.warn(
        "node-cron is not installed. The job was registered without a scheduler.",
        error.message,
      );
    }

    return null;
  }
}

module.exports = {
  defaultAlertWindowDays,
  findLotsNearExpiry,
  nearExpiryAlertJob,
  startNearExpiryAlertJob,
};
