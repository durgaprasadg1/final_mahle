import pool from "../config/database.js";

class Tier {
  static async getHierarchyDetailsById(tierId) {
    const query = `
      SELECT
        t.id AS tier_id,
        t.name AS tier_name,
        t.count AS tier_count,
        t.description AS tier_description,
        t.created_at AS tier_created_at,
        t.product_id AS tier_product_id,
        p.name AS product_name,
        p.type AS product_type,
        p.unit_id AS product_unit_id,

        c.id AS cell_id,
        c.name AS cell_name,
        c.count AS cell_count,
        c.description AS cell_description,
        c.created_at AS cell_created_at,

        f.id AS fractile_id,
        f.name AS fractile_name,
        f.count AS fractile_count,
        f.description AS fractile_description,
        f.created_at AS fractile_created_at
      FROM product_tiers t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN product_cells c ON c.tier_id = t.id
      LEFT JOIN product_fractiles f ON f.cell_id = c.id
      WHERE t.id = $1
      ORDER BY c.created_at ASC NULLS LAST, f.created_at ASC NULLS LAST
      LIMIT 1
    `;

    const result = await pool.query(query, [tierId]);

    if (!result.rows.length) {
      return null;
    }

    const row = result.rows[0];

    return {
      tier: {
        id: row.tier_id,
        product_id: row.tier_product_id,
        unit_id: row.product_unit_id,
        name: row.tier_name,
        count: row.tier_count,
        description: row.tier_description,
        created_at: row.tier_created_at,
      },
      cell: row.cell_id
        ? {
            id: row.cell_id,
            tier_id: row.tier_id,
            name: row.cell_name,
            count: row.cell_count,
            description: row.cell_description,
            created_at: row.cell_created_at,
          }
        : null,
      fractile: row.fractile_id
        ? {
            id: row.fractile_id,
            cell_id: row.cell_id,
            name: row.fractile_name,
            count: row.fractile_count,
            description: row.fractile_description,
            created_at: row.fractile_created_at,
          }
        : null,
    };
  }
}

export default Tier;