import express from "express";
import UserController from "../controllers/userController.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, authorizeAdmin);

router.post("/", UserController.createUser);
router.get("/", UserController.getAllUsers);
router.get("/unit/:unitId", UserController.getUsersByUnit);
router.get("/:id", UserController.getUserById);
router.put("/:id", UserController.updateUser);
router.patch("/:id/status", UserController.toggleUserStatus);
router.delete("/:id", UserController.deleteUser);

export default router;
