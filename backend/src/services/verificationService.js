const Batch = require("../../models/Batch");
const Product = require("../../models/Product");
const Organization = require("../../models/Organization");
const License = require("../../models/License");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const Verification = require("../../models/Verification");
const { logAuditAction } = require("../utils/auditLogger");
const BlockchainService = require("./blockchainService");

class VerificationService {
  /**
   * Executes full 9-point pharmaceutical authenticity verification
   */
  static async verifyProductIdentifier(identifier, req = null) {
    const cleanId = (identifier || "").trim();
    if (!cleanId) {
      return {
        success: false,
        status: "NOT_FOUND",
        message: "No identifier provided.",
        checks: {},
      };
    }

    // 1. Search by qrIdentifier or batchNumber or productCode
    let batch = await Batch.findOne({
      $or: [
        { qrIdentifier: cleanId },
        { batchNumber: cleanId.toUpperCase() },
      ],
    }).populate({
      path: "product",
      populate: { path: "manufacturer" },
    }).populate("manufacturer");

    if (!batch) {
      // Record failed verification scan
      await Verification.create({
        identifier: cleanId,
        verificationType: "PRODUCT_QR_SCAN",
        status: "NOT_FOUND",
        remarks: "Product / Batch not found in registered ledger.",
        ipAddress: req ? req.headers["x-forwarded-for"] || req.socket?.remoteAddress : null,
      });

      return {
        success: true,
        verified: false,
        status: "NOT_FOUND",
        message: `No authentic record found for identifier '${cleanId}'. This medicine may be counterfeit or unregistered.`,
        checks: {
          productExists: false,
          batchExists: false,
          manufacturerVerified: false,
          licenseValid: false,
          batchNotExpired: false,
          batchNotRecalled: false,
          supplyChainConsistent: false,
          identifierValid: false,
          notFlagged: false,
        },
      };
    }

    const product = batch.product;
    const manufacturer = batch.manufacturer || (product ? product.manufacturer : null);

    // 2. Fetch Manufacturer License
    const license = manufacturer
      ? await License.findOne({ organization: manufacturer._id })
      : null;

    // 3. Fetch Supply Chain Events
    const events = await SupplyChainEvent.find({ batch: batch._id })
      .populate("fromOrganization", "name type address status")
      .populate("toOrganization", "name type address status")
      .populate("user", "name role")
      .sort({ eventDate: 1 });

    // Execute 9 Checks
    const now = new Date();
    const isProductValid = Boolean(product && product.status === "ACTIVE");
    const isBatchValid = Boolean(batch);
    const isMfgApproved = Boolean(manufacturer && manufacturer.status === "APPROVED");
    const isLicenseApproved = Boolean(
      license &&
      (license.verificationStatus === "VERIFIED" || license.verificationStatus === "APPROVED") &&
      (!license.expiryDate || new Date(license.expiryDate) > now)
    );
    const isBatchUnexpired = Boolean(batch.expiryDate && new Date(batch.expiryDate) > now);
    const isNotRecalled = batch.status !== "RECALLED";
    const isNotFlagged = batch.status !== "FLAGGED" && product.status !== "INACTIVE";
    const hasConsistentHistory = events.length > 0 && events[0].eventType === "MANUFACTURED";
    const isIdentifierValid = Boolean(batch.qrIdentifier || batch.batchNumber);

    const checks = {
      productExists: isProductValid,
      batchExists: isBatchValid,
      manufacturerVerified: isMfgApproved,
      licenseValid: isLicenseApproved,
      batchNotExpired: isBatchUnexpired,
      batchNotRecalled: isNotRecalled,
      supplyChainConsistent: hasConsistentHistory,
      identifierValid: isIdentifierValid,
      notFlagged: isNotFlagged,
    };

    // Determine Final Verification Status
    let finalStatus = "AUTHENTIC";
    let message = "This pharmaceutical product is 100% authentic and verified on the regulatory ledger.";

    if (!isNotRecalled) {
      finalStatus = "RECALLED";
      message = `WARNING: This batch has been officially RECALLED by the manufacturer/regulator. Reason: ${batch.recallReason || "Safety precaution"}. Do not dispense or consume.`;
    } else if (!isBatchUnexpired) {
      finalStatus = "EXPIRED";
      message = "WARNING: This pharmaceutical batch has PASSED ITS EXPIRY DATE. Do not consume.";
    } else if (!isMfgApproved || !isLicenseApproved || !isNotFlagged || !hasConsistentHistory) {
      finalStatus = "SUSPICIOUS";
      message = "ALERT: Suspicious product. Regulatory checks failed. Manufacturer or license is unverified, or chain-of-custody is broken.";
    }

    // Record verification event
    await Verification.create({
      batch: batch._id,
      organization: manufacturer ? manufacturer._id : null,
      identifier: cleanId,
      verificationType: "PRODUCT_QR_SCAN",
      status: finalStatus,
      remarks: message,
      ipAddress: req ? req.headers["x-forwarded-for"] || req.socket?.remoteAddress : null,
      metadata: { checks },
    });

    if (finalStatus === "SUSPICIOUS" || finalStatus === "RECALLED") {
      await logAuditAction({
        action: "PRODUCT_FLAGGED",
        entityType: "Batch",
        entityId: batch._id,
        details: { status: finalStatus, identifier: cleanId, message },
        req,
      });
    }

    return {
      success: true,
      verified: finalStatus === "AUTHENTIC",
      status: finalStatus,
      message,
      checks,
      batch: {
        id: batch._id,
        batchNumber: batch.batchNumber,
        qrIdentifier: batch.qrIdentifier,
        quantity: batch.quantity,
        unit: batch.unit,
        manufacturingDate: batch.manufacturingDate,
        expiryDate: batch.expiryDate,
        status: batch.status,
        storageRequirements: batch.storageRequirements,
        batchHash: batch.batchHash,
      },
      product: product
        ? {
            id: product._id,
            name: product.name,
            genericName: product.genericName,
            brandName: product.brandName,
            productCode: product.productCode,
            dosageForm: product.dosageForm,
            strength: product.strength,
            category: product.category,
            regulatoryApprovalNumber: product.regulatoryApprovalNumber,
            description: product.description,
            storageRequirements: product.storageRequirements,
          }
        : null,
      manufacturer: manufacturer
        ? {
            id: manufacturer._id,
            name: manufacturer.name,
            type: manufacturer.type,
            address: manufacturer.address,
            status: manufacturer.status,
            licenseNumber: license ? license.licenseNumber : null,
            licenseType: license ? license.licenseType : null,
            licenseStatus: license ? license.verificationStatus : null,
            issuingAuthority: license ? license.issuingAuthority : null,
          }
        : null,
      timeline: events.map((e) => ({
        id: e._id,
        eventType: e.eventType,
        fromOrganization: e.fromOrganization?.name || "Origin Facility",
        toOrganization: e.toOrganization?.name || "Destination Node",
        location: e.location,
        eventDate: e.eventDate,
        notes: e.notes,
        quantity: e.quantity,
        transactionHash: e.transactionHash,
      })),
      cryptographicRootHash: events.length > 0 ? events[events.length - 1].transactionHash : batch.batchHash,
    };
  }
}

module.exports = VerificationService;
