const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "REGULATOR",
        "MANUFACTURER",
        "DISTRIBUTOR",
        "PHARMACY",
        "ADMIN", // alias for SUPER_ADMIN
      ],
      required: true,
      default: "MANUFACTURER",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    accountStatus: {
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
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ organization: 1 });

module.exports = mongoose.model("User", userSchema);