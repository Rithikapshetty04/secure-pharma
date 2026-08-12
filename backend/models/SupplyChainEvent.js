const mongoose = require("mongoose");

const supplyChainEventSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    fromOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },

    toOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },

    eventType: {
      type: String,
      enum: [
        "MANUFACTURED",
        "SHIPPED",
        "RECEIVED",
        "TRANSFERRED",
        "DELIVERED",
      ],
      required: true,
    },

    location: {
      type: String,
      trim: true,
    },

    transactionHash: {
      type: String,
      trim: true,
    },

    eventDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SupplyChainEvent",
  supplyChainEventSchema
);