const express = require("express");
const router = express.Router();
const fileController = require("../controllers/file.controller");
const upload = require("../middlewares/upload.middleware");
const { authVerify } = require("../middlewares/auth.middleware");

router.post(
  "/upload",
  authVerify,
  upload.single("file"),
  fileController.uploadFile
);
router.get("/task/:taskId", authVerify, fileController.getTaskFiles);
router.delete("/:id", authVerify, fileController.deleteFile);

router.get("/view/:id", authVerify, fileController.viewFile);
router.get("/download/:id", authVerify, fileController.downloadFile);

module.exports = router;
