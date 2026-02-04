// Script to generate bcrypt hash for admin123 and update database
import bcrypt from "bcryptjs";
import pool from "./config/database.js";

async function resetAdminPassword() {
  try {
    console.log("🔐 Generating bcrypt hash for password: admin123");

    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("✓ Hash generated:", hashedPassword);
    console.log("");
    console.log("🔄 Updating admin user password in database...");

    const result = await pool.query(
      `UPDATE users 
       SET password = $1 
       WHERE email = 'admin@mahle.com' 
       RETURNING email, name, role`,
      [hashedPassword],
    );

    if (result.rows.length > 0) {
      console.log("✓ Admin password updated successfully!");
      console.log("");
      console.log("   Login Credentials:");
      console.log("   Email: admin@mahle.com");
      console.log("   Password: admin123");
      console.log("");
      console.log("You can now login with these credentials!");
    } else {
      console.log("Admin user not found. Creating admin user...");

      await pool.query(
        `INSERT INTO users (email, password, name, role, status, permissions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          "admin@mahle.com",
          hashedPassword,
          "System Administrator",
          "admin",
          "active",
          { create: true, read: true, update: true, delete: true },
        ],
      );

      console.log("✓ Admin user created successfully!");
      console.log("Login Credentials:");
      console.log("Email: admin@mahle.com");
      console.log("Password: admin123");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();
