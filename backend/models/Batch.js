import pool from "../config/database.js";

class Batch {
  // Create a new batch
  static async create(batchData) {
    const {
      batch_number,
      product_id,
      unit_id,
      quantity_produced,
      batch_start_time,
      batch_end_time,
      duration_minutes,
      status,
      notes,
      created_by,
    } = batchData;

    const query = `
      INSERT INTO batches (
        batch_number, product_id, unit_id, quantity_produced,
        batch_start_time, batch_end_time, duration_minutes, status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      batch_number,
      product_id,
      unit_id,
      quantity_produced,
      batch_start_time,
      batch_end_time,
      duration_minutes || 60,
      status || "completed",
      notes,
      created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find batch by ID
  static async findById(id) {
    const query = `
      SELECT b.*, 
             p.name as product_name, p.type as product_type,
             units.name as unit_name, units.code as unit_code,
             users.name as created_by_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN units ON b.unit_id = units.id
      LEFT JOIN users ON b.created_by = users.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all batches with filters
  static async findAll(filters = {}) {
    let query = `
      SELECT b.*, 
             p.name as product_name, p.type as product_type,
             units.name as unit_name, units.code as unit_code,
             users.name as created_by_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN units ON b.unit_id = units.id
      LEFT JOIN users ON b.created_by = users.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.unit_id) {
      query += ` AND b.unit_id = $${paramCount}`;
      values.push(filters.unit_id);
      paramCount++;
    }

    if (filters.product_id) {
      query += ` AND b.product_id = $${paramCount}`;
      values.push(filters.product_id);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.date_from) {
      query += ` AND b.batch_start_time >= $${paramCount}`;
      values.push(filters.date_from);
      paramCount++;
    }

    if (filters.date_to) {
      query += ` AND b.batch_end_time <= $${paramCount}`;
      values.push(filters.date_to);
      paramCount++;
    }

    query += ` ORDER BY b.batch_start_time DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Get batches by unit
  static async findByUnit(unitId, limit = 50) {
    const query = `
      SELECT b.*, 
             p.name as product_name, p.type as product_type,
             users.name as created_by_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN users ON b.created_by = users.id
      WHERE b.unit_id = $1
      ORDER BY b.batch_start_time DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [unitId, limit]);
    return result.rows;
  }

  // Update batch
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
      UPDATE batches
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete batch
  static async delete(id) {
    const query = "DELETE FROM batches WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get batch statistics for a unit
  static async getUnitStatistics(unitId, dateFrom, dateTo) {
    const query = `
      SELECT 
        COUNT(*) as total_batches,
        SUM(quantity_produced) as total_quantity,
        AVG(quantity_produced) as avg_quantity,
        COUNT(DISTINCT product_id) as unique_products,
        SUM(duration_minutes) as total_duration_minutes
      FROM batches
      WHERE unit_id = $1
        AND batch_start_time >= $2
        AND batch_end_time <= $3
    `;
    const result = await pool.query(query, [unitId, dateFrom, dateTo]);
    return result.rows[0];
  }

  // Generate batch number
  static async generateBatchNumber(unitId) {
    const query = `
      SELECT batch_number FROM batches 
      WHERE unit_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [unitId]);

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let sequence = 1;

    if (result.rows.length > 0) {
      const lastBatch = result.rows[0].batch_number;
      const lastDate = lastBatch.split("-")[1];
      if (lastDate === today) {
        sequence = parseInt(lastBatch.split("-")[2]) + 1;
      }
    }

    return `U${unitId}-${today}-${sequence.toString().padStart(4, "0")}`;
  }
}

export default Batch;
