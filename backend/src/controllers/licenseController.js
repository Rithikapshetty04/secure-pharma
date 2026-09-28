const path = require("path");
const fs = require("fs");
const License = require("../../models/License");
const Organization = require("../../models/Organization");
const Verification = require("../../models/Verification");
const User = require("../../models/User");
const { logAuditAction } = require("../utils/auditLogger");
const { createNotification } = require("../services/notificationService");
const BlockchainService = require("../services/blockchainService");

const getAllLicenses = async (req, res, next) => {
  try {
    const { status, type, role, expiry, search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Auto-detect expired licenses
    const now = new Date();
    await License.updateMany(
      {
        expiryDate: { $lt: now },
        verificationStatus: { $in: ["APPROVED", "VERIFIED"] },
      },
      { verificationStatus: "EXPIRED" }
    );

    const filter = {};

    // 1. Verification Status Filter
    if (status && status.toUpperCase() !== "ALL") {
      if (status.toUpperCase() === "APPROVED" || status.toUpperCase() === "VERIFIED") {
        filter.verificationStatus = { $in: ["APPROVED", "VERIFIED"] };
      } else {
        filter.verificationStatus = status.toUpperCase();
      }
    }

    // 2. Role / License Type Filter
    const targetType = (type || role || "").toUpperCase();
    if (targetType && targetType !== "ALL") {
      if (targetType === "MANUFACTURER") filter.licenseType = "MANUFACTURING";
      else if (targetType === "DISTRIBUTOR") filter.licenseType = "WHOLESALE";
      else if (targetType === "PHARMACY") filter.licenseType = "PHARMACY";
      else filter.licenseType = targetType;
    }

    // 3. Expiry Filter
    if (expiry && expiry.toUpperCase() !== "ALL") {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (expiry.toUpperCase() === "EXPIRED") {
        filter.$or = [{ verificationStatus: "EXPIRED" }, { expiryDate: { $lt: now } }];
      } else if (expiry.toUpperCase() === "EXPIRING_SOON") {
        filter.expiryDate = { $gte: now, $lte: thirtyDaysFromNow };
      } else if (expiry.toUpperCase() === "VALID") {
        filter.expiryDate = { $gt: thirtyDaysFromNow };
      }
    }

    // 4. Search Filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      const matchingOrgs = await Organization.find({
        $or: [
          { name: searchRegex },
          { registrationNumber: searchRegex },
          { contactEmail: searchRegex },
        ],
      }).select("_id");
      const orgIds = matchingOrgs.map((o) => o._id);

      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("organization");
      const userOrgIds = matchingUsers.map((u) => u.organization).filter(Boolean);

      const combinedOrgIds = [...new Set([...orgIds.map(String), ...userOrgIds.map(String)])];

      filter.$or = [
        { licenseNumber: searchRegex },
        { issuingAuthority: searchRegex },
        ...(combinedOrgIds.length > 0 ? [{ organization: { $in: combinedOrgIds } }] : []),
      ];
    }

    // Query DB
    const [licenses, total, summaryCounts] = await Promise.all([
      License.find(filter)
        .populate("organization")
        .populate("verifiedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),

      License.countDocuments(filter),

      Promise.all([
        License.countDocuments(),
        License.countDocuments({ verificationStatus: { $in: ["PENDING", "UNDER_REVIEW"] } }),
        License.countDocuments({ verificationStatus: { $in: ["APPROVED", "VERIFIED"] } }),
        License.countDocuments({ verificationStatus: "REJECTED" }),
        License.countDocuments({ $or: [{ verificationStatus: "EXPIRED" }, { expiryDate: { $lt: now } }] }),
      ]),
    ]);

    // Attach applicant user details
    const orgIdsList = licenses.map((l) => l.organization?._id).filter(Boolean);
    const users = await User.find({ organization: { $in: orgIdsList } })
      .select("name email role accountStatus organization contactPhone")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      if (u.organization) {
        userMap[u.organization.toString()] = u;
      }
    });

    const formattedLicenses = licenses.map((lic) => ({
      ...lic,
      applicant: lic.organization ? userMap[lic.organization._id.toString()] || null : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        licenses: formattedLicenses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        summary: {
          total: summaryCounts[0],
          pending: summaryCounts[1],
          approved: summaryCounts[2],
          rejected: summaryCounts[3],
          expired: summaryCounts[4],
        },
      },
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
      .populate("verifiedBy", "name email role")
      .lean();

    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
      });
    }

    const verifications = await Verification.find({ license: license._id })
      .populate("verifiedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const users = await User.find({ organization: license.organization?._id })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    return res.status(200).json({
      success: true,
      license: {
        ...license,
        users,
        verifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLicenseDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const license = await License.findById(id);

    if (!license || !license.documentPath) {
      return res.status(404).json({
        success: false,
        message: "License document file not found.",
      });
    }

    // Access control: Admin or user belonging to license organization
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "REGULATOR"].includes(req.user.role);
    const isOwner =
      req.user.organization &&
      license.organization &&
      req.user.organization._id
        ? req.user.organization._id.toString() === license.organization.toString()
        : req.user.organization
        ? req.user.organization.toString() === license.organization.toString()
        : false;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You are not authorized to view this protected document.",
      });
    }

    const absolutePath = path.resolve(license.documentPath);
    const uploadsDir = path.resolve(process.cwd(), "uploads");

    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document storage path.",
      });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file does not exist on storage.",
      });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    return res.sendFile(absolutePath);
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

    // Double-review protection
    if (license.verificationStatus === "APPROVED" || license.verificationStatus === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Double-Review Conflict: This license has already been approved.",
      });
    }
    if (license.verificationStatus === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Double-Review Conflict: This license has already been rejected.",
      });
    }

    const previousStatus = license.verificationStatus;
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
        previousStatus,
        newStatus: "APPROVED",
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

    const rejectionReason = (reason || remarks || "").trim();
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "A clear rejection reason is required before rejecting a license.",
      });
    }

    const license = await License.findById(id).populate("organization");
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "License not found",
      });
    }

    // Double-review protection
    if (license.verificationStatus === "APPROVED" || license.verificationStatus === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Double-Review Conflict: This license has already been approved.",
      });
    }
    if (license.verificationStatus === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Double-Review Conflict: This license has already been rejected.",
      });
    }

    const previousStatus = license.verificationStatus;
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
        previousStatus,
        newStatus: "REJECTED",
        licenseNumber: license.licenseNumber,
        organizationName: license.organization?.name,
        reason: rejectionReason,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "License application rejected.",
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
  getLicenseDocument,
  createLicense,
  updateLicense,
  approveLicense,
  rejectLicense,
};

