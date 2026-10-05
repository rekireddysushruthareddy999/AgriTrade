const express = require("express");
const {
  getShipments,
  createShipment,
  dispatchShipment,
  updateShipmentTransit,
  deliverShipment,
} = require("../controllers/shipmentController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();
const logisticsRoles = requireRole("admin", "logistics", "warehouse_manager");
router.use(authenticate);
router.get("/", logisticsRoles, getShipments);
router.post("/", logisticsRoles, createShipment);
router.patch("/:id/dispatch", logisticsRoles, dispatchShipment);
router.patch("/:id/transit-update", logisticsRoles, updateShipmentTransit);
router.patch("/:id/deliver", logisticsRoles, deliverShipment);
module.exports = router;
