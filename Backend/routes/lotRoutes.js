const express = require("express");
const {
  createLot,
  getLots,
  getLotById,
  updateLotStatus,
  addInspectionToLot,
  getLotTransitions,
  getLifecycleGraph,
} = require("../controllers/lotController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authenticate);

// Lifecycle directed graph structure
router.get("/lifecycle-graph", getLifecycleGraph);

router.post(
  "/",
  requireRole("admin", "farmer", "collection_center", "collection_center_staff"),
  createLot
);

router.get("/", getLots);
router.get("/:id", getLotById);
router.get("/:id/transitions", getLotTransitions);

router.patch(
  "/:id/status",
  requireRole(
    "admin",
    "inspector",
    "quality_inspector",
    "warehouse_manager",
    "collection_center",
    "collection_center_staff",
    "logistics",
    "logistics_coordinator"
  ),
  updateLotStatus
);

router.post(
  "/:id/inspections",
  requireRole("admin", "inspector", "quality_inspector"),
  addInspectionToLot
);

module.exports = router;
