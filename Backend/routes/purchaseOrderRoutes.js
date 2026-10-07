const express = require("express");
const c = require("../controllers/purchaseController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();

router.use(authenticate);
router.post(
  "/",
  requireRole("admin", "buyer", "farmer", "warehouse_manager"),
  c.createPurchaseOrder,
);
router.get("/", c.getPurchaseOrders);
router.get("/:id", c.getPurchaseOrderById);
router.post(
  "/:id/allocate",
  requireRole("admin", "buyer", "farmer", "warehouse_manager"),
  c.allocatePurchaseOrder,
);
router.patch(
  "/:id/cancel",
  requireRole("admin", "buyer", "farmer", "warehouse_manager"),
  c.cancelPurchaseOrder,
);
router.patch(
  "/:id/confirm-delivery",
  requireRole("admin", "buyer", "farmer", "warehouse_manager"),
  c.confirmDelivery,
);

module.exports = router;
