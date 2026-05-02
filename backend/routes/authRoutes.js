import express from "express";
import AuthController from "../controllers/authController.js";
import { authenticate, preventAuthAccess } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", preventAuthAccess, AuthController.login);
router.get("/profile", authenticate, AuthController.getProfile);
router.put("/change-password", authenticate, AuthController.changePassword);

export default router;
