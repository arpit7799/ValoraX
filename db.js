const mysql = require("mysql2");
require("dotenv").config();

// ============================================
// MySQL Connection Pool (Promise-based)
// ============================================
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "valorant",
  port:               process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

const db = pool.promise();

// ============================================
// Test connection on startup
// ============================================
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);  // stop server if DB unreachable
  }
})();

module.exports = db;