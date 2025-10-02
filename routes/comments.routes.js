const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comments.controller");
const { authVerify } = require("../middlewares/auth.middleware");

// POST → Create Comment
router.post("/", authVerify, commentController.createComment);

// GET → All Comments for a Task
router.get("/task/:taskId", authVerify, commentController.getCommentsByTask);

// GET → Comment by ID
router.get("/:id", authVerify, commentController.getCommentById);

// DELETE → Comment by ID
router.delete("/:id", authVerify, commentController.deleteComment);

module.exports = router;
