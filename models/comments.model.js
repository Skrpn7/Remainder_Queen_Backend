const { getDB } = require("../config/dbConfig");
const logger = require("../logger");

class Comment {
  // Create a new comment
  static async createComment({
    taskId,
    userPhone,
    content = null,
    parentId = null,
  }) {
    try {
      const db = getDB();
      const [result] = await db.execute(
        `INSERT INTO comments (task_id, user_phone, content, parent_id)
         VALUES (?, ?, ?, ?)`,
        [taskId, userPhone, content, parentId]
      );

      return {
        id: result.insertId,
        taskId,
        userPhone,
        content,
        parentId,
      };
    } catch (error) {
      logger.error(`Error creating comment: ${error.message}`);
      throw error;
    }
  }

  // Get all comments for a task
  static async getCommentsByTask(taskId) {
    try {
      const db = getDB();
      const [rows] = await db.execute(
        `
        SELECT 
          c.*,
          JSON_OBJECT('id', u.id, 'name', u.name, 'phoneNo', u.phoneNo) AS user
        FROM comments c
        JOIN users u ON c.user_phone = u.phoneNo
        WHERE c.task_id = ?
        ORDER BY c.created_on ASC
        `,
        [taskId]
      );

      return rows.map((row) => ({
        ...row,
        user: row.user ? JSON.parse(row.user) : null,
      }));
    } catch (error) {
      logger.error(`Error fetching comments for task: ${error.message}`);
      throw error;
    }
  }

  // Get single comment by ID
  static async getCommentById(id) {
    try {
      const db = getDB();
      const [rows] = await db.execute(
        `
        SELECT 
          c.*,
          JSON_OBJECT('id', u.id, 'name', u.name, 'phoneNo', u.phoneNo) AS user
        FROM comments c
        JOIN users u ON c.user_phone = u.phoneNo
        WHERE c.id = ?
        `,
        [id]
      );

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        user: row.user ? JSON.parse(row.user) : null,
      };
    } catch (error) {
      logger.error(`Error fetching comment by ID: ${error.message}`);
      throw error;
    }
  }

  // Delete comment
  static async deleteComment(id) {
    try {
      const db = getDB();
      const [result] = await db.execute(`DELETE FROM comments WHERE id = ?`, [
        id,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error deleting comment: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Comment;
