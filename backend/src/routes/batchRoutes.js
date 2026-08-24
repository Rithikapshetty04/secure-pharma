const express = require("express");
const {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  updateBatchStatus,
} = require("../controllers/batchController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getAllBatches);
router.get("/:id", authenticateToken, getBatchById);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("MANUFACTURER", "SUPER_ADMIN", "ADMIN", "REGULATOR"),
  createBatch
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("MANUFACTURER", "SUPER_ADMIN", "ADMIN", "REGULATOR"),
  updateBatch
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("MANUFACTURER", "SUPER_ADMIN", "ADMIN", "REGULATOR", "DISTRIBUTOR", "PHARMACY"),
  updateBatchStatus
);

module.exports = router;
