const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const { authVerify } = require("../middlewares/auth.middleware");

// POST → Create Task
router.post("/", authVerify, taskController.createTask);

// GET → All Tasks
router.get("/", authVerify, taskController.getTasks);

// GET → Task by ID
router.get("/:id", authVerify, taskController.getTaskById);

router.put("/:id", authVerify, taskController.updateTask);

router.put("/:id/status", authVerify, taskController.updateTaskStatus);

module.exports = router;
