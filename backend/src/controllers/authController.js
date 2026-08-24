const User = require("../../models/User");
const Organization = require("../../models/Organization");
const License = require("../../models/License");
const Verification = require("../../models/Verification");

const {
  registerUser,
  authenticateUser,
  requestPasswordReset,
  resetPasswordWithToken,
  getUserProfile,
} = require("../services/authService");
const { logAuditAction } = require("../utils/auditLogger");

const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      organizationName,
      organizationType,
      licenseNumber,
      licenseType,
      address,
      contactPhone,
    } = req.body;

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
        message: "All required fields must be provided.",
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Official regulatory license document (.pdf, .jpg, .jpeg, or .png) is required.",
      });
    }

    const licenseDocument = req.file.path;

    const result = await registerUser(
      {
        name,
        email,
        password,
        organizationName,
        organizationType,
        licenseNumber,
        licenseType,
        licenseDocument,
        documentPath: licenseDocument,
        address,
        contactPhone,
      },
      req
    );

    return res.status(201).json({
      success: true,
      message: "Registration submitted successfully. Your account is awaiting license verification.",
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        organizationName: result.organization.name,
        organizationType: result.organization.type,
        accountStatus: result.user.accountStatus,
      },
    });
  } catch (error) {
    if (
      error.message === "Email is already registered" ||
      error.message === "License number is already registered"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const authResult = await authenticateUser({ email, password }, req);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Authentication failed",
      accountStatus: error.accountStatus || undefined,
      userId: error.userId || undefined,
    });
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAuditAction({
        userId: req.user._id,
        organization: req.user.organization?._id,
        action: "USER_LOGGED_OUT",
        entityType: "User",
        entityId: req.user._id,
        details: { email: req.user.email },
        req,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user._id);
    return res.status(200).json({
      success: true,
      user: profile.user,
      license: profile.license,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const result = await requestPasswordReset(email, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const result = await resetPasswordWithToken(token, newPassword, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getVerificationStatus = async (req, res, next) => {
  try {
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: "Either userId or email is required",
      });
    }

    const query = userId ? { _id: userId } : { email: email.toLowerCase().trim() };
    const user = await User.findOne(query).populate("organization");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User or organization not found",
      });
    }

    const license = user.organization
      ? await License.findOne({ organization: user.organization._id })
      : null;

    const verification = license
      ? await Verification.findOne({ license: license._id }).sort({ createdAt: -1 })
      : null;

    return res.status(200).json({
      success: true,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      rejectionReason: user.rejectionReason,
      organization: user.organization,
      license: license
        ? {
            id: license._id,
            licenseNumber: license.licenseNumber,
            licenseType: license.licenseType,
            issuingAuthority: license.issuingAuthority,
            expiryDate: license.expiryDate,
            verificationStatus: license.verificationStatus,
            rejectionReason: license.rejectionReason,
          }
        : null,
      verificationRemarks: verification ? verification.remarks : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  getVerificationStatus,
};