import pool from "../config/database.js";

class ComponentTemplate {
  // List templates - type: 'fractile', 'cell', 'tier'
  static async list(type, parentId = null) {
    if (type === "fractile") {
      const result = await pool.query(
        `SELECT * FROM fractile_templates ORDER BY name`
      );
      return result.rows;
    } else if (type === "cell") {
      // If parentId provided, filter by fractile_id
      if (parentId) {
        const result = await pool.query(
          `SELECT ct.*, ft.name as fractile_name 
           FROM cell_templates ct
           JOIN fractile_templates ft ON ct.fractile_id = ft.id
           WHERE ct.fractile_id = $1 
           ORDER BY ct.name`,
          [parentId]
        );
        return result.rows;
      }
      const result = await pool.query(
        `SELECT ct.*, ft.name as fractile_name 
         FROM cell_templates ct
         JOIN fractile_templates ft ON ct.fractile_id = ft.id
         ORDER BY ft.name, ct.name`
      );
      return result.rows;
    } else if (type === "tier") {
      // If parentId provided, filter by cell_id
      if (parentId) {
        const result = await pool.query(
          `SELECT tt.*, ct.name as cell_name, ft.name as fractile_name, ct.fractile_id
           FROM tier_templates tt
           JOIN cell_templates ct ON tt.cell_id = ct.id
           JOIN fractile_templates ft ON ct.fractile_id = ft.id
           WHERE tt.cell_id = $1
           ORDER BY tt.name`,
          [parentId]
        );
        return result.rows;
      }
      const result = await pool.query(
        `SELECT tt.*, ct.name as cell_name, ft.name as fractile_name, ct.fractile_id
         FROM tier_templates tt
         JOIN cell_templates ct ON tt.cell_id = ct.id
         JOIN fractile_templates ft ON ct.fractile_id = ft.id
         ORDER BY ft.name, ct.name, tt.name`
      );
      return result.rows;
    }
    throw new Error("Invalid type");
  }

  // Create template
  static async create(type, data) {
    const { name, description, created_by, fractile_id, cell_id } = data;

    if (type === "fractile") {
      const query = `INSERT INTO fractile_templates (name, description, created_by) 
                     VALUES ($1, $2, $3) RETURNING *`;
      const result = await pool.query(query, [name, description, created_by]);
      return result.rows[0];
    } else if (type === "cell") {
      if (!fractile_id) throw new Error("fractile_id is required for cell");
      const query = `INSERT INTO cell_templates (fractile_id, name, description, created_by) 
                     VALUES ($1, $2, $3, $4) RETURNING *`;
      const result = await pool.query(query, [fractile_id, name, description, created_by]);
      return result.rows[0];
    } else if (type === "tier") {
      if (!cell_id) throw new Error("cell_id is required for tier");
      const query = `INSERT INTO tier_templates (cell_id, name, description, created_by) 
                     VALUES ($1, $2, $3, $4) RETURNING *`;
      const result = await pool.query(query, [cell_id, name, description, created_by]);
      return result.rows[0];
    }
    throw new Error("Invalid type");
  }

  // Update template
  static async update(type, id, data) {
    const { name, description } = data;
    let table;
    if (type === "fractile") table = "fractile_templates";
    else if (type === "cell") table = "cell_templates";
    else if (type === "tier") table = "tier_templates";
    else throw new Error("Invalid type");

    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (fields.length === 0) throw new Error("No fields to update");
    values.push(id);
    const query = `UPDATE ${table} SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete template
  static async delete(type, id) {
    let table;
    if (type === "fractile") table = "fractile_templates";
    else if (type === "cell") table = "cell_templates";
    else if (type === "tier") table = "tier_templates";
    else throw new Error("Invalid type");

    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get full hierarchy for a tier (used when creating product)
  static async getTierHierarchy(tierId) {
    const query = `
      SELECT 
        tt.id as tier_id,
        tt.name as tier_name,
        tt.description as tier_description,
        ct.id as cell_id,
        ct.name as cell_name,
        ct.description as cell_description,
        ft.id as fractile_id,
        ft.name as fractile_name,
        ft.description as fractile_description
      FROM tier_templates tt
      JOIN cell_templates ct ON tt.cell_id = ct.id
      JOIN fractile_templates ft ON ct.fractile_id = ft.id
      WHERE tt.id = $1
    `;
    const result = await pool.query(query, [tierId]);
    if (!result.rows.length) return null;
    
    const row = result.rows[0];
    return {
      tier: {
        id: row.tier_id,
        name: row.tier_name,
        description: row.tier_description,
      },
      cell: {
        id: row.cell_id,
        name: row.cell_name,
        description: row.cell_description,
      },
      fractile: {
        id: row.fractile_id,
        name: row.fractile_name,
        description: row.fractile_description,
      },
    };
  }
}

export default ComponentTemplate;
