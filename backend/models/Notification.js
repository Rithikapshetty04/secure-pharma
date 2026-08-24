const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recipientRole: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "REGULATOR",
        "MANUFACTURER",
        "DISTRIBUTOR",
        "PHARMACY",
        "ADMIN",
        "ALL",
      ],
      default: "ALL",
    },
    recipientOrg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    type: {
      type: String,
      enum: [
        "LICENSE_SUBMITTED",
        "LICENSE_APPROVED",
        "LICENSE_REJECTED",
        "LICENSE_EXPIRING",
        "BATCH_RECEIVED",
        "BATCH_TRANSFERRED",
        "SUSPICIOUS_PRODUCT",
        "VERIFICATION_COMPLETED",
        "ACCOUNT_STATUS_CHANGED",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEntity: {
      type: String,
      trim: true,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientUser: 1 });
notificationSchema.index({ recipientRole: 1 });
notificationSchema.index({ recipientOrg: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
