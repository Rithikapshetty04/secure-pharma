const express = require("express");
const {
  verifyProduct,
  submitVerificationScan,
  getVerificationHistory,
} = require("../controllers/verificationController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public authenticity verification routes
router.get("/:identifier", verifyProduct);
router.post("/", submitVerificationScan);

// Authenticated verification log inspection
router.get(
  "/history/all",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getVerificationHistory
);

module.exports = router;
