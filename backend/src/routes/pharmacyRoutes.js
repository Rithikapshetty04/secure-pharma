const express = require("express");
const {
  getPharmacyDashboard,
  getPharmacyMedicines,
  getPharmacyReceivedBatches,
  getPharmacyCart,
  addPharmacyCartItem,
  updatePharmacyCartItem,
  removePharmacyCartItem,
  clearPharmacyCart,
  getPharmacyHistory,
} = require("../controllers/pharmacyController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  getPharmacyDashboard
);

router.get(
  "/medicines",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  getPharmacyMedicines
);

router.get(
  "/received",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  getPharmacyReceivedBatches
);

router.get(
  "/history",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  getPharmacyHistory
);

// Cart Routes
router.get(
  "/cart",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  getPharmacyCart
);

router.post(
  "/cart/items",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  addPharmacyCartItem
);

router.patch(
  "/cart/items/:itemId",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  updatePharmacyCartItem
);

router.delete(
  "/cart/items/:itemId",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  removePharmacyCartItem
);

router.delete(
  "/cart",
  authenticateToken,
  authorizeRoles("PHARMACY", "SUPER_ADMIN", "ADMIN"),
  clearPharmacyCart
);

module.exports = router;
