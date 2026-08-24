const VerificationService = require("../services/verificationService");
const Verification = require("../../models/Verification");

const verifyProduct = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const result = await VerificationService.verifyProductIdentifier(identifier, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const submitVerificationScan = async (req, res, next) => {
  try {
    const { identifier, scanLocation, deviceSource } = req.body;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Product/Batch identifier is required.",
      });
    }

    const result = await VerificationService.verifyProductIdentifier(identifier, req);

    if (scanLocation || deviceSource) {
      await Verification.create({
        identifier,
        verificationType: "PRODUCT_QR_SCAN",
        status: result.status,
        remarks: `Scan performed at location: ${scanLocation || "Mobile Device"}. Result: ${result.status}`,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        metadata: { scanLocation, deviceSource, checks: result.checks },
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getVerificationHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const verifications = await Verification.find(filter)
      .populate("license")
      .populate("organization")
      .populate("batch")
      .populate("verifiedBy", "name role")
      .sort({ verificationDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Verification.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      verifications,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyProduct,
  submitVerificationScan,
  getVerificationHistory,
};
