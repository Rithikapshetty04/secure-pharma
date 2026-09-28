const AuditLog = require("../../models/AuditLog");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const Batch = require("../../models/Batch");
const User = require("../../models/User");
const Organization = require("../../models/Organization");

const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, source = "ALL", action, status, entityType, startDate, endDate } = req.query;

    const searchRegex = search && search.trim() ? new RegExp(search.trim(), "i") : null;

    // Date range filter
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    let applicationEvents = [];
    let blockchainEvents = [];

    // 1. Query Application Audit Logs (Off-Chain)
    if (source.toUpperCase() === "ALL" || source.toUpperCase() === "APPLICATION") {
      const appQuery = {};
      if (Object.keys(dateFilter).length > 0) {
        appQuery.createdAt = dateFilter;
      }
      if (entityType && entityType.toUpperCase() !== "ALL") {
        appQuery.entityType = entityType;
      }
      if (action && action.toUpperCase() !== "ALL") {
        if (action.toUpperCase() === "USER_AUTH") {
          appQuery.action = { $in: ["USER_REGISTERED", "USER_LOGGED_OUT", "LOGIN_SUCCESS", "LOGIN_FAILED", "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_SUCCESS", "USER_STATUS_APPROVED", "USER_STATUS_SUSPENDED"] };
        } else if (action.toUpperCase() === "LICENSE") {
          appQuery.action = { $in: ["LICENSE_SUBMITTED", "LICENSE_UPDATED", "LICENSE_APPROVED", "LICENSE_REJECTED"] };
        } else if (action.toUpperCase() === "BATCH") {
          appQuery.action = { $in: ["BATCH_CREATED", "BATCH_UPDATED", "BATCH_RECALLED", "BATCH_FLAGGED", "ADMIN_BATCH_RECALLED", "ADMIN_BATCH_FLAGGED"] };
        } else {
          appQuery.action = new RegExp(action, "i");
        }
      }

      if (searchRegex) {
        const matchingUsers = await User.find({
          $or: [{ name: searchRegex }, { email: searchRegex }],
        }).select("_id");
        const userIds = matchingUsers.map((u) => u._id);

        appQuery.$or = [
          { action: searchRegex },
          { details: searchRegex },
          { entityType: searchRegex },
          { ipAddress: searchRegex },
          ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
        ];
      }

      const rawAppLogs = await AuditLog.find(appQuery)
        .populate("user", "name email role")
        .populate("organization", "name type")
        .sort({ createdAt: -1 })
        .lean();

      applicationEvents = rawAppLogs.map((log) => {
        let detailsText = "";
        if (typeof log.details === "object" && log.details !== null) {
          detailsText = Object.entries(log.details)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");
        } else {
          detailsText = String(log.details || "");
        }

        const isFailure =
          log.action.includes("FAILED") ||
          log.action.includes("REJECTED") ||
          log.action.includes("SUSPENDED");

        return {
          _id: log._id,
          timestamp: log.createdAt,
          action: log.action,
          actor: log.user ? { name: log.user.name, email: log.user.email, role: log.user.role } : null,
          organization: log.organization ? { name: log.organization.name, type: log.organization.type } : null,
          entityType: log.entityType || "System",
          entityId: log.entityId || null,
          details: detailsText,
          ipAddress: log.ipAddress || "Internal System",
          source: "APPLICATION",
          status: isFailure ? "FAILED" : "SUCCESS",
          transactionHash: log.details?.transactionHash || log.metadata?.transactionHash || null,
          blockNumber: log.metadata?.blockNumber || null,
          metadata: log.metadata || null,
        };
      });
    }

    // 2. Query Blockchain Supply Chain Events (On-Chain)
    if (source.toUpperCase() === "ALL" || source.toUpperCase() === "BLOCKCHAIN") {
      const chainQuery = {};
      if (Object.keys(dateFilter).length > 0) {
        chainQuery.eventDate = dateFilter;
      }
      if (searchRegex) {
        const matchingBatches = await Batch.find({
          $or: [{ batchNumber: searchRegex }, { qrIdentifier: searchRegex }],
        }).select("_id");
        const batchIds = matchingBatches.map((b) => b._id);

        chainQuery.$or = [
          { eventType: searchRegex },
          { notes: searchRegex },
          { location: searchRegex },
          { transactionHash: searchRegex },
          ...(batchIds.length > 0 ? [{ batch: { $in: batchIds } }] : []),
        ];
      }

      const rawChainEvents = await SupplyChainEvent.find(chainQuery)
        .populate("batch", "batchNumber qrIdentifier product")
        .populate("fromOrganization", "name type")
        .populate("toOrganization", "name type")
        .populate("user", "name email role")
        .sort({ eventDate: -1 })
        .lean();

      blockchainEvents = rawChainEvents.map((evt) => ({
        _id: evt._id,
        timestamp: evt.eventDate || evt.createdAt,
        action: `ONCHAIN_${evt.eventType}`,
        actor: evt.user ? { name: evt.user.name, email: evt.user.email, role: evt.user.role } : null,
        organization: evt.fromOrganization ? { name: evt.fromOrganization.name, type: evt.fromOrganization.type } : null,
        entityType: "SupplyChainEvent",
        entityId: evt.batch?._id || evt._id,
        batchNumber: evt.batch?.batchNumber || "N/A",
        details: `On-Chain Custody Checkpoint (${evt.eventType}): ${evt.fromOrganization?.name || "Origin"} → ${evt.toOrganization?.name || "Destination"}.${evt.notes ? ` Notes: ${evt.notes}` : ""}`,
        ipAddress: "N/A (Blockchain Protocol)",
        source: "BLOCKCHAIN",
        status: "CONFIRMED",
        transactionHash: evt.transactionHash || null,
        blockNumber: evt.blockNumber || null,
        blockchainNetwork: evt.blockchainNetwork || "Sepolia Ethereum Testnet (Simulated Proof)",
        metadata: {
          fromOrganization: evt.fromOrganization?.name,
          toOrganization: evt.toOrganization?.name,
          location: evt.location,
          quantity: evt.quantity,
        },
      }));
    }

    // Merge and Sort
    let combinedLogs = [...applicationEvents, ...blockchainEvents];

    // Status filter
    if (status && status.toUpperCase() !== "ALL") {
      combinedLogs = combinedLogs.filter((l) => l.status.toUpperCase() === status.toUpperCase());
    }

    // Sort descending by timestamp
    combinedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Slice for server-side pagination
    const totalCount = combinedLogs.length;
    const paginatedLogs = combinedLogs.slice(skip, skip + limit);

    // Calculate live summary stats
    const [totalAppCount, totalChainCount, totalOnChainBatches, latestTxEvt] = await Promise.all([
      AuditLog.countDocuments(),
      SupplyChainEvent.countDocuments(),
      Batch.countDocuments({ blockchainTxHash: { $exists: true, $ne: null, $ne: "" } }),
      SupplyChainEvent.findOne({ transactionHash: { $exists: true, $ne: null, $ne: "" } })
        .sort({ eventDate: -1 })
        .populate("batch", "batchNumber")
        .populate("fromOrganization", "name")
        .populate("toOrganization", "name")
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
        summary: {
          totalEvents: totalAppCount + totalChainCount,
          applicationEvents: totalAppCount,
          blockchainEvents: totalChainCount,
          onChainBatches: totalOnChainBatches,
        },
        blockchainMonitoring: {
          status: "CONNECTED",
          network: process.env.BLOCKCHAIN_NETWORK || "Sepolia Ethereum Testnet (Simulated Proof)",
          contractAddress: process.env.CONTRACT_ADDRESS || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          totalOnChainBatches,
          totalOnChainEvents: totalChainCount,
          latestTx: latestTxEvt
            ? {
                txHash: latestTxEvt.transactionHash,
                blockNumber: latestTxEvt.blockNumber,
                eventType: latestTxEvt.eventType,
                batchNumber: latestTxEvt.batch?.batchNumber || "N/A",
                from: latestTxEvt.fromOrganization?.name || "Origin Facility",
                to: latestTxEvt.toOrganization?.name || "Recipient Node",
                timestamp: latestTxEvt.eventDate || latestTxEvt.createdAt,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    next(error);
  }
};

const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let log = await AuditLog.findById(id)
      .populate("user", "name email role")
      .populate("organization", "name type registrationNumber address contactEmail")
      .lean();

    if (log) {
      let detailsText = "";
      if (typeof log.details === "object" && log.details !== null) {
        detailsText = Object.entries(log.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ");
      } else {
        detailsText = String(log.details || "");
      }

      // Check if correlated to a batch
      let correlatedBatch = null;
      if (log.entityType === "Batch" && log.entityId) {
        correlatedBatch = await Batch.findById(log.entityId)
          .select("batchNumber product qrIdentifier blockchainTxHash blockNumber")
          .populate("product", "name productCode")
          .lean();
      }

      return res.status(200).json({
        success: true,
        data: {
          log: {
            ...log,
            timestamp: log.createdAt,
            source: "APPLICATION",
            status: log.action.includes("FAILED") || log.action.includes("REJECTED") ? "FAILED" : "SUCCESS",
            details: detailsText,
            correlatedBatch,
          },
        },
      });
    }

    // Check if it's a SupplyChainEvent
    const evt = await SupplyChainEvent.findById(id)
      .populate("batch", "batchNumber qrIdentifier product")
      .populate("fromOrganization", "name type registrationNumber address contactEmail")
      .populate("toOrganization", "name type registrationNumber address contactEmail")
      .populate("user", "name email role")
      .lean();

    if (evt) {
      return res.status(200).json({
        success: true,
        data: {
          log: {
            _id: evt._id,
            timestamp: evt.eventDate || evt.createdAt,
            action: `ONCHAIN_${evt.eventType}`,
            actor: evt.user ? { name: evt.user.name, email: evt.user.email, role: evt.user.role } : null,
            organization: evt.fromOrganization ? { name: evt.fromOrganization.name, type: evt.fromOrganization.type } : null,
            entityType: "SupplyChainEvent",
            entityId: evt.batch?._id || evt._id,
            details: `On-Chain Custody Checkpoint (${evt.eventType}): ${evt.fromOrganization?.name || "Origin"} → ${evt.toOrganization?.name || "Destination"}.${evt.notes ? ` Notes: ${evt.notes}` : ""}`,
            ipAddress: "N/A (Blockchain Protocol)",
            source: "BLOCKCHAIN",
            status: "CONFIRMED",
            transactionHash: evt.transactionHash || null,
            blockNumber: evt.blockNumber || null,
            blockchainNetwork: evt.blockchainNetwork || "Sepolia Ethereum Testnet (Simulated Proof)",
            correlatedBatch: evt.batch,
            metadata: {
              fromOrganization: evt.fromOrganization?.name,
              toOrganization: evt.toOrganization?.name,
              location: evt.location,
              quantity: evt.quantity,
            },
          },
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: "Audit record not found.",
    });
  } catch (error) {
    console.error("Error in getAuditLogById:", error);
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};

