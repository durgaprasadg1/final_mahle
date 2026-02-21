import express from "express";
import ShiftController from "../controllers/shiftController.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", ShiftController.getAllShifts);
router.get("/:id", ShiftController.getShiftById);
router.post("/", authorizeAdmin, ShiftController.createShift);
router.put("/:id", authorizeAdmin, ShiftController.updateShift);
router.delete("/:id", authorizeAdmin, ShiftController.deleteShift);

export default router;
