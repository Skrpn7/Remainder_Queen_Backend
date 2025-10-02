const Comment = require("../models/comments.model");
const Users = require("../models/users.model");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../logger");

// Create Comment
exports.createComment = async (req, res) => {
  try {
    const { taskId, content, parentId = null } = req.body;
    const userPhone = req.user.phoneNo;

    if (!taskId || !userPhone || !content) {
      return res
        .status(400)
        .json(ApiResponse.error("Task ID, content and user are required", 400));
    }

    const comment = await Comment.createComment({
      taskId,
      userPhone,
      content,
      parentId,
    });

    logger.info(`Comment created on task ${taskId} by ${userPhone}`);
    res.status(201).json(ApiResponse.success(comment, 1, 201));
  } catch (error) {
    logger.error(`Error creating comment: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Get all comments for a task
exports.getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId || isNaN(taskId)) {
      return res
        .status(400)
        .json(ApiResponse.error("Valid task ID is required", 400));
    }

    const comments = await Comment.getCommentsByTask(parseInt(taskId));

    res.json(ApiResponse.success(comments, comments.length, 200));
  } catch (error) {
    logger.error(`Error fetching comments: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Get single comment by ID
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json(ApiResponse.error("Valid comment ID is required", 400));
    }

    const comment = await Comment.getCommentById(parseInt(id));
    if (!comment) {
      return res.status(404).json(ApiResponse.error("Comment not found", 404));
    }

    res.json(ApiResponse.success(comment, 1, 200));
  } catch (error) {
    logger.error(`Error fetching comment by ID: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userPhone = req.user.phoneNo;

    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json(ApiResponse.error("Valid comment ID is required", 400));
    }

    const existingComment = await Comment.getCommentById(parseInt(id));
    if (!existingComment) {
      return res.status(404).json(ApiResponse.error("Comment not found", 404));
    }

    // Only the author of the comment can delete it
    if (existingComment.user?.phoneNo !== userPhone) {
      return res
        .status(403)
        .json(ApiResponse.error("You can only delete your own comments", 403));
    }

    const deleted = await Comment.deleteComment(parseInt(id));

    if (!deleted) {
      return res
        .status(500)
        .json(ApiResponse.error("Failed to delete comment", 500));
    }

    logger.info(`Comment ${id} deleted by ${userPhone}`);
    res.json(ApiResponse.success({ deleted: true }, 1, 200));
  } catch (error) {
    logger.error(`Error deleting comment: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};
