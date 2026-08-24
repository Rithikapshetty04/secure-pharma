const bcrypt = require("bcryptjs");

const User = require("../../models/User");
const Organization = require("../../models/Organization");
const License = require("../../models/License");
const Verification = require("../../models/Verification");
const registerUser = async (userData) => {
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
  } = userData;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedLicenseNumber = licenseNumber.trim();

  const existingEmail = await User.findOne({
    email: normalizedEmail,
  });

  if (existingEmail) {
    throw new Error("Email is already registered");
  }

  const existingLicense = await User.findOne({
    licenseNumber: normalizedLicenseNumber,
  });

  if (existingLicense) {
    throw new Error("License number is already registered");
  }

  const existingLicenseRecord = await License.findOne({
    licenseNumber: normalizedLicenseNumber,
  });

  if (existingLicenseRecord) {
    throw new Error("License number is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const organization = await Organization.create({
    name: organizationName.trim(),
    type: organizationType.trim(),
    contactEmail: normalizedEmail,
    status: "PENDING",
  });

  const license = await License.create({
    organization: organization._id,
    licenseNumber: normalizedLicenseNumber,
    licenseType: licenseType.trim(),
    documentPath,
    verificationStatus: "PENDING",
  });

  await Verification.create({
    license: license._id,
    status: "PENDING",
  });

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    organizationName: organization.name,
    organizationType: organization.type,
    licenseNumber: normalizedLicenseNumber,
    licenseDocument,
    verificationStatus: "PENDING",
    role: "organizationType",
  });

  return user;
};

const authenticateUser = async (credentials) => {
  // Login will be implemented later.
};

module.exports = {
  registerUser,
  authenticateUser,
};