import pool from "../config/database.js";

class Unit {
  // Get all units
  static async findAll() {
    const query = `
      SELECT u.*,
             COUNT(DISTINCT users.id) as user_count,
             COUNT(DISTINCT products.id) as product_count
      FROM units u
      LEFT JOIN users ON u.id = users.unit_id AND users.role = 'user'
      LEFT JOIN products ON u.id = products.unit_id
      GROUP BY u.id
      ORDER BY u.name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Find unit by ID
  static async findById(id) {
    const query = `
      SELECT u.*,
             COUNT(DISTINCT users.id) as user_count,
             COUNT(DISTINCT products.id) as product_count
      FROM units u
      LEFT JOIN users ON u.id = users.unit_id AND users.role = 'user'
      LEFT JOIN products ON u.id = products.unit_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find unit by code
  static async findByCode(code) {
    const query = "SELECT * FROM units WHERE code = $1";
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  static async create(unitData) {
    const { name, code, description, location } = unitData;
    const query = `
      INSERT INTO units (name, code, description, location)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [name, code, description, location];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && key !== "id") {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      console.log("No fields to update");
      return ;
    }

    values.push(id);
    const query = `
      UPDATE units
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default Unit;
