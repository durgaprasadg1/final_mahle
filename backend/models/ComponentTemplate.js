import pool from "../config/database.js";

class ComponentTemplate {
  // type should be one of 'fractile','cell','tier' but we use separate tables for simplicity
  static async list(type) {
    let table;
    if (type === "fractile") table = "fractile_templates";
    else if (type === "cell") table = "cell_templates";
    else table = "tier_templates";

    const result = await pool.query(`SELECT * FROM ${table} ORDER BY name`);
    return result.rows;
  }

  static async create(type, data) {
    const { name, description, created_by } = data;
    let table;
    if (type === "fractile") table = "fractile_templates";
    else if (type === "cell") table = "cell_templates";
    else table = "tier_templates";

    const query = `INSERT INTO ${table} (name, description, created_by) VALUES ($1, $2, $3) RETURNING *`;
    const result = await pool.query(query, [name, description, created_by]);
    return result.rows[0];
  }

  static async update(type, id, data) {
    const { name, description } = data;
    let table;
    if (type === "fractile") table = "fractile_templates";
    else if (type === "cell") table = "cell_templates";
    else table = "tier_templates";

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

  static async delete(type, id) {
    let table;
    if (type === "fractile") table = "fractile_templates";
    else if (type === "cell") table = "cell_templates";
    else table = "tier_templates";

    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default ComponentTemplate;
