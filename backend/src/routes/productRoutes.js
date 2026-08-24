const express = require("express");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getAllProducts);
router.get("/:id", authenticateToken, getProductById);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("MANUFACTURER", "SUPER_ADMIN", "ADMIN", "REGULATOR"),
  createProduct
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("MANUFACTURER", "SUPER_ADMIN", "ADMIN", "REGULATOR"),
  updateProduct
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("MANUFACTURER", "SUPER_ADMIN", "ADMIN", "REGULATOR"),
  deleteProduct
);

module.exports = router;