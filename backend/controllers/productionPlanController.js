import ProductionPlan from "../models/ProductionPlan.js";
import Product from "../models/Product.js";

class ProductionPlanController {
  static async createOrUpdatePlan(req, res) {
    try {
      const { product_id, shift, plan_date, target_quantity, notes, unit_id } = req.body;

      if (!product_id || !shift || !plan_date || !target_quantity) {
        return res.status(400).json({
          success: false,
          message: "product_id, shift, plan_date, and target_quantity are required",
        });
      }

      if (!Number.isFinite(Number(target_quantity)) || Number(target_quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: "target_quantity must be a positive number",
        });
      }

      const validShifts = ["morning", "afternoon", "night"];
      if (!validShifts.includes(shift)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shift. Must be morning, afternoon, or night",
        });
      }

      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const effectiveUnitId = req.user.role === "admin"
        ? Number(unit_id || product.unit_id)
        : Number(req.user.unit_id);

      if (req.user.role !== "admin" && Number(product.unit_id) !== Number(req.user.unit_id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const plan = await ProductionPlan.upsert({
        unit_id: effectiveUnitId,
        product_id: Number(product_id),
        shift,
        plan_date,
        target_quantity: Number(target_quantity),
        notes,
        created_by: req.user.id,
        updated_by: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Production target saved successfully",
        data: plan,
      });
    } catch (error) {
      console.error("Create/update production plan error:", error);
      res.status(500).json({
        success: false,
        message: "Error saving production target",
        error: error.message,
      });
    }
  }

  static async getAllPlans(req, res) {
    try {
      const { product_id, shift, plan_date, date_from, date_to, unit_id } = req.query;
      const filters = {};

      if (req.user.role !== "admin") {
        filters.unit_id = req.user.unit_id;
      } else if (unit_id) {
        filters.unit_id = Number(unit_id);
      }

      if (product_id) filters.product_id = Number(product_id);
      if (shift) filters.shift = shift;
      if (plan_date) filters.plan_date = plan_date;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const plans = await ProductionPlan.findAll(filters);

      res.json({
        success: true,
        count: plans.length,
        data: plans,
      });
    } catch (error) {
      console.error("Get production plans error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching production plans",
        error: error.message,
      });
    }
  }

  static async getTargetProgress(req, res) {
    try {
      const { product_id, shift, plan_date, unit_id } = req.query;

      if (!product_id || !shift || !plan_date) {
        return res.status(400).json({
          success: false,
          message: "product_id, shift and plan_date are required",
        });
      }

      const effectiveUnitId = req.user.role === "admin"
        ? Number(unit_id || req.user.unit_id)
        : Number(req.user.unit_id);

      const progress = await ProductionPlan.getTargetProgress({
        unit_id: effectiveUnitId,
        product_id: Number(product_id),
        shift,
        plan_date,
      });

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error("Get target progress error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching target progress",
        error: error.message,
      });
    }
  }

  static async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const { target_quantity, notes } = req.body;

      const existing = await ProductionPlan.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Production plan not found",
        });
      }

      if (req.user.role !== "admin" && Number(existing.unit_id) !== Number(req.user.unit_id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this production plan",
        });
      }

      if (
        target_quantity !== undefined &&
        (!Number.isFinite(Number(target_quantity)) || Number(target_quantity) <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "target_quantity must be a positive number",
        });
      }

      const updated = await ProductionPlan.update(id, {
        target_quantity:
          target_quantity !== undefined ? Number(target_quantity) : undefined,
        notes,
        updated_by: req.user.id,
      });

      res.json({
        success: true,
        message: "Production plan updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update production plan error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating production plan",
        error: error.message,
      });
    }
  }

  static async deletePlan(req, res) {
    try {
      const { id } = req.params;

      const existing = await ProductionPlan.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Production plan not found",
        });
      }

      if (req.user.role !== "admin" && Number(existing.unit_id) !== Number(req.user.unit_id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this production plan",
        });
      }

      await ProductionPlan.delete(id);

      res.json({
        success: true,
        message: "Production plan deleted successfully",
      });
    } catch (error) {
      console.error("Delete production plan error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting production plan",
        error: error.message,
      });
    }
  }
}

export default ProductionPlanController;
