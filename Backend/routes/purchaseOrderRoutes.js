const express = require("express");
const c = require("../controllers/purchaseController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();
router.use(authenticate);
router.post("/", requireRole("admin", "buyer"), c.createPurchaseOrder);
router.get(
  "/",
  requireRole("admin", "buyer", "warehouse_manager"),
  c.getPurchaseOrders,
);
router.get(
  "/:id",
  requireRole("admin", "buyer", "warehouse_manager"),
  c.getPurchaseOrderById,
);
router.post(
  "/:id/allocate",
  requireRole("admin", "buyer", "warehouse_manager"),
  c.allocatePurchaseOrder,
);
router.patch(
  "/:id/cancel",
  requireRole("admin", "buyer"),
  c.cancelPurchaseOrder,
);
router.patch(
  "/:id/confirm-delivery",
  requireRole("admin", "buyer", "warehouse_manager"),
  c.confirmDelivery,
);
module.exports = router;
