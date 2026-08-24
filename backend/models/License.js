const mongoose = require("mongoose");

const licenseSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
    },
    licenseType: {
      type: String,
      enum: [
        "MANUFACTURING",
        "WHOLESALE",
        "PHARMACY",
        "IMPORT_EXPORT",
      ],
      required: true,
    },
    issuingAuthority: {
      type: String,
      trim: true,
      default: "Federal Drug Control Agency",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2), // 2 years default
    },
    documentPath: {
      type: String,
    },
    documentHash: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "VERIFIED",
        "REJECTED",
        "EXPIRED",
      ],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

licenseSchema.index({ organization: 1 });
licenseSchema.index({ verificationStatus: 1 });
licenseSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("License", licenseSchema);