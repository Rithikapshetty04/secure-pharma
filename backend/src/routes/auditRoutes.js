const express = require("express");
const {
  getAuditLogs,
  getAuditLogById,
  getBlockchainLedger,
  getBlockchainTxDetails,
} = require("../controllers/auditController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAuditLogs
);

// Dedicated Blockchain Ledger Endpoints (Placed before /:id)
router.get(
  "/blockchain-ledger",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getBlockchainLedger
);

router.get(
  "/ledger",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getBlockchainLedger
);

router.get(
  "/blockchain-ledger/tx/:txHash",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getBlockchainTxDetails
);

router.get(
  "/ledger/tx/:txHash",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getBlockchainTxDetails
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAuditLogById
);

module.exports = router;


