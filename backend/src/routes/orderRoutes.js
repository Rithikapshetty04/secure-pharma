const express = require("express");
const { createOrder, getOrders } = require("../controllers/orderController");
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

module.exports = router;
