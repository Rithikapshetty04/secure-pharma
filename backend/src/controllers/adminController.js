const User = require("../../models/User");
const Organization = require("../../models/Organization");
const License = require("../../models/License");
const Batch = require("../../models/Batch");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const Order = require("../../models/Order");
const AuditLog = require("../../models/AuditLog");
const { logAuditAction } = require("../utils/auditLogger");

/**
 * GET /api/admin/dashboard
 * Aggregates operational summary metrics and read-only status for the Admin Dashboard.
 */
const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      manufacturersCount,
      distributorsCount,
      pharmaciesCount,
      totalOrganizations,
      totalLicenses,
      pendingLicensesCount,
      approvedLicensesCount,
      rejectedLicensesCount,
      totalBatches,
      transferredBatches,
      deliveredBatches,
      recalledBatches,
      flaggedBatches,
      expiredBatches,
      totalTransfers,
      totalSupplyChainEvents,
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      blockchainBatchesCount,
      blockchainEventsCount,
      latestBlockchainTx,
      pendingLicenseList,
      pendingUserList,
      recalledBatchList,
      recentAuditLogs
    ] = await Promise.all([
      // Users & Stakeholders
      User.countDocuments(),
      User.countDocuments({ accountStatus: "APPROVED" }),
      User.countDocuments({ accountStatus: { $in: ["PENDING", "UNDER_REVIEW"] } }),
      User.countDocuments({ accountStatus: "SUSPENDED" }),
      User.countDocuments({ role: "MANUFACTURER" }),
      User.countDocuments({ role: "DISTRIBUTOR" }),
      User.countDocuments({ role: "PHARMACY" }),
      Organization.countDocuments(),

      // Licenses
      License.countDocuments(),
      License.countDocuments({ verificationStatus: "PENDING" }),
      License.countDocuments({ verificationStatus: { $in: ["APPROVED", "VERIFIED"] } }),
      License.countDocuments({ verificationStatus: "REJECTED" }),

      // Batches
      Batch.countDocuments(),
      Batch.countDocuments({ status: "IN_TRANSIT" }),
      Batch.countDocuments({ status: { $in: ["DELIVERED", "DISTRIBUTED", "SOLD"] } }),
      Batch.countDocuments({ status: "RECALLED" }),
      Batch.countDocuments({ status: "FLAGGED" }),
      Batch.countDocuments({ $or: [{ status: "EXPIRED" }, { expiryDate: { $lt: now } }] }),

      // Supply Chain Events
      SupplyChainEvent.countDocuments({ eventType: { $in: ["DISPATCHED", "SHIPPED", "TRANSFERRED"] } }),
      SupplyChainEvent.countDocuments(),

      // Orders
      Order.countDocuments(),
      Order.countDocuments({ status: "PENDING" }),
      Order.countDocuments({ status: "SHIPPED" }),
      Order.countDocuments({ status: "DELIVERED" }),

      // Blockchain Traceability Stats (Read-Only MongoDB Queries)
      Batch.countDocuments({ blockchainTxHash: { $exists: true, $ne: null, $ne: "" } }),
      SupplyChainEvent.countDocuments({ transactionHash: { $exists: true, $ne: null, $ne: "" } }),
      SupplyChainEvent.findOne({ transactionHash: { $exists: true, $ne: null, $ne: "" } })
        .sort({ eventDate: -1, createdAt: -1 })
        .populate("batch", "batchNumber")
        .populate("fromOrganization", "name")
        .populate("toOrganization", "name")
        .lean(),

      // Actionable Details / Lists
      License.find({ verificationStatus: "PENDING" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("organization", "name type registrationNumber")
        .lean(),

      User.find({ accountStatus: { $in: ["PENDING", "UNDER_REVIEW"] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("organization", "name type")
        .select("-password")
        .lean(),

      Batch.find({ status: { $in: ["RECALLED", "FLAGGED"] } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("product", "name code")
        .populate("manufacturer", "name")
        .lean(),

      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name email role")
        .populate("organization", "name")
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          suspended: suspendedUsers,
          manufacturers: manufacturersCount,
          distributors: distributorsCount,
          pharmacies: pharmaciesCount,
          totalOrganizations
        },
        licenses: {
          total: totalLicenses,
          pending: pendingLicensesCount,
          approved: approvedLicensesCount,
          rejected: rejectedLicensesCount
        },
        batches: {
          total: totalBatches,
          transferred: transferredBatches,
          delivered: deliveredBatches,
          recalled: recalledBatches,
          flagged: flaggedBatches,
          expired: expiredBatches
        },
        supplyChain: {
          totalTransfers,
          totalEvents: totalSupplyChainEvents
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders
        },
        blockchain: {
          status: "CONNECTED",
          network: process.env.BLOCKCHAIN_NETWORK || "Sepolia Ethereum Testnet (Simulated Proof)",
          contractAddress: process.env.CONTRACT_ADDRESS || null,
          totalOnChainBatches: blockchainBatchesCount,
          totalOnChainEvents: blockchainEventsCount,
          latestTx: latestBlockchainTx
            ? {
                txHash: latestBlockchainTx.transactionHash,
                blockNumber: latestBlockchainTx.blockNumber,
                eventType: latestBlockchainTx.eventType,
                batchNumber: latestBlockchainTx.batch?.batchNumber || "N/A",
                from: latestBlockchainTx.fromOrganization?.name || "Manufacturer Origin",
                to: latestBlockchainTx.toOrganization?.name || "Recipient",
                timestamp: latestBlockchainTx.eventDate || latestBlockchainTx.createdAt
              }
            : null
        },
        attentionRequired: {
          pendingLicenses: pendingLicenseList,
          pendingUsers: pendingUserList,
          recalledBatchList,
          hasOutstandingIssues:
            pendingLicensesCount > 0 ||
            pendingUsers > 0 ||
            recalledBatches > 0 ||
            flaggedBatches > 0 ||
            expiredBatches > 0
        },
        recentAuditLogs
      }
    });
  } catch (error) {
    console.error("Error in getAdminDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate admin dashboard summary.",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/users
 * Returns paginated, searchable, filterable user directory with real database data.
 */
const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : "";
    const role = req.query.role ? req.query.role.toUpperCase() : "ALL";
    const status = req.query.status ? req.query.status.toUpperCase() : "ALL";

    const query = {};

    if (role && role !== "ALL") {
      if (role === "ADMIN") {
        query.role = { $in: ["ADMIN", "SUPER_ADMIN", "REGULATOR"] };
      } else {
        query.role = role;
      }
    }

    if (status && status !== "ALL") {
      query.accountStatus = status;
    }

    if (search) {
      const matchingOrgs = await Organization.find({
        name: { $regex: search, $options: "i" }
      }).select("_id");
      const orgIds = matchingOrgs.map(o => o._id);

      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        ...(orgIds.length > 0 ? [{ organization: { $in: orgIds } }] : [])
      ];
    }

    const [users, total, summary] = await Promise.all([
      User.find(query)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .populate("organization", "name type registrationNumber status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query),

      Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "MANUFACTURER" }),
        User.countDocuments({ role: "DISTRIBUTOR" }),
        User.countDocuments({ role: "PHARMACY" }),
        User.countDocuments({ role: { $in: ["ADMIN", "SUPER_ADMIN", "REGULATOR"] } }),
        User.countDocuments({ accountStatus: { $in: ["PENDING", "UNDER_REVIEW"] } })
      ])
    ]);

    // Attach associated License status for each organization
    const orgIdsList = users.map(u => u.organization?._id).filter(Boolean);
    const licenses = await License.find({ organization: { $in: orgIdsList } })
      .select("organization licenseNumber licenseType verificationStatus expiryDate")
      .lean();

    const licenseMap = {};
    licenses.forEach(lic => {
      if (lic.organization) {
        licenseMap[lic.organization.toString()] = lic;
      }
    });

    const formattedUsers = users.map(u => ({
      ...u,
      license: u.organization ? (licenseMap[u.organization._id.toString()] || null) : null
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1
        },
        summary: {
          total: summary[0],
          manufacturers: summary[1],
          distributors: summary[2],
          pharmacies: summary[3],
          admins: summary[4],
          pending: summary[5]
        }
      }
    });
  } catch (error) {
    console.error("Error in getAdminUsers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user directory.",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Retrieves detailed user profile and associated organization/license/audit details.
 */
const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("organization")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    let license = null;
    if (user.organization) {
      license = await License.findOne({ organization: user.organization._id })
        .select("licenseNumber licenseType issuingAuthority verificationStatus issueDate expiryDate documentPath documentHash")
        .lean();
    }

    const userAuditLogs = await AuditLog.find({
      $or: [{ user: user._id }, { entityId: user._id }]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          license,
          auditLogs: userAuditLogs
        }
      }
    });
  } catch (error) {
    console.error("Error in getAdminUserById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user details.",
      error: error.message
    });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Administrative account status modification with self-protection and audit logging.
 */
const updateAdminUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, status, reason } = req.body;
    const targetStatus = (accountStatus || status || "").toUpperCase();

    const validStatuses = ["APPROVED", "SUSPENDED", "PENDING", "UNDER_REVIEW", "REJECTED"];
    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account status '${targetStatus}'. Supported values: ${validStatuses.join(", ")}.`
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // SELF-PROTECTION ENFORCEMENT: Admin cannot suspend or alter their own account status
    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Self-Protection Enforced: You cannot alter the status of your own currently active administrator account."
      });
    }

    // ADMIN PROTECTION: Only SUPER_ADMIN can alter status of another Admin/Regulator account
    const isTargetAdmin = ["ADMIN", "SUPER_ADMIN", "REGULATOR"].includes(targetUser.role);
    if (isTargetAdmin && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: Only Super Administrators can alter the account status of administrative users."
      });
    }

    const oldStatus = targetUser.accountStatus;
    targetUser.accountStatus = targetStatus;
    if (reason) {
      targetUser.rejectionReason = reason;
    }
    await targetUser.save();

    // Synchronize associated organization status if applicable
    if (targetUser.organization) {
      const orgStatus = targetStatus === "APPROVED" ? "APPROVED" : targetStatus === "SUSPENDED" ? "SUSPENDED" : targetStatus === "REJECTED" ? "REJECTED" : "PENDING";
      await Organization.findByIdAndUpdate(targetUser.organization, {
        status: orgStatus,
        ...(targetStatus === "REJECTED" ? { rejectionReason: reason } : {}),
        ...(targetStatus === "SUSPENDED" ? { suspensionReason: reason } : {})
      });
    }

    // Record audit trail entry
    await logAuditAction({
      userId: req.user._id,
      action: `USER_STATUS_${targetStatus}`,
      entityType: "User",
      entityId: targetUser._id,
      details: `Administrator ${req.user.name} (${req.user.email}) changed user status of ${targetUser.name} (${targetUser.email}) from ${oldStatus} to ${targetStatus}.${reason ? ` Reason: ${reason}` : ""}`,
      req
    });

    res.json({
      success: true,
      message: `User status for ${targetUser.name} successfully updated to ${targetStatus}.`,
      data: {
        userId: targetUser._id,
        accountStatus: targetUser.accountStatus
      }
    });
  } catch (error) {
    console.error("Error in updateAdminUserStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user account status.",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/batches
 * Returns paginated, searchable, filterable batch inventory across all manufacturers with current custody.
 */
const getAdminBatches = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, status, role, expiry, blockchain } = req.query;

    const now = new Date();

    // Auto-detect expired batches
    await Batch.updateMany(
      {
        expiryDate: { $lt: now },
        status: { $nin: ["EXPIRED", "RECALLED"] },
      },
      { status: "EXPIRED" }
    );

    const filter = {};

    // 1. Status Filter
    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    // 2. Expiry Filter
    if (expiry && expiry.toUpperCase() !== "ALL") {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (expiry.toUpperCase() === "EXPIRED") {
        filter.$or = [{ status: "EXPIRED" }, { expiryDate: { $lt: now } }];
      } else if (expiry.toUpperCase() === "EXPIRING_SOON") {
        filter.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
      } else if (expiry.toUpperCase() === "VALID") {
        filter.expiryDate = { $gt: thirtyDaysFromNow };
      }
    }

    // 3. Blockchain Filter
    if (blockchain && blockchain.toUpperCase() !== "ALL") {
      if (blockchain.toUpperCase() === "ON_CHAIN") {
        filter.blockchainTxHash = { $exists: true, $ne: null, $ne: "" };
      } else if (blockchain.toUpperCase() === "OFF_CHAIN") {
        filter.$or = [{ blockchainTxHash: { $exists: false } }, { blockchainTxHash: null }, { blockchainTxHash: "" }];
      }
    }

    // 4. Search Filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      const matchingProducts = await Product.find({
        $or: [
          { name: searchRegex },
          { genericName: searchRegex },
          { brandName: searchRegex },
          { productCode: searchRegex },
        ],
      }).select("_id");
      const productIds = matchingProducts.map((p) => p._id);

      const matchingOrgs = await Organization.find({
        name: searchRegex,
      }).select("_id");
      const orgIds = matchingOrgs.map((o) => o._id);

      filter.$or = [
        { batchNumber: searchRegex },
        { qrIdentifier: searchRegex },
        ...(productIds.length > 0 ? [{ product: { $in: productIds } }] : []),
        ...(orgIds.length > 0 ? [{ manufacturer: { $in: orgIds } }] : []),
      ];
    }

    // Retrieve batches
    const [allBatches, total, counts] = await Promise.all([
      Batch.find(filter)
        .populate({
          path: "product",
          select: "name genericName brandName productCode dosageForm category storageRequirements",
          populate: { path: "manufacturer", select: "name type" },
        })
        .populate("manufacturer", "name type registrationNumber contactEmail address")
        .sort({ createdAt: -1 })
        .lean(),

      Batch.countDocuments(filter),

      Promise.all([
        Batch.countDocuments(),
        Batch.countDocuments({ status: { $in: ["MANUFACTURED", "IN_TRANSIT"] } }),
        Batch.countDocuments({ status: { $in: ["RECEIVED", "DELIVERED", "DISTRIBUTED", "SOLD"] } }),
        Batch.countDocuments({ status: { $in: ["RECALLED", "FLAGGED"] } }),
        Batch.countDocuments({ $or: [{ status: "EXPIRED" }, { expiryDate: { $lt: now } }] }),
        Batch.countDocuments({ blockchainTxHash: { $exists: true, $ne: null, $ne: "" } }),
      ]),
    ]);

    // Attach latest custodian for every batch from SupplyChainEvent
    const batchIdsList = allBatches.map((b) => b._id);
    const events = await SupplyChainEvent.find({ batch: { $in: batchIdsList } })
      .populate("toOrganization", "name type registrationNumber contactEmail address")
      .sort({ eventDate: 1 })
      .lean();

    const latestEventMap = {};
    events.forEach((evt) => {
      latestEventMap[evt.batch.toString()] = evt;
    });

    let formattedBatches = allBatches.map((b) => {
      const latestEvt = latestEventMap[b._id.toString()];
      const currentCustodian = latestEvt?.toOrganization || b.manufacturer;
      const currentRole = currentCustodian?.type || "MANUFACTURER";

      return {
        ...b,
        currentCustodian,
        currentRole,
      };
    });

    // 5. Role Filter (Filters by derived current custodian role)
    if (role && role.toUpperCase() !== "ALL") {
      formattedBatches = formattedBatches.filter((b) => b.currentRole.toUpperCase() === role.toUpperCase());
    }

    // Apply pagination slice after role filter
    const totalCount = formattedBatches.length;
    const paginatedBatches = formattedBatches.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: {
        batches: paginatedBatches,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit) || 1,
        },
        summary: {
          total: counts[0],
          active: counts[1],
          delivered: counts[2],
          issues: counts[3],
          expired: counts[4],
          onChain: counts[5],
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminBatches:", error);
    next(error);
  }
};

/**
 * GET /api/admin/batches/:id
 * Retrieves comprehensive details, custody history, supply chain events, and blockchain status for a batch.
 */
const getAdminBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let batch = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      batch = await Batch.findById(id)
        .populate({
          path: "product",
          populate: { path: "manufacturer", select: "name type address status contactEmail" },
        })
        .populate("manufacturer", "name type registrationNumber contactEmail address")
        .lean();
    }

    if (!batch) {
      batch = await Batch.findOne({
        $or: [{ batchNumber: id.trim().toUpperCase() }, { qrIdentifier: id.trim() }],
      })
        .populate({
          path: "product",
          populate: { path: "manufacturer", select: "name type address status contactEmail" },
        })
        .populate("manufacturer", "name type registrationNumber contactEmail address")
        .lean();
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Pharmaceutical batch not found in system ledger.",
      });
    }

    // Supply Chain Events Timeline
    const events = await SupplyChainEvent.find({ batch: batch._id })
      .populate("fromOrganization", "name type registrationNumber contactEmail address")
      .populate("toOrganization", "name type registrationNumber contactEmail address")
      .populate("user", "name role email")
      .sort({ eventDate: 1 })
      .lean();

    // Determine current custodian
    let currentCustodian = batch.manufacturer;
    if (events && events.length > 0) {
      const latestEvt = events[events.length - 1];
      if (latestEvt.toOrganization) {
        currentCustodian = latestEvt.toOrganization;
      }
    }

    // Blockchain integrity check
    const BlockchainService = require("../services/blockchainService");
    let verificationState = "UNAVAILABLE";
    let calculatedHash = "";

    if (batch.batchHash || batch.blockchainTxHash) {
      calculatedHash = BlockchainService.generateBatchHash({
        batchNumber: batch.batchNumber,
        productCode: batch.product?.productCode || "PC-FORMULARY",
        manufacturingDate: batch.manufacturingDate,
        expiryDate: batch.expiryDate,
        quantity: batch.quantity,
        manufacturerId: batch.manufacturer?._id || batch.manufacturer,
      });

      const isMatch = BlockchainService.verifyRecordIntegrity(calculatedHash, batch.batchHash || batch.blockchainTxHash);
      verificationState = isMatch ? "VERIFIED" : "MISMATCH";
    }

    // Fetch Scan History
    const Verification = require("../../models/Verification");
    const scans = await Verification.find({ batch: batch._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json({
      success: true,
      data: {
        batch: {
          ...batch,
          currentCustodian,
          currentRole: currentCustodian?.type || "MANUFACTURER",
        },
        events,
        scans,
        verification: {
          state: verificationState,
          calculatedHash,
          storedHash: batch.batchHash || batch.blockchainTxHash || null,
          network: batch.blockchainNetwork || "Sepolia Ethereum Testnet (Simulated Proof)",
          blockNumber: batch.blockNumber || null,
          transactionHash: batch.blockchainTxHash || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminBatchById:", error);
    next(error);
  }
};

/**
 * PATCH /api/admin/batches/:id/status
 * Administrative batch status management (Issue Recall, Flag Suspicious Batch, Clear Flag).
 */
const updateAdminBatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ["RECALLED", "FLAGGED", "MANUFACTURED", "ACTIVE"];
    const targetStatus = (status || "").toUpperCase();

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid administrative batch status '${targetStatus}'. Allowed: ${validStatuses.join(", ")}.`,
      });
    }

    if ((targetStatus === "RECALLED" || targetStatus === "FLAGGED") && !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A clear regulatory justification reason is required when recalling or flagging a batch.",
      });
    }

    const batch = await Batch.findById(id).populate("product").populate("manufacturer");
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    const previousStatus = batch.status;
    batch.status = targetStatus;

    if (targetStatus === "RECALLED") {
      batch.recallReason = reason.trim();
    } else if (targetStatus === "FLAGGED") {
      batch.flagReason = reason.trim();
    } else if (targetStatus === "MANUFACTURED" || targetStatus === "ACTIVE") {
      batch.recallReason = undefined;
      batch.flagReason = undefined;
    }

    await batch.save();

    // Record Supply Chain Event
    const crypto = require("crypto");
    const BlockchainService = require("../services/blockchainService");

    const eventTxHash = BlockchainService.generateSupplyChainEventHash({
      batchNumber: batch.batchNumber,
      eventType: targetStatus,
      fromOrgId: req.user.organization?._id || req.user.organization,
      toOrgId: req.user.organization?._id || req.user.organization,
      location: "Regulatory Administration Console",
      timestamp: new Date(),
      previousHash: batch.batchHash || "",
    });

    await SupplyChainEvent.create({
      batch: batch._id,
      eventType: targetStatus === "RECALLED" ? "RECALLED" : targetStatus === "FLAGGED" ? "FLAGGED" : "TRANSFERRED",
      fromOrganization: req.user.organization?._id || batch.manufacturer?._id,
      toOrganization: req.user.organization?._id || batch.manufacturer?._id,
      location: "Regulatory Oversight Division",
      user: req.user._id,
      quantity: batch.quantity,
      notes: `Regulatory Action by Admin ${req.user.name}: Batch marked as ${targetStatus}.${reason ? ` Reason: ${reason}` : ""}`,
      uniqueEventId: `EVT-${crypto.randomUUID()}`,
      transactionHash: eventTxHash,
      eventDate: new Date(),
    });

    // Record Audit Log
    const { logAuditAction } = require("../utils/auditLogger");
    await logAuditAction({
      userId: req.user._id,
      organization: req.user.organization?._id || batch.manufacturer?._id,
      action: `ADMIN_BATCH_${targetStatus}`,
      entityType: "Batch",
      entityId: batch._id,
      details: {
        batchNumber: batch.batchNumber,
        previousStatus,
        newStatus: targetStatus,
        reason,
        adminName: req.user.name,
      },
      req,
    });

    // Send Broadcast Notification
    const { createNotification } = require("../services/notificationService");
    if (targetStatus === "RECALLED" || targetStatus === "FLAGGED") {
      await createNotification({
        recipientRole: "ALL",
        type: "SUSPICIOUS_PRODUCT",
        title: `URGENT REGULATORY NOTICE: Batch #${batch.batchNumber} ${targetStatus}`,
        message: `Official Regulatory Action: Batch #${batch.batchNumber} (${batch.product?.name}) has been marked as ${targetStatus}. Reason: ${reason}`,
        relatedEntity: "Batch",
        relatedEntityId: batch._id,
      });
    }

    return res.json({
      success: true,
      message: `Batch #${batch.batchNumber} successfully updated to ${targetStatus}.`,
      data: {
        batchId: batch._id,
        status: batch.status,
      },
    });
  } catch (error) {
    console.error("Error in updateAdminBatchStatus:", error);
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  getAdminBatches,
  getAdminBatchById,
  updateAdminBatchStatus,
};

