const express = require("express");
const { getAuditLogs, getAuditLogById } = require("../controllers/auditController");
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

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAuditLogById
);

module.exports = router;

