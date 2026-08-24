const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
      default: "",
    },
    brandName: {
      type: String,
      trim: true,
      default: "",
    },
    productCode: {
      type: String,
      required: [true, "Product code / GTIN is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    regulatoryApprovalNumber: {
      type: String,
      trim: true,
      default: "",
    },
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General Pharmaceutical",
    },
    dosageForm: {
      type: String,
      trim: true,
      default: "Tablet / Capsule",
    },
    strength: {
      type: String,
      trim: true,
      default: "",
    },
    packageSize: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    storageRequirements: {
      type: String,
      trim: true,
      default: "Store at controlled room temperature 15°C to 25°C",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ manufacturer: 1 });
productSchema.index({ name: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model("Product", productSchema);