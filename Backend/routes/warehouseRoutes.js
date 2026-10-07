const express = require("express");
const c = require("../controllers/warehouseController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const router = express.Router();

router.use(authenticate);
router.get("/", c.getWarehouses);
router.get("/:id", c.getWarehouseById);
router.post("/", requireRole("admin", "warehouse_manager"), c.createWarehouse);
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
router.get(
  "/:id/inventory",
  requireRole("admin", "warehouse_manager", "logistics", "buyer", "farmer"),
  c.getWarehouseInventory,
);
module.exports = router;
