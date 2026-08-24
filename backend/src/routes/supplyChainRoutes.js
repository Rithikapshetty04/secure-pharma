const express = require("express");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Supply Chain API is working",
  });
});

module.exports = router;