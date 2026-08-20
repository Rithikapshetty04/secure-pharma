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
      required: true,
      trim: true,
    },

    licenseType: {
      type: String,
      enum: [
        "MANUFACTURING",
        "WHOLESALE",
        "PHARMACY",
      ],
      required: true,
    },

    documentPath: {
      type: String,
    },

    verificationStatus: {
      type: String,
      enum: [
        "PENDING",
        "VERIFIED",
        "REJECTED",
      ],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "License",
  licenseSchema
);