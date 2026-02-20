import pool from "../config/database.js";

class Shift {
  static _columnsCache = null;

  static async getTableColumns() {
    if (Shift._columnsCache) {
      return Shift._columnsCache;
    }

    const result = await pool.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'shifts'
      `,
    );

    Shift._columnsCache = new Set(result.rows.map((row) => row.column_name));
    return Shift._columnsCache;
  }

  static async create(shiftData) {
    const { name, start_time, end_time, description, is_active, unit_id, created_by } = shiftData;

    const tableColumns = await Shift.getTableColumns();
    const insertData = {
      name,
      start_time: start_time || null,
      end_time: end_time || null,
      description: description || null,
      is_active: is_active === false ? false : true,
    };

    if (tableColumns.has("unit_id")) {
      insertData.unit_id = unit_id || null;
    }

    if (tableColumns.has("created_by")) {
      insertData.created_by = created_by || null;
    }

    const columns = Object.keys(insertData);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = columns.map((column) => insertData[column]);

    const query = `
      INSERT INTO shifts (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    const tableColumns = await Shift.getTableColumns();
    const hasUnitId = tableColumns.has("unit_id");

    let query = hasUnitId
      ? `SELECT s.*, u.name as unit_name, u.code as unit_code FROM shifts s LEFT JOIN units u ON s.unit_id = u.id WHERE 1=1`
      : `SELECT s.* FROM shifts s WHERE 1=1`;
    const values = [];
    let param = 1;

    if (filters.unit_id && hasUnitId) {
      query += ` AND s.unit_id = $${param}`;
      values.push(filters.unit_id);
      param++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND s.is_active = $${param}`;
      values.push(filters.is_active);
      param++;
    }

    query += ` ORDER BY s.name`;
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const tableColumns = await Shift.getTableColumns();
    const hasUnitId = tableColumns.has("unit_id");

    const query = hasUnitId
      ? `SELECT s.*, u.name as unit_name, u.code as unit_code FROM shifts s LEFT JOIN units u ON s.unit_id = u.id WHERE s.id = $1`
      : `SELECT s.* FROM shifts s WHERE s.id = $1`;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let param = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && key !== "id") {
        fields.push(`${key} = $${param}`);
        values.push(updateData[key]);
        param++;
      }
    });

    if (fields.length === 0) throw new Error("No fields to update");

    values.push(id);
    const query = `UPDATE shifts SET ${fields.join(", ")} WHERE id = $${param} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `DELETE FROM shifts WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default Shift;
