const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    license: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },
    identifier: {
      type: String,
      trim: true,
    },
    verificationType: {
      type: String,
      enum: ["LICENSE_VERIFICATION", "PRODUCT_QR_SCAN", "PUBLIC_BATCH_QUERY"],
      default: "LICENSE_VERIFICATION",
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "VERIFIED",
        "REJECTED",
        "AUTHENTIC",
        "SUSPICIOUS",
        "EXPIRED",
        "RECALLED",
        "NOT_FOUND",
      ],
      default: "PENDING",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationDate: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

verificationSchema.index({ identifier: 1 });
verificationSchema.index({ license: 1 });
verificationSchema.index({ batch: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ verificationDate: -1 });

module.exports = mongoose.model("Verification", verificationSchema);
