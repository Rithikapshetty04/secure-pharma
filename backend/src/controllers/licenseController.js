const License = require("../../models/License");
const Organization = require("../../models/Organization");
const Verification = require("../../models/Verification");
const User = require("../../models/User");
const { logAuditAction } = require("../utils/auditLogger");
const { createNotification } = require("../services/notificationService");
const BlockchainService = require("../services/blockchainService");

const getAllLicenses = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Auto-detect expired licenses
    const now = new Date();
    await License.updateMany(
      {
        expiryDate: { $lt: now },
        verificationStatus: { $in: ["APPROVED", "VERIFIED"] },
      },
      { verificationStatus: "EXPIRED" }
    );

    if (status) {
      if (status === "APPROVED" || status === "VERIFIED") {
        filter.verificationStatus = { $in: ["APPROVED", "VERIFIED"] };
      } else {
        filter.verificationStatus = status.toUpperCase();
      }
    }
    if (type) {
      filter.licenseType = type.toUpperCase();
    }
    if (search) {
      filter.licenseNumber = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const licenses = await License.find(filter)
      .populate("organization")
      .populate("verifiedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await License.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      licenses,
    });
  } catch (error) {
    next(error);
  }
};

const getLicenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const license = await License.findById(id)
      .populate("organization")
      .populate("verifiedBy", "name email role");

    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
      });
    }

    const verifications = await Verification.find({ license: license._id })
      .populate("verifiedBy", "name email role")
      .sort({ createdAt: -1 });

    const users = await User.find({ organization: license.organization?._id }).select("-password");

    return res.status(200).json({
      success: true,
      license,
      verifications,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const createLicense = async (req, res, next) => {
  try {
    const { organizationId, licenseNumber, licenseType, issuingAuthority, issueDate, expiryDate } = req.body;

    if (!licenseNumber || !licenseType) {
      return res.status(400).json({
        success: false,
        message: "License number and license type are required.",
      });
    }

    const normalizedLicenseNumber = licenseNumber.trim().toUpperCase();
    const existing = await License.findOne({ licenseNumber: normalizedLicenseNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `License with number '${normalizedLicenseNumber}' already exists.`,
      });
    }

    const orgId = organizationId || req.user.organization?._id || req.user.organization;
    const docPath = req.file ? req.file.path : null;
    const documentHash = docPath ? BlockchainService.generateDocumentHash(docPath) : null;

    const license = await License.create({
      organization: orgId,
      licenseNumber: normalizedLicenseNumber,
      licenseType: licenseType.toUpperCase().trim(),
      issuingAuthority: issuingAuthority || "Federal Drug Control Agency",
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      documentPath: docPath,
      documentHash,
      verificationStatus: "PENDING",
    });

    await createNotification({
      recipientRole: "REGULATOR",
      type: "LICENSE_SUBMITTED",
      title: "New Pharmaceutical License Uploaded",
      message: `License #${license.licenseNumber} submitted for verification.`,
      relatedEntity: "License",
      relatedEntityId: license._id,
    });

    await logAuditAction({
      userId: req.user._id,
      organization: orgId,
      action: "LICENSE_SUBMITTED",
      entityType: "License",
      entityId: license._id,
      details: { licenseNumber: license.licenseNumber, licenseType: license.licenseType },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "License submitted successfully",
      license,
    });
  } catch (error) {
    next(error);
  }
};

const updateLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { issuingAuthority, issueDate, expiryDate } = req.body;

    const license = await License.findById(id);
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
      });
    }

    if (issuingAuthority) license.issuingAuthority = issuingAuthority.trim();
    if (issueDate) license.issueDate = new Date(issueDate);
    if (expiryDate) license.expiryDate = new Date(expiryDate);
    if (req.file) {
      license.documentPath = req.file.path;
      license.documentHash = BlockchainService.generateDocumentHash(req.file.path);
    }

    await license.save();

    await logAuditAction({
      userId: req.user._id,
      organization: license.organization,
      action: "LICENSE_UPDATED",
      entityType: "License",
      entityId: license._id,
      details: { licenseNumber: license.licenseNumber },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "License updated successfully",
      license,
    });
  } catch (error) {
    next(error);
  }
};

const approveLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const license = await License.findById(id).populate("organization");
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
      });
    }

    license.verificationStatus = "APPROVED";
    license.verifiedBy = req.user._id;
    license.verifiedDate = new Date();
    license.rejectionReason = undefined;
    await license.save();

    if (license.organization) {
      await Organization.findByIdAndUpdate(license.organization._id, {
        status: "APPROVED",
        rejectionReason: undefined,
      });

      await User.updateMany(
        { organization: license.organization._id },
        { accountStatus: "APPROVED", rejectionReason: undefined }
      );
    }

    const verification = await Verification.create({
      license: license._id,
      organization: license.organization?._id,
      status: "APPROVED",
      verifiedBy: req.user._id,
      verificationDate: new Date(),
      remarks: remarks || "License verified and approved by regulatory authority.",
    });

    await createNotification({
      recipientOrg: license.organization?._id,
      type: "LICENSE_APPROVED",
      title: "License Approved & Verified!",
      message: `Your license #${license.licenseNumber} has been verified and approved. You now have full operational access to the platform.`,
      relatedEntity: "License",
      relatedEntityId: license._id,
    });

    await logAuditAction({
      userId: req.user._id,
      organization: license.organization?._id,
      action: "LICENSE_APPROVED",
      entityType: "License",
      entityId: license._id,
      details: {
        licenseNumber: license.licenseNumber,
        organizationName: license.organization?.name,
        remarks: verification.remarks,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "License successfully verified and approved.",
      license,
      verification,
    });
  } catch (error) {
    next(error);
  }
};

const rejectLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, remarks } = req.body;

    const rejectionReason = reason || remarks;
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is strictly required.",
      });
    }

    const license = await License.findById(id).populate("organization");
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
      });
    }

    license.verificationStatus = "REJECTED";
    license.rejectionReason = rejectionReason;
    license.verifiedBy = req.user._id;
    license.verifiedDate = new Date();
    await license.save();

    if (license.organization) {
      await Organization.findByIdAndUpdate(license.organization._id, {
        status: "REJECTED",
        rejectionReason,
      });

      await User.updateMany(
        { organization: license.organization._id },
        { accountStatus: "REJECTED", rejectionReason }
      );
    }

    const verification = await Verification.create({
      license: license._id,
      organization: license.organization?._id,
      status: "REJECTED",
      verifiedBy: req.user._id,
      verificationDate: new Date(),
      remarks: rejectionReason,
    });

    await createNotification({
      recipientOrg: license.organization?._id,
      type: "LICENSE_REJECTED",
      title: "License Application Rejected",
      message: `Your license #${license.licenseNumber} was rejected. Reason: ${rejectionReason}`,
      relatedEntity: "License",
      relatedEntityId: license._id,
    });

    await logAuditAction({
      userId: req.user._id,
      organization: license.organization?._id,
      action: "LICENSE_REJECTED",
      entityType: "License",
      entityId: license._id,
      details: {
        licenseNumber: license.licenseNumber,
        organizationName: license.organization?.name,
        reason: rejectionReason,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "License rejected.",
      license,
      verification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  approveLicense,
  rejectLicense,
};
