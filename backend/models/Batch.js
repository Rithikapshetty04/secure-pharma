const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    manufacturingDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    quantity: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "MANUFACTURED",
        "IN_TRANSIT",
        "DELIVERED",
        "EXPIRED",
      ],
      default: "MANUFACTURED",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Batch",
  batchSchema
);