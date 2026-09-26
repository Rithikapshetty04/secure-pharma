require("dotenv").config();

const path = require("path");
const express = require("express");
const connectDatabase = require("../config/database");
const cors = require("cors");
const helmet = require("helmet");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const licenseRoutes = require("./routes/licenseRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const productRoutes = require("./routes/productRoutes");
const batchRoutes = require("./routes/batchRoutes");
const supplyChainRoutes = require("./routes/supplyChainRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");
const distributorRoutes = require("./routes/distributorRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

connectDatabase();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded documents securely
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/supply-chain", supplyChainRoutes);
app.use("/api/distributor", distributorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/verify", verificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/audit-logs", auditRoutes);

// Global 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.originalUrl}' not found on Secure Pharma API.`,
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Secure Pharma backend API running on port ${PORT}`);
});
