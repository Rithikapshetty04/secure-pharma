require("dotenv").config();

const express = require("express");
const connectDatabase = require("../config/database");
const cors = require("cors");
const helmet = require("helmet");
const healthRoutes = require("./routes/healthRoutes");
const app = express();

connectDatabase();

app.use(helmet());
app.use(cors());
app.use(express.json());
console.log("healthRoutes =", healthRoutes);
app.use("/api/health", healthRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Secure Pharma backend running on port ${PORT}`);
});
