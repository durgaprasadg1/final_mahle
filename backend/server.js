import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Mahle Inventory System API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("═══════════════════════════════════════════════════════");
  console.log("   🚀 MAHLE INVENTORY MANAGEMENT SYSTEM 🚀");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`   📡 Server running on port ${PORT}`);
  console.log(`   🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`   💾 Database: ${process.env.DB_NAME}`);
  console.log(`   🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("   Available endpoints:");
  console.log("   - POST /api/auth/login");
  console.log("   - GET  /api/auth/profile");
  console.log("   - GET  /api/units");
  console.log("   - GET  /api/products");
  console.log("   - GET  /api/batches");
  console.log("   - GET  /api/users (admin only)");
  console.log("═══════════════════════════════════════════════════════");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
});

export default app;
