const express = require("express");
const {
  createLot,
  getLots,
  getLotById,
  updateLotStatus,
  addInspectionToLot,
} = require("../controllers/lotController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();
router.use(authenticate);
router.post("/", requireRole("admin", "farmer"), createLot);
router.get("/", getLots);
router.get("/:id", getLotById);
router.patch(
  "/:id/status",
  requireRole("admin", "inspector", "warehouse_manager", "logistics"),
  updateLotStatus,
);
router.post(
  "/:id/inspections",
  requireRole("admin", "inspector"),
  addInspectionToLot,
);
module.exports = router;
