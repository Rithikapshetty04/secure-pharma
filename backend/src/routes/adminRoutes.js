const express = require("express");
const {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  getAdminBatches,
  getAdminBatchById,
  updateAdminBatchStatus
} = require("../controllers/adminController");
const {
  getAuditLogs,
  getAuditLogById,
} = require("../controllers/auditController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAdminDashboard
);

router.get(
  "/users",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAdminUsers
);

router.get(
  "/users/:id",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAdminUserById
);

router.patch(
  "/users/:id/status",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  updateAdminUserStatus
);

router.get(
  "/batches",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAdminBatches
);

router.get(
  "/batches/:id",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAdminBatchById
);

router.patch(
  "/batches/:id/status",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  updateAdminBatchStatus
);

router.get(
  "/audit",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAuditLogs
);

router.get(
  "/audit/:id",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAuditLogById
);

module.exports = router;

