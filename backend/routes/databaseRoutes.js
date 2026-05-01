import express from "express";
import DatabaseController from "../controllers/databaseController.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate, authorizeAdmin);
router.get("/export", DatabaseController.exportSql);
router.post("/import", DatabaseController.importSql);

export default router;
