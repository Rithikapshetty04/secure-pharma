const express = require("express");
const {
  getAllEvents,
  getBatchEventsTimeline,
  recordEvent,
} = require("../controllers/supplyChainController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/events", authenticateToken, getAllEvents);
router.get("/batches/:batchId", authenticateToken, getBatchEventsTimeline);

router.post(
  "/events",
  authenticateToken,
  authorizeRoles(
    "MANUFACTURER",
    "DISTRIBUTOR",
    "PHARMACY",
    "SUPER_ADMIN",
    "ADMIN",
    "REGULATOR"
  ),
  recordEvent
);

module.exports = router;