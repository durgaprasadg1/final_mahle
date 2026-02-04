import express from "express";
import AuthController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);

// Protected routes
router.get("/profile", authenticate, AuthController.getProfile);
router.put("/change-password", authenticate, AuthController.changePassword);

export default router;
