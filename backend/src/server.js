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
const supplyChainRoutes = require("./routes/supplyChainRoutes");
const app = express();

connectDatabase();

app.use(helmet());
app.use(cors());
app.use(express.json());
console.log("healthRoutes =", healthRoutes);
app.use("/api/health", healthRoutes);

console.log(
  "AUTH ROUTES:",
  authRoutes.stack.map(x => x.route && x.route.path)
);

app.use("/api/auth", authRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/supply-chain", supplyChainRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Secure Pharma backend running on port ${PORT}`);
});
