require("dotenv").config();

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
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { authRateLimiter, verificationRateLimiter } = require("./middleware/rateLimitMiddleware");

const app = express();

connectDatabase();

// Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "sameorigin" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Restricted CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, test scripts, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Access forbidden from this origin."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Uploaded documents are NOT served statically to prevent unrestricted public access.
// All license document access must be routed through authenticated endpoint: GET /api/licenses/:id/document

// API Routes with rate limiting on sensitive entry points
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/supply-chain", supplyChainRoutes);
app.use("/api/distributor", distributorRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/verify", verificationRateLimiter, verificationRoutes);
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

// Centralized Safe Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);
  const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  const safeMessage =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "An internal server error occurred. Please contact system administrator."
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    code: err.code || undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Secure Pharma backend API running on port ${PORT}`);
});
