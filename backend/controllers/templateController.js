import ComponentTemplate from "../models/ComponentTemplate.js";

class TemplateController {
  static async listTemplates(req, res) {
    try {
      const { type } = req.params; // fractiles, cells, tiers
      const t = type.replace(/s$/i, "");
      const rows = await ComponentTemplate.list(t);
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
      const { name, description } = req.body;
      if (!name)
        return res
          .status(400)
          .json({ success: false, message: "Name required" });

      const created = await ComponentTemplate.create(t, {
        name,
        description,
        created_by: req.user?.id || null,
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
}

export default TemplateController;
