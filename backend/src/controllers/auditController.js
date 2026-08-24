const AuditLog = require("../../models/AuditLog");

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, search, startDate, endDate, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }
    if (entityType) {
      filter.entityType = entityType;
    }
    if (search) {
      filter.$or = [
        { details: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { ipAddress: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find(filter)
      .populate("user", "name email role")
      .populate("organization", "name type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
