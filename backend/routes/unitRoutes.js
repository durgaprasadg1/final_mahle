import express from "express";
import UnitController from "../controllers/unitController.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", UnitController.getAllUnits);
router.get("/:id", UnitController.getUnitById);

// Admin only routes
router.post("/", authorizeAdmin, UnitController.createUnit);
router.put("/:id", authorizeAdmin, UnitController.updateUnit);

export default router;
