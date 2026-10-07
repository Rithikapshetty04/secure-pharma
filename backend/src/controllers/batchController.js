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
    const { status, productId, manufacturerId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Enforce Role Scope
    if (req.user.role === "MANUFACTURER") {
      const mfgOrgId = req.user.organization?._id || req.user.organization;
      if (mfgOrgId) {
        filter.manufacturer = mfgOrgId;
      }
    } else if (req.user.role === "DISTRIBUTOR") {
      const distOrgId = req.user.organization?._id || req.user.organization;
      if (distOrgId) {
        const events = await SupplyChainEvent.find({
          $or: [{ fromOrganization: distOrgId }, { toOrganization: distOrgId }],
        }).select("batch");
        const batchIds = [...new Set(events.map((e) => e.batch?.toString()).filter(Boolean))];
        filter._id = { $in: batchIds };
      }
    } else if (manufacturerId) {
      filter.manufacturer = manufacturerId;
    }

    if (status && typeof status === "string") {
      filter.status = status.toUpperCase();
    }
    if (productId && typeof productId === "string" && /^[0-9a-fA-F]{24}$/.test(productId)) {
      filter.product = productId;
    }

    if (search && typeof search === "string" && search.trim()) {
      const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = { $regex: cleanSearch, $options: "i" };

      // Search matching products by name or code
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
    let batch = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      batch = await Batch.findById(id)
        .populate({
          path: "product",
          populate: { path: "manufacturer", select: "name type address status contactEmail" },
        })
        .populate("manufacturer", "name type address status contactEmail")
        .populate("currentHolder", "name type address status contactEmail");
    }
    if (!batch) {
      batch = await Batch.findOne({ batchNumber: id.trim().toUpperCase() })
        .populate({
          path: "product",
          populate: { path: "manufacturer", select: "name type address status contactEmail" },
        })
        .populate("manufacturer", "name type address status contactEmail")
        .populate("currentHolder", "name type address status contactEmail");
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Pharmaceutical batch not found in ledger.",
      });
    }

    // Role Ownership / Authorization Check (IDOR Prevention)
    if (req.user.role === "MANUFACTURER") {
      const userOrgId = (req.user.organization?._id || req.user.organization || "").toString();
      const batchMfgId = (batch.manufacturer?._id || batch.manufacturer || "").toString();
      if (userOrgId && batchMfgId && userOrgId !== batchMfgId) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: You do not have authorization to view this batch.",
        });
      }
    } else if (req.user.role === "DISTRIBUTOR") {
      const distOrgId = (req.user.organization?._id || req.user.organization || "").toString();
      const hasAccess = await SupplyChainEvent.exists({
        batch: batch._id,
        $or: [{ fromOrganization: distOrgId }, { toOrganization: distOrgId }],
      });
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: You do not have authorization to view this batch.",
        });
      }
    } else if (req.user.role === "PHARMACY") {
      const pharmOrgId = (req.user.organization?._id || req.user.organization || "").toString();
      const isHolder = (batch.currentHolder?._id || batch.currentHolder || "").toString() === pharmOrgId;
      const hasAccess = await SupplyChainEvent.exists({
        batch: batch._id,
        $or: [{ fromOrganization: pharmOrgId }, { toOrganization: pharmOrgId }],
      });
      if (!isHolder && !hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: You do not have authorization to view this batch.",
        });
      }
    }

    const events = await SupplyChainEvent.find({ batch: batch._id })
      .populate("fromOrganization", "name type address")
      .populate("toOrganization", "name type address")
      .populate("user", "name role")
      .sort({ eventDate: 1 });

    // Derive current custodian from latest event or batch currentHolder/manufacturer
    let currentCustodian = batch.currentHolder || batch.manufacturer;
    if (events && events.length > 0) {
      const latestEvent = events[events.length - 1];
      if (latestEvent.toOrganization) {
        currentCustodian = latestEvent.toOrganization;
      }
    }

    // Cryptographic verification check
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

    return res.status(200).json({
      success: true,
      batch,
      events,
      currentCustodian,
      verification: {
        state: verificationState,
        calculatedHash,
        storedHash: batch.batchHash || batch.blockchainTxHash || null,
        network: batch.blockchainNetwork || null,
        blockNumber: batch.blockNumber || null,
      },
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

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
      return res.status(400).json({
        success: false,
        message: "Batch quantity must be a positive integer.",
      });
    }

    const expDate = new Date(expiryDate);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be a valid future date.",
      });
    }

    const normalizedBatchNumber = String(batchNumber).trim().toUpperCase();
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
    const batchHash = BlockchainService.generateBatchHash({
      batchNumber: normalizedBatchNumber,
      productCode: product.productCode,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      quantity: Number(quantity),
      manufacturerId: mfgOrgId,
    });

    // Record on-chain registration proof
    const blockchainRecord = await BlockchainService.recordBatchOnChain({
      batchNumber: normalizedBatchNumber,
      productCode: product.productCode,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      quantity: Number(quantity),
      manufacturerId: mfgOrgId,
      manufacturerOrgName: req.user.organization?.name || "Manufacturer",
      location: location || req.user.organization?.address || "Primary Manufacturing Cleanroom",
      batchHash,
    });

    const batch = await Batch.create({
      batchNumber: normalizedBatchNumber,
      product: product._id,
      manufacturer: mfgOrgId,
      currentHolder: mfgOrgId,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      quantity: Number(quantity),
      unit: unit || "Units",
      storageRequirements: storageRequirements || product.storageRequirements,
      status: "MANUFACTURED",
      qrIdentifier,
      batchHash,
      blockchainTxHash: blockchainRecord?.transactionHash || null,
      blockNumber: blockchainRecord?.blockNumber || null,
      blockchainNetwork: blockchainRecord?.network || null,
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
      transactionHash: blockchainRecord?.transactionHash || initialTxHash,
      blockNumber: blockchainRecord?.blockNumber || null,
      blockchainNetwork: blockchainRecord?.network || null,
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
      blockchainRecord,
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

    // Role & Ownership Access Control (IDOR Prevention)
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "REGULATOR"].includes(req.user.role);
    const mfgOrgId = (req.user.organization?._id || req.user.organization || "").toString();
    const batchMfgId = (batch.manufacturer?._id || batch.manufacturer || "").toString();

    if (!isAdmin && (!mfgOrgId || mfgOrgId !== batchMfgId)) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not have authorization to modify this batch.",
      });
    }

    // Custody Lock: Batches transferred downstream cannot have specifications altered
    if (["IN_TRANSIT", "RECEIVED", "DISTRIBUTED", "SOLD", "RECALLED"].includes(batch.status) && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Batch cannot be modified because it is currently in '${batch.status}' status in the supply chain.`,
      });
    }

    if (storageRequirements !== undefined) batch.storageRequirements = String(storageRequirements).trim();
    if (quantity !== undefined) {
      const parsedQty = Number(quantity);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        return res.status(400).json({ success: false, message: "Quantity must be a positive number." });
      }
      batch.quantity = parsedQty;
    }
    if (unit !== undefined) batch.unit = String(unit).trim();

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

    const normalizedStatus = String(status).toUpperCase().trim();

    if (!validStatuses.includes(normalizedStatus)) {
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

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "REGULATOR"].includes(req.user.role);
    const userOrgId = (req.user.organization?._id || req.user.organization || "").toString();
    const batchMfgId = (batch.manufacturer?._id || batch.manufacturer || "").toString();
    const currentHolderId = (batch.currentHolder?._id || batch.currentHolder || "").toString();

    // Authority rules:
    // Only Admin / Regulator or the creator Manufacturer can RECALL or FLAG a batch
    if (["RECALLED", "FLAGGED"].includes(normalizedStatus) && !isAdmin) {
      if (req.user.role !== "MANUFACTURER" || userOrgId !== batchMfgId) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden: Only authorized regulators or the manufacturing organization can recall or flag batches.",
        });
      }
    }

    // Only current custodian, creator manufacturer, or admin can update status
    const isCurrentHolder = Boolean(userOrgId && currentHolderId && userOrgId === currentHolderId);
    const isMfgOwner = Boolean(userOrgId && batchMfgId && userOrgId === batchMfgId);

    if (!isAdmin && !isCurrentHolder && !isMfgOwner) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not currently hold custody or ownership of this batch.",
      });
    }

    batch.status = normalizedStatus;
    if (normalizedStatus === "RECALLED") {
      batch.recallReason = reason ? String(reason).trim() : "Regulatory recall order";
    } else if (normalizedStatus === "FLAGGED") {
      batch.flagReason = reason ? String(reason).trim() : "Suspicious supply chain anomaly detected";
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
