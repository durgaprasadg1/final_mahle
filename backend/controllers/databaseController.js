import pool from "../config/database.js";

const EXPORT_TABLES = [
  "units",
  "users",
  "fractile_templates",
  "cell_templates",
  "tier_templates",
  "products",
  "product_tiers",
  "product_cells",
  "product_fractiles",
  "production_plans",
  "batches",
];

const FORBIDDEN_IMPORT_KEYWORDS = [
  "alter",
  "begin",
  "commit",
  "create",
  "drop",
  "grant",
  "revoke",
  "rollback",
];

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;

const sqlLiteral = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return `'${value.toISOString().replace("T", " ").replace("Z", "")}'`;
  if (Buffer.isBuffer(value)) return `decode('${value.toString("hex")}', 'hex')`;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replaceAll("'", "''")}'`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
};

const stripSqlStringsAndComments = (sql) =>
  sql
    .replace(/--.*$/gm, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""');

const validateImportSql = (sql) => {
  const normalizedSql = stripSqlStringsAndComments(sql).toLowerCase();
  const forbiddenKeyword = FORBIDDEN_IMPORT_KEYWORDS.find((keyword) =>
    new RegExp(`\\b${keyword}\\b`).test(normalizedSql),
  );

  if (forbiddenKeyword) {
    return `SQL import cannot include ${forbiddenKeyword.toUpperCase()} statements`;
  }

  return null;
};

class DatabaseController {
  static async exportSql(req, res) {
    try {
      const generatedAt = new Date().toISOString();
      const statements = [
        "-- Mahle Inventory System data export",
        `-- Generated at ${generatedAt}`,
        "-- Import this file from Admin Dashboard > Database Import / Export.",
        "",
      ];

      for (const tableName of EXPORT_TABLES) {
        const tableExists = await pool.query(
          `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
          `,
          [tableName],
        );

        if (tableExists.rowCount === 0) continue;

        const columnsResult = await pool.query(
          `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
          `,
          [tableName],
        );
        const columns = columnsResult.rows.map((row) => row.column_name);

        const rowsResult = await pool.query(
          `SELECT * FROM ${quoteIdentifier(tableName)} ORDER BY ${columns.includes("id") ? "id" : columns.map(quoteIdentifier).join(", ")}`,
        );

        statements.push(`-- ${tableName}: ${rowsResult.rowCount} row(s)`);

        for (const row of rowsResult.rows) {
          const columnSql = columns.map(quoteIdentifier).join(", ");
          const valueSql = columns.map((column) => sqlLiteral(row[column])).join(", ");
          statements.push(
            `INSERT INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES (${valueSql}) ON CONFLICT DO NOTHING;`,
          );
        }

        if (columns.includes("id")) {
          statements.push(
            `SELECT setval(pg_get_serial_sequence('public.${tableName}', 'id'), COALESCE((SELECT MAX(${quoteIdentifier("id")}) FROM ${quoteIdentifier(tableName)}), 1), (SELECT COUNT(*) > 0 FROM ${quoteIdentifier(tableName)}));`,
          );
        }

        statements.push("");
      }

      const fileName = `mahle-data-export-${new Date()
        .toISOString()
        .slice(0, 10)}.sql`;

      res.setHeader("Content-Type", "application/sql; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(`${statements.join("\n")}\n`);
    } catch (error) {
      console.error("Database export error:", error);
      res.status(500).json({
        success: false,
        message: "Error exporting database data",
        error: error.message,
      });
    }
  }

  static async importSql(req, res) {
    const client = await pool.connect();

    try {
      const { sql } = req.body;

      if (!sql || typeof sql !== "string" || !sql.trim()) {
        return res.status(400).json({
          success: false,
          message: "SQL content is required",
        });
      }

      if (Buffer.byteLength(sql, "utf8") > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "SQL file is too large. Maximum allowed size is 5 MB.",
        });
      }

      const validationError = validateImportSql(sql);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
      // database kaa transaction shuru kiye hai yaha
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      // transaction khatam 
      res.json({
        success: true,
        message: "SQL data imported successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("Database import error:", error);
      res.status(400).json({
        success: false,
        message: "Error importing SQL data",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
}

export default DatabaseController;
