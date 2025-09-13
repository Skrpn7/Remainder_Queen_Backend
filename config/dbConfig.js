const mysql = require("mysql2/promise");

const DB_NAME = "remainder_queen_db_main";

let pool;

async function initDB() {
  try {
    // 1️⃣ Connect without specifying DB (to check/create DB)
    // const connection = await mysql.createConnection({
    //   host: "localhost",
    //   user: "root",
    //   password: "",
    // });

    // await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    // console.log(`✅ Database '${DB_NAME}' ready.`);

    // await connection.end();

    if (process.env.NODE_ENV !== "production") {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
      console.log(`✅ Database '${DB_NAME}' ready (local).`);
      await connection.end();
    }

    // 2️⃣ Create pool WITH the DB
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || DB_NAME,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    });

    // 3️⃣ Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phoneno VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `);

    await pool.query(`
  CREATE TABLE IF NOT EXISTS task (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    Status ENUM('Todo', 'Completed','Rejected') DEFAULT 'Todo',

    Assignee VARCHAR(15),
    AssignTo VARCHAR(15),

    CreatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_assignee FOREIGN KEY (Assignee) REFERENCES users(phoneno) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_task_assignto FOREIGN KEY (AssignTo) REFERENCES users(phoneno) ON DELETE SET NULL ON UPDATE CASCADE
  );
`);

    console.log("✅ Users table ready.");

    return pool;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

function getDB() {
  if (!pool) {
    throw new Error("DB not initialized. Call initDB() first.");
  }
  return pool;
}

module.exports = { initDB, getDB };
