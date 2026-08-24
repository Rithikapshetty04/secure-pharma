const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    manufacturingDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      trim: true,
      default: "Units",
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "MANUFACTURED",
        "IN_TRANSIT",
        "RECEIVED",
        "DELIVERED",
        "DISTRIBUTED",
        "SOLD",
        "EXPIRED",
        "RECALLED",
        "FLAGGED",
      ],
      default: "MANUFACTURED",
    },
    storageRequirements: {
      type: String,
      trim: true,
      default: "Standard controlled storage",
    },
    qrIdentifier: {
      type: String,
      unique: true,
      trim: true,
    },
    qrCodeDataUrl: {
      type: String,
    },
    batchHash: {
      type: String,
      trim: true,
    },
    recallReason: {
      type: String,
      trim: true,
    },
    flagReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ product: 1 });
batchSchema.index({ manufacturer: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("Batch", batchSchema);