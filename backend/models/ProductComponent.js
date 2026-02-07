import pool from "../config/database.js";

class ProductComponent {
  // ========== FRACTILES ==========
  
  static async createFractile(productId, fractileData) {
    const { name, count, description } = fractileData;
    const query = `
      INSERT INTO product_fractiles (product_id, name, count, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [productId, name, count || 0, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async createFractiles(productId, fractilesArray) {
    if (!fractilesArray || fractilesArray.length === 0) return [];
    
    const results = [];
    for (const fractile of fractilesArray) {
      const result = await this.createFractile(productId, fractile);
      results.push(result);
    }
    return results;
  }

  static async getFractilesByProduct(productId) {
    const query = `
      SELECT * FROM product_fractiles
      WHERE product_id = $1
      ORDER BY name
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  }

  static async updateFractile(id, updateData) {
    const { name, count, description } = updateData;
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (count !== undefined) {
      fields.push(`count = $${paramCount}`);
      values.push(count);
      paramCount++;
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `
      UPDATE product_fractiles
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteFractile(id) {
    const query = "DELETE FROM product_fractiles WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteFractilesByProduct(productId) {
    const query = "DELETE FROM product_fractiles WHERE product_id = $1";
    await pool.query(query, [productId]);
  }

  // ========== CELLS ==========
  
  static async createCell(productId, cellData) {
    const { name, count, description } = cellData;
    const query = `
      INSERT INTO product_cells (product_id, name, count, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [productId, name, count || 0, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async createCells(productId, cellsArray) {
    if (!cellsArray || cellsArray.length === 0) return [];
    
    const results = [];
    for (const cell of cellsArray) {
      const result = await this.createCell(productId, cell);
      results.push(result);
    }
    return results;
  }

  static async getCellsByProduct(productId) {
    const query = `
      SELECT * FROM product_cells
      WHERE product_id = $1
      ORDER BY name
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  }

  static async updateCell(id, updateData) {
    const { name, count, description } = updateData;
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (count !== undefined) {
      fields.push(`count = $${paramCount}`);
      values.push(count);
      paramCount++;
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `
      UPDATE product_cells
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteCell(id) {
    const query = "DELETE FROM product_cells WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteCellsByProduct(productId) {
    const query = "DELETE FROM product_cells WHERE product_id = $1";
    await pool.query(query, [productId]);
  }

  // ========== TIERS ==========
  
  static async createTier(productId, tierData) {
    const { name, count, description } = tierData;
    const query = `
      INSERT INTO product_tiers (product_id, name, count, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [productId, name, count || 0, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async createTiers(productId, tiersArray) {
    if (!tiersArray || tiersArray.length === 0) return [];
    
    const results = [];
    for (const tier of tiersArray) {
      const result = await this.createTier(productId, tier);
      results.push(result);
    }
    return results;
  }

  static async getTiersByProduct(productId) {
    const query = `
      SELECT * FROM product_tiers
      WHERE product_id = $1
      ORDER BY name
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  }

  static async updateTier(id, updateData) {
    const { name, count, description } = updateData;
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (count !== undefined) {
      fields.push(`count = $${paramCount}`);
      values.push(count);
      paramCount++;
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `
      UPDATE product_tiers
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteTier(id) {
    const query = "DELETE FROM product_tiers WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteTiersByProduct(productId) {
    const query = "DELETE FROM product_tiers WHERE product_id = $1";
    await pool.query(query, [productId]);
  }

  // ========== COMBINED OPERATIONS ==========
  
  static async getAllComponentsByProduct(productId) {
    const [fractiles, cells, tiers] = await Promise.all([
      this.getFractilesByProduct(productId),
      this.getCellsByProduct(productId),
      this.getTiersByProduct(productId),
    ]);

    return { fractiles, cells, tiers };
  }

  static async deleteAllComponentsByProduct(productId) {
    await Promise.all([
      this.deleteFractilesByProduct(productId),
      this.deleteCellsByProduct(productId),
      this.deleteTiersByProduct(productId),
    ]);
  }

  // Replace all components for a product (used in updates)
  static async replaceAllComponents(productId, components) {
    const { fractiles, cells, tiers } = components;

    // Delete existing components
    await this.deleteAllComponentsByProduct(productId);

    // Create new components
    const results = await Promise.all([
      this.createFractiles(productId, fractiles),
      this.createCells(productId, cells),
      this.createTiers(productId, tiers),
    ]);

    return {
      fractiles: results[0],
      cells: results[1],
      tiers: results[2],
    };
  }
}

export default ProductComponent;
