import Shift from "../models/Shift.js";

class ShiftController {
  static async createShift(req, res) {
    try {
      const { name, start_time, end_time, description, is_active, unit_id } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: "Shift name is required" });
      }

      const shift = await Shift.create({
        name,
        start_time,
        end_time,
        description,
        is_active: is_active === false ? false : true,
        unit_id: unit_id || null,
        created_by: req.user?.id || null,
      });

      res.status(201).json({ success: true, data: shift, message: "Shift created" });
    } catch (error) {
      console.error("Create shift error:", error);
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Shift already exists" });
      }

      if (error.code === "23503") {
        return res.status(400).json({ success: false, message: "Invalid unit or user reference" });
      }

      if (error.code === "23502" || error.code === "22P02") {
        return res.status(400).json({ success: false, message: "Invalid shift data" });
      }

      res.status(500).json({ success: false, message: "Error creating shift", error: error.message });
    }
  }

  static async getAllShifts(req, res) {
    try {
      const filters = {};
      if (req.query.unit_id) filters.unit_id = parseInt(req.query.unit_id);
      if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

      const shifts = await Shift.findAll(filters);
      res.json({ success: true, count: shifts.length, data: shifts });
    } catch (error) {
      console.error("Get shifts error:", error);
      res.status(500).json({ success: false, message: "Error fetching shifts", error: error.message });
    }
  }

  static async getShiftById(req, res) {
    try {
      const { id } = req.params;
      const shift = await Shift.findById(id);
      if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });
      res.json({ success: true, data: shift });
    } catch (error) {
      console.error("Get shift error:", error);
      res.status(500).json({ success: false, message: "Error fetching shift", error: error.message });
    }
  }

  static async updateShift(req, res) {
    try {
      const { id } = req.params;
      const updated = await Shift.update(id, req.body);
      res.json({ success: true, data: updated, message: "Shift updated" });
    } catch (error) {
      console.error("Update shift error:", error);
      res.status(500).json({ success: false, message: "Error updating shift", error: error.message });
    }
  }

  static async deleteShift(req, res) {
    try {
      const { id } = req.params;
      await Shift.delete(id);
      res.json({ success: true, message: "Shift deleted" });
    } catch (error) {
      console.error("Delete shift error:", error);
      res.status(500).json({ success: false, message: "Error deleting shift", error: error.message });
    }
  }
}

export default ShiftController;
