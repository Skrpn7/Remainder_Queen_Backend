const Task = require("../models/task.model");
const Users = require("../models/users.model");
const NotificationService = require("../services/notificationService");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../logger");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status = "Todo", assignTo } = req.body;

    const assignee = req.user.phoneNo;

    if (!title || !assignee || !assignTo) {
      return res
        .status(400)
        .json(ApiResponse.error("fill the required fields", 400));
    }

    if (assignee === assignTo) {
      return res
        .status(400)
        .json(ApiResponse.error("Cannot assign a task to yourself", 400));
    }

    const task = await Task.createTask(
      title,
      description || null,
      status,
      assignee,
      assignTo
    );

    // Send push notification to assignee
    try {
      const assigntoPushToken = await Users.getUserPushToken(assignTo);
      const assignerUser = await Users.getUserByPhone(assignee);
      console.log(`Assigner user: ${JSON.stringify(assignerUser)}`);
      console.log(`Assignee push token: ${assigntoPushToken}`);

      if (assigneePushToken && assignerUser) {
        await NotificationService.sendTaskAssignmentNotification(
          assigntoPushToken,
          assignerUser.name || assignee,
          title,
          task.id
        );
        logger.info(`Task assignment notification sent to ${assignTo}`);
        console.log(`Task assignment notification sent to ${assignTo}`);
      }
    } catch (notificationError) {
      logger.error(
        `Error sending task assignment notification: ${notificationError.message}`
      );
      // Don't fail the task creation if notification fails
      console.log(
        `Error sending task assignment notification: ${notificationError.message}`
      );
    }

    logger.info(`Task created: ${task.title}`);
    res.status(201).json(ApiResponse.success(task, 1, 201));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    if (!req.user?.phoneNo) {
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { search, status } = req.query;

    const tasks = await Task.getTasks({
      userPhone: req.user.phoneNo,
      search: search || null,
      status: status || null,
    });
    // const tasks = await Task.getTasks(req.user.phoneNo);

    res.json(ApiResponse.success(tasks, tasks.length, 200));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json(ApiResponse.error("Task not found", 404));
    }
    res.json(ApiResponse.success(task, 1, 200));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Update task details
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedBy = req.user.phoneNo;

    // Validate ID
    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json(ApiResponse.error("Valid task ID is required", 400));
    }

    // Check if task exists and user has permission
    const existingTask = await Task.getTaskById(parseInt(id));
    if (!existingTask) {
      return res.status(404).json(ApiResponse.error("Task not found", 404));
    }

    const userPhone = req.user.phoneNo;
    // Only assignee (creator) can update task details
    if (existingTask.Assignee !== userPhone) {
      return res
        .status(403)
        .json(
          ApiResponse.error("Only task creator can update task details", 403)
        );
    }

    // Validate updates
    if (updates.Title && updates.Title.length > 255) {
      return res
        .status(400)
        .json(ApiResponse.error("Title must be less than 255 characters", 400));
    }

    if (updates.Status) {
      const validStatuses = [
        "Pending",
        "In Progress",
        "Completed",
        "Rejected",
        "Reverted",
      ];
      if (!validStatuses.includes(updates.Status)) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              `Status must be one of: ${validStatuses.join(", ")}`,
              400
            )
          );
      }
    }

    // Trim string values
    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === "string") {
        cleanUpdates[key] = value.trim();
      } else {
        cleanUpdates[key] = value;
      }
    }

    const updatedTask = await Task.updateTask(
      parseInt(id),
      cleanUpdates,
      updatedBy
    );

    logger.info(`Task ${id} updated by ${updatedBy}`);
    res.json(ApiResponse.success(updatedTask, 1, 200));
  } catch (error) {
    logger.error(`Error updating task: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBy = req.user.phoneNo;

    // Validate ID
    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json(ApiResponse.error("Valid task ID is required", 400));
    }

    // Validate status
    if (!status) {
      return res.status(400).json(ApiResponse.error("Status is required", 400));
    }

    const validStatuses = [
      "Pending",
      "In Progress",
      "Completed",
      "Rejected",
      "Reverted",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json(
          ApiResponse.error(
            `Status must be one of: ${validStatuses.join(", ")}`,
            400
          )
        );
    }

    // Check if task exists and user has permission
    const existingTask = await Task.getTaskById(parseInt(id));
    if (!existingTask) {
      return res.status(404).json(ApiResponse.error("Task not found", 404));
    }

    const userPhone = req.user.phoneNo;
    if (
      existingTask.Assignee.phoneNo !== userPhone &&
      existingTask.AssignTo.phoneNo !== userPhone
    ) {
      return res.status(403).json(ApiResponse.error("Access denied", 403));
    }

    const updatedTask = await Task.updateTaskStatus(parseInt(id), status);

    // Send push notification to task creator
    try {
      const assignerPushToken = await Users.getUserPushToken(
        existingTask.Assignee.phoneNo
      );
      const assigneeUser = await Users.getUserByPhone(updatedBy);

      if (
        assignerPushToken &&
        assigneeUser &&
        existingTask.Assignee.phoneNo  !== updatedBy
      ) {
        if (status === "Completed") {
          await NotificationService.sendTaskCompletionNotification(
            assignerPushToken,
            assigneeUser.name || updatedBy,
            existingTask.Title,
            parseInt(id)
          );
        } else if (status === "Rejected") {
          await NotificationService.sendTaskRejectionNotification(
            assignerPushToken,
            assigneeUser.name || updatedBy,
            existingTask.Title,
            parseInt(id)
          );
        } else {
          await NotificationService.sendTaskStatusUpdateNotification(
            assignerPushToken,
            assigneeUser.name || updatedBy,
            existingTask.Title,
            status,
            parseInt(id)
          );
        }
        logger.info(
          `Task status notification sent to ${existingTask.Assignee}`
        );
      }
    } catch (notificationError) {
      logger.error(
        `Error sending task status notification: ${notificationError.message}`
      );
      // Don't fail the status update if notification fails
    }

    logger.info(`Task ${id} status updated to ${status} by ${updatedBy}`);
    res.json(ApiResponse.success(updatedTask, 1, 200));
  } catch (error) {
    logger.error(`Error updating task status: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};
