import express from "express";
import ProductController from "../controllers/productController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/types", ProductController.getProductTypes);
router.get("/", ProductController.getAllProducts);
router.get("/unit/:unitId", ProductController.getProductsByUnit);
router.get("/:id", ProductController.getProductById);
router.post("/", checkPermission("create"), ProductController.createProduct);
router.put("/:id", checkPermission("update"), ProductController.updateProduct);
router.delete(
  "/:id",
  checkPermission("delete"),
  ProductController.deleteProduct,
);

export default router;
