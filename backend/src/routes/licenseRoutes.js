const express = require("express");
const {
  getAllLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  approveLicense,
  rejectLicense,
} = require("../controllers/licenseController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const uploadLicenseDocument = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  getAllLicenses
);

router.get("/:id", authenticateToken, getLicenseById);

router.post(
  "/",
  authenticateToken,
  uploadLicenseDocument.single("licenseDocument"),
  createLicense
);

router.put(
  "/:id",
  authenticateToken,
  uploadLicenseDocument.single("licenseDocument"),
  updateLicense
);

router.patch(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  approveLicense
);

router.patch(
  "/:id/reject",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  rejectLicense
);

// Backward compatibility alias
router.patch(
  "/:id/verify",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "REGULATOR"),
  (req, res, next) => {
    if (req.body.status === "REJECTED") {
      return rejectLicense(req, res, next);
    }
    return approveLicense(req, res, next);
  }
);

module.exports = router;