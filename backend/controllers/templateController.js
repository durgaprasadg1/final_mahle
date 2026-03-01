import ComponentTemplate from "../models/ComponentTemplate.js";

class TemplateController {
  static async listTemplates(req, res) {
    try {
      const { type } = req.params; // fractiles, cells, tiers
      const { fractile_id, cell_id } = req.query;
      const t = type.replace(/s$/i, "");
      
      // Determine parentId based on type
      let parentId = null;
      if (t === "cell" && fractile_id) parentId = parseInt(fractile_id);
      if (t === "tier" && cell_id) parentId = parseInt(cell_id);
      
      const rows = await ComponentTemplate.list(t, parentId);
      res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
      console.error("List templates error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error listing templates",
          error: error.message,
        });
    }
  }

  static async createTemplate(req, res) {
    try {
      const { type } = req.params; // fractiles, cells, tiers
      const t = type.replace(/s$/i, "");
      const { name, description, fractile_id, cell_id } = req.body;
      if (!name)
        return res
          .status(400)
          .json({ success: false, message: "Name required" });

      const created = await ComponentTemplate.create(t, {
        name,
        description,
        created_by: req.user?.id || null,
        fractile_id,
        cell_id,
      });
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      console.error("Create template error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error creating template",
          error: error.message,
        });
    }
  }

  static async updateTemplate(req, res) {
    try {
      const { type, id } = req.params;
      const t = type.replace(/s$/i, "");
      const { name, description } = req.body;
      const updated = await ComponentTemplate.update(t, id, {
        name,
        description,
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update template error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error updating template",
          error: error.message,
        });
    }
  }

  static async deleteTemplate(req, res) {
    try {
      const { type, id } = req.params;
      const t = type.replace(/s$/i, "");
      await ComponentTemplate.delete(t, id);
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      console.error("Delete template error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error deleting template",
          error: error.message,
        });
    }
  }

  // Get full hierarchy for a tier
  static async getTierHierarchy(req, res) {
    try {
      const { id } = req.params;
      const hierarchy = await ComponentTemplate.getTierHierarchy(id);
      if (!hierarchy) {
        return res.status(404).json({
          success: false,
          message: "Tier not found",
        });
      }
      res.json({ success: true, data: hierarchy });
    } catch (error) {
      console.error("Get tier hierarchy error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching tier hierarchy",
        error: error.message,
      });
    }
  }
}

export default TemplateController;
