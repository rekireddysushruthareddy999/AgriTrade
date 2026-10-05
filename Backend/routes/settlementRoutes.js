const express = require("express");
const c = require("../controllers/settlementController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();
router.use(authenticate);
router.get(
  "/",
  requireRole("admin", "warehouse_manager", "farmer"),
  c.getSettlements,
);
router.post(
  "/generate",
  requireRole("admin", "warehouse_manager"),
  c.generateSettlement,
);
router.patch("/:id/pay", requireRole("admin"), c.paySettlement);
module.exports = router;
