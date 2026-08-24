const Product = require("../../models/Product");
const Batch = require("../../models/Batch");
const Organization = require("../../models/Organization");
const { logAuditAction } = require("../utils/auditLogger");

const getAllProducts = async (req, res, next) => {
  try {
    const { manufacturerId, category, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (manufacturerId) {
      filter.manufacturer = manufacturerId;
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
        { productCode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter)
      .populate("manufacturer", "name type address contactEmail status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "manufacturer",
      "name type address contactEmail status"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const batches = await Batch.find({ product: product._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      product,
      batches,
      totalBatches: batches.length,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      brandName,
      productCode,
      regulatoryApprovalNumber,
      category,
      dosageForm,
      strength,
      packageSize,
      description,
      storageRequirements,
      manufacturerId,
    } = req.body;

    if (!name || !productCode) {
      return res.status(400).json({
        success: false,
        message: "Product name and unique product code (GTIN/NDC) are required.",
      });
    }

    const mfgId = manufacturerId || (req.user.organization ? req.user.organization._id || req.user.organization : null);

    if (!mfgId) {
      return res.status(400).json({
        success: false,
        message: "Manufacturer organization is required.",
      });
    }

    // Verify manufacturer is APPROVED
    const mfgOrg = await Organization.findById(mfgId);
    if (!mfgOrg || (mfgOrg.status !== "APPROVED" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "ADMIN")) {
      return res.status(403).json({
        success: false,
        message: "Only verified and approved manufacturer organizations can register products.",
      });
    }

    const normalizedCode = productCode.trim().toUpperCase();
    const existing = await Product.findOne({ productCode: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Product with code '${normalizedCode}' already exists in formulary.`,
      });
    }

    const product = await Product.create({
      name: name.trim(),
      genericName: genericName ? genericName.trim() : "",
      brandName: brandName ? brandName.trim() : "",
      productCode: normalizedCode,
      regulatoryApprovalNumber: regulatoryApprovalNumber ? regulatoryApprovalNumber.trim() : "",
      manufacturer: mfgId,
      category: category || "General Pharmaceutical",
      dosageForm: dosageForm || "Tablet / Capsule",
      strength: strength ? strength.trim() : "",
      packageSize: packageSize ? packageSize.trim() : "",
      description: description ? description.trim() : "",
      storageRequirements: storageRequirements || "Store at controlled room temperature 15°C to 25°C",
      status: "ACTIVE",
    });

    await logAuditAction({
      userId: req.user._id,
      organization: mfgId,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product._id,
      details: { name: product.name, productCode: product.productCode },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Pharmaceutical product formulary created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      genericName,
      brandName,
      regulatoryApprovalNumber,
      category,
      dosageForm,
      strength,
      packageSize,
      description,
      storageRequirements,
      status,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Permission check
    const isOwner = req.user.organization && product.manufacturer.toString() === req.user.organization._id.toString();
    const isAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN" || req.user.role === "REGULATOR";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not own this product record.",
      });
    }

    if (name) product.name = name.trim();
    if (genericName !== undefined) product.genericName = genericName.trim();
    if (brandName !== undefined) product.brandName = brandName.trim();
    if (regulatoryApprovalNumber !== undefined) product.regulatoryApprovalNumber = regulatoryApprovalNumber.trim();
    if (category) product.category = category;
    if (dosageForm) product.dosageForm = dosageForm;
    if (strength !== undefined) product.strength = strength.trim();
    if (packageSize !== undefined) product.packageSize = packageSize.trim();
    if (description !== undefined) product.description = description.trim();
    if (storageRequirements !== undefined) product.storageRequirements = storageRequirements.trim();
    if (status) product.status = status;

    await product.save();

    await logAuditAction({
      userId: req.user._id,
      organization: product.manufacturer,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: product._id,
      details: { productCode: product.productCode, name: product.name },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.status = "INACTIVE";
    await product.save();

    await logAuditAction({
      userId: req.user._id,
      organization: product.manufacturer,
      action: "PRODUCT_DEACTIVATED",
      entityType: "Product",
      entityId: product._id,
      details: { productCode: product.productCode },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Product marked as inactive.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
