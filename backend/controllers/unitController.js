import Unit from "../models/Unit.js";

class UnitController {
  static async getAllUnits(req, res) {
    try {
      const units = await Unit.findAll();

      res.json({
        success: true,
        count: units.length,
        data: units,
      });
    } catch (error) {
      console.error("Get all units error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching units",
        error: error.message,
      });
    }
  }

  static async getUnitById(req, res) {
    try {
      const { id } = req.params;
      const unit = await Unit.findById(id);

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      console.error("Get unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching unit",
        error: error.message,
      });
    }
  }

  static async createUnit(req, res) {
    try {
      const { name, code, description, location } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Unit name and code are required",
        });
      }

      const unitData = { name, code, description, location };
      const unit = await Unit.create(unitData);

      res.status(201).json({
        success: true,
        message: "Unit created successfully",
        data: unit,
      });
    } catch (error) {
      console.error("Create unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating unit",
        error: error.message,
      });
    }
  }

  static async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const { name, code, description, location } = req.body;

      const unit = await Unit.findById(id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (code) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;

      const updatedUnit = await Unit.update(id, updateData);

      res.json({
        success: true,
        message: "Unit updated successfully",
        data: updatedUnit,
      });
    } catch (error) {
      console.error("Update unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating unit",
        error: error.message,
      });
    }
  }

  static async deleteUnit(req, res) {
    try {
      const { id } = req.params;

      const unit = await Unit.findById(id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      // Check if unit has users or products
      if (parseInt(unit.user_count) > 0 || parseInt(unit.product_count) > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete unit. It has ${unit.user_count} user(s) and ${unit.product_count} product(s) associated with it.`,
        });
      }

      await Unit.delete(id);

      res.json({
        success: true,
        message: "Unit deleted successfully",
      });
    } catch (error) {
      console.error("Delete unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting unit",
        error: error.message,
      });
    }
  }
}

export default UnitController;
