const { getDB } = require("../config/dbConfig"); // your DB connection (MySQL/Sequelize)
const logger = require("../logger");

class Task {
  static async createTask(title, description, status, assignee, assignTo) {
    try {
      const db = getDB();
      const [result] = await db.execute(
        `INSERT INTO task (Title, Description, Status, Assignee, AssignTo)
         VALUES (?, ?, ?, ?, ?)`,
        [title, description, status, assignee, assignTo]
      );

      return {
        id: result.insertId,
        title,
        description,
        status,
        assignee,
        assignTo,
      };
    } catch (error) {
      logger.error(`Error creating task: ${error.message}`);
      throw error;
    }
  }

  // Get all tasks
  // static async getTasks(userPhone, status = null) {
  //   try {
  //     const db = getDB();
  //     let query = `
  //     SELECT *
  //     FROM task
  //     WHERE (Assignee = ? OR AssignTo = ?)
  //   `;
  //     const params = [userPhone, userPhone];

  //     if (status) {
  //       query += " AND Status = ?";
  //       params.push(status);
  //     }

  //     query += " ORDER BY CreatedOn DESC";

  //     const [rows] = await db.execute(query, params);
  //     return rows;
  //   } catch (error) {
  //     logger.error(`Error fetching tasks: ${error.message}`);
  //     throw error;
  //   }
  // }

  static async getTasks({ userPhone, search = null, status = null }) {
    try {
      const db = getDB();
      let query = `
      SELECT 
        t.*, 
        JSON_OBJECT('id', u1.id, 'name', u1.name, 'phoneNo', u1.phoneNo) AS Assignee,
        JSON_OBJECT('id', u2.id, 'name', u2.name, 'phoneNo', u2.phoneNo) AS AssignTo
      FROM task t
      LEFT JOIN users u1 ON t.Assignee = u1.phoneNo
      LEFT JOIN users u2 ON t.AssignTo = u2.phoneNo
      WHERE (t.Assignee = ? OR t.AssignTo = ?)
    `;

      const params = [userPhone, userPhone];

      if (status) {
        query += " AND t.Status = ?";
        params.push(status);
      }

      if (search) {
        if (/^\d+$/.test(search)) {
          // If search is only digits, treat it as a phone number
          query += " AND (t.Assignee = ? OR t.AssignTo = ?)";
          params.push(search, search);
        } else {
          // Otherwise, treat it as title search
          query += " AND t.Title LIKE ?";
          params.push(`%${search}%`);
        }
      }

      query += " ORDER BY t.CreatedOn DESC";

      const [rows] = await db.execute(query, params);

      // Parse JSON fields into objects
      return rows.map((row) => ({
        ...row,
        Assignee: row.Assignee ? JSON.parse(row.Assignee) : null,
        AssignTo: row.AssignTo ? JSON.parse(row.AssignTo) : null,
      }));
    } catch (error) {
      logger.error(`Error fetching tasks: ${error.message}`);
      throw error;
    }
  }

  // Get task by ID
  // static async getTaskById(id) {
  //   try {
  //     const db = getDB();
  //     const query = `
  //     SELECT
  //       t.*,
  //       JSON_OBJECT('id', u1.id, 'name', u1.name, 'phoneNo', u1.phoneNo) AS Assignee,
  //       JSON_OBJECT('id', u2.id, 'name', u2.name, 'phoneNo', u2.phoneNo) AS AssignTo
  //     FROM task t
  //     LEFT JOIN users u1 ON t.Assignee = u1.phoneNo
  //     LEFT JOIN users u2 ON t.AssignTo = u2.phoneNo
  //     WHERE t.id = ?
  //   `;

  //     const [rows] = await db.execute(query, [id]);

  //     if (!rows.length) return null;

  //     const row = rows[0];
  //     return {
  //       ...row,
  //       Assignee: row.Assignee ? JSON.parse(row.Assignee) : null,
  //       AssignTo: row.AssignTo ? JSON.parse(row.AssignTo) : null,
  //     };
  //   } catch (error) {
  //     logger.error(`Error fetching task by ID: ${error.message}`);
  //     throw error;
  //   }
  // }

  static async getTaskById(id) {
    try {
      const db = getDB();

      const query = `
      SELECT 
        t.*, 
        JSON_OBJECT('id', u1.id, 'name', u1.name, 'phoneNo', u1.phoneNo) AS Assignee,
        JSON_OBJECT('id', u2.id, 'name', u2.name, 'phoneNo', u2.phoneNo) AS AssignTo
      FROM task t
      LEFT JOIN users u1 ON t.Assignee = u1.phoneNo
      LEFT JOIN users u2 ON t.AssignTo = u2.phoneNo
      WHERE t.id = ?
    `;

      const [rows] = await db.execute(query, [id]);
      if (!rows.length) return null;

      const row = rows[0];

      const [fileRows] = await db.execute(
        `SELECT id, FileName, FileURL, FileType 
       FROM task_files 
       WHERE TaskID = ? 
       ORDER BY UploadedOn DESC`,
        [id]
      );

      return {
        ...row,
        Assignee: row.Assignee ? JSON.parse(row.Assignee) : null,
        AssignTo: row.AssignTo ? JSON.parse(row.AssignTo) : null,
        Files: fileRows || [],
      };
    } catch (error) {
      logger.error(`Error fetching task by ID: ${error.message}`);
      throw error;
    }
  }

  static async getTasksForUser(userPhone) {
    const query = `
      SELECT * 
      FROM task
      WHERE Assignee = ? OR AssignTo = ?
      ORDER BY CreatedOn DESC
    `;

    const [rows] = await db.execute(query, [userPhone, userPhone]);
    return rows;
  }

  // Update task details
  static async updateTask(id, updates, updatedBy) {
    try {
      const db = getDB();

      if (!id || !updates || Object.keys(updates).length === 0) {
        throw new Error("Task ID and updates are required");
      }

      const allowedFields = [
        "Title",
        "Description",
        "Status",
        "Assignee",
        "AssignTo",
      ];
      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error("No valid fields to update");
      }

      updateFields.push("UpdatedOn = NOW()");
      if (updatedBy) {
        updateFields.push("UpdatedBy = ?");
        values.push(updatedBy);
      }

      values.push(id);

      const [result] = await db.execute(
        `UPDATE task SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error("Task not found or no changes made");
      }

      return await this.getTaskById(id);
    } catch (error) {
      logger.error(`Error updating task: ${error.message}`);
      throw error;
    }
  }

  // Update task status
  static async updateTaskStatus(id, status) {
    try {
      const db = getDB();

      if (!id || !status) {
        throw new Error("Task ID and status are required");
      }

      const validStatuses = [
        "Pending",
        "In Progress",
        "Completed",
        "Rejected",
        "Reverted",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        );
      }

      if (status === "Reverted") {
        // Swap Assignee and AssignTo
        const [swapResult] = await db.execute(
          `UPDATE task 
         SET UpdatedOn = NOW(),
             Assignee = (@tmp := Assignee),
             Assignee = AssignTo,
             AssignTo = @tmp
         WHERE id = ?`,
          [id]
        );

        if (swapResult.affectedRows === 0) {
          throw new Error("Task not found or no changes made");
        }
      } else {
        const [result] = await db.execute(
          `UPDATE task 
         SET Status = ?, UpdatedOn = NOW()
         WHERE id = ?`,
          [status, id]
        );

        if (result.affectedRows === 0) {
          throw new Error("Task not found or no changes made");
        }
      }

      return await this.getTaskById(id);
    } catch (error) {
      logger.error(`Error updating task status: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Task;
