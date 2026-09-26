const Batch = require("../../models/Batch");
const Product = require("../../models/Product");
const SupplyChainEvent = require("../../models/SupplyChainEvent");

/**
 * GET /api/distributor/dashboard
 * Returns real aggregate stats, recent active inventory, pending actions, and recent activity scoped to the authenticated distributor.
 */
const getDistributorDashboard = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    // 1. Fetch all supply chain events where this distributor is fromOrganization or toOrganization
    const events = await SupplyChainEvent.find({
      $or: [{ fromOrganization: distributorOrgId }, { toOrganization: distributorOrgId }],
    })
      .populate({
        path: "batch",
        populate: { path: "product", select: "name productCode dosageForm strength" },
      })
      .populate("fromOrganization", "name type address contactEmail")
      .populate("toOrganization", "name type address contactEmail")
      .populate("user", "name role email")
      .sort({ eventDate: -1 });

    // Distinct Batch IDs from events involving this distributor
    const batchIds = [...new Set(events.map((e) => (e.batch?._id || e.batch)?.toString()).filter(Boolean))];

    // 2. Fetch all batches associated with these IDs
    const batches = await Batch.find({
      _id: { $in: batchIds },
    })
      .populate({
        path: "product",
        populate: { path: "manufacturer", select: "name type status contactEmail" },
      })
      .populate("manufacturer", "name type status contactEmail address")
      .sort({ updatedAt: -1 });

    // Calculate real stats:
    // Received Batches: Events where toOrganization is distributor
    const receivedEventBatches = events.filter(
      (e) => (e.toOrganization?._id || e.toOrganization)?.toString() === distributorOrgId.toString()
    );
    const receivedBatchesCount = new Set(
      receivedEventBatches.map((e) => (e.batch?._id || e.batch)?.toString()).filter(Boolean)
    ).size;

    // Active Inventory: Batches not EXPIRED or SOLD
    const activeInventoryBatches = batches.filter(
      (b) => b.status !== "EXPIRED" && b.status !== "SOLD" && new Date(b.expiryDate) > new Date()
    );

    // Pending Transfers: Batches currently IN_TRANSIT
    const pendingTransfersCount = batches.filter((b) => b.status === "IN_TRANSIT").length;

    // Outgoing Dispatches: Events where fromOrganization is distributor
    const outgoingEvents = events.filter(
      (e) => (e.fromOrganization?._id || e.fromOrganization)?.toString() === distributorOrgId.toString()
    );

    // Pending Actions: Incoming dispatches awaiting distributor receipt
    const pendingReceiptEvents = events.filter(
      (e) =>
        (e.toOrganization?._id || e.toOrganization)?.toString() === distributorOrgId.toString() &&
        (e.eventType === "DISPATCHED" || e.eventType === "SHIPPED" || e.eventType === "TRANSFERRED")
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalReceivedBatches: receivedBatchesCount,
        activeInventoryCount: activeInventoryBatches.length,
        pendingTransfersCount: pendingTransfersCount,
        completedTransfersCount: outgoingEvents.length,
      },
      recentInventory: activeInventoryBatches.slice(0, 6),
      pendingActions: pendingReceiptEvents.slice(0, 5),
      recentActivity: events.slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/distributor/batches
 * Returns all batches associated with the authenticated distributor (received or transferred).
 */
const getDistributorBatches = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const { status, search, expiry, page = 1, limit = 50 } = req.query;

    const events = await SupplyChainEvent.find({
      $or: [{ fromOrganization: distributorOrgId }, { toOrganization: distributorOrgId }],
    }).sort({ eventDate: 1 });

    const batchIds = [...new Set(events.map((e) => (e.batch?._id || e.batch)?.toString()).filter(Boolean))];

    const filter = { _id: { $in: batchIds } };

    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    if (expiry && expiry.toUpperCase() !== "ALL") {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (expiry.toUpperCase() === "EXPIRED") {
        filter.expiryDate = { $lt: now };
      } else if (expiry.toUpperCase() === "EXPIRING_SOON") {
        filter.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
      } else if (expiry.toUpperCase() === "VALID") {
        filter.expiryDate = { $gt: thirtyDaysFromNow };
      }
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const matchingProducts = await Product.find({
        $or: [
          { name: searchRegex },
          { genericName: searchRegex },
          { productCode: searchRegex },
        ],
      }).select("_id");
      const matchingProductIds = matchingProducts.map((p) => p._id);

      filter.$or = [
        { batchNumber: searchRegex },
        { qrIdentifier: searchRegex },
        { product: { $in: matchingProductIds } },
      ];
    }

    const total = await Batch.countDocuments(filter);
    const skip = (Number(page) - 1) * Number(limit);

    const batches = await Batch.find(filter)
      .populate({
        path: "product",
        populate: { path: "manufacturer", select: "name type status contactEmail" },
      })
      .populate("manufacturer", "name type status contactEmail address")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const eventsByBatch = {};
    events.forEach((evt) => {
      const bId = (evt.batch?._id || evt.batch)?.toString();
      if (bId) {
        if (!eventsByBatch[bId]) eventsByBatch[bId] = [];
        eventsByBatch[bId].push(evt);
      }
    });

    const enrichedBatches = batches.map((batch) => {
      const batchEvents = eventsByBatch[batch._id.toString()] || [];
      const latestEvent = batchEvents[batchEvents.length - 1];

      let custodyStatus = "RECEIVED";
      if (latestEvent) {
        if (
          latestEvent.fromOrganization?.toString() === distributorOrgId.toString() &&
          latestEvent.toOrganization?.toString() !== distributorOrgId.toString() &&
          ["TRANSFERRED", "DISPATCHED", "SHIPPED", "DELIVERED"].includes(latestEvent.eventType)
        ) {
          custodyStatus = "TRANSFERRED_AWAY";
        } else if (
          latestEvent.toOrganization?.toString() === distributorOrgId.toString() &&
          latestEvent.eventType === "RECEIVED"
        ) {
          custodyStatus = "ACTIVE_INVENTORY";
        } else if (
          latestEvent.toOrganization?.toString() === distributorOrgId.toString() &&
          ["DISPATCHED", "SHIPPED", "TRANSFERRED"].includes(latestEvent.eventType)
        ) {
          custodyStatus = "PENDING_RECEIPT";
        }
      }

      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expDate = new Date(batch.expiryDate);

      return {
        ...batch.toObject(),
        custodyStatus,
        isExpired: expDate < now,
        isExpiringSoon: expDate >= now && expDate <= thirtyDays,
        lastEvent: latestEvent || null,
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      batches: enrichedBatches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/distributor/inventory
 * Returns ONLY active inventory held by the authenticated distributor (batches received and NOT transferred away).
 */
const getDistributorInventory = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const { status, search, expiry, page = 1, limit = 50 } = req.query;

    const events = await SupplyChainEvent.find({
      $or: [{ fromOrganization: distributorOrgId }, { toOrganization: distributorOrgId }],
    }).sort({ eventDate: 1 });

    const eventsByBatch = {};
    events.forEach((evt) => {
      const bId = (evt.batch?._id || evt.batch)?.toString();
      if (bId) {
        if (!eventsByBatch[bId]) eventsByBatch[bId] = [];
        eventsByBatch[bId].push(evt);
      }
    });

    const activeBatchIds = [];
    Object.keys(eventsByBatch).forEach((bId) => {
      const batchEvents = eventsByBatch[bId];
      const latestEvent = batchEvents[batchEvents.length - 1];

      if (latestEvent) {
        const isLatestToDistributor = (latestEvent.toOrganization?.toString() === distributorOrgId.toString());
        const isTransferredAway = (
          latestEvent.fromOrganization?.toString() === distributorOrgId.toString() &&
          latestEvent.toOrganization?.toString() !== distributorOrgId.toString() &&
          ["TRANSFERRED", "DISPATCHED", "SHIPPED", "DELIVERED", "SOLD"].includes(latestEvent.eventType)
        );

        if ((isLatestToDistributor || batchEvents.some(e => e.toOrganization?.toString() === distributorOrgId.toString())) && !isTransferredAway) {
          activeBatchIds.push(bId);
        }
      }
    });

    const filter = {
      _id: { $in: activeBatchIds },
      status: { $nin: ["SOLD"] },
    };

    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    if (expiry && expiry.toUpperCase() !== "ALL") {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (expiry.toUpperCase() === "EXPIRED") {
        filter.expiryDate = { $lt: now };
      } else if (expiry.toUpperCase() === "EXPIRING_SOON") {
        filter.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
      } else if (expiry.toUpperCase() === "VALID") {
        filter.expiryDate = { $gt: thirtyDaysFromNow };
      }
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const matchingProducts = await Product.find({
        $or: [
          { name: searchRegex },
          { genericName: searchRegex },
          { productCode: searchRegex },
        ],
      }).select("_id");
      const matchingProductIds = matchingProducts.map((p) => p._id);

      filter.$or = [
        { batchNumber: searchRegex },
        { qrIdentifier: searchRegex },
        { product: { $in: matchingProductIds } },
      ];
    }

    const allActiveBatches = await Batch.find(filter)
      .populate({
        path: "product",
        populate: { path: "manufacturer", select: "name type status contactEmail" },
      })
      .populate("manufacturer", "name type status contactEmail address")
      .sort({ expiryDate: 1 });

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let totalAvailableUnits = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    allActiveBatches.forEach((b) => {
      totalAvailableUnits += b.quantity || 0;
      const expDate = new Date(b.expiryDate);
      if (expDate < now) {
        expiredCount++;
      } else if (expDate <= thirtyDays) {
        expiringSoonCount++;
      }
    });

    const total = allActiveBatches.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedBatches = allActiveBatches.slice(skip, skip + Number(limit));

    const enrichedInventory = paginatedBatches.map((batch) => {
      const expDate = new Date(batch.expiryDate);
      const batchEvents = eventsByBatch[batch._id.toString()] || [];
      const latestEvent = batchEvents[batchEvents.length - 1];

      return {
        ...batch.toObject(),
        isExpired: expDate < now,
        isExpiringSoon: expDate >= now && expDate <= thirtyDays,
        receivedDate: latestEvent ? latestEvent.eventDate : batch.createdAt,
        lastEvent: latestEvent || null,
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalActiveBatches: total,
        totalAvailableUnits,
        expiringSoonCount,
        expiredCount,
      },
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      inventory: enrichedInventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/distributor/transfers
 * Returns transfers involving the authenticated distributor (Incoming dispatches, Outgoing pharmacy transfers, or Full transfer history).
 */
const getDistributorTransfers = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const { category = "ALL", search, status, page = 1, limit = 50 } = req.query;

    const filter = {
      $or: [{ fromOrganization: distributorOrgId }, { toOrganization: distributorOrgId }],
    };

    if (category.toUpperCase() === "INCOMING") {
      filter.toOrganization = distributorOrgId;
    } else if (category.toUpperCase() === "OUTGOING") {
      filter.fromOrganization = distributorOrgId;
      filter.toOrganization = { $ne: distributorOrgId };
    }

    if (status && status.toUpperCase() !== "ALL") {
      filter.eventType = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const matchingBatches = await Batch.find({
        $or: [{ batchNumber: searchRegex }, { qrIdentifier: searchRegex }],
      }).select("_id");
      const matchingBatchIds = matchingBatches.map((b) => b._id);

      filter.$and = [
        { $or: [{ fromOrganization: distributorOrgId }, { toOrganization: distributorOrgId }] },
        {
          $or: [
            { uniqueEventId: searchRegex },
            { transactionHash: searchRegex },
            { batch: { $in: matchingBatchIds } },
          ],
        },
      ];
      delete filter.$or;
    }

    const total = await SupplyChainEvent.countDocuments(filter);
    const skip = (Number(page) - 1) * Number(limit);

    const events = await SupplyChainEvent.find(filter)
      .populate({
        path: "batch",
        populate: { path: "product", select: "name productCode dosageForm strength" },
      })
      .populate("fromOrganization", "name type address contactEmail")
      .populate("toOrganization", "name type address contactEmail")
      .populate("user", "name role email")
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const allDistributorEvents = await SupplyChainEvent.find({
      $or: [{ fromOrganization: distributorOrgId }, { toOrganization: distributorOrgId }],
    });

    const pendingIncoming = allDistributorEvents.filter(
      (e) =>
        e.toOrganization?.toString() === distributorOrgId.toString() &&
        ["DISPATCHED", "SHIPPED", "TRANSFERRED"].includes(e.eventType)
    );

    const receivedIncoming = allDistributorEvents.filter(
      (e) =>
        e.toOrganization?.toString() === distributorOrgId.toString() &&
        e.eventType === "RECEIVED"
    );

    const outgoingDispatches = allDistributorEvents.filter(
      (e) =>
        e.fromOrganization?.toString() === distributorOrgId.toString() &&
        e.toOrganization?.toString() !== distributorOrgId.toString()
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalEvents: allDistributorEvents.length,
        pendingIncomingCount: pendingIncoming.length,
        receivedIncomingCount: receivedIncoming.length,
        outgoingCount: outgoingDispatches.length,
      },
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      transfers: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/distributor/transfers/receive
 * Confirms receipt of an incoming pharmaceutical shipment transferred to the authenticated distributor.
 */
const receiveDistributorBatch = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const { batchId, location, notes } = req.body;
    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "batchId is required to record batch receipt.",
      });
    }

    const batch = await Batch.findById(batchId).populate("product");
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found in supply chain registry.",
      });
    }

    if (batch.status === "RECALLED") {
      return res.status(400).json({
        success: false,
        message: "Recalled batches cannot be received or processed.",
      });
    }

    if (new Date(batch.expiryDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expired batches cannot be received into active inventory.",
      });
    }

    const lastEvent = await SupplyChainEvent.findOne({ batch: batch._id }).sort({ eventDate: -1 });
    if (!lastEvent) {
      return res.status(400).json({
        success: false,
        message: "No prior dispatch record found for this batch.",
      });
    }

    if (
      lastEvent.eventType === "RECEIVED" &&
      lastEvent.toOrganization?.toString() === distributorOrgId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Batch has already been received and confirmed by your organization.",
      });
    }

    const targetRecipient = (lastEvent.toOrganization?._id || lastEvent.toOrganization)?.toString();
    if (targetRecipient !== distributorOrgId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Authorization error: Your organization is not the intended recipient of this batch dispatch.",
      });
    }

    batch.status = "RECEIVED";
    await batch.save();

    const BlockchainService = require("../services/blockchainService");
    const { createNotification } = require("../services/notificationService");
    const { logAuditAction } = require("../utils/auditLogger");

    const previousHash = lastEvent.transactionHash || batch.batchHash || "";
    const eventTime = Date.now();

    const txHash = BlockchainService.generateSupplyChainEventHash({
      batchNumber: batch.batchNumber,
      eventType: "RECEIVED",
      fromOrgId: lastEvent.fromOrganization,
      toOrgId: distributorOrgId,
      location: location || req.user.organization?.address || "Distributor Receiving Warehouse",
      timestamp: eventTime,
      previousHash,
    });

    const blockchainRecord = await BlockchainService.recordEventOnChain({
      batchNumber: batch.batchNumber,
      eventType: "RECEIVED",
      fromOrgId: lastEvent.fromOrganization,
      toOrgId: distributorOrgId,
      location: location || req.user.organization?.address || "Distributor Receiving Warehouse",
      timestamp: eventTime,
      previousHash,
    });

    const crypto = require("crypto");
    const uniqueEventId = `EVT-${crypto.randomUUID()}`;

    const event = await SupplyChainEvent.create({
      batch: batch._id,
      eventType: "RECEIVED",
      fromOrganization: lastEvent.fromOrganization,
      toOrganization: distributorOrgId,
      location: location || req.user.organization?.address || "Distributor Receiving Warehouse",
      user: req.user._id,
      quantity: batch.quantity,
      notes: notes ? notes.trim() : `Receipt confirmed by wholesale distributor ${req.user.organization?.name || ""}.`,
      uniqueEventId,
      transactionHash: blockchainRecord?.transactionHash || txHash,
      blockNumber: blockchainRecord?.blockNumber,
      blockchainNetwork: blockchainRecord?.network || "Sepolia Ethereum Testnet (Simulated Proof)",
      eventDate: new Date(),
    });

    const populatedEvent = await SupplyChainEvent.findById(event._id)
      .populate("fromOrganization", "name type address")
      .populate("toOrganization", "name type address")
      .populate("user", "name role");

    if (lastEvent.fromOrganization) {
      await createNotification({
        recipientOrg: lastEvent.fromOrganization,
        type: "BATCH_RECEIVED",
        title: `Shipment Received: Batch #${batch.batchNumber}`,
        message: `${req.user.organization?.name || "Distributor"} confirmed receipt of Batch #${batch.batchNumber} (${batch.product?.name}).`,
        relatedEntity: "Batch",
        relatedEntityId: batch._id,
      });
    }

    await logAuditAction({
      userId: req.user._id,
      organization: distributorOrgId,
      action: "DISTRIBUTOR_BATCH_RECEIVED",
      entityType: "SupplyChainEvent",
      entityId: event._id,
      details: {
        batchNumber: batch.batchNumber,
        uniqueEventId,
        transactionHash: blockchainRecord?.transactionHash || txHash,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Batch #${batch.batchNumber} receipt successfully confirmed and cryptographically logged on ledger.`,
      event: populatedEvent,
      batchStatus: batch.status,
      blockchainRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/distributor/transfers/dispatch
 * Initiates a custody transfer from the authenticated distributor to an approved Pharmacy.
 */
const dispatchDistributorBatch = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const { batchId, toOrganizationId, quantity, location, notes } = req.body;

    if (!batchId || !toOrganizationId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "batchId, toOrganizationId, and quantity are required.",
      });
    }

    const batch = await Batch.findById(batchId).populate("product");
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found in supply chain registry.",
      });
    }

    if (batch.status === "RECALLED") {
      return res.status(400).json({
        success: false,
        message: "Recalled batches cannot be transferred.",
      });
    }

    if (new Date(batch.expiryDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expired batches cannot be transferred to pharmacies.",
      });
    }

    const lastEvent = await SupplyChainEvent.findOne({ batch: batch._id }).sort({ eventDate: -1 });
    if (!lastEvent) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: No supply chain record exists for this batch.",
      });
    }

    const isCurrentCustodian =
      (lastEvent.toOrganization?.toString() === distributorOrgId.toString() && lastEvent.eventType === "RECEIVED") ||
      (lastEvent.toOrganization?.toString() === distributorOrgId.toString() && lastEvent.eventType === "TRANSFERRED");

    const isAlreadyTransferredAway =
      lastEvent.fromOrganization?.toString() === distributorOrgId.toString() &&
      lastEvent.toOrganization?.toString() !== distributorOrgId.toString() &&
      ["TRANSFERRED", "DISPATCHED", "SHIPPED", "DELIVERED"].includes(lastEvent.eventType);

    if (isAlreadyTransferredAway) {
      return res.status(400).json({
        success: false,
        message: "This batch lot has already been transferred away from your inventory.",
      });
    }

    if (!isCurrentCustodian) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not currently hold custody of this batch in your active warehouse inventory.",
      });
    }

    const Organization = require("../../models/Organization");
    const targetPharmacy = await Organization.findById(toOrganizationId);
    if (!targetPharmacy || targetPharmacy.type !== "PHARMACY") {
      return res.status(400).json({
        success: false,
        message: "Target recipient must be a certified Pharmacy organization.",
      });
    }

    if (targetPharmacy.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Target pharmacy organization is not currently approved on the ledger.",
      });
    }

    const transferQty = Number(quantity);
    if (isNaN(transferQty) || transferQty <= 0 || transferQty > batch.quantity) {
      return res.status(400).json({
        success: false,
        message: `Transfer quantity must be between 1 and available warehouse volume (${batch.quantity}).`,
      });
    }

    batch.status = "IN_TRANSIT";
    await batch.save();

    const BlockchainService = require("../services/blockchainService");
    const { createNotification } = require("../services/notificationService");
    const { logAuditAction } = require("../utils/auditLogger");
    const crypto = require("crypto");

    const previousHash = lastEvent.transactionHash || batch.batchHash || "";
    const eventTime = Date.now();

    const txHash = BlockchainService.generateSupplyChainEventHash({
      batchNumber: batch.batchNumber,
      eventType: "TRANSFERRED",
      fromOrgId: distributorOrgId,
      toOrgId: targetPharmacy._id,
      location: location || req.user.organization?.address || "Distributor Logistics Transfer Bay",
      timestamp: eventTime,
      previousHash,
    });

    const blockchainRecord = await BlockchainService.recordEventOnChain({
      batchNumber: batch.batchNumber,
      eventType: "TRANSFERRED",
      fromOrgId: distributorOrgId,
      toOrgId: targetPharmacy._id,
      location: location || req.user.organization?.address || "Distributor Logistics Transfer Bay",
      timestamp: eventTime,
      previousHash,
    });

    const uniqueEventId = `EVT-${crypto.randomUUID()}`;

    const event = await SupplyChainEvent.create({
      batch: batch._id,
      eventType: "TRANSFERRED",
      fromOrganization: distributorOrgId,
      toOrganization: targetPharmacy._id,
      location: location || req.user.organization?.address || "Distributor Logistics Transfer Bay",
      user: req.user._id,
      quantity: transferQty,
      notes: notes ? notes.trim() : `Wholesale distribution delivery dispatched to pharmacy ${targetPharmacy.name}.`,
      uniqueEventId,
      transactionHash: blockchainRecord?.transactionHash || txHash,
      blockNumber: blockchainRecord?.blockNumber,
      blockchainNetwork: blockchainRecord?.network || "Sepolia Ethereum Testnet (Simulated Proof)",
      eventDate: new Date(),
    });

    const populatedEvent = await SupplyChainEvent.findById(event._id)
      .populate("fromOrganization", "name type address")
      .populate("toOrganization", "name type address")
      .populate("user", "name role");

    await createNotification({
      recipientOrg: targetPharmacy._id,
      type: "BATCH_TRANSFERRED",
      title: `Pharmacy Dispatch Notice: Batch #${batch.batchNumber}`,
      message: `Distributor ${req.user.organization?.name || ""} dispatched Batch #${batch.batchNumber} (${batch.product?.name}) to your dispensary.`,
      relatedEntity: "Batch",
      relatedEntityId: batch._id,
    });

    await logAuditAction({
      userId: req.user._id,
      organization: distributorOrgId,
      action: "DISTRIBUTOR_BATCH_DISPATCHED",
      entityType: "SupplyChainEvent",
      entityId: event._id,
      details: {
        batchNumber: batch.batchNumber,
        toOrganization: targetPharmacy._id,
        quantity: transferQty,
        uniqueEventId,
        transactionHash: blockchainRecord?.transactionHash || txHash,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Transfer to pharmacy ${targetPharmacy.name} successfully executed and recorded on ledger.`,
      event: populatedEvent,
      batchStatus: batch.status,
      blockchainRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/distributor/orders
 * Returns real pharmacy purchase orders assigned to or intended for the authenticated distributor.
 */
const getDistributorOrders = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const Order = require("../../models/Order");
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = {
      $or: [{ distributor: distributorOrgId }, { distributor: null }, { distributor: { $exists: false } }],
    };

    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const searchConditions = [
        { orderId: searchRegex },
        { pharmacyName: searchRegex },
        { "items.productName": searchRegex },
        { "items.batchNumber": searchRegex },
      ];

      filter.$and = [
        { $or: [{ distributor: distributorOrgId }, { distributor: null }, { distributor: { $exists: false } }] },
        { $or: searchConditions },
      ];
      delete filter.$or;
    }

    const skip = (Number(page) - 1) * Number(limit);

    let orders = await Order.find(filter)
      .populate("pharmacy", "name type address contactEmail")
      .populate("distributor", "name type address contactEmail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    // Aggregate Order Statistics
    const allDistributorOrders = await Order.find({
      $or: [{ distributor: distributorOrgId }, { distributor: null }],
    });

    let pendingCount = 0;
    let confirmedCount = 0;
    let shippedCount = 0;
    let totalValue = 0;

    allDistributorOrders.forEach((o) => {
      totalValue += o.totalAmount || 0;
      if (o.status === "PENDING") pendingCount++;
      if (o.status === "CONFIRMED" || o.status === "PROCESSING") confirmedCount++;
      if (o.status === "SHIPPED" || o.status === "DELIVERED" || o.status === "COMPLETED") shippedCount++;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders: allDistributorOrders.length,
        pendingCount,
        confirmedCount,
        shippedCount,
        totalValue,
      },
      total: orders.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(orders.length / Number(limit)) || 1,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/distributor/orders/:orderId
 * Returns order details with IDOR protection for the authenticated distributor.
 */
const getDistributorOrderById = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const Order = require("../../models/Order");
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ orderId: orderId.toUpperCase() }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }],
    })
      .populate("pharmacy", "name type address contactEmail")
      .populate("distributor", "name type address contactEmail")
      .populate({
        path: "items.batch",
        populate: { path: "product" },
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy purchase order not found.",
      });
    }

    // IDOR Protection: Distributor must be associated or order must be unassigned
    if (
      order.distributor &&
      order.distributor._id?.toString() !== distributorOrgId.toString() &&
      order.distributor.toString() !== distributorOrgId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not have authorization to view this pharmacy order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/distributor/orders/:orderId/status
 * Updates order status (CONFIRMED, PROCESSING, SHIPPED, REJECTED, CANCELLED) with server-side validation.
 */
const updateDistributorOrderStatus = async (req, res, next) => {
  try {
    const distributorOrgId = req.user.organization?._id || req.user.organization;
    if (!distributorOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Distributor organization.",
      });
    }

    const Order = require("../../models/Order");
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = [
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
    ];

    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const normalizedStatus = status.toUpperCase();

    const order = await Order.findOne({
      $or: [{ orderId: orderId.toUpperCase() }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy purchase order not found.",
      });
    }

    // IDOR Check
    if (
      order.distributor &&
      order.distributor.toString() !== distributorOrgId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not have authorization to modify this order.",
      });
    }

    if (order.status === "DELIVERED" || order.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Order has already been completed or delivered and cannot be altered.",
      });
    }

    order.distributor = distributorOrgId;
    order.distributorName = req.user.organization?.name || "Wholesale Distributor";
    order.status = normalizedStatus;
    if (notes) order.notes = notes.trim();

    await order.save();

    const { createNotification } = require("../services/notificationService");
    const { logAuditAction } = require("../utils/auditLogger");

    if (order.pharmacy) {
      await createNotification({
        recipientOrg: order.pharmacy,
        type: "ORDER_CREATED",
        title: `Order #${order.orderId} Status Updated`,
        message: `Distributor ${req.user.organization?.name || ""} updated Order #${order.orderId} status to '${normalizedStatus}'.`,
        relatedEntity: "Order",
        relatedEntityId: order._id,
      });
    }

    await logAuditAction({
      userId: req.user._id,
      organization: distributorOrgId,
      action: `DISTRIBUTOR_ORDER_${normalizedStatus}`,
      entityType: "Order",
      entityId: order._id,
      details: { orderId: order.orderId, status: normalizedStatus },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderId} status updated to ${normalizedStatus}.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDistributorDashboard,
  getDistributorBatches,
  getDistributorInventory,
  getDistributorTransfers,
  receiveDistributorBatch,
  dispatchDistributorBatch,
  getDistributorOrders,
  getDistributorOrderById,
  updateDistributorOrderStatus,
};



