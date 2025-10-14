const { getDB } = require("../config/dbConfig");
const logger = require("../logger");

class TaskFile {
  static async uploadFile(
    taskId,
    uploadedBy,
    fileName,
    fileURL,
    fileType,
    fileSize
  ) {
    try {
      const db = getDB();
      const [result] = await db.execute(
        `INSERT INTO task_files (TaskID, UploadedBy, FileName, FileURL, FileType, FileSize)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [taskId, uploadedBy, fileName, fileURL, fileType, fileSize]
      );

      return {
        id: result.insertId,
        taskId,
        uploadedBy,
        fileName,
        fileURL,
        fileType,
        fileSize,
      };
    } catch (error) {
      logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  static async getFilesByTask(taskId, userPhone) {
    try {
      const db = getDB();

      // Verify user has access to the task
      const [taskCheck] = await db.execute(
        `SELECT * FROM task WHERE id = ? AND (Assignee = ? OR AssignTo = ?)`,
        [taskId, userPhone, userPhone]
      );

      if (!taskCheck.length) {
        throw new Error("Access denied to this task's files");
      }

      const [rows] = await db.execute(
        `SELECT * FROM task_files WHERE TaskID = ? ORDER BY UploadedOn DESC`,
        [taskId]
      );

      return rows;
    } catch (error) {
      logger.error(`Error fetching files: ${error.message}`);
      throw error;
    }
  }

  static async deleteFile(fileId, userPhone) {
    try {
      const db = getDB();

      // Ensure user uploaded this file or belongs to that task
      const [rows] = await db.execute(
        `SELECT f.*, t.Assignee, t.AssignTo
         FROM task_files f
         JOIN task t ON f.TaskID = t.id
         WHERE f.id = ?`,
        [fileId]
      );

      if (!rows.length) throw new Error("File not found");
      const file = rows[0];

      if (
        file.UploadedBy !== userPhone &&
        file.Assignee !== userPhone &&
        file.AssignTo !== userPhone
      ) {
        throw new Error("Access denied");
      }

      await db.execute(`DELETE FROM task_files WHERE id = ?`, [fileId]);

      return file;
    } catch (error) {
      logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  static async getFileById(fileId, userPhone) {
    try {
      const db = getDB();
      const [rows] = await db.execute(
        `SELECT f.*, t.Assignee, t.AssignTo
       FROM task_files f
       JOIN task t ON f.TaskID = t.id
       WHERE f.id = ?`,
        [fileId]
      );

      if (!rows.length) return null;
      const file = rows[0];

      // if (
      //   file.UploadedBy !== userPhone &&
      //   file.Assignee !== userPhone 
      // ) {
      //   throw new Error("Access denied to this file");
      // }

      return file;
    } catch (error) {
      logger.error(`Error fetching file by ID: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TaskFile;
