const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "MANUFACTURER",
        "DISTRIBUTOR",
        "PHARMACY",
        "REGULATOR",
      ],
      required: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
      ],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    suspensionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ name: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ type: 1 });

module.exports = mongoose.model("Organization", organizationSchema);