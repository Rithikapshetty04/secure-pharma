const mongoose = require("mongoose");

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/secure_pharma";
  try {
    await mongoose.connect(uri, {
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.warn("Primary MongoDB connection warning:", error.message);
    // If remote connection failed, fallback to local MongoDB instance
    if (uri !== "mongodb://127.0.0.1:27017/secure_pharma") {
      try {
        console.log("Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/secure_pharma)...");
        await mongoose.connect("mongodb://127.0.0.1:27017/secure_pharma", {
          serverSelectionTimeoutMS: 5000,
        });
        console.log("Local MongoDB fallback connected successfully");
        return;
      } catch (fallbackError) {
        console.error("Local fallback also failed:", fallbackError.message);
      }
    }
    console.error("MongoDB connection failed completely:", error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;