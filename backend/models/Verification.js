const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    license: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "VERIFIED",
        "REJECTED",
      ],
      default: "PENDING",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verificationDate: {
      type: Date,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Verification",
  verificationSchema
);
