import ComponentTemplate from "../models/ComponentTemplate.js";
import pool from "../config/database.js";

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

  static async createHierarchy(req, res) {
    const client = await pool.connect();
    try {
      const { fractile, cells = [] } = req.body;

      const fractileName = String(fractile?.name || "").trim();
      const fractileDescription = fractile?.description || "";

      if (!fractileName) {
        return res.status(400).json({
          success: false,
          message: "Fractile name is required",
        });
      }

      await client.query("BEGIN");

      const fractileInsert = await client.query(
        `INSERT INTO fractile_templates (name, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [fractileName, fractileDescription, req.user?.id || null],
      );

      const createdFractile = fractileInsert.rows[0];
      const createdCells = [];
      const createdTiers = [];

      for (const rawCell of cells) {
        const cellName = String(rawCell?.name || "").trim();
        const cellDescription = rawCell?.description || "";

        if (!cellName) continue;

        const cellInsert = await client.query(
          `INSERT INTO cell_templates (fractile_id, name, description, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            createdFractile.id,
            cellName,
            cellDescription,
            req.user?.id || null,
          ],
        );

        const createdCell = cellInsert.rows[0];
        createdCells.push(createdCell);

        const tiers = Array.isArray(rawCell?.tiers) ? rawCell.tiers : [];
        for (const rawTier of tiers) {
          const tierName = String(rawTier?.name || "").trim();
          const tierDescription = rawTier?.description || "";

          if (!tierName) continue;

          const tierInsert = await client.query(
            `INSERT INTO tier_templates (cell_id, name, description, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [createdCell.id, tierName, tierDescription, req.user?.id || null],
          );

          createdTiers.push(tierInsert.rows[0]);
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Hierarchy created successfully",
        data: {
          fractile: createdFractile,
          cells: createdCells,
          tiers: createdTiers,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");

      if (error?.code === "23505") {
        let message = "Duplicate template name in hierarchy";

        if (error.constraint === "fractile_templates_name_key") {
          message = "Fractile name already exists";
        } else if (error.constraint === "unique_cell_per_fractile") {
          message = "Cell name already exists in this fractile";
        } else if (error.constraint === "unique_tier_per_cell") {
          message = "Tier name already exists in this cell";
        }

        return res.status(409).json({
          success: false,
          message,
          error: error.detail,
        });
      }

      console.error("Create hierarchy error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating hierarchy",
        error: error.message,
      });
    } finally {
      client.release();
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
