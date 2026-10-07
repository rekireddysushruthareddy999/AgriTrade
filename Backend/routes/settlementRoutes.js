const express = require("express");
const {
  getSettlements,
  generateSettlement,
  batchGenerateSettlements,
  paySettlement,
} = require("../controllers/settlementController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  requireRole("admin", "warehouse_manager", "farmer", "collection_center", "collection_center_staff"),
  getSettlements
);

router.post(
  "/generate",
  requireRole("admin", "warehouse_manager", "collection_center", "collection_center_staff"),
  generateSettlement
);

router.post(
  "/batch-generate",
  requireRole("admin", "warehouse_manager", "collection_center", "collection_center_staff"),
  batchGenerateSettlements
);

router.patch("/:id/pay", requireRole("admin"), paySettlement);

module.exports = router;
