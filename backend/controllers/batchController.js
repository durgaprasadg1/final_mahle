import Batch from "../models/Batch.js";
import Product from "../models/Product.js";

class BatchController {
  static async createBatch(req, res) {
    try {
      const {
        product_id,
        quantity_produced,
        shift,
        batch_in_shift,
        start_time,
        end_time,
        status,
        notes,
        batch_date,
        had_delay,
        delay_reason,
      } = req.body;

      // Validation
      if (
        !product_id ||
        !quantity_produced ||
        !shift ||
        !start_time ||
        !end_time
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product, quantity, shift, start time, and end time are required",
        });
      }

      // Validate shift
      const validShifts = ["morning", "afternoon", "night"];
      if (!validShifts.includes(shift)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shift. Must be morning, afternoon, or night",
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
      const queryDate = batch_date || new Date().toISOString().split("T")[0];

      // Get next batch_in_shift for this specific product if not provided
      let finalBatchInShift = batch_in_shift;
      if (!finalBatchInShift) {
        finalBatchInShift = await Batch.getNextBatchInShift(
          product_id,
          shift,
          queryDate,
        );
      }

      // Check if time slot is already used by this product
      const usedSlots = await Batch.getUsedTimeSlots(
        product_id,
        shift,
        queryDate,
      );
      const isSlotUsed = usedSlots.some(
        (slot) => slot.start_time === start_time && slot.end_time === end_time,
      );

      if (isSlotUsed) {
        return res.status(400).json({
          success: false,
          message:
            "This time slot is already used for this product in this shift",
        });
      }

      const batchData = {
        product_id,
        unit_id,
        quantity_produced,
        shift,
        batch_in_shift: finalBatchInShift,
        batch_date: queryDate,
        start_time,
        end_time,
        status: status || "completed",
        notes,
        had_delay: had_delay || "no",
        delay_reason: delay_reason || null,
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
      const { product_id, shift, status, date_from, date_to, limit } =
        req.query;
      const filters = {};

      // If user is not admin, filter by their unit
      if (req.user.role !== "admin") {
        filters.unit_id = req.user.unit_id;
      } else if (req.query.unit_id) {
        filters.unit_id = parseInt(req.query.unit_id);
      }

      if (product_id) filters.product_id = parseInt(product_id);
      if (shift) filters.shift = shift;
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
        shift,
        batch_in_shift,
        start_time,
        end_time,
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

      // Validate shift if provided
      if (shift) {
        const validShifts = ["morning", "afternoon", "night"];
        if (!validShifts.includes(shift)) {
          return res.status(400).json({
            success: false,
            message: "Invalid shift. Must be morning, afternoon, or night",
          });
        }
      }

      const updateData = {};
      if (quantity_produced !== undefined)
        updateData.quantity_produced = quantity_produced;
      if (shift) updateData.shift = shift;
      if (batch_in_shift !== undefined)
        updateData.batch_in_shift = batch_in_shift;
      if (start_time) updateData.start_time = start_time;
      if (end_time) updateData.end_time = end_time;
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

  // Get batches by shift
  static async getBatchesByShift(req, res) {
    try {
      const { unitId, shift } = req.params;
      const { date } = req.query;

      // Check if user has access to this unit
      if (req.user.role !== "admin" && parseInt(unitId) !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this unit",
        });
      }

      // Validate shift
      const validShifts = ["morning", "afternoon", "night"];
      if (!validShifts.includes(shift)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shift. Must be morning, afternoon, or night",
        });
      }

      const batches = await Batch.findByShift(unitId, shift, date);

      res.json({
        success: true,
        shift,
        date: date || "today",
        count: batches.length,
        data: batches,
      });
    } catch (error) {
      console.error("Get batches by shift error:", error);
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

  // Get shift statistics
  static async getShiftStatistics(req, res) {
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

      const statistics = await Batch.getShiftStatistics(
        unitId,
        date_from,
        date_to,
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("Get shift statistics error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching shift statistics",
        error: error.message,
      });
    }
  }

  // Get next batch in shift (helper endpoint) - now per product
  static async getNextBatchInShift(req, res) {
    try {
      const { productId, shift } = req.params;
      const { date } = req.query;

      // Verify product exists and user has access
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user has access to this product
      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const nextBatch = await Batch.getNextBatchInShift(productId, shift, date);

      res.json({
        success: true,
        data: {
          product_id: parseInt(productId),
          shift,
          date: date || new Date().toISOString().split("T")[0],
          next_batch_in_shift: nextBatch,
        },
      });
    } catch (error) {
      console.error("Get next batch in shift error:", error);
      res.status(500).json({
        success: false,
        message: "Error getting next batch number",
        error: error.message,
      });
    }
  }

  // Get shift types
  static async getShiftTypes(req, res) {
    try {
      const shifts = await Batch.getShiftTypes();

      res.json({
        success: true,
        data: shifts,
      });
    } catch (error) {
      console.error("Get shift types error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching shift types",
        error: error.message,
      });
    }
  }

  // Get used time slots for a specific product
  static async getUsedTimeSlots(req, res) {
    try {
      const { productId, shift } = req.params;
      const { date } = req.query;

      // Verify product exists and user has access
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user has access to this product
      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const usedSlots = await Batch.getUsedTimeSlots(productId, shift, date);

      res.json({
        success: true,
        data: usedSlots,
      });
    } catch (error) {
      console.error("Get used time slots error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching used time slots",
        error: error.message,
      });
    }
  }
}

export default BatchController;
