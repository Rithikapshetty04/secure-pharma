const express = require("express");
const {
  getUserNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getUserNotifications);
router.patch("/:id/read", authenticateToken, markRead);
router.patch("/read-all", authenticateToken, markAllRead);

module.exports = router;
