import pool from "../config/database.js";

class User {
  static async create(userData) {
    const {
      email,
      password,
      name,
      role,
      status,
      unit_id,
      permissions,
      created_by,
    } = userData;

    const query = `
      INSERT INTO users (email, password, name, role, status, unit_id, permissions, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, name, role, status, unit_id, permissions, created_at
    `;

    const values = [
      email,
      password,
      name,
      role || "user",
      status || "active",
      unit_id,
      permissions,
      created_by,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = `
      SELECT u.*, units.name as unit_name, units.code as unit_code
      FROM users u
      LEFT JOIN units ON u.unit_id = units.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT u.*, units.name as unit_name, units.code as unit_code
      FROM users u
      LEFT JOIN units ON u.unit_id = units.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all users (with filters)
  static async findAll(filters = {}) {
    let query = `
      SELECT u.id, u.email, u.name, u.role, u.status, u.unit_id, u.permissions, 
             u.created_at, u.last_login,
             units.name as unit_name, units.code as unit_code,
             creator.name as created_by_name
      FROM users u
      LEFT JOIN units ON u.unit_id = units.id
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.unit_id) {
      query += ` AND u.unit_id = $${paramCount}`;
      values.push(filters.unit_id);
      paramCount++;
    }

    if (filters.role) {
      query += ` AND u.role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND u.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Update user
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
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, status, unit_id, permissions, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete user
  static async delete(id) {
    const query = "DELETE FROM users WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Update last login
  static async updateLastLogin(id) {
    const query =
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1";
    await pool.query(query, [id]);
  }

  // Block/Unblock user
  static async updateStatus(id, status) {
    const query = `
      UPDATE users SET status = $1 WHERE id = $2
      RETURNING id, email, name, status
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // Get users by unit
  static async findByUnit(unitId) {
    const query = `
      SELECT id, email, name, role, status, permissions, created_at
      FROM users
      WHERE unit_id = $1 AND role = 'user'
      ORDER BY name
    `;
    const result = await pool.query(query, [unitId]);
    return result.rows;
  }
}

export default User;
