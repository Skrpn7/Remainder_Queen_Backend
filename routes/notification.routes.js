const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authVerify } = require("../middlewares/auth.middleware");

// PUT → Update push token
router.put("/push-token", authVerify, notificationController.updatePushToken);

// GET → Get push token
router.get("/push-token", authVerify, notificationController.getPushToken);

module.exports = router;
