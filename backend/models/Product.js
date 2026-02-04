import pool from "../config/database.js";

class Product {
  // Create a new product
  static async create(productData) {
    const {
      name,
      type,
      unit_id,
      fractiles,
      cells,
      tiers,
      description,
      specifications,
      created_by,
    } = productData;

    const query = `
      INSERT INTO products (name, type, unit_id, fractiles, cells, tiers, description, specifications, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      name,
      type,
      unit_id,
      fractiles || 0,
      cells || 0,
      tiers || 0,
      description,
      specifications,
      created_by,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find product by ID
  static async findById(id) {
    const query = `
      SELECT p.*, 
             units.name as unit_name, units.code as unit_code,
             users.name as created_by_name
      FROM products p
      LEFT JOIN units ON p.unit_id = units.id
      LEFT JOIN users ON p.created_by = users.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all products with filters
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, 
             units.name as unit_name, units.code as unit_code,
             users.name as created_by_name
      FROM products p
      LEFT JOIN units ON p.unit_id = units.id
      LEFT JOIN users ON p.created_by = users.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.unit_id) {
      query += ` AND p.unit_id = $${paramCount}`;
      values.push(filters.unit_id);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND p.type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get products by unit
  static async findByUnit(unitId) {
    const query = `
      SELECT p.*, users.name as created_by_name
      FROM products p
      LEFT JOIN users ON p.created_by = users.id
      WHERE p.unit_id = $1
      ORDER BY p.name
    `;
    const result = await pool.query(query, [unitId]);
    return result.rows;
  }

  // Update product
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
      UPDATE products
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete product
  static async delete(id) {
    const query = "DELETE FROM products WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get product types enum
  static async getProductTypes() {
    const query = `
      SELECT unnest(enum_range(NULL::product_type))::text as type
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => row.type);
  }
}

export default Product;
