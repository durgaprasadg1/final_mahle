import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pool from "./config/database.js";

dotenv.config();

const client = await pool.connect();
let tierId;

try {
  await client.query("BEGIN");

  const productRes = await client.query(
    `INSERT INTO products (name, type, unit_id, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    ["Seed Source Product " + Date.now(), "other", 1, "seed for hierarchy smoke test", 1],
  );
  const sourceProductId = productRes.rows[0].id;

  const tierRes = await client.query(
    `INSERT INTO product_tiers (product_id, name, count, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [sourceProductId, "Tier-A", 1, "seed tier"],
  );
  tierId = tierRes.rows[0].id;

  const cellRes = await client.query(
    `INSERT INTO product_cells (product_id, tier_id, name, count, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [sourceProductId, tierId, "Cell-A", 1, "seed cell"],
  );
  const cellId = cellRes.rows[0].id;

  await client.query(
    `INSERT INTO product_fractiles (product_id, cell_id, name, count, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [sourceProductId, cellId, "Fractile-A", 1, "seed fractile"],
  );

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}

const token = jwt.sign(
  { id: 1, email: "admin@mahle.com", role: "admin", unit_id: null },
  process.env.JWT_SECRET,
  { expiresIn: "1h" },
);

const detailsResp = await fetch(`http://localhost:5000/api/tiers/${tierId}/details`, {
  headers: { Authorization: `Bearer ${token}` },
});
const detailsJson = await detailsResp.json();

const createResp = await fetch("http://localhost:5000/api/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "Auto Hierarchy Product " + Date.now(),
    type: "other",
    tier_id: tierId,
    description: "created via smoke test",
  }),
});
const createJson = await createResp.json();

console.log("TIER_DETAILS_STATUS=" + detailsResp.status);
console.log("TIER_DETAILS_SUCCESS=" + detailsJson.success);
console.log("TIER_DETAILS_HAS_CHAIN=" + Boolean(detailsJson?.data?.tier && detailsJson?.data?.cell && detailsJson?.data?.fractile));

console.log("CREATE_PRODUCT_STATUS=" + createResp.status);
console.log("CREATE_PRODUCT_SUCCESS=" + createJson.success);
console.log("CREATE_PRODUCT_ID=" + (createJson?.data?.id ?? "NA"));
console.log("CREATED_TIERS_COUNT=" + (createJson?.data?.tiers?.length ?? 0));
console.log("CREATED_CELLS_COUNT=" + (createJson?.data?.cells?.length ?? 0));
console.log("CREATED_FRACTILES_COUNT=" + (createJson?.data?.fractiles?.length ?? 0));

await pool.end();
