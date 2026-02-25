import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log("🔧 Starting database initialization...");

    // Determine directory of this file in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Read the SQL file
    const sqlFile = path.join(__dirname, "config", "database.sql");
    const sql = fs.readFileSync(sqlFile, "utf-8");

    // Execute the SQL (may contain multiple statements)
    await client.query(sql);

    console.log("✅ Database initialized successfully!");
    console.log("✅ All tables, indexes, and functions created");
    console.log("✅ Sample data inserted");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
