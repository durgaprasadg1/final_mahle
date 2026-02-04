import express from "express";
import UnitController from "../controllers/unitController.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", UnitController.getAllUnits);
router.get("/:id", UnitController.getUnitById);
router.post("/", authorizeAdmin, UnitController.createUnit);
router.put("/:id", authorizeAdmin, UnitController.updateUnit);

export default router;
