import pool from "../config/database.js";
import ProductComponent from "./ProductComponent.js";

class Product {
  // Create a new product with components
  static async create(productData) {
    const {
      name,
      type,
      unit_id,
      description,
      specifications,
      created_by,
      tier_id,
      // Hierarchy info from templates (passed from controller)
      tierName,
      tierDescription,
      cellName,
      cellDescription,
      fractileName,
      fractileDescription,
      // Legacy array-based approach
      fractiles,
      cells,
      tiers,
    } = productData;

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      // Insert product
      const productQuery = `
        INSERT INTO products (name, type, unit_id, description, specifications, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const productValues = [
        name,
        type,
        unit_id,
        description,
        typeof specifications === "object" && specifications !== null
          ? JSON.stringify(specifications)
          : specifications, // Ensure VARCHAR stores a string
        created_by,
      ];

      const productResult = await client.query(productQuery, productValues);
      const product = productResult.rows[0];

      // If tier_id and hierarchy info is provided (from templates)
      if (tier_id && tierName) {
        // Insert tier
        const insertedTierResult = await client.query(
          `INSERT INTO product_tiers (product_id, name, count, description)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [product.id, tierName, 0, tierDescription]
        );
        const insertedTier = insertedTierResult.rows[0];

        // Insert cell linked to tier
        const insertedCellResult = await client.query(
          `INSERT INTO product_cells (product_id, tier_id, name, count, description)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [product.id, insertedTier.id, cellName, 0, cellDescription]
        );
        const insertedCell = insertedCellResult.rows[0];

        // Insert fractile linked to cell
        await client.query(
          `INSERT INTO product_fractiles (product_id, cell_id, name, count, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, insertedCell.id, fractileName, 0, fractileDescription]
        );
      } else {
        // Backward-compatible component insertion (legacy array approach)
        if (fractiles && fractiles.length > 0) {
          for (const fractile of fractiles) {
            await client.query(
              `INSERT INTO product_fractiles (product_id, name, count, description)
               VALUES ($1, $2, $3, $4)`,
              [product.id, fractile.name, fractile.count || 0, fractile.description],
            );
          }
        }

        if (cells && cells.length > 0) {
          for (const cell of cells) {
            await client.query(
              `INSERT INTO product_cells (product_id, name, count, description)
               VALUES ($1, $2, $3, $4)`,
              [product.id, cell.name, cell.count || 0, cell.description],
            );
          }
        }

        if (tiers && tiers.length > 0) {
          for (const tier of tiers) {
            await client.query(
              `INSERT INTO product_tiers (product_id, name, count, description)
               VALUES ($1, $2, $3, $4)`,
              [product.id, tier.name, tier.count || 0, tier.description],
            );
          }
        }
      }

      await client.query("COMMIT");

      // Get the complete product with components
      return await this.findById(product.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Find product by ID with all components
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
    
    if (!result.rows.length) {
      return null;
    }

    const product = result.rows[0];

    // Attempt to parse specifications back to JSON if stored as stringified JSON
    if (product && product.specifications && typeof product.specifications === "string") {
      try {
        product.specifications = JSON.parse(product.specifications);
      } catch (e) {
        // keep as string if not valid JSON
      }
    }
    // Get components
    const components = await ProductComponent.getAllComponentsByProduct(id);
    product.fractiles = components.fractiles;
    product.cells = components.cells;
    product.tiers = components.tiers;

    return product;
  }

  // Get all products with filters (without components for performance)
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
    // Parse specifications for each product when possible
    result.rows.forEach((p) => {
      if (p && p.specifications && typeof p.specifications === "string") {
        try {
          p.specifications = JSON.parse(p.specifications);
        } catch (e) {
          // leave as string
        }
      }
    });

    return result.rows;
  }

  // Get all products with components (for detailed view)
  static async findAllWithComponents(filters = {}) {
    const products = await this.findAll(filters);
    
    // Fetch components for each product
    for (const product of products) {
      const components = await ProductComponent.getAllComponentsByProduct(product.id);
      product.fractiles = components.fractiles;
      product.cells = components.cells;
      product.tiers = components.tiers;
    }

    return products;
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
    const {
      name,
      type,
      description,
      specifications,
      fractiles,
      cells,
      tiers,
    } = updateData;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update product basic info
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        fields.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (type !== undefined) {
        fields.push(`type = $${paramCount}`);
        values.push(type);
        paramCount++;
      }
      if (description !== undefined) {
        fields.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (specifications !== undefined) {
        fields.push(`specifications = $${paramCount}`);
        values.push(
          typeof specifications === "object" && specifications !== null
            ? JSON.stringify(specifications)
            : specifications
        );
        paramCount++;
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `
          UPDATE products
          SET ${fields.join(", ")}
          WHERE id = $${paramCount}
          RETURNING *
        `;
        await client.query(query, values);
      }

      // Update components if provided
      if (fractiles !== undefined || cells !== undefined || tiers !== undefined) {
        await ProductComponent.replaceAllComponents(id, {
          fractiles: fractiles || [],
          cells: cells || [],
          tiers: tiers || [],
        });
      }

      await client.query("COMMIT");

      return await this.findById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete product (components will be deleted by CASCADE)
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

  // Get component counts for a product (quick summary)
  static async getComponentCounts(productId) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM product_fractiles WHERE product_id = $1) as fractile_count,
        (SELECT COUNT(*) FROM product_cells WHERE product_id = $1) as cell_count,
        (SELECT COUNT(*) FROM product_tiers WHERE product_id = $1) as tier_count
    `;
    const result = await pool.query(query, [productId]);
    return result.rows[0];
  }
}

export default Product;
