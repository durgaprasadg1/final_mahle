import pool from "../config/database.js";

class Batch {
  static async create(batchData) {
    const {
      batch_number,
      product_id,
      unit_id,
      quantity_produced,
      shift,
      batch_in_shift,
      start_time,
      end_time,
      status,
      notes,
      created_by,
    } = batchData;

    const query = `
      INSERT INTO batches (
        batch_number, 
        product_id, 
        unit_id, 
        quantity_produced, 
        shift, 
        batch_in_shift, 
        start_time, 
        end_time, 
        status, 
        notes, 
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      batch_number,
      product_id,
      unit_id,
      quantity_produced,
      shift,
      batch_in_shift,
      start_time,
      end_time,
      status || "completed",
      notes,
      created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        b.*, 
        p.name as product_name, 
        p.type as product_type,
        units.name as unit_name, 
        units.code as unit_code,
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

  static async findAll(filters = {}) {
    let query = `
      SELECT 
        b.*, 
        p.name as product_name, 
        p.type as product_type,
        units.name as unit_name, 
        units.code as unit_code,
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

    if (filters.shift) {
      query += ` AND b.shift = $${paramCount}`;
      values.push(filters.shift);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.date_from) {
      query += ` AND DATE(b.created_at) >= $${paramCount}`;
      values.push(filters.date_from);
      paramCount++;
    }

    if (filters.date_to) {
      query += ` AND DATE(b.created_at) <= $${paramCount}`;
      values.push(filters.date_to);
      paramCount++;
    }

    query += ` ORDER BY b.created_at DESC, b.shift, b.batch_in_shift`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findByUnit(unitId, limit = 50) {
    const query = `
      SELECT 
        b.*, 
        p.name as product_name, 
        p.type as product_type,
        users.name as created_by_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN users ON b.created_by = users.id
      WHERE b.unit_id = $1
      ORDER BY b.created_at DESC, b.shift, b.batch_in_shift
      LIMIT $2
    `;
    const result = await pool.query(query, [unitId, limit]);
    return result.rows;
  }

  static async findByShift(unitId, shift, date = null) {
    let query = `
      SELECT 
        b.*, 
        p.name as product_name, 
        p.type as product_type,
        users.name as created_by_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      LEFT JOIN users ON b.created_by = users.id
      WHERE b.unit_id = $1 AND b.shift = $2
    `;

    const values = [unitId, shift];
    let paramCount = 3;

    if (date) {
      query += ` AND DATE(b.created_at) = $${paramCount}`;
      values.push(date);
      paramCount++;
    }

    query += ` ORDER BY b.batch_in_shift`;

    const result = await pool.query(query, values);
    return result.rows;
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

  static async delete(id) {
    const query = "DELETE FROM batches WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get statistics for a unit
  static async getUnitStatistics(unitId, dateFrom, dateTo) {
    const query = `
      SELECT 
        COUNT(*) as total_batches,
        SUM(quantity_produced) as total_quantity,
        AVG(quantity_produced) as avg_quantity,
        COUNT(DISTINCT product_id) as unique_products
      FROM batches
      WHERE unit_id = $1
        AND DATE(created_at) >= $2
        AND DATE(created_at) <= $3
    `;
    const result = await pool.query(query, [unitId, dateFrom, dateTo]);
    return result.rows[0];
  }

  // Get statistics by shift
  static async getShiftStatistics(unitId, dateFrom, dateTo) {
    const query = `
      SELECT 
        shift,
        COUNT(*) as total_batches,
        SUM(quantity_produced) as total_quantity,
        AVG(quantity_produced) as avg_quantity
      FROM batches
      WHERE unit_id = $1
        AND DATE(created_at) >= $2
        AND DATE(created_at) <= $3
      GROUP BY shift
      ORDER BY 
        CASE shift
          WHEN 'morning' THEN 1
          WHEN 'afternoon' THEN 2
          WHEN 'night' THEN 3
        END
    `;
    const result = await pool.query(query, [unitId, dateFrom, dateTo]);
    return result.rows;
  }

  // Get next batch number for a shift on a specific date
  static async getNextBatchInShift(unitId, shift, date = null) {
    const queryDate = date || new Date().toISOString().split("T")[0];

    const query = `
      SELECT COALESCE(MAX(batch_in_shift), 0) + 1 as next_batch
      FROM batches
      WHERE unit_id = $1
        AND shift = $2
        AND DATE(created_at) = $3
    `;

    const result = await pool.query(query, [unitId, shift, queryDate]);
    return result.rows[0].next_batch;
  }

  // Generate batch number with shift
  // Format: UNITCODE-YYYY-MM-DD-SHIFT-###
  // Example: U-GAMMA-2026-02-07-MORNING-001
  static async generateBatchNumber(unitId, shift, batchInShift) {
    const unitQuery = "SELECT code FROM units WHERE id = $1";
    const unitResult = await pool.query(unitQuery, [unitId]);

    if (!unitResult.rows.length) {
      throw new Error("Unit not found");
    }

    const unitCode = unitResult.rows[0].code;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const shiftUpper = shift.toUpperCase();
    const batchNum = batchInShift.toString().padStart(3, "0");

    return `${unitCode}-${today}-${shiftUpper}-${batchNum}`;
  }

  // Get shift types enum
  static async getShiftTypes() {
    const query = `
      SELECT unnest(enum_range(NULL::shift_type))::text as shift
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => row.shift);
  }
}

export default Batch;
