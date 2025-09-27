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

exports.saveRefreshToken = async (userId, refreshToken) => {
  const db = getDB();
  await db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
    refreshToken,
    userId,
  ]);
};

// Find user by refresh token
exports.findByRefreshToken = async (refreshToken) => {
  const db = getDB();
  const [rows] = await db.query("SELECT * FROM users WHERE refresh_token = ?", [
    refreshToken,
  ]);
  return rows[0];
};

// Update (rotate) refresh token
exports.updateRefreshToken = async (userId, oldToken, newToken) => {
  const db = getDB();
  await db.query(
    "UPDATE users SET refresh_token = ? WHERE id = ? AND refresh_token = ?",
    [newToken, userId, oldToken]
  );
};

// Remove refresh token (logout)
exports.removeRefreshToken = async (refreshToken) => {
  const db = getDB();
  await db.query(
    "UPDATE users SET refresh_token = NULL WHERE refresh_token = ?",
    [refreshToken]
  );
};
// Update user push token
exports.updateUserPushToken = async (phoneno, pushToken) => {
  const db = getDB();
  const [result] = await db.query(
    "UPDATE users SET push_token = ? WHERE phoneno = ?",
    [pushToken, phoneno]
  );
  return result.affectedRows > 0;
};

// Get user push token
exports.getUserPushToken = async (phoneno) => {
  const db = getDB();
  const [rows] = await db.query(
    "SELECT push_token FROM users WHERE phoneno = ?",
    [phoneno]
  );
  return rows[0]?.push_token;
};
