import pool from "../config/database.js";

class User {
  // Helper: Convert permissions to JSON object for JSONB storage
  static permissionsToJSON(permissionsInput) {
    // If already an object, return as-is
    if (typeof permissionsInput === "object" && permissionsInput !== null) {
      return {
        create: Boolean(permissionsInput.create),
        read: Boolean(permissionsInput.read),
        update: Boolean(permissionsInput.update),
        delete: Boolean(permissionsInput.delete),
      };
    }

    // If string like "create,read", convert to object
    if (typeof permissionsInput === "string") {
      const permsArray = permissionsInput.split(",").map((p) => p.trim());
      return {
        create: permsArray.includes("create"),
        read: permsArray.includes("read"),
        update: permsArray.includes("update"),
        delete: permsArray.includes("delete"),
      };
    }

    // Default permissions
    return { create: false, read: true, update: false, delete: false };
  }

  // Helper: Convert JSON object/string to permissions object
  static permissionsToObject(permissionsInput) {
    // If string (from database JSONB or CSV)
    if (typeof permissionsInput === "string") {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(permissionsInput);
        return this.permissionsToJSON(parsed);
      } catch (e) {
        // Fall back to CSV parsing
        const permsArray = permissionsInput.split(",").map((p) => p.trim());
        return {
          create: permsArray.includes("create"),
          read: permsArray.includes("read"),
          update: permsArray.includes("update"),
          delete: permsArray.includes("delete"),
        };
      }
    }

    // If already an object
    return this.permissionsToJSON(permissionsInput);
  }

  // Create a new user
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

    // Convert permissions to JSON object
    const permissionsObj = this.permissionsToJSON(permissions);

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
      JSON.stringify(permissionsObj), // Store as JSON string for JSONB column
      created_by,
    ];

    const result = await pool.query(query, values);
    const user = result.rows[0];

    // Convert permissions back to object for response
    user.permissions = this.permissionsToObject(user.permissions);

    return user;
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
    
    if (!result.rows.length) {
      return null;
    }

    const user = result.rows[0];
    // Convert permissions to object for API response
    user.permissions = this.permissionsToObject(user.permissions);
    
    return user;
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
    
    if (!result.rows.length) {
      return null;
    }

    const user = result.rows[0];
    // Convert permissions to object for API response
    user.permissions = this.permissionsToObject(user.permissions);
    
    return user;
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
    
    // Convert permissions to object for all users
    result.rows.forEach((user) => {
      user.permissions = this.permissionsToObject(user.permissions);
    });

    return result.rows;
  }

  // Update user
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && key !== "id") {
        // Special handling for permissions
        if (key === "permissions") {
          fields.push(`${key} = $${paramCount}`);
          const permissionsObj = this.permissionsToJSON(updateData[key]);
          values.push(JSON.stringify(permissionsObj)); // Convert to JSON string for JSONB
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
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
    const user = result.rows[0];

    // Convert permissions back to object
    user.permissions = this.permissionsToObject(user.permissions);

    return user;
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
    
    // Convert permissions to object for all users
    result.rows.forEach((user) => {
      user.permissions = this.permissionsToObject(user.permissions);
    });

    return result.rows;
  }

  // Check if user has specific permission
  static hasPermission(permissionsStr, permission) {
    if (!permissionsStr || typeof permissionsStr !== "string") {
      return false;
    }
    const permsArray = permissionsStr.split(",").map((p) => p.trim());
    return permsArray.includes(permission);
  }
}

export default User;
