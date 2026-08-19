const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async (userData) => {
  const {
    name,
    email,
    password,
    organizationName,
    organizationType,
    licenseNumber,
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    organizationName: organizationName.trim(),
    organizationType: organizationType.trim(),
    licenseNumber: normalizedLicenseNumber,
    verificationStatus: "PENDING",
    role: "USER",
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