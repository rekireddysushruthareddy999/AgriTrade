const express = require("express");
const {
  getInspections,
  createInspection,
  getInspectionById,
  updateInspection,
  deleteInspection,
} = require("../controllers/inspectionController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authenticate);

router.get("/", getInspections);

router.post(
  "/",
  requireRole(
    "admin",
    "inspector",
    "quality_inspector",
    "warehouse_manager",
    "collection_center",
    "collection_center_staff"
  ),
  createInspection
);

router.get("/:id", getInspectionById);

router.patch(
  "/:id",
  requireRole(
    "admin",
    "inspector",
    "quality_inspector",
    "warehouse_manager"
  ),
  updateInspection
);

router.delete("/:id", requireRole("admin"), deleteInspection);

module.exports = router;
