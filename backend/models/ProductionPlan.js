import pool from "../config/database.js";

class ProductionPlan {
  static tableReady = false;

  static async ensureTableExists() {
    if (this.tableReady) return;

    const query = `
      CREATE TABLE IF NOT EXISTS production_plans (
        id SERIAL PRIMARY KEY,
        unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        shift shift_type NOT NULL,
        plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
        target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_production_plan UNIQUE(unit_id, product_id, shift, plan_date)
      );

      CREATE INDEX IF NOT EXISTS idx_production_plans_unit ON production_plans(unit_id);
      CREATE INDEX IF NOT EXISTS idx_production_plans_product_date ON production_plans(product_id, plan_date);
      CREATE INDEX IF NOT EXISTS idx_production_plans_shift_date ON production_plans(shift, plan_date);
    `;

    await pool.query(query);
    this.tableReady = true;
  }

  static async upsert(planData) {
    await this.ensureTableExists();

    const {
      unit_id,
      product_id,
      shift,
      plan_date,
      target_quantity,
      notes,
      created_by,
      updated_by,
    } = planData;

    const query = `
      INSERT INTO production_plans (
        unit_id, product_id, shift, plan_date, target_quantity, notes, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (unit_id, product_id, shift, plan_date)
      DO UPDATE
      SET
        target_quantity = EXCLUDED.target_quantity,
        notes = EXCLUDED.notes,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      unit_id,
      product_id,
      shift,
      plan_date,
      target_quantity,
      notes || null,
      created_by || null,
      updated_by || created_by || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    await this.ensureTableExists();

    let query = `
      SELECT
        pp.*,
        p.name as product_name,
        p.type as product_type,
        u.name as unit_name,
        u.code as unit_code,
        creator.name as created_by_name,
        updater.name as updated_by_name,
        COALESCE(prod.total_produced, 0) as produced_quantity
      FROM production_plans pp
      JOIN products p ON pp.product_id = p.id
      JOIN units u ON pp.unit_id = u.id
      LEFT JOIN users creator ON pp.created_by = creator.id
      LEFT JOIN users updater ON pp.updated_by = updater.id
      LEFT JOIN (
        SELECT
          product_id,
          shift,
          batch_date,
          SUM(quantity_produced) as total_produced
        FROM batches
        GROUP BY product_id, shift, batch_date
      ) prod ON prod.product_id = pp.product_id
            AND prod.shift = pp.shift
            AND prod.batch_date = pp.plan_date
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.unit_id) {
      query += ` AND pp.unit_id = $${paramCount}`;
      values.push(filters.unit_id);
      paramCount++;
    }

    if (filters.product_id) {
      query += ` AND pp.product_id = $${paramCount}`;
      values.push(filters.product_id);
      paramCount++;
    }

    if (filters.shift) {
      query += ` AND pp.shift = $${paramCount}`;
      values.push(filters.shift);
      paramCount++;
    }

    if (filters.plan_date) {
      query += ` AND pp.plan_date = $${paramCount}`;
      values.push(filters.plan_date);
      paramCount++;
    }

    if (filters.date_from) {
      query += ` AND pp.plan_date >= $${paramCount}`;
      values.push(filters.date_from);
      paramCount++;
    }

    if (filters.date_to) {
      query += ` AND pp.plan_date <= $${paramCount}`;
      values.push(filters.date_to);
      paramCount++;
    }

    query += ` ORDER BY pp.plan_date DESC, pp.shift, pp.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    await this.ensureTableExists();

    const query = `
      SELECT pp.*, p.name as product_name, p.type as product_type
      FROM production_plans pp
      JOIN products p ON pp.product_id = p.id
      WHERE pp.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getTargetProgress({ unit_id, product_id, shift, plan_date }) {
    await this.ensureTableExists();

    const query = `
      SELECT
        pp.id,
        pp.unit_id,
        pp.product_id,
        pp.shift,
        pp.plan_date,
        pp.target_quantity,
        pp.notes,
        p.name as product_name,
        COALESCE(SUM(b.quantity_produced), 0) as produced_quantity
      FROM production_plans pp
      JOIN products p ON pp.product_id = p.id
      LEFT JOIN batches b
        ON b.product_id = pp.product_id
        AND b.shift = pp.shift
        AND b.batch_date = pp.plan_date
      WHERE pp.unit_id = $1
        AND pp.product_id = $2
        AND pp.shift = $3
        AND pp.plan_date = $4
      GROUP BY pp.id, p.name
      LIMIT 1
    `;

    const result = await pool.query(query, [unit_id, product_id, shift, plan_date]);
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const targetQuantity = Number(row.target_quantity || 0);
    const producedQuantity = Number(row.produced_quantity || 0);

    return {
      ...row,
      target_quantity: targetQuantity,
      produced_quantity: producedQuantity,
      remaining_quantity: targetQuantity - producedQuantity,
    };
  }

  static async update(id, updateData) {
    await this.ensureTableExists();

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

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const query = `
      UPDATE production_plans
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    await this.ensureTableExists();

    const query = `DELETE FROM production_plans WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default ProductionPlan;
