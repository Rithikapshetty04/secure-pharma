require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Organization = require("../../models/Organization");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for admin seeding...");

    let adminOrg = await Organization.findOne({ name: "Regulatory Authority" });
    if (!adminOrg) {
      adminOrg = await Organization.create({
        name: "Regulatory Authority",
        type: "MANUFACTURER", // placeholder enum
        contactEmail: "admin@securepharma.gov",
        status: "APPROVED",
        address: "Federal Drug Control HQ",
      });
    }

    const existingAdmin = await User.findOne({ email: "admin@securepharma.gov" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin@123456", 10);
      await User.create({
        name: "National Drug Regulator Admin",
        email: "admin@securepharma.gov",
        password: hashedPassword,
        role: "ADMIN",
        organization: adminOrg._id,
        accountStatus: "APPROVED",
      });
      console.log("Admin account created successfully (admin@securepharma.gov / Admin@123456)");
    } else {
      console.log("Admin account already exists.");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
