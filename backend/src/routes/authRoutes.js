const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  getVerificationStatus,
} = require("../controllers/authController");

const uploadLicenseDocument = require("../middleware/uploadMiddleware");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/register",
  uploadLicenseDocument.single("licenseDocument"),
  register
);

router.post("/login", login);
router.post("/logout", authenticateToken, logout);
router.get("/me", authenticateToken, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verification-status", getVerificationStatus);

module.exports = router;