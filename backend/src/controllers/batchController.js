const crypto = require("crypto");
const Batch = require("../../models/Batch");
const Product = require("../../models/Product");
const Organization = require("../../models/Organization");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const { logAuditAction } = require("../utils/auditLogger");
const { createNotification } = require("../services/notificationService");
const BlockchainService = require("../services/blockchainService");

const getAllBatches = async (req, res, next) => {
  try {
    const { status, productId, manufacturerId, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }
    if (productId) {
      filter.product = productId;
    }
    if (manufacturerId) {
      filter.manufacturer = manufacturerId;
    }
    if (search) {
      filter.$or = [
        { batchNumber: { $regex: search, $options: "i" } },
        { qrIdentifier: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const batches = await Batch.find(filter)
      .populate({
        path: "product",
        populate: { path: "manufacturer", select: "name type status contactEmail" },
      })
      .populate("manufacturer", "name type status contactEmail address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Batch.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      batches,
    });
  } catch (error) {
    next(error);
  }
};

const getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id)
      .populate({
        path: "product",
        populate: { path: "manufacturer", select: "name type address status contactEmail" },
      })
      .populate("manufacturer", "name type address status contactEmail");

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const events = await SupplyChainEvent.find({ batch: batch._id })
      .populate("fromOrganization", "name type address")
      .populate("toOrganization", "name type address")
      .populate("user", "name role")
      .sort({ eventDate: 1 });

    return res.status(200).json({
      success: true,
      batch,
      events,
    });
  } catch (error) {
    next(error);
  }
};

const createBatch = async (req, res, next) => {
  try {
    const {
      productId,
      batchNumber,
      manufacturingDate,
      expiryDate,
      quantity,
      unit,
      storageRequirements,
      location,
    } = req.body;

    if (!productId || !batchNumber || !expiryDate || !quantity) {
      return res.status(400).json({
        success: false,
        message: "productId, batchNumber, expiryDate, and quantity are required.",
      });
    }

    const normalizedBatchNumber = batchNumber.trim().toUpperCase();
    const existing = await Batch.findOne({ batchNumber: normalizedBatchNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Batch with number '${normalizedBatchNumber}' already exists in ledger.`,
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Pharmaceutical formulary product not found.",
      });
    }

    const mfgOrgId = req.user.organization?._id || req.user.organization;

    // Check ownership unless Admin
    const isSuperAdminOrRegulator = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN" || req.user.role === "REGULATOR";
    if (!isSuperAdminOrRegulator && product.manufacturer.toString() !== mfgOrgId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only mint batches for products registered to your organization.",
      });
    }

    // Generate unique secure QR identifier (UUID based)
    const qrIdentifier = `SP-${crypto.randomUUID()}`;

    // Cryptographic Batch Hash
    const mfgDate = manufacturingDate ? new Date(manufacturingDate) : new Date();
    const expDate = new Date(expiryDate);
    const batchHash = BlockchainService.generateBatchHash({
      batchNumber: normalizedBatchNumber,
      productCode: product.productCode,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      quantity: Number(quantity),
      manufacturerId: mfgOrgId,
    });

    const batch = await Batch.create({
      batchNumber: normalizedBatchNumber,
      product: product._id,
      manufacturer: mfgOrgId,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      quantity: Number(quantity),
      unit: unit || "Units",
      storageRequirements: storageRequirements || product.storageRequirements,
      status: "MANUFACTURED",
      qrIdentifier,
      batchHash,
    });

    // Create Initial MANUFACTURED SupplyChainEvent
    const initialTxHash = BlockchainService.generateSupplyChainEventHash({
      batchNumber: normalizedBatchNumber,
      eventType: "MANUFACTURED",
      fromOrgId: mfgOrgId,
      toOrgId: mfgOrgId,
      location: location || req.user.organization?.address || "Primary Manufacturing Cleanroom",
      timestamp: mfgDate,
      previousHash: batchHash,
    });

    const event = await SupplyChainEvent.create({
      batch: batch._id,
      eventType: "MANUFACTURED",
      fromOrganization: mfgOrgId,
      toOrganization: mfgOrgId,
      location: location || req.user.organization?.address || "Primary Manufacturing Cleanroom",
      user: req.user._id,
      quantity: batch.quantity,
      notes: "Production batch manufactured and cryptographically sealed on Secure Pharma ledger.",
      uniqueEventId: `EVT-${crypto.randomUUID()}`,
      transactionHash: initialTxHash,
      eventDate: mfgDate,
    });

    await createNotification({
      recipientRole: "REGULATOR",
      type: "BATCH_TRANSFERRED",
      title: "New Pharmaceutical Batch Minted",
      message: `Batch #${batch.batchNumber} (${product.name}) minted by ${req.user.organization?.name || "Manufacturer"}.`,
      relatedEntity: "Batch",
      relatedEntityId: batch._id,
    });

    await logAuditAction({
      userId: req.user._id,
      organization: mfgOrgId,
      action: "BATCH_CREATED",
      entityType: "Batch",
      entityId: batch._id,
      details: {
        batchNumber: batch.batchNumber,
        productCode: product.productCode,
        quantity: batch.quantity,
        qrIdentifier,
        batchHash,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Batch successfully minted, hashed, and registered with initial provenance checkpoint.",
      batch,
      event,
    });
  } catch (error) {
    next(error);
  }
};

const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { storageRequirements, quantity, unit } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    if (storageRequirements !== undefined) batch.storageRequirements = storageRequirements.trim();
    if (quantity !== undefined) batch.quantity = Number(quantity);
    if (unit !== undefined) batch.unit = unit.trim();

    await batch.save();

    await logAuditAction({
      userId: req.user._id,
      organization: batch.manufacturer,
      action: "BATCH_UPDATED",
      entityType: "Batch",
      entityId: batch._id,
      details: { batchNumber: batch.batchNumber },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch,
    });
  } catch (error) {
    next(error);
  }
};

const updateBatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = [
      "CREATED",
      "MANUFACTURED",
      "IN_TRANSIT",
      "RECEIVED",
      "DISTRIBUTED",
      "SOLD",
      "EXPIRED",
      "RECALLED",
      "FLAGGED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const batch = await Batch.findById(id).populate("product");
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    batch.status = status;
    if (status === "RECALLED") {
      batch.recallReason = reason || "Regulatory recall order";
    } else if (status === "FLAGGED") {
      batch.flagReason = reason || "Suspicious supply chain anomaly detected";
    }
    await batch.save();

    // Create Audit & Notification
    if (status === "RECALLED" || status === "FLAGGED") {
      await createNotification({
        recipientRole: "ALL",
        type: "SUSPICIOUS_PRODUCT",
        title: `URGENT: Batch #${batch.batchNumber} has been ${status}`,
        message: `Batch #${batch.batchNumber} (${batch.product?.name}) marked as ${status}. Reason: ${reason || "Oversight notice"}`,
        relatedEntity: "Batch",
        relatedEntityId: batch._id,
      });
    }

    await logAuditAction({
      userId: req.user._id,
      organization: req.user.organization?._id,
      action: `BATCH_${status}`,
      entityType: "Batch",
      entityId: batch._id,
      details: { batchNumber: batch.batchNumber, status, reason },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Batch #${batch.batchNumber} status updated to ${status}`,
      batch,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  updateBatchStatus,
};
