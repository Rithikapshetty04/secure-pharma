const Organization = require("../../models/Organization");
const Order = require("../../models/Order");
const Batch = require("../../models/Batch");
const Product = require("../../models/Product");
const SupplyChainEvent = require("../../models/SupplyChainEvent");
const Cart = require("../../models/Cart");

/**
 * Helper to recalculate cart totals and validate real-time warehouse stock
 */
const syncCartTotalsAndStock = async (cart) => {
  if (!cart || !cart.items) return { cart, warnings: [] };

  const warnings = [];
  let totalQuantity = 0;
  let totalAmount = 0;

  for (let i = cart.items.length - 1; i >= 0; i--) {
    const item = cart.items[i];
    let maxAvailable = 10000;

    if (item.batch) {
      const batchObj = await Batch.findById(item.batch).populate("product");
      if (batchObj) {
        maxAvailable = Number(batchObj.quantity || 0);
        if (batchObj.product?.unitPrice) {
          item.unitPrice = Number(batchObj.product.unitPrice);
        }
      }
    } else if (item.product) {
      const prodObj = await Product.findById(item.product);
      if (prodObj && prodObj.unitPrice) {
        item.unitPrice = Number(prodObj.unitPrice);
      }
    }

    if (maxAvailable <= 0) {
      warnings.push(`'${item.productName}' (Batch #${item.batchNumber}) is out of stock and was removed from cart.`);
      cart.items.splice(i, 1);
      continue;
    } else if (item.quantity > maxAvailable) {
      warnings.push(`Requested quantity for '${item.productName}' was adjusted to available stock (${maxAvailable} units).`);
      item.quantity = maxAvailable;
    }

    item.unitPrice = item.unitPrice || 45.00;
    item.totalPrice = item.quantity * item.unitPrice;

    totalQuantity += item.quantity;
    totalAmount += item.totalPrice;
  }

  cart.totalQuantity = totalQuantity;
  cart.totalAmount = totalAmount;

  await cart.save();
  return { cart, warnings };
};

/**
 * GET /api/pharmacy/dashboard
 * Returns real aggregate operational stats, recent orders, received batches, available medicines preview, and supply chain activity scoped to the authenticated pharmacy.
 */
const getPharmacyDashboard = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    const pharmacyOrg = await Organization.findById(pharmacyOrgId).select("name type status address licenseNumber contactEmail phone");

    // 1. Fetch real Pharmacy Orders
    const orders = await Order.find({ pharmacy: pharmacyOrgId })
      .populate("distributor", "name type address contactEmail")
      .sort({ createdAt: -1 });

    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter((o) =>
      ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)
    ).length;
    const completedOrdersCount = orders.filter((o) =>
      ["DELIVERED", "COMPLETED"].includes(o.status)
    ).length;

    // 2. Fetch real Supply Chain Events involving this pharmacy
    const events = await SupplyChainEvent.find({
      $or: [{ fromOrganization: pharmacyOrgId }, { toOrganization: pharmacyOrgId }],
    })
      .populate({
        path: "batch",
        populate: { path: "product", select: "name productCode dosageForm strength unitPrice" },
      })
      .populate("fromOrganization", "name type address contactEmail")
      .populate("toOrganization", "name type address contactEmail")
      .populate("user", "name role email")
      .sort({ eventDate: -1 });

    // Received events where pharmacy is recipient
    const receivedEvents = events.filter(
      (e) => (e.toOrganization?._id || e.toOrganization)?.toString() === pharmacyOrgId.toString() &&
        ["RECEIVED", "DELIVERED", "TRANSFERRED"].includes(e.eventType)
    );

    const receivedBatchIds = [...new Set(receivedEvents.map((e) => (e.batch?._id || e.batch)?.toString()).filter(Boolean))];

    // Fetch batch objects for received batches
    const receivedBatches = await Batch.find({ _id: { $in: receivedBatchIds } })
      .populate("product", "name productCode dosageForm strength category unitPrice")
      .populate("manufacturer", "name type status contactEmail")
      .sort({ updatedAt: -1 });

    // Calculate expiry stats
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let expiringSoonCount = 0;
    let expiredCount = 0;
    receivedBatches.forEach((b) => {
      const expDate = new Date(b.expiryDate);
      if (expDate < now) {
        expiredCount++;
      } else if (expDate <= thirtyDaysFromNow) {
        expiringSoonCount++;
      }
    });

    // 3. Count Available Products & Batches for ordering
    const availableProductsCount = await Product.countDocuments({});
    const availableBatchesCount = await Batch.countDocuments({
      status: { $in: ["MANUFACTURED", "IN_TRANSIT", "RECEIVED"] },
      expiryDate: { $gt: now },
    });

    // Preview available batches for ordering
    const availableBatchesPreview = await Batch.find({
      status: { $in: ["MANUFACTURED", "IN_TRANSIT", "RECEIVED"] },
      expiryDate: { $gt: now },
    })
      .populate("product", "name productCode dosageForm strength unitPrice category")
      .populate("manufacturer", "name type status")
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      pharmacy: pharmacyOrg,
      stats: {
        totalOrdersCount,
        pendingOrdersCount,
        completedOrdersCount,
        receivedBatchesCount: receivedBatches.length,
        expiringSoonCount,
        expiredCount,
        availableProductsCount,
        availableBatchesCount,
      },
      recentOrders: orders.slice(0, 6),
      recentlyReceivedBatches: receivedBatches.slice(0, 6),
      availableBatchesPreview,
      recentActivity: events.slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pharmacy/medicines
 */
const getPharmacyMedicines = async (req, res, next) => {
  try {
    const {
      search,
      category,
      dosageForm,
      availability = "ALL",
      sort = "newest",
      page = 1,
      limit = 24,
    } = req.query;

    const now = new Date();

    const filter = {
      status: { $in: ["MANUFACTURED", "IN_TRANSIT", "RECEIVED", "DISTRIBUTED"] },
      expiryDate: { $gt: now },
    };

    if (availability === "IN_STOCK") {
      filter.quantity = { $gte: 10 };
    } else if (availability === "LOW_STOCK") {
      filter.quantity = { $gt: 0, $lt: 10 };
    } else if (availability === "OUT_OF_STOCK") {
      filter.quantity = { $lte: 0 };
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };

      const matchingProducts = await Product.find({
        $or: [
          { name: searchRegex },
          { genericName: searchRegex },
          { brandName: searchRegex },
          { productCode: searchRegex },
          { category: searchRegex },
          { dosageForm: searchRegex },
        ],
      }).select("_id");
      const matchingProductIds = matchingProducts.map((p) => p._id);

      filter.$or = [
        { batchNumber: searchRegex },
        { qrIdentifier: searchRegex },
        { product: { $in: matchingProductIds } },
      ];
    }

    const sortOption = {};
    if (sort === "name-asc") {
      sortOption.batchNumber = 1;
    } else if (sort === "name-desc") {
      sortOption.batchNumber = -1;
    } else if (sort === "qty-desc") {
      sortOption.quantity = -1;
    } else {
      sortOption.createdAt = -1;
    }

    let allBatches = await Batch.find(filter)
      .populate("product")
      .populate("manufacturer", "name type address contactEmail status")
      .sort(sortOption);

    if (category && category.toUpperCase() !== "ALL") {
      allBatches = allBatches.filter(
        (b) => (b.product?.category || "").toUpperCase() === category.toUpperCase()
      );
    }
    if (dosageForm && dosageForm.toUpperCase() !== "ALL") {
      allBatches = allBatches.filter(
        (b) => (b.product?.dosageForm || "").toUpperCase().includes(dosageForm.toUpperCase())
      );
    }

    const total = allBatches.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedBatches = allBatches.slice(skip, skip + Number(limit));

    const categoriesSet = new Set();
    const dosageFormsSet = new Set();
    const allActive = await Batch.find({ status: { $in: ["MANUFACTURED", "IN_TRANSIT", "RECEIVED"] } }).populate("product");
    allActive.forEach((b) => {
      if (b.product?.category) categoriesSet.add(b.product.category);
      if (b.product?.dosageForm) dosageFormsSet.add(b.product.dosageForm);
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      categories: Array.from(categoriesSet),
      dosageForms: Array.from(dosageFormsSet),
      batches: paginatedBatches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pharmacy/received
 */
const getPharmacyReceivedBatches = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    const events = await SupplyChainEvent.find({
      toOrganization: pharmacyOrgId,
      eventType: { $in: ["RECEIVED", "DELIVERED", "TRANSFERRED"] },
    }).sort({ eventDate: -1 });

    const batchIds = [...new Set(events.map((e) => (e.batch?._id || e.batch)?.toString()).filter(Boolean))];

    const batches = await Batch.find({ _id: { $in: batchIds } })
      .populate("product")
      .populate("manufacturer", "name type address contactEmail")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      total: batches.length,
      batches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pharmacy/cart
 */
const getPharmacyCart = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    let cart = await Cart.findOne({ pharmacy: pharmacyOrgId })
      .populate({
        path: "items.product",
        select: "name genericName brandName productCode category dosageForm strength unitPrice manufacturer",
        populate: { path: "manufacturer", select: "name type" },
      })
      .populate({
        path: "items.batch",
        select: "batchNumber quantity expiryDate status unit manufacturer",
        populate: { path: "manufacturer", select: "name type" },
      });

    if (!cart) {
      cart = await Cart.create({
        pharmacy: pharmacyOrgId,
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
      });
    }

    const { cart: syncedCart, warnings } = await syncCartTotalsAndStock(cart);

    return res.status(200).json({
      success: true,
      cart: syncedCart,
      warnings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/pharmacy/cart/items
 */
const addPharmacyCartItem = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    const { productId, batchId, quantity = 1 } = req.body;
    const requestedQty = Math.max(1, Number(quantity) || 1);

    if (!productId && !batchId) {
      return res.status(400).json({
        success: false,
        message: "productId or batchId is required to add item to cart.",
      });
    }

    let batch = null;
    let product = null;

    if (batchId) {
      batch = await Batch.findById(batchId).populate("product").populate("manufacturer", "name type");
      if (batch) product = batch.product;
    }

    if (!product && productId) {
      product = await Product.findById(productId).populate("manufacturer", "name type");
    }

    if (!batch && product) {
      batch = await Batch.findOne({
        product: product._id,
        status: { $in: ["MANUFACTURED", "IN_TRANSIT", "RECEIVED"] },
        expiryDate: { $gt: new Date() },
        quantity: { $gt: 0 },
      }).populate("manufacturer", "name type");
    }

    if (!product && !batch) {
      return res.status(404).json({
        success: false,
        message: "Pharmaceutical product or batch not found.",
      });
    }

    const availableStock = batch ? Number(batch.quantity || 0) : 1000;
    if (availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: `'${product?.name || "Product"}' is currently out of stock.`,
      });
    }

    let cart = await Cart.findOne({ pharmacy: pharmacyOrgId });
    if (!cart) {
      cart = await Cart.create({
        pharmacy: pharmacyOrgId,
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
      });
    }

    const targetBatchIdStr = batch ? batch._id.toString() : null;
    const targetProductIdStr = product ? product._id.toString() : null;

    const existingIndex = cart.items.findIndex(
      (item) =>
        (targetBatchIdStr && item.batch?.toString() === targetBatchIdStr) ||
        (targetProductIdStr && item.product?.toString() === targetProductIdStr)
    );

    const unitPrice = Number(product?.unitPrice || 45.00);

    if (existingIndex > -1) {
      const existingItem = cart.items[existingIndex];
      const newQty = existingItem.quantity + requestedQty;

      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Adding ${requestedQty} units would exceed available warehouse stock (${availableStock} units). You already have ${existingItem.quantity} units in your cart.`,
        });
      }

      existingItem.quantity = newQty;
      existingItem.unitPrice = unitPrice;
      existingItem.totalPrice = newQty * unitPrice;
    } else {
      if (requestedQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity (${requestedQty} units) exceeds available warehouse stock (${availableStock} units).`,
        });
      }

      cart.items.push({
        product: product?._id || batch?.product,
        batch: batch?._id || null,
        productName: product?.name || batch?.productName || "Pharmaceutical Product",
        productCode: product?.productCode || "PC-FORMULARY",
        batchNumber: batch?.batchNumber || "UNASSIGNED",
        quantity: requestedQty,
        unit: batch?.unit || "Units",
        unitPrice,
        totalPrice: requestedQty * unitPrice,
      });
    }

    const { cart: updatedCart } = await syncCartTotalsAndStock(cart);

    return res.status(200).json({
      success: true,
      message: `'${product?.name || "Medicine"}' added to procurement cart.`,
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/pharmacy/cart/items/:itemId
 */
const updatePharmacyCartItem = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;
    const newQty = Number(quantity);

    if (isNaN(newQty)) {
      return res.status(400).json({
        success: false,
        message: "Valid numeric quantity is required.",
      });
    }

    const cart = await Cart.findOne({ pharmacy: pharmacyOrgId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId || (item.batch && item.batch.toString() === itemId)
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const item = cart.items[itemIndex];
      let availableStock = 10000;
      if (item.batch) {
        const batchObj = await Batch.findById(item.batch);
        if (batchObj) availableStock = Number(batchObj.quantity || 0);
      }

      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity (${newQty} units) exceeds available warehouse stock (${availableStock} units).`,
        });
      }

      item.quantity = newQty;
      item.totalPrice = newQty * item.unitPrice;
    }

    const { cart: updatedCart } = await syncCartTotalsAndStock(cart);

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully.",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/pharmacy/cart/items/:itemId
 */
const removePharmacyCartItem = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    const { itemId } = req.params;
    const cart = await Cart.findOne({ pharmacy: pharmacyOrgId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId && (!item.batch || item.batch.toString() !== itemId)
    );

    const { cart: updatedCart } = await syncCartTotalsAndStock(cart);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/pharmacy/cart
 */
const clearPharmacyCart = async (req, res, next) => {
  try {
    const pharmacyOrgId = req.user.organization?._id || req.user.organization;
    if (!pharmacyOrgId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: User is not associated with a registered Pharmacy organization.",
      });
    }

    const cart = await Cart.findOne({ pharmacy: pharmacyOrgId });
    if (cart) {
      cart.items = [];
      cart.totalQuantity = 0;
      cart.totalAmount = 0;
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Procurement cart cleared.",
      cart: cart || { items: [], totalQuantity: 0, totalAmount: 0 },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPharmacyDashboard,
  getPharmacyMedicines,
  getPharmacyReceivedBatches,
  getPharmacyCart,
  addPharmacyCartItem,
  updatePharmacyCartItem,
  removePharmacyCartItem,
  clearPharmacyCart,
};
