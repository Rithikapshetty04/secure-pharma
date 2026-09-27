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

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus
};
