require("dotenv").config();

const express = require("express");
const connectDatabase = require("../config/database");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

connectDatabase();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Secure Pharma backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Secure Pharma backend running on port ${PORT}`);
});