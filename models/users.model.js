const { getDB } = require("../config/dbConfig");

// Create new user
exports.createUser = async (name, phoneno) => {
  const db = getDB();
  const [result] = await db.query(
    "INSERT INTO users (name, phoneno) VALUES (?, ?)",
    [name, phoneno]
  );
  return { id: result.insertId, name, phoneno };
};

// Get all users
exports.getUsers = async () => {
  const db = getDB();
  const [rows] = await db.query("SELECT * FROM users");
  return rows;
};

// Get user by ID
exports.getUserById = async (id) => {
  const db = getDB();
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};

exports.getUserByPhone = async (phoneno) => {
  const db = getDB();
  const [rows] = await db.query("SELECT * FROM users WHERE phoneno = ?", [
    phoneno,
  ]);
  return rows[0];
};