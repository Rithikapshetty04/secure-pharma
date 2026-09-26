const express = require("express");
const {
  getDistributorDashboard,
  getDistributorBatches,
  getDistributorInventory,
  getDistributorTransfers,
  receiveDistributorBatch,
  dispatchDistributorBatch,
  getDistributorOrders,
  getDistributorOrderById,
  updateDistributorOrderStatus,
} = require("../controllers/distributorController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getDistributorDashboard
);

router.get(
  "/batches",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getDistributorBatches
);

router.get(
  "/inventory",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getDistributorInventory
);

router.get(
  "/transfers",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getDistributorTransfers
);

router.post(
  "/transfers/receive",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  receiveDistributorBatch
);

router.post(
  "/transfers/dispatch",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  dispatchDistributorBatch
);

router.get(
  "/orders",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getDistributorOrders
);

router.get(
  "/orders/:orderId",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getDistributorOrderById
);

router.patch(
  "/orders/:orderId/status",
  authenticateToken,
  authorizeRoles("DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  updateDistributorOrderStatus
);

module.exports = router;



