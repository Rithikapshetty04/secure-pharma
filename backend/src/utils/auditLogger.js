const AuditLog = require("../../models/AuditLog");

const logAuditAction = async ({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  details = null,
  ipAddress = null,
  req = null,
}) => {
  try {
    const finalUserId = userId || (req && req.user ? req.user._id : null);
    const finalIp =
      ipAddress ||
      (req ? req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null : null);

    const logEntry = await AuditLog.create({
      user: finalUserId,
      action,
      entityType,
      entityId,
      details: typeof details === "object" ? JSON.stringify(details) : details,
      ipAddress: finalIp,
    });

    return logEntry;
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
    // Don't crash request flow if audit logging encounters a database hiccup
    return null;
  }
};

module.exports = { logAuditAction };
