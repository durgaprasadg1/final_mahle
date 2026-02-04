import express from "express";
import BatchController from "../controllers/batchController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", BatchController.getAllBatches);
router.get("/unit/:unitId", BatchController.getBatchesByUnit);
router.get("/unit/:unitId/statistics", BatchController.getBatchStatistics);
router.get("/:id", BatchController.getBatchById);
router.post("/", checkPermission("create"), BatchController.createBatch);
router.put("/:id", checkPermission("update"), BatchController.updateBatch);
router.delete("/:id", checkPermission("delete"), BatchController.deleteBatch);

export default router;
