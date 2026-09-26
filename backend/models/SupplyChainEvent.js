const mongoose = require("mongoose");

const supplyChainEventSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        "MANUFACTURED",
        "DISPATCHED",
        "SHIPPED", // alias for DISPATCHED
        "RECEIVED",
        "TRANSFERRED",
        "DELIVERED",
        "SOLD",
        "RETURNED",
        "RECALLED",
        "FLAGGED",
      ],
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
    location: {
      type: String,
      trim: true,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    quantity: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    uniqueEventId: {
      type: String,
      trim: true,
    },
    transactionHash: {
      type: String,
      trim: true,
    },
    blockNumber: {
      type: Number,
    },
    blockchainNetwork: {
      type: String,
      default: "Sepolia Ethereum Testnet (Simulated Proof)",
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

supplyChainEventSchema.index({ batch: 1 });
supplyChainEventSchema.index({ eventDate: 1 });
supplyChainEventSchema.index({ eventType: 1 });
supplyChainEventSchema.index({ fromOrganization: 1 });
supplyChainEventSchema.index({ toOrganization: 1 });

module.exports = mongoose.model("SupplyChainEvent", supplyChainEventSchema);