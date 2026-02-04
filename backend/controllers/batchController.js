import Batch from "../models/Batch.js";
import Product from "../models/Product.js";

class BatchController {
  // Create batch
  static async createBatch(req, res) {
    try {
      const {
        product_id,
        quantity_produced,
        batch_start_time,
        batch_end_time,
        duration_minutes,
        status,
        notes,
      } = req.body;

      // Validation
      if (
        !product_id ||
        !quantity_produced ||
        !batch_start_time ||
        !batch_end_time
      ) {
        return res.status(400).json({
          success: false,
          message: "Product, quantity, start time, and end time are required",
        });
      }

      // Verify product exists and user has access
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user has access to this product's unit
      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const unit_id = product.unit_id;

      // Generate batch number
      const batch_number = await Batch.generateBatchNumber(unit_id);

      const batchData = {
        batch_number,
        product_id,
        unit_id,
        quantity_produced,
        batch_start_time,
        batch_end_time,
        duration_minutes: duration_minutes || 60,
        status: status || "completed",
        notes,
        created_by: req.user.id,
      };

      const batch = await Batch.create(batchData);

      res.status(201).json({
        success: true,
        message: "Batch created successfully",
        data: batch,
      });
    } catch (error) {
      console.error("Create batch error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating batch",
        error: error.message,
      });
    }
  }

  // Get all batches
  static async getAllBatches(req, res) {
    try {
      const { product_id, status, date_from, date_to, limit } = req.query;
      const filters = {};

      // If user is not admin, filter by their unit
      if (req.user.role !== "admin") {
        filters.unit_id = req.user.unit_id;
      } else if (req.query.unit_id) {
        filters.unit_id = parseInt(req.query.unit_id);
      }

      if (product_id) filters.product_id = parseInt(product_id);
      if (status) filters.status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
      if (limit) filters.limit = parseInt(limit);

      const batches = await Batch.findAll(filters);

      res.json({
        success: true,
        count: batches.length,
        data: batches,
      });
    } catch (error) {
      console.error("Get all batches error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching batches",
        error: error.message,
      });
    }
  }

  // Get batch by ID
  static async getBatchById(req, res) {
    try {
      const { id } = req.params;
      const batch = await Batch.findById(id);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      // Check if user has access to this batch
      if (req.user.role !== "admin" && batch.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this batch",
        });
      }

      res.json({
        success: true,
        data: batch,
      });
    } catch (error) {
      console.error("Get batch error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching batch",
        error: error.message,
      });
    }
  }

  // Update batch
  static async updateBatch(req, res) {
    try {
      const { id } = req.params;
      const {
        quantity_produced,
        batch_start_time,
        batch_end_time,
        duration_minutes,
        status,
        notes,
      } = req.body;

      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      // Check if user has access to this batch
      if (req.user.role !== "admin" && batch.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this batch",
        });
      }

      const updateData = {};
      if (quantity_produced !== undefined)
        updateData.quantity_produced = quantity_produced;
      if (batch_start_time) updateData.batch_start_time = batch_start_time;
      if (batch_end_time) updateData.batch_end_time = batch_end_time;
      if (duration_minutes !== undefined)
        updateData.duration_minutes = duration_minutes;
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const updatedBatch = await Batch.update(id, updateData);

      res.json({
        success: true,
        message: "Batch updated successfully",
        data: updatedBatch,
      });
    } catch (error) {
      console.error("Update batch error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating batch",
        error: error.message,
      });
    }
  }

  // Delete batch
  static async deleteBatch(req, res) {
    try {
      const { id } = req.params;

      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      // Check if user has access to this batch
      if (req.user.role !== "admin" && batch.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this batch",
        });
      }

      await Batch.delete(id);

      res.json({
        success: true,
        message: "Batch deleted successfully",
      });
    } catch (error) {
      console.error("Delete batch error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting batch",
        error: error.message,
      });
    }
  }

  // Get batches by unit
  static async getBatchesByUnit(req, res) {
    try {
      const { unitId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;

      // Check if user has access to this unit
      if (req.user.role !== "admin" && parseInt(unitId) !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this unit",
        });
      }

      const batches = await Batch.findByUnit(unitId, limit);

      res.json({
        success: true,
        count: batches.length,
        data: batches,
      });
    } catch (error) {
      console.error("Get batches by unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching batches",
        error: error.message,
      });
    }
  }

  // Get batch statistics
  static async getBatchStatistics(req, res) {
    try {
      const { unitId } = req.params;
      const { date_from, date_to } = req.query;

      // Check if user has access to this unit
      if (req.user.role !== "admin" && parseInt(unitId) !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this unit",
        });
      }

      if (!date_from || !date_to) {
        return res.status(400).json({
          success: false,
          message: "Date range (date_from and date_to) is required",
        });
      }

      const statistics = await Batch.getUnitStatistics(
        unitId,
        date_from,
        date_to,
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("Get batch statistics error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching statistics",
        error: error.message,
      });
    }
  }
}

export default BatchController;
