const crypto = require("crypto");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const Batch = require("../../models/Batch");
const Product = require("../../models/Product");
const Organization = require("../../models/Organization");
const { logAuditAction } = require("../utils/auditLogger");
const { createNotification } = require("../services/notificationService");
const BlockchainService = require("../services/blockchainService");

const getAllEvents = async (req, res, next) => {
  try {
    const { batchId, eventType, fromOrgId, toOrgId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Manufacturer organization scope
    if (req.user.role === "MANUFACTURER") {
      const mfgOrgId = req.user.organization?._id || req.user.organization;
      if (mfgOrgId) {
        filter.$or = [{ fromOrganization: mfgOrgId }, { toOrganization: mfgOrgId }];
      }
    } else {
      if (fromOrgId) filter.fromOrganization = fromOrgId;
      if (toOrgId) filter.toOrganization = toOrgId;
    }

    if (batchId) filter.batch = batchId;
    if (eventType) filter.eventType = eventType.toUpperCase();

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const matchingBatches = await Batch.find({
        $or: [{ batchNumber: searchRegex }, { qrIdentifier: searchRegex }],
      }).select("_id");
      const matchingBatchIds = matchingBatches.map((b) => b._id);

      const searchFilter = {
        $or: [
          { uniqueEventId: searchRegex },
          { transactionHash: searchRegex },
          { batch: { $in: matchingBatchIds } },
        ],
      };

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, searchFilter];
        delete filter.$or;
      } else {
        filter.$or = searchFilter.$or;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const events = await SupplyChainEvent.find(filter)
      .populate({
        path: "batch",
        populate: { path: "product", select: "name productCode dosageForm strength" },
      })
      .populate("fromOrganization", "name type address")
      .populate("toOrganization", "name type address")
      .populate("user", "name role email")
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SupplyChainEvent.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      events,
    });
  } catch (error) {
    next(error);
  }
};

const getBatchEventsTimeline = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    // Search by ObjectId or batchNumber
    let batch = null;
    if (batchId.match(/^[0-9a-fA-F]{24}$/)) {
      batch = await Batch.findById(batchId)
        .populate("product")
        .populate("manufacturer");
    } else {
      batch = await Batch.findOne({
        $or: [
          { batchNumber: batchId.toUpperCase() },
          { qrIdentifier: batchId },
        ],
      })
        .populate("product")
        .populate("manufacturer");
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const events = await SupplyChainEvent.find({ batch: batch._id })
      .populate("fromOrganization", "name type address contactEmail")
      .populate("toOrganization", "name type address contactEmail")
      .populate("user", "name role email")
      .sort({ eventDate: 1 });

    return res.status(200).json({
      success: true,
      batch,
      events,
      totalCheckpoints: events.length,
    });
  } catch (error) {
    next(error);
  }
};

const recordEvent = async (req, res, next) => {
  try {
    const {
      batchId,
      batchNumber,
      eventType,
      toOrganizationId,
      location,
      quantity,
      notes,
    } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "eventType is required (MANUFACTURED, DISPATCHED, RECEIVED, TRANSFERRED, DELIVERED, SOLD, RETURNED, RECALLED, FLAGGED).",
      });
    }

    const normalizedEventType = eventType.toUpperCase().trim();

    let batch = null;
    if (batchId) {
      batch = await Batch.findById(batchId).populate("product");
    } else if (batchNumber) {
      batch = await Batch.findOne({ batchNumber: batchNumber.trim().toUpperCase() }).populate("product");
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found in supply chain registry.",
      });
    }

    const fromOrgId = req.user.organization?._id || req.user.organization;

    // Role Custody & Ownership Authorization Check for Manufacturers
    if (req.user.role === "MANUFACTURER") {
      const batchMfgId = (batch.manufacturer?._id || batch.manufacturer || "").toString();
      const userOrgId = (fromOrgId || "").toString();

      if (userOrgId && batchMfgId && userOrgId !== batchMfgId) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: You do not have custody of this batch.",
        });
      }
    }

    // Status Validation: Recalled or Expired batches cannot be transferred
    if (batch.status === "RECALLED") {
      return res.status(400).json({
        success: false,
        message: "Batch has been recalled and cannot be transferred into the supply chain.",
      });
    }

    if (new Date(batch.expiryDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Batch has expired and cannot be transferred into the supply chain.",
      });
    }

    // Recipient Distributor Validation
    let destOrgId = fromOrgId;
    if (toOrganizationId) {
      const targetOrg = await Organization.findById(toOrganizationId);
      if (!targetOrg) {
        return res.status(400).json({
          success: false,
          message: "Selected recipient organization not found.",
        });
      }

      if (targetOrg.type !== "DISTRIBUTOR" && targetOrg.type !== "PHARMACY") {
        return res.status(400).json({
          success: false,
          message: "Selected recipient must be a certified Distributor or Pharmacy organization.",
        });
      }
      destOrgId = targetOrg._id;
    }

    // Quantity Validation
    const transferQty = quantity ? Number(quantity) : batch.quantity;
    if (isNaN(transferQty) || transferQty <= 0 || transferQty > batch.quantity) {
      return res.status(400).json({
        success: false,
        message: `Transfer quantity must be between 1 and total available volume (${batch.quantity}).`,
      });
    }

    // Update batch status based on event
    if (normalizedEventType === "DISPATCHED" || normalizedEventType === "SHIPPED" || normalizedEventType === "TRANSFERRED") {
      batch.status = "IN_TRANSIT";
    } else if (normalizedEventType === "RECEIVED") {
      batch.status = "RECEIVED";
    } else if (normalizedEventType === "DELIVERED") {
      batch.status = "DELIVERED";
    } else if (normalizedEventType === "SOLD") {
      batch.status = "SOLD";
    } else if (normalizedEventType === "RECALLED") {
      batch.status = "RECALLED";
    } else if (normalizedEventType === "FLAGGED") {
      batch.status = "FLAGGED";
    }
    await batch.save();

    // Fetch previous event for cryptographic chain linking
    const lastEvent = await SupplyChainEvent.findOne({ batch: batch._id }).sort({ eventDate: -1 });
    const previousHash = lastEvent ? lastEvent.transactionHash : batch.batchHash || "";

    const txHash = BlockchainService.generateSupplyChainEventHash({
      batchNumber: batch.batchNumber,
      eventType: normalizedEventType,
      fromOrgId,
      toOrgId: destOrgId,
      location: location || req.user.organization?.address || "Supply Chain Logistics Node",
      timestamp: Date.now(),
      previousHash,
    });

    const blockchainRecord = await BlockchainService.recordEventOnChain({
      batchNumber: batch.batchNumber,
      eventType: normalizedEventType,
      fromOrgId,
      toOrgId: destOrgId,
      location: location || req.user.organization?.address || "Supply Chain Logistics Node",
      timestamp: Date.now(),
      previousHash,
    });

    const uniqueEventId = `EVT-${crypto.randomUUID()}`;

    const event = await SupplyChainEvent.create({
      batch: batch._id,
      eventType: normalizedEventType,
      fromOrganization: fromOrgId,
      toOrganization: destOrgId,
      location: location || req.user.organization?.address || "Supply Chain Logistics Node",
      user: req.user._id,
      quantity: transferQty,
      notes: notes ? notes.trim() : `Custody transfer '${normalizedEventType}' logged on ledger.`,
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

    // Notification to destination org
    if (destOrgId && destOrgId.toString() !== fromOrgId?.toString()) {
      await createNotification({
        recipientOrg: destOrgId,
        type: normalizedEventType === "DISPATCHED" ? "BATCH_TRANSFERRED" : "BATCH_RECEIVED",
        title: `Supply Chain Notice: Batch #${batch.batchNumber}`,
        message: `${req.user.organization?.name || "Manufacturer"} transferred custody for Batch #${batch.batchNumber} (${batch.product?.name}).`,
        relatedEntity: "Batch",
        relatedEntityId: batch._id,
      });
    }

    await logAuditAction({
      userId: req.user._id,
      organization: fromOrgId,
      action: `SUPPLY_CHAIN_${normalizedEventType}`,
      entityType: "SupplyChainEvent",
      entityId: event._id,
      details: {
        batchNumber: batch.batchNumber,
        eventType: normalizedEventType,
        uniqueEventId,
        transactionHash: blockchainRecord?.transactionHash || txHash,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Supply chain event '${normalizedEventType}' logged and cryptographically anchored on ledger.`,
      event: populatedEvent,
      batchStatus: batch.status,
      blockchainRecord,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getBatchEventsTimeline,
  recordEvent,
};
