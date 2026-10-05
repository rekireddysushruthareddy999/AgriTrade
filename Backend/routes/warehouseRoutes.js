const express = require("express");
const c = require("../controllers/warehouseController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();
const warehouseRoles = requireRole("admin", "warehouse_manager", "logistics");
router.use(authenticate);
router.get("/", warehouseRoles, c.getWarehouses);
router.post("/", requireRole("admin", "warehouse_manager"), c.createWarehouse);
router.get("/:id", warehouseRoles, c.getWarehouseById);
router.put(
  "/:id",
  requireRole("admin", "warehouse_manager"),
  c.updateWarehouse,
);
router.patch(
  "/:id",
  requireRole("admin", "warehouse_manager"),
  c.updateWarehouse,
);
router.delete("/:id", requireRole("admin"), c.deleteWarehouse);
router.get("/:id/inventory", warehouseRoles, c.getWarehouseInventory);
module.exports = router;
