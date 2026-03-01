import express from "express";
import BatchController from "../controllers/batchController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/", BatchController.getAllBatches);
router.get("/unit/:unitId", BatchController.getBatchesByUnit);
router.get("/unit/:unitId/statistics", BatchController.getBatchStatistics);
router.get(
  "/product/:productId/shift/:shift/used-slots",
  BatchController.getUsedTimeSlots,
);
router.get(
  "/product/:productId/shift/:shift/next-batch",
  BatchController.getNextBatchInShift,
);
router.get("/:id", BatchController.getBatchById);
router.post("/", checkPermission("create"), BatchController.createBatch);
router.put("/:id", checkPermission("update"), BatchController.updateBatch);
router.delete("/:id", checkPermission("delete"), BatchController.deleteBatch);

export default router;
