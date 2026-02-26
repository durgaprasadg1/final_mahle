import express from "express";
import TierController from "../controllers/tierController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/:tierId/details", TierController.getTierDetails);

export default router;