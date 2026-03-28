import pool from "../config/database.js";

class Batch {
  static async createBulk(batchesData) {
    if (!batchesData || batchesData.length === 0) {
      return [];
    }
    const placeholders = [];
    const values = [];
    let paramCount = 1;

    // Filter out duplicate entries from the input (same product_id, shift, batch_date, start_time)
    const seen = new Set();
    const filtered = [];
    for (const batch of batchesData) {
      const bdate = batch.batch_date || new Date().toISOString().split("T")[0];
      const key = `${batch.product_id}|${batch.shift}|${bdate}|${batch.start_time}`;
      if (seen.has(key)) continue;
      seen.add(key);
      filtered.push({ ...batch, batch_date: bdate });
    }

    if (filtered.length === 0) return [];

    filtered.forEach((batch) => {
      const {
        product_id,
        unit_id,
        quantity_produced,
        shift,
        batch_in_shift,
        batch_date,
        start_time,
        end_time,
        status,
        notes,
        had_delay,
        delay_reason,
        created_by,
      } = batch;

      const rowPlaceholders = [];
      for (let i = 0; i < 13; i++) {
        rowPlaceholders.push(`$${paramCount++}`);
      }
      placeholders.push(`(${rowPlaceholders.join(", ")})`);

      values.push(
        product_id,
        unit_id,
        quantity_produced,
        shift,
        batch_in_shift,
        batch_date,
        start_time,
        end_time,
        status || "completed",
        notes || null,
        had_delay || "no",
        delay_reason || null,
        created_by,
      );
    });

    const query = `
      INSERT INTO batches (
        product_id, unit_id, quantity_produced, shift, batch_in_shift,
        batch_date, start_time, end_time, status, notes,
        had_delay, delay_reason, created_by
      )
      VALUES ${placeholders.join(", ")}
      ON CONFLICT ON CONSTRAINT unique_product_shift_time DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }
  static async create(batchData) {
    const {
      product_id,
      unit_id,
      quantity_produced,
      shift,
      batch_in_shift,
      batch_date,
      start_time,
      end_time,
      status,
      notes,
      had_delay,
      delay_reason,
      created_by,
    } = batchData;

    const query = `
      INSERT INTO batches (
        product_id, 
        unit_id, 
        quantity_produced, 
        shift, 
        batch_in_shift, 
        batch_date,
        start_time, 
        end_time, 
        status, 
        notes,
        had_delay,
        delay_reason,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      product_id,
      unit_id,
      quantity_produced,
      shift,
      batch_in_shift,
      batch_date || new Date().toISOString().split("T")[0],
      start_time,
      end_time,
      status || "completed",
      notes,
      had_delay || "no",
      delay_reason || null,
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
    // need to dynamically add filters to the query kyuki hmne wha 1=1 which is always true, to make it easier to append AND conditions without worrying about whether it's the first condition or not. Then we check for each possible filter and if it's present, we append the appropriate condition to the query and add the value to the values array. Finally, we execute the query with the accumulated values.
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

    if (filters.created_by) {
      query += ` AND b.created_by = $${paramCount}`;
      values.push(filters.created_by);
      paramCount++;
    }

    if (filters.created_by_name) {
      query += ` AND users.name ILIKE $${paramCount}`;
      values.push(`%${filters.created_by_name}%`);
      paramCount++;
    }

    if (filters.batch_in_shift) {
      query += ` AND b.batch_in_shift = $${paramCount}`;
      values.push(filters.batch_in_shift);
      paramCount++;
    }

    if (filters.fractile_id) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM product_fractiles pf
          JOIN fractile_templates ft ON ft.name = pf.name
          WHERE pf.product_id = b.product_id
            AND ft.id = $${paramCount}
        )
      `;
      values.push(filters.fractile_id);
      paramCount++;
    }

    if (filters.cell_id) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM product_cells pc
          JOIN cell_templates ct ON ct.name = pc.name
          WHERE pc.product_id = b.product_id
            AND ct.id = $${paramCount}
        )
      `;
      values.push(filters.cell_id);
      paramCount++;
    }

    if (filters.tier_id) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM product_tiers pt
          JOIN tier_templates tt ON tt.name = pt.name
          WHERE pt.product_id = b.product_id
            AND tt.id = $${paramCount}
        )
      `;
      values.push(filters.tier_id);
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

  // ek unit ke stats nikalne ke lae
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

  // ek unit ke stats nikalne ke lae
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

  //  shift me next batch number dene ke liye kaam
  static async getNextBatchInShift(productId, shift, date = null) {
    const queryDate = date || new Date().toISOString().split("T")[0];

    const query = `
      SELECT COALESCE(MAX(batch_in_shift), 0) + 1 as next_batch
      FROM batches
      WHERE product_id = $1
        AND shift = $2
        AND batch_date = $3
    `;

    const result = await pool.query(query, [productId, shift, queryDate]);
    return result.rows[0].next_batch;
  }

  // Get used time slots for a specific product on a date and shift
  static async getUsedTimeSlots(productId, shift, date = null) {
    const queryDate = date || new Date().toISOString().split("T")[0];

    const query = `
      SELECT start_time, end_time
      FROM batches
      WHERE product_id = $1
        AND shift = $2
        AND batch_date = $3
      ORDER BY start_time
    `;

    const result = await pool.query(query, [productId, shift, queryDate]);
    return result.rows;
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
