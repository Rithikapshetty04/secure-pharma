const User = require("../../models/User");

const { registerUser } = require("../services/authService");

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      organizationName,
      organizationType,
      licenseNumber,
      licenseType,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "License document is required.",
      });
    }

    const licenseDocument = req.file.path;

    if (
      !name ||
      !email ||
      !password ||
      !organizationName ||
      !organizationType ||
      !licenseNumber ||
      !licenseType
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await registerUser({
      name,
      email,
      password,
      organizationName,
      organizationType,
      licenseNumber,
      licenseType,
      licenseDocument,
      documentPath: licenseDocument,
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration submitted successfully. Your account is pending verification.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organizationName: user.organizationName,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    if (error.message === "Email is already registered") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "License number is already registered") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findById(userId).select("verificationStatus");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    console.error("Verification status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve verification status",
    });
  }
};

const login = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Login API implementation pending",
  });
};

module.exports = {
  register,
  login,
  getVerificationStatus,
};