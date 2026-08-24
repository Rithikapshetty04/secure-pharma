const express = require("express");

const {
  register,
  login,
  getVerificationStatus,
} = require("../controllers/authController");

const uploadLicenseDocument = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/register",
  uploadLicenseDocument.single("licenseDocument"),
  register
);

router.post("/login", login);

router.get("/verification-status", getVerificationStatus);

module.exports = router;