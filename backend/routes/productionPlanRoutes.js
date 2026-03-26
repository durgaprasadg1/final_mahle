import express from "express";
import ProductionPlanController from "../controllers/productionPlanController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  checkPermission("read", "planning"),
  ProductionPlanController.getAllPlans,
);
router.get(
  "/progress",
  checkPermission("read", "planning"),
  ProductionPlanController.getTargetProgress,
);
router.post(
  "/",
  checkPermission("create", "planning"),
  ProductionPlanController.createOrUpdatePlan,
);
router.put(
  "/:id",
  checkPermission("update", "planning"),
  ProductionPlanController.updatePlan,
);
router.delete(
  "/:id",
  checkPermission("delete", "planning"),
  ProductionPlanController.deletePlan,
);

export default router;
