import pool from "../config/database.js";
import bcrypt from "bcryptjs";
class User {
  static CRUD_OPERATIONS = ["create", "read", "update", "delete"];

  static RESOURCE_KEYS = ["product", "fracticle", "tier", "cells", "batch", "planning"];

  static RESOURCE_ALIASES = {
    product: "product",
    products: "product",
    fracticl: "fracticle",
    fracticle: "fracticle",
    fractile: "fracticle",
    fractiles: "fracticle",
    tier: "tier",
    tiers: "tier",
    cell: "cells",
    cells: "cells",
    batch: "batch",
    batches: "batch",
    planning: "planning",
    productionplanning: "planning",
    production_planning: "planning",
    productionplan: "planning",
    productionplans: "planning",
  };

  static normalizeResourceKey(resource) {
    const key = String(resource || "")
      .trim()
      .toLowerCase();
    return this.RESOURCE_ALIASES[key] || null;
  }

  static buildCrudObject(input = {}, fallback = false) {
    const normalized = {};
    this.CRUD_OPERATIONS.forEach((operation) => {
      const compactKey = operation[0];
      if (Object.prototype.hasOwnProperty.call(input, operation)) {
        normalized[operation] = Boolean(input[operation]);
      } else if (Object.prototype.hasOwnProperty.call(input, compactKey)) {
        normalized[operation] = Boolean(input[compactKey]);
      } else {
        normalized[operation] = Boolean(fallback);
      }
    });
    return normalized;
  }

  static aggregateResources(resources = {}) {
    const aggregate = this.buildCrudObject();
    this.RESOURCE_KEYS.forEach((resourceKey) => {
      const resourcePerms = this.buildCrudObject(resources[resourceKey]);
      this.CRUD_OPERATIONS.forEach((operation) => {
        aggregate[operation] = aggregate[operation] || resourcePerms[operation];
      });
    });
    return aggregate;
  }

  static buildResources(resourceInput = {}, fallbackCrud = null) {
    const resources = {};
    const normalizedResourceInput = {};

    Object.entries(resourceInput || {}).forEach(([resourceKey, value]) => {
      const normalizedKey = this.normalizeResourceKey(resourceKey);
      if (!normalizedKey || typeof value !== "object" || value === null) {
        return;
      }
      normalizedResourceInput[normalizedKey] = value;
    });

    this.RESOURCE_KEYS.forEach((resourceKey) => {
      const explicit =
        normalizedResourceInput[resourceKey] || resourceInput[resourceKey[0]];
      resources[resourceKey] = explicit
        ? this.buildCrudObject(explicit)
        : this.buildCrudObject(fallbackCrud || {});
    });
    return resources;
  }

  static parsePermissionsObject(rawObject = {}) {
    const compactMatrix = rawObject.m && typeof rawObject.m === "object" ? rawObject.m : {};
    const expandedMatrix =
      rawObject.resources && typeof rawObject.resources === "object"
        ? rawObject.resources
        : rawObject.matrix && typeof rawObject.matrix === "object"
          ? rawObject.matrix
          : rawObject.resource_permissions && typeof rawObject.resource_permissions === "object"
            ? rawObject.resource_permissions
            : {};

    const topLevelResources = this.RESOURCE_KEYS.reduce((acc, resourceKey) => {
      if (rawObject[resourceKey] && typeof rawObject[resourceKey] === "object") {
        acc[resourceKey] = rawObject[resourceKey];
      }
      return acc;
    }, {});

    const flatCrudFromInput = this.buildCrudObject(rawObject);
    const hasExplicitFlat = this.CRUD_OPERATIONS.some(
      (operation) =>
        Object.prototype.hasOwnProperty.call(rawObject, operation) ||
        Object.prototype.hasOwnProperty.call(rawObject, operation[0]),
    );

    const resources = this.buildResources(
      {
        ...compactMatrix,
        ...expandedMatrix,
        ...topLevelResources,
      },
      hasExplicitFlat ? flatCrudFromInput : null,
    );

    const aggregatedCrud = this.aggregateResources(resources);
    const effectiveCrud = hasExplicitFlat
      ? this.CRUD_OPERATIONS.reduce((acc, operation) => {
          acc[operation] = Boolean(flatCrudFromInput[operation] || aggregatedCrud[operation]);
          return acc;
        }, {})
      : aggregatedCrud;

    return {
      ...effectiveCrud,
      resources,
    };
  }

  // Backward-compatible name used by existing code paths.
  static permissionsToJSON(permissionsInput) {
    return this.permissionsToObject(permissionsInput);
  }

  static permissionsToStorage(permissionsInput) {
    const normalized = this.permissionsToObject(permissionsInput);

    const compactResources = {};
    this.RESOURCE_KEYS.forEach((resourceKey) => {
      const resourcePerms = normalized.resources?.[resourceKey] || {};
      compactResources[resourceKey] = {
        c: resourcePerms.create ? 1 : 0,
        r: resourcePerms.read ? 1 : 0,
        u: resourcePerms.update ? 1 : 0,
        d: resourcePerms.delete ? 1 : 0,
      };
    });

    const compactPayload = {
      c: normalized.create ? 1 : 0,
      r: normalized.read ? 1 : 0,
      u: normalized.update ? 1 : 0,
      d: normalized.delete ? 1 : 0,
      m: compactResources,
    };

    return JSON.stringify(compactPayload);
  }

  // Helper: Convert JSON object/string/csv to permissions object
  static permissionsToObject(permissionsInput) {
    if (permissionsInput && typeof permissionsInput === "object") {
      return this.parsePermissionsObject(permissionsInput);
    }

    if (typeof permissionsInput === "string") {
      try {
        const parsed = JSON.parse(permissionsInput);
        return this.parsePermissionsObject(parsed);
      } catch (error) {
        const permsArray = permissionsInput
          .split(",")
          .map((p) => p.trim().toLowerCase())
          .filter(Boolean);
        const flatCrud = {
          create: permsArray.includes("create"),
          read: permsArray.includes("read"),
          update: permsArray.includes("update"),
          delete: permsArray.includes("delete"),
        };
        return this.parsePermissionsObject(flatCrud);
      }
    }

    // Legacy-safe default: read access only.
    return this.parsePermissionsObject({ read: true });
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

    const permissionsObj = this.permissionsToObject(permissions);

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
      this.permissionsToStorage(permissionsObj),
      created_by,
    ];

    const result = await pool.query(query, values);
    const user = result.rows[0];

    // Convert permissions back to object for response
    user.permissions = this.permissionsToObject(user.permissions);

    return user;
  }

  // Find user by email for authentication
  static async findByEmail(email,password = null) {
    const query = `
      SELECT u.*, units.name as unit_name, units.code as unit_code
      FROM users u
      LEFT JOIN units ON u.unit_id = units.id
      WHERE u.email = $1 AND u.status != 'blocked' 
      LIMIT 1
    `;
    const result = await pool.query(query, [email]);

    if (!result.rows.length) {
      return null;
    }

    const user = result.rows[0];
    
    // Only verify password if provided
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
    }

    // Convert permissions to object for API response
    user.permissions = this.permissionsToObject(user.permissions);

    return user;
  }

  // Lightweight existence check used by create/update flows
  static async emailExists(email, excludeUserId = null) {
    const values = [email];
    let query = "SELECT 1 FROM users WHERE email = $1";

    if (excludeUserId) {
      values.push(excludeUserId);
      query += " AND id != $2";
    }

    query += " LIMIT 1";

    const result = await pool.query(query, values);
    return result.rows.length > 0;
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
          values.push(this.permissionsToStorage(updateData[key]));
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

  // Check if user has specific permission (supports optional resource scope)
  static hasPermission(permissionsInput, permission, resource = null) {
    if (!permission) {
      return false;
    }

    const normalizedPermissions = this.permissionsToObject(permissionsInput);

    if (resource) {
      const resourceKey = this.normalizeResourceKey(resource);
      if (!resourceKey) {
        return false;
      }
      return Boolean(normalizedPermissions.resources?.[resourceKey]?.[permission]);
    }

    return Boolean(normalizedPermissions?.[permission]);
  }
}

export default User;
