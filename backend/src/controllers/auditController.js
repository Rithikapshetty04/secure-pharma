const AuditLog = require("../../models/AuditLog");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const Batch = require("../../models/Batch");
const User = require("../../models/User");
const Organization = require("../../models/Organization");
const BlockchainService = require("../services/blockchainService");

/**
 * Sanitizes details text and metadata to prevent leaking sensitive information
 * such as passwords, tokens, private keys, or credentials.
 */
const sanitizeDetails = (details) => {
  if (!details) return "";

  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details);
      return sanitizeDetails(parsed);
    } catch {
      // String format - redact any password or token occurrences
      return details
        .replace(/"?password"?\s*[:=]\s*"?[^",\s}]+/gi, 'password: "[REDACTED]"')
        .replace(/"?token"?\s*[:=]\s*"?[^",\s}]+/gi, 'token: "[REDACTED]"')
        .replace(/"?privateKey"?\s*[:=]\s*"?[^",\s}]+/gi, 'privateKey: "[REDACTED]"');
    }
  }

  if (typeof details === "object" && details !== null) {
    const sensitiveKeys = ["password", "token", "jwt", "secret", "privatekey", "signature", "refreshtoken"];
    const cleaned = {};

    for (const [k, v] of Object.entries(details)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        cleaned[k] = "[REDACTED]";
      } else if (typeof v === "object" && v !== null) {
        cleaned[k] = sanitizeDetails(v);
      } else {
        cleaned[k] = v;
      }
    }

    return Object.entries(cleaned)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(" | ");
  }

  return String(details);
};

/**
 * GET /api/admin/audit or /api/audit-logs
 * Strictly read-only audit log querying with server-side pagination, composable filtering,
 * clear separation between off-chain application events and on-chain blockchain events,
 * and real blockchain provider telemetry.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const {
      search,
      source = "ALL",
      action,
      status = "ALL",
      entityType,
      startDate,
      endDate,
    } = req.query;

    const requestedSource = (source || "ALL").toUpperCase();
    const searchRegex = search && search.trim() ? new RegExp(search.trim(), "i") : null;

    // Date range filter
    const dateFilter = {};
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) dateFilter.$gte = parsedStart;
    }
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) dateFilter.$lte = parsedEnd;
    }

    let applicationLogs = [];
    let blockchainLogs = [];
    let totalApplicationCount = 0;
    let totalBlockchainCount = 0;

    // -------------------------------------------------------------------------
    // 1. QUERY APPLICATION AUDIT EVENTS (OFF-CHAIN)
    // -------------------------------------------------------------------------
    if (requestedSource === "ALL" || requestedSource === "APPLICATION") {
      const appQuery = {};

      if (Object.keys(dateFilter).length > 0) {
        appQuery.createdAt = dateFilter;
      }

      if (entityType && entityType.toUpperCase() !== "ALL") {
        appQuery.entityType = entityType;
      }

      if (action && action.toUpperCase() !== "ALL") {
        const act = action.toUpperCase();
        if (act === "USER_AUTH") {
          appQuery.action = {
            $in: [
              "USER_REGISTERED",
              "USER_LOGGED_OUT",
              "LOGIN_SUCCESS",
              "LOGIN_FAILED",
              "PASSWORD_RESET_REQUESTED",
              "PASSWORD_RESET_SUCCESS",
              "USER_STATUS_APPROVED",
              "USER_STATUS_SUSPENDED",
              "USER_STATUS_REJECTED",
            ],
          };
        } else if (act === "LICENSE") {
          appQuery.action = {
            $in: [
              "LICENSE_SUBMITTED",
              "LICENSE_UPDATED",
              "LICENSE_APPROVED",
              "LICENSE_REJECTED",
              "LICENSE_VERIFIED",
            ],
          };
        } else if (act === "BATCH") {
          appQuery.action = {
            $in: [
              "BATCH_CREATED",
              "BATCH_UPDATED",
              "BATCH_RECALLED",
              "BATCH_FLAGGED",
              "ADMIN_BATCH_RECALLED",
              "ADMIN_BATCH_FLAGGED",
            ],
          };
        } else if (act === "SUPPLY_CHAIN") {
          appQuery.action = {
            $in: ["SUPPLY_CHAIN_DISPATCHED", "BATCH_CREATED", "BATCH_RECALLED"],
          };
        } else {
          appQuery.action = new RegExp(action, "i");
        }
      }

      // Status filtering for application events based on outcome
      if (status && status.toUpperCase() !== "ALL") {
        const s = status.toUpperCase();
        if (s === "FAILED" || s === "REJECTED") {
          appQuery.action = { $regex: /FAILED|REJECTED|SUSPENDED/i };
        } else if (s === "SUCCESS" || s === "CONFIRMED") {
          appQuery.action = { $not: /FAILED|REJECTED|SUSPENDED/i };
        }
      }

      // Search filtering
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

      if (requestedSource === "APPLICATION") {
        // Direct server-side pagination on AuditLog
        const [rawLogs, count] = await Promise.all([
          AuditLog.find(appQuery)
            .select("-__v")
            .populate("user", "name email role")
            .populate("organization", "name type")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          AuditLog.countDocuments(appQuery),
        ]);

        totalApplicationCount = count;
        applicationLogs = rawLogs.map(formatApplicationLog);
      } else {
        // Source is ALL: count and bounded query for combination
        const count = await AuditLog.countDocuments(appQuery);
        totalApplicationCount = count;

        const maxToFetch = Math.min(skip + limit, 200);
        const rawLogs = await AuditLog.find(appQuery)
          .select("-__v")
          .populate("user", "name email role")
          .populate("organization", "name type")
          .sort({ createdAt: -1 })
          .limit(maxToFetch)
          .lean();

        applicationLogs = rawLogs.map(formatApplicationLog);
      }
    }

    // -------------------------------------------------------------------------
    // 2. QUERY BLOCKCHAIN CUSTODY EVENTS (ON-CHAIN)
    // -------------------------------------------------------------------------
    if (requestedSource === "ALL" || requestedSource === "BLOCKCHAIN") {
      const chainQuery = {};

      if (Object.keys(dateFilter).length > 0) {
        chainQuery.eventDate = dateFilter;
      }

      if (action && action.toUpperCase() !== "ALL") {
        const act = action.toUpperCase();
        if (act === "SUPPLY_CHAIN" || act === "BATCH") {
          // All SupplyChainEvents are supply chain / batch events
        } else if (act === "USER_AUTH" || act === "LICENSE") {
          // Off-chain only categories
          chainQuery.eventType = "__NONE__";
        } else {
          chainQuery.eventType = new RegExp(action, "i");
        }
      }

      // Status filter for blockchain events
      if (status && status.toUpperCase() !== "ALL") {
        const s = status.toUpperCase();
        if (s === "FAILED" || s === "REJECTED") {
          // Recorded on-chain checkpoints are valid/confirmed
          chainQuery._id = null;
        }
      }

      // Search filter for blockchain events
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

      if (requestedSource === "BLOCKCHAIN") {
        // Direct server-side pagination on SupplyChainEvent
        const [rawEvents, count] = await Promise.all([
          SupplyChainEvent.find(chainQuery)
            .select("-__v")
            .populate("batch", "batchNumber qrIdentifier product batchHash blockchainTxHash")
            .populate("fromOrganization", "name type")
            .populate("toOrganization", "name type")
            .populate("user", "name email role")
            .sort({ eventDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          SupplyChainEvent.countDocuments(chainQuery),
        ]);

        totalBlockchainCount = count;
        blockchainLogs = rawEvents.map(formatBlockchainEvent);
      } else {
        // Source is ALL: count and bounded query for combination
        const count = await SupplyChainEvent.countDocuments(chainQuery);
        totalBlockchainCount = count;

        const maxToFetch = Math.min(skip + limit, 200);
        const rawEvents = await SupplyChainEvent.find(chainQuery)
          .select("-__v")
          .populate("batch", "batchNumber qrIdentifier product batchHash blockchainTxHash")
          .populate("fromOrganization", "name type")
          .populate("toOrganization", "name type")
          .populate("user", "name email role")
          .sort({ eventDate: -1 })
          .limit(maxToFetch)
          .lean();

        blockchainLogs = rawEvents.map(formatBlockchainEvent);
      }
    }

    // -------------------------------------------------------------------------
    // 3. MERGE & PAGINATE
    // -------------------------------------------------------------------------
    let paginatedRecords = [];
    let totalRecordsCount = 0;

    if (requestedSource === "APPLICATION") {
      paginatedRecords = applicationLogs;
      totalRecordsCount = totalApplicationCount;
    } else if (requestedSource === "BLOCKCHAIN") {
      paginatedRecords = blockchainLogs;
      totalRecordsCount = totalBlockchainCount;
    } else {
      totalRecordsCount = totalApplicationCount + totalBlockchainCount;
      const combined = [...applicationLogs, ...blockchainLogs];
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      paginatedRecords = combined.slice(skip, skip + limit);
    }

    // -------------------------------------------------------------------------
    // 4. REAL SUMMARY METRICS & REAL BLOCKCHAIN TELEMETRY
    // -------------------------------------------------------------------------
    const [totalDbAppEvents, totalDbChainEvents, totalDbOnChainBatches, latestRecordedTx] =
      await Promise.all([
        AuditLog.countDocuments(),
        SupplyChainEvent.countDocuments(),
        Batch.countDocuments({
          $or: [
            { blockchainTxHash: { $exists: true, $ne: null, $ne: "" } },
            { batchHash: { $exists: true, $ne: null, $ne: "" } },
          ],
        }),
        SupplyChainEvent.findOne({
          transactionHash: { $exists: true, $ne: null, $ne: "" },
        })
          .sort({ eventDate: -1 })
          .populate("batch", "batchNumber qrIdentifier")
          .populate("fromOrganization", "name")
          .populate("toOrganization", "name")
          .lean(),
      ]);

    // Query real provider status (checks BLOCKCHAIN_RPC_URL, returns NOT_CONFIGURED if unset)
    const providerStatus = await BlockchainService.getProviderStatus();
    const contractInfo = BlockchainService.getContractInfo();

    return res.status(200).json({
      success: true,
      data: {
        logs: paginatedRecords,
        pagination: {
          page,
          limit,
          total: totalRecordsCount,
          totalPages: Math.ceil(totalRecordsCount / limit) || 1,
        },
        summary: {
          totalEvents: totalDbAppEvents + totalDbChainEvents,
          applicationEvents: totalDbAppEvents,
          blockchainEvents: totalDbChainEvents,
          onChainBatches: totalDbOnChainBatches,
        },
        blockchainMonitoring: {
          status: providerStatus.status, // "CONNECTED" | "NOT_CONFIGURED" | "UNAVAILABLE"
          network: providerStatus.network,
          rpcUrl: providerStatus.rpcUrl,
          latestBlock: providerStatus.latestBlock,
          contractAddress: contractInfo.contractAddress,
          isContractConfigured: contractInfo.isConfigured,
          message: providerStatus.message,
          totalOnChainEvents: totalDbChainEvents,
          totalOnChainBatches: totalDbOnChainBatches,
          latestTx: latestRecordedTx
            ? {
                txHash: latestRecordedTx.transactionHash,
                blockNumber: latestRecordedTx.blockNumber || null,
                eventType: latestRecordedTx.eventType,
                batchNumber: latestRecordedTx.batch?.batchNumber || null,
                qrIdentifier: latestRecordedTx.batch?.qrIdentifier || null,
                from: latestRecordedTx.fromOrganization?.name || "Origin Facility",
                to: latestRecordedTx.toOrganization?.name || "Recipient Node",
                timestamp: latestRecordedTx.eventDate || latestRecordedTx.createdAt,
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

/**
 * GET /api/admin/audit/:id or /api/audit-logs/:id
 * Strictly read-only detailed inspection with real correlation when supported by identifiers.
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit event identifier format.",
      });
    }

    // 1. Check in AuditLog (Application off-chain)
    const log = await AuditLog.findById(id)
      .select("-__v")
      .populate("user", "name email role accountStatus")
      .populate("organization", "name type registrationNumber address contactEmail")
      .lean();

    if (log) {
      let correlatedBatch = null;
      let correlatedBlockchainEvents = [];

      // Check if this application event is tied to a real Batch identifier
      if (log.entityType === "Batch" && log.entityId) {
        correlatedBatch = await Batch.findById(log.entityId)
          .select("batchNumber product qrIdentifier batchHash blockchainTxHash blockNumber status createdAt")
          .populate("product", "name productCode genericName")
          .lean();
      } else if (log.entityType === "SupplyChainEvent" && log.entityId) {
        const scEvt = await SupplyChainEvent.findById(log.entityId).select("batch").lean();
        if (scEvt && scEvt.batch) {
          correlatedBatch = await Batch.findById(scEvt.batch)
            .select("batchNumber product qrIdentifier batchHash blockchainTxHash blockNumber status createdAt")
            .populate("product", "name productCode genericName")
            .lean();
        }
      } else if (log.details?.batchNumber) {
        correlatedBatch = await Batch.findOne({ batchNumber: log.details.batchNumber })
          .select("batchNumber product qrIdentifier batchHash blockchainTxHash blockNumber status createdAt")
          .populate("product", "name productCode genericName")
          .lean();
      }

      if (correlatedBatch) {
        correlatedBlockchainEvents = await SupplyChainEvent.find({ batch: correlatedBatch._id })
          .select("eventType transactionHash blockNumber eventDate fromOrganization toOrganization location notes")
          .populate("fromOrganization", "name type")
          .populate("toOrganization", "name type")
          .sort({ eventDate: 1, _id: 1 })
          .lean();
      }

      const isFailure =
        log.action.includes("FAILED") ||
        log.action.includes("REJECTED") ||
        log.action.includes("SUSPENDED");

      return res.status(200).json({
        success: true,
        data: {
          log: {
            _id: log._id,
            timestamp: log.createdAt,
            action: log.action,
            actor: log.user ? { name: log.user.name, email: log.user.email, role: log.user.role } : null,
            organization: log.organization ? { name: log.organization.name, type: log.organization.type } : null,
            entityType: log.entityType || "System",
            entityId: log.entityId || null,
            details: sanitizeDetails(log.details),
            ipAddress: log.ipAddress || "Internal System",
            source: "APPLICATION",
            status: isFailure ? "FAILED" : "SUCCESS",
            transactionHash: null,
            blockNumber: null,
            correlatedBatch,
            correlatedBlockchainEvents,
          },
        },
      });
    }

    // 2. Check in SupplyChainEvent (Blockchain on-chain)
    const evt = await SupplyChainEvent.findById(id)
      .select("-__v")
      .populate("batch", "batchNumber qrIdentifier product batchHash blockchainTxHash blockNumber status")
      .populate("fromOrganization", "name type registrationNumber address contactEmail")
      .populate("toOrganization", "name type registrationNumber address contactEmail")
      .populate("user", "name email role")
      .lean();

    if (evt) {
      let correlatedApplicationLogs = [];

      // Look up real application audit events linked to this batch
      if (evt.batch?._id) {
        correlatedApplicationLogs = await AuditLog.find({
          $or: [
            { entityId: evt.batch._id },
            { "details": { $regex: evt.batch.batchNumber || evt.batch._id.toString() } },
          ],
        })
          .select("action createdAt user entityType")
          .populate("user", "name role")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
      }

      return res.status(200).json({
        success: true,
        data: {
          log: {
            _id: evt._id,
            timestamp: evt.eventDate || evt.createdAt,
            action: evt.eventType,
            actor: evt.user ? { name: evt.user.name, email: evt.user.email, role: evt.user.role } : null,
            organization: evt.fromOrganization
              ? { name: evt.fromOrganization.name, type: evt.fromOrganization.type }
              : null,
            toOrganization: evt.toOrganization
              ? { name: evt.toOrganization.name, type: evt.toOrganization.type }
              : null,
            entityType: "SupplyChainEvent",
            entityId: evt.batch?._id || evt._id,
            batchNumber: evt.batch?.batchNumber || "—",
            qrIdentifier: evt.batch?.qrIdentifier || null,
            details: `Custodial Transfer (${evt.eventType}): ${evt.fromOrganization?.name || "Origin"} → ${evt.toOrganization?.name || "Destination"}.${evt.notes ? ` Notes: ${evt.notes}` : ""}`,
            location: evt.location || "—",
            quantity: evt.quantity || null,
            ipAddress: "—",
            source: "BLOCKCHAIN",
            status: "CONFIRMED",
            transactionHash: evt.transactionHash || null,
            blockNumber: evt.blockNumber || null,
            blockchainNetwork: evt.blockchainNetwork || null,
            correlatedBatch: evt.batch || null,
            correlatedApplicationLogs,
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

/**
 * Format raw AuditLog entry into uniform frontend structure
 */
function formatApplicationLog(log) {
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
    details: sanitizeDetails(log.details),
    ipAddress: log.ipAddress || "Internal System",
    source: "APPLICATION",
    status: isFailure ? "FAILED" : "SUCCESS",
    transactionHash: null,
    blockNumber: null,
  };
}

/**
 * Format raw SupplyChainEvent entry into uniform frontend structure
 */
function formatBlockchainEvent(evt) {
  return {
    _id: evt._id,
    timestamp: evt.eventDate || evt.createdAt,
    action: evt.eventType,
    actor: evt.user ? { name: evt.user.name, email: evt.user.email, role: evt.user.role } : null,
    organization: evt.fromOrganization
      ? { name: evt.fromOrganization.name, type: evt.fromOrganization.type }
      : null,
    entityType: "SupplyChainEvent",
    entityId: evt.batch?._id || evt._id,
    batchNumber: evt.batch?.batchNumber || "—",
    qrIdentifier: evt.batch?.qrIdentifier || null,
    details: `Custodial Transfer (${evt.eventType}): ${evt.fromOrganization?.name || "Origin"} → ${evt.toOrganization?.name || "Destination"}.${evt.notes ? ` Notes: ${evt.notes}` : ""}`,
    ipAddress: "—",
    source: "BLOCKCHAIN",
    status: "CONFIRMED",
    transactionHash: evt.transactionHash || null,
    blockNumber: evt.blockNumber || null,
    blockchainNetwork: evt.blockchainNetwork || null,
  };
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
