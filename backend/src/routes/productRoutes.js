const express = require("express");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Product API is working",
  });
});

module.exports = router;