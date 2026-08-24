const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../../models/User");
const Organization = require("../../models/Organization");
const License = require("../../models/License");
const Verification = require("../../models/Verification");
const { logAuditAction } = require("../utils/auditLogger");
const { createNotification } = require("./notificationService");
const BlockchainService = require("./blockchainService");

const registerUser = async (userData, req = null) => {
  const {
    name,
    email,
    password,
    organizationName,
    organizationType,
    licenseNumber,
    licenseType,
    licenseDocument,
    documentPath,
    address,
    contactPhone,
  } = userData;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedLicenseNumber = licenseNumber.trim().toUpperCase();

  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new Error("Email is already registered");
  }

  const existingLicenseRecord = await License.findOne({ licenseNumber: normalizedLicenseNumber });
  if (existingLicenseRecord) {
    throw new Error("License number is already registered");
  }

  const requestedOrgType = (organizationType || "MANUFACTURER").toUpperCase().trim();
  const validOrgTypes = ["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR"];
  const normalizedOrgType = validOrgTypes.includes(requestedOrgType) ? requestedOrgType : "MANUFACTURER";

  const requestedLicenseType = (licenseType || "MANUFACTURING").toUpperCase().trim();
  const validLicenseTypes = ["MANUFACTURING", "WHOLESALE", "PHARMACY", "IMPORT_EXPORT"];
  const normalizedLicenseType = validLicenseTypes.includes(requestedLicenseType) ? requestedLicenseType : "MANUFACTURING";

  const hashedPassword = await bcrypt.hash(password, 10);

  // Compute document cryptographic hash
  const docPath = documentPath || licenseDocument;
  const documentHash = docPath ? BlockchainService.generateDocumentHash(docPath) : null;

  // 1. Create Organization
  const organization = await Organization.create({
    name: organizationName.trim(),
    type: normalizedOrgType,
    address: address ? address.trim() : "",
    contactEmail: normalizedEmail,
    contactPhone: contactPhone ? contactPhone.trim() : "",
    status: "PENDING",
  });

  // 2. Create License
  const license = await License.create({
    organization: organization._id,
    licenseNumber: normalizedLicenseNumber,
    licenseType: normalizedLicenseType,
    documentPath: docPath,
    documentHash,
    verificationStatus: "PENDING",
  });

  // 3. Create Verification Record
  await Verification.create({
    license: license._id,
    organization: organization._id,
    status: "PENDING",
    remarks: "Initial license submission awaiting regulatory inspection.",
  });

  // 4. Create User
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: normalizedOrgType,
    organization: organization._id,
    accountStatus: "PENDING",
  });

  // 5. Notify Regulators
  await createNotification({
    recipientRole: "REGULATOR",
    type: "LICENSE_SUBMITTED",
    title: "New Organization License Submitted",
    message: `${organization.name} (${organization.type}) submitted license #${license.licenseNumber} for verification.`,
    relatedEntity: "License",
    relatedEntityId: license._id,
  });

  // 6. Audit Log
  await logAuditAction({
    userId: user._id,
    organization: organization._id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user._id,
    details: {
      email: normalizedEmail,
      organizationName: organization.name,
      organizationType: organization.type,
      licenseNumber: normalizedLicenseNumber,
      documentHash,
    },
    req,
  });

  return {
    user,
    organization,
    license,
  };
};

const authenticateUser = async ({ email, password }, req = null) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).populate("organization");

  if (!user) {
    await logAuditAction({
      action: "LOGIN_FAILED",
      entityType: "User",
      details: { email: normalizedEmail, reason: "User not found" },
      req,
    });
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await logAuditAction({
      userId: user._id,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user._id,
      details: { email: normalizedEmail, reason: "Incorrect password" },
      req,
    });
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check Account Status for non-admins
  const isSuperAdminOrRegulator = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "REGULATOR";

  if (!isSuperAdminOrRegulator && user.accountStatus === "PENDING") {
    const error = new Error(
      "Your organization registration and license verification are currently pending review by regulatory authorities."
    );
    error.statusCode = 403;
    error.accountStatus = "PENDING";
    error.userId = user._id;
    throw error;
  }

  if (user.accountStatus === "UNDER_REVIEW") {
    const error = new Error(
      "Your license application is actively under regulatory review. Please check back shortly."
    );
    error.statusCode = 403;
    error.accountStatus = "UNDER_REVIEW";
    error.userId = user._id;
    throw error;
  }

  if (user.accountStatus === "REJECTED") {
    const error = new Error(
      `Your registration and license were rejected: ${user.rejectionReason || "Regulatory compliance standards not met"}.`
    );
    error.statusCode = 403;
    error.accountStatus = "REJECTED";
    error.userId = user._id;
    throw error;
  }

  if (user.accountStatus === "SUSPENDED") {
    const error = new Error(
      "Your organization account has been suspended by regulatory oversight. Please contact support."
    );
    error.statusCode = 403;
    error.accountStatus = "SUSPENDED";
    error.userId = user._id;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organization ? user.organization._id : null,
    },
    process.env.JWT_SECRET || "default_jwt_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  await logAuditAction({
    userId: user._id,
    organization: user.organization?._id,
    action: "LOGIN_SUCCESS",
    entityType: "User",
    entityId: user._id,
    details: { email: user.email, role: user.role },
    req,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      organization: user.organization,
      lastLogin: user.lastLogin,
    },
  };
};

const requestPasswordReset = async (email, req = null) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Return success to avoid email enumeration
    return { success: true, message: "If an account exists, a reset token has been generated." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  await logAuditAction({
    userId: user._id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: user._id,
    details: { email: normalizedEmail },
    req,
  });

  return {
    success: true,
    message: "Password reset token generated.",
    resetToken, // Returned in dev/API mode
  };
};

const resetPasswordWithToken = async (token, newPassword, req = null) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Password reset token is invalid or has expired.");
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await logAuditAction({
    userId: user._id,
    action: "PASSWORD_RESET_SUCCESS",
    entityType: "User",
    entityId: user._id,
    details: { email: user.email },
    req,
  });

  return { success: true, message: "Password has been successfully updated. You may now sign in." };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate("organization")
    .select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const license = user.organization
    ? await License.findOne({ organization: user.organization._id })
    : null;

  return {
    user,
    license,
  };
};

module.exports = {
  registerUser,
  authenticateUser,
  requestPasswordReset,
  resetPasswordWithToken,
  getUserProfile,
};