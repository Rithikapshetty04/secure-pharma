const Organization = require("../../models/Organization");
const License = require("../../models/License");
const Product = require("../../models/Product");
const User = require("../../models/User");
const { logAuditAction } = require("../utils/auditLogger");
const { createNotification } = require("../services/notificationService");

const getAllOrganizations = async (req, res, next) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (type) {
      filter.type = type.toUpperCase();
    }
    if (status) {
      filter.status = status.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const organizations = await Organization.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Organization.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      organizations,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const license = await License.findOne({ organization: organization._id });
    const products = await Product.find({ manufacturer: organization._id });
    const users = await User.find({ organization: organization._id }).select("-password");

    return res.status(200).json({
      success: true,
      organization,
      license,
      productCount: products.length,
      userCount: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const { name, type, address, contactEmail, contactPhone, registrationNumber, status } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Organization name and type are required.",
      });
    }

    const org = await Organization.create({
      name: name.trim(),
      type: type.toUpperCase().trim(),
      address: address ? address.trim() : "",
      contactEmail: contactEmail ? contactEmail.toLowerCase().trim() : "",
      contactPhone: contactPhone ? contactPhone.trim() : "",
      registrationNumber: registrationNumber ? registrationNumber.trim() : "",
      status: status || "PENDING",
    });

    await logAuditAction({
      userId: req.user._id,
      organization: org._id,
      action: "ORGANIZATION_CREATED",
      entityType: "Organization",
      entityId: org._id,
      details: { name: org.name, type: org.type, status: org.status },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization: org,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, contactEmail, contactPhone, registrationNumber } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Permission check: only admin, regulator, or org's own member
    const isRegulator = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN" || req.user.role === "REGULATOR";
    const isOwnOrg = req.user.organization && req.user.organization._id.toString() === id;

    if (!isRegulator && !isOwnOrg) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You can only edit your own organization profile.",
      });
    }

    if (name) organization.name = name.trim();
    if (address !== undefined) organization.address = address.trim();
    if (contactEmail) organization.contactEmail = contactEmail.toLowerCase().trim();
    if (contactPhone !== undefined) organization.contactPhone = contactPhone.trim();
    if (registrationNumber !== undefined) organization.registrationNumber = registrationNumber.trim();

    await organization.save();

    await logAuditAction({
      userId: req.user._id,
      organization: organization._id,
      action: "ORGANIZATION_UPDATED",
      entityType: "Organization",
      entityId: organization._id,
      details: { name: organization.name },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Organization profile updated successfully",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganizationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    if ((status === "REJECTED" || status === "SUSPENDED") && !reason) {
      return res.status(400).json({
        success: false,
        message: `A reason is strictly required when setting status to ${status}.`,
      });
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    organization.status = status;
    if (status === "REJECTED") {
      organization.rejectionReason = reason;
    } else if (status === "SUSPENDED") {
      organization.suspensionReason = reason;
    }
    await organization.save();

    // Synchronize linked Users accountStatus
    const userAccountStatus = status === "APPROVED" ? "APPROVED" : status === "SUSPENDED" ? "SUSPENDED" : status === "REJECTED" ? "REJECTED" : "PENDING";
    await User.updateMany(
      { organization: organization._id },
      {
        accountStatus: userAccountStatus,
        rejectionReason: status === "REJECTED" || status === "SUSPENDED" ? reason : undefined,
      }
    );

    // Notify organization members
    await createNotification({
      recipientOrg: organization._id,
      type: "ACCOUNT_STATUS_CHANGED",
      title: `Organization Status Changed to ${status}`,
      message: `Your organization status has been updated to ${status}.${reason ? ` Reason: ${reason}` : ""}`,
      relatedEntity: "Organization",
      relatedEntityId: organization._id,
    });

    await logAuditAction({
      userId: req.user._id,
      organization: organization._id,
      action: `ORGANIZATION_${status}`,
      entityType: "Organization",
      entityId: organization._id,
      details: { status, reason },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Organization status updated to ${status}`,
      organization,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
};
