const express = require("express");

const {
  register,
  login,
  getVerificationStatus,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verification-status", getVerificationStatus);

module.exports = router;