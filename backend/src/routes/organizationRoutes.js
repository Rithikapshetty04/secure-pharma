const express = require("express");
const {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
} = require("../controllers/organizationController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getAllOrganizations);
router.get("/:id", authenticateToken, getOrganizationById);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  createOrganization
);
router.put("/:id", authenticateToken, updateOrganization);
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  updateOrganizationStatus
);

module.exports = router;