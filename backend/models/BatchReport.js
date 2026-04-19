import pool from "../config/database.js";

class BatchReport {
  // Common filters reuse karne ke liye helper
  static applyCommonFilters(filters, values, startIndex = 1) {
    const where = [];
    let paramCount = startIndex;

    if (filters.unit_id) {
      where.push(`b.unit_id = $${paramCount++}`);
      values.push(filters.unit_id);
    }

    if (filters.product_id) {
      where.push(`b.product_id = $${paramCount++}`);
      values.push(filters.product_id);
    }

    if (filters.product_name) {
      where.push(`p.name ILIKE $${paramCount++}`);
      values.push(`%${filters.product_name}%`);
    }

    if (filters.shift) {
      where.push(`b.shift = $${paramCount++}`);
      values.push(filters.shift);
    }

    if (filters.status) {
      where.push(`b.status = $${paramCount++}`);
      values.push(filters.status);
    }

    if (filters.created_by) {
      where.push(`b.created_by = $${paramCount++}`);
      values.push(filters.created_by);
    }

    if (filters.batch_in_shift) {
      where.push(`b.batch_in_shift = $${paramCount++}`);
      values.push(filters.batch_in_shift);
    }

    if (filters.slot_start_time) {
      where.push(`TO_CHAR(b.start_time, 'HH24:MI') = $${paramCount++}`);
      values.push(filters.slot_start_time);
    }

    if (filters.slot_end_time) {
      where.push(`TO_CHAR(b.end_time, 'HH24:MI') = $${paramCount++}`);
      values.push(filters.slot_end_time);
    }

    if (filters.date_from) {
      where.push(`b.batch_date >= $${paramCount++}`);
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      where.push(`b.batch_date <= $${paramCount++}`);
      values.push(filters.date_to);
    }

    return { where, paramCount };
  }

  static buildBaseSelect() {
    return `
      SELECT
        b.id,
        b.product_id,
        b.unit_id,
        b.quantity_produced,
        b.shift,
        b.batch_in_shift,
        b.batch_date,
        b.start_time,
        b.end_time,
        b.status,
        b.notes,
        b.had_delay,
        b.delay_reason,
        b.created_by,
        b.created_at,
        b.updated_at,
        p.name as product_name,
        p.type as product_type,
        creator.name as created_by_name
    `;
  }

  static buildBaseFrom() {
    return `
      FROM batches b
      JOIN products p ON b.product_id = p.id
      LEFT JOIN users creator ON b.created_by = creator.id
    `;
  }

  static async findProductionReport(filters = {}) {
    const values = [];
    const { where } = this.applyCommonFilters(filters, values);

    let query = `${this.buildBaseSelect()} ${this.buildBaseFrom()}`;

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += ` ORDER BY b.created_at DESC, b.shift, b.batch_in_shift`;

    if (filters.limit) {
      const limitIndex = values.length + 1;
      query += ` LIMIT $${limitIndex}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findCreatedByReport(filters = {}) {
    const values = [];
    const { where, paramCount } = this.applyCommonFilters(filters, values);
    let paramCursor = paramCount;

    if (filters.created_by_name) {
      where.push(`creator.name ILIKE $${paramCursor++}`);
      values.push(`%${filters.created_by_name}%`);
    }

    let query = `${this.buildBaseSelect()} ${this.buildBaseFrom()}`;

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += ` ORDER BY b.created_at DESC, b.shift, b.batch_in_shift`;

    if (filters.limit) {
      const limitIndex = values.length + 1;
      query += ` LIMIT $${limitIndex}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findFractileReport(filters = {}) {
    const values = [];
    const { where, paramCount } = this.applyCommonFilters(filters, values);
    let paramCursor = paramCount;

    const fractileFilter = filters.fractile_id
      ? `ft.id = $${paramCursor++}`
      : "TRUE";

    if (filters.fractile_id) {
      values.push(filters.fractile_id);
    }

    let query = `
      ${this.buildBaseSelect()},
      fractile.fractile_names
      ${this.buildBaseFrom()}
      LEFT JOIN LATERAL (
        SELECT STRING_AGG(DISTINCT pf.name, ', ' ORDER BY pf.name) as fractile_names
        FROM product_fractiles pf
        JOIN fractile_templates ft
          ON LOWER(TRIM(ft.name)) = LOWER(TRIM(pf.name))
        WHERE pf.product_id = b.product_id
          AND ${fractileFilter}
      ) fractile ON true
    `;

    where.push(`EXISTS (
      SELECT 1
      FROM product_fractiles pf
      JOIN fractile_templates ft
        ON LOWER(TRIM(ft.name)) = LOWER(TRIM(pf.name))
      WHERE pf.product_id = b.product_id
        AND ${fractileFilter}
    )`);

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += ` ORDER BY b.created_at DESC, b.shift, b.batch_in_shift`;

    if (filters.limit) {
      const limitIndex = values.length + 1;
      query += ` LIMIT $${limitIndex}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findCellReport(filters = {}) {
    const values = [];
    const { where, paramCount } = this.applyCommonFilters(filters, values);
    let paramCursor = paramCount;

    const fractileFilter = filters.fractile_id
      ? `ft.id = $${paramCursor++}`
      : "TRUE";
    if (filters.fractile_id) {
      values.push(filters.fractile_id);
    }

    const cellFilter = filters.cell_id ? `ct.id = $${paramCursor++}` : "TRUE";
    if (filters.cell_id) {
      values.push(filters.cell_id);
    }

    let query = `
      ${this.buildBaseSelect()},
      cell.fractile_names,
      cell.cell_names
      ${this.buildBaseFrom()}
      LEFT JOIN LATERAL (
        SELECT
          STRING_AGG(DISTINCT ft.name, ', ' ORDER BY ft.name) as fractile_names,
          STRING_AGG(DISTINCT pc.name, ', ' ORDER BY pc.name) as cell_names
        FROM product_cells pc
        JOIN cell_templates ct
          ON LOWER(TRIM(ct.name)) = LOWER(TRIM(pc.name))
        JOIN fractile_templates ft ON ct.fractile_id = ft.id
        WHERE pc.product_id = b.product_id
          AND ${fractileFilter}
          AND ${cellFilter}
      ) cell ON true
    `;

    where.push(`EXISTS (
      SELECT 1
      FROM product_cells pc
      JOIN cell_templates ct
        ON LOWER(TRIM(ct.name)) = LOWER(TRIM(pc.name))
      JOIN fractile_templates ft ON ct.fractile_id = ft.id
      WHERE pc.product_id = b.product_id
        AND ${fractileFilter}
        AND ${cellFilter}
    )`);

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += ` ORDER BY b.created_at DESC, b.shift, b.batch_in_shift`;

    if (filters.limit) {
      const limitIndex = values.length + 1;
      query += ` LIMIT $${limitIndex}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findTierReport(filters = {}) {
    const values = [];
    const { where, paramCount } = this.applyCommonFilters(filters, values);
    let paramCursor = paramCount;

    const fractileFilter = filters.fractile_id
      ? `ft.id = $${paramCursor++}`
      : "TRUE";
    if (filters.fractile_id) {
      values.push(filters.fractile_id);
    }

    const cellFilter = filters.cell_id ? `ct.id = $${paramCursor++}` : "TRUE";
    if (filters.cell_id) {
      values.push(filters.cell_id);
    }

    const tierFilter = filters.tier_id ? `tt.id = $${paramCursor++}` : "TRUE";
    if (filters.tier_id) {
      values.push(filters.tier_id);
    }

    let query = `
      ${this.buildBaseSelect()},
      tier.fractile_names,
      tier.cell_names,
      tier.tier_names
      ${this.buildBaseFrom()}
      LEFT JOIN LATERAL (
        SELECT
          STRING_AGG(DISTINCT ft.name, ', ' ORDER BY ft.name) as fractile_names,
          STRING_AGG(DISTINCT ct.name, ', ' ORDER BY ct.name) as cell_names,
          STRING_AGG(DISTINCT pt.name, ', ' ORDER BY pt.name) as tier_names
        FROM product_tiers pt
        JOIN tier_templates tt
          ON LOWER(TRIM(tt.name)) = LOWER(TRIM(pt.name))
        JOIN cell_templates ct ON tt.cell_id = ct.id
        JOIN fractile_templates ft ON ct.fractile_id = ft.id
        WHERE pt.product_id = b.product_id
          AND ${fractileFilter}
          AND ${cellFilter}
          AND ${tierFilter}
      ) tier ON true
    `;

    where.push(`EXISTS (
      SELECT 1
      FROM product_tiers pt
      JOIN tier_templates tt
        ON LOWER(TRIM(tt.name)) = LOWER(TRIM(pt.name))
      JOIN cell_templates ct ON tt.cell_id = ct.id
      JOIN fractile_templates ft ON ct.fractile_id = ft.id
      WHERE pt.product_id = b.product_id
        AND ${fractileFilter}
        AND ${cellFilter}
        AND ${tierFilter}
    )`);

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += ` ORDER BY b.created_at DESC, b.shift, b.batch_in_shift`;

    if (filters.limit) {
      const limitIndex = values.length + 1;
      query += ` LIMIT $${limitIndex}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default BatchReport;
