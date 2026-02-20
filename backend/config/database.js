import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const p = process.env.DB_PASSWORD


const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password : p
  
});

pool.on("connect", () => {
  console.log("✅ Database connected successfully");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
  process.exit(-1);
});

export default pool;
