const express = require("express");
const { createOrder, getOrders, getOrderById, cancelOrder } = require("../controllers/orderController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  createOrder
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("PHARMACY", "DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getOrders
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("PHARMACY", "DISTRIBUTOR", "SUPER_ADMIN", "ADMIN"),
  getOrderById
);

router.patch(
  "/:id/cancel",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  cancelOrder
);

module.exports = router;
