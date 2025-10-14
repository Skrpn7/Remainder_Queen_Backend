const TaskFile = require("../models/file.model");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../logger");
const path = require("path");
const fs = require("fs");

exports.uploadFile = async (req, res) => {
  try {
    const { taskId } = req.body;
    const uploadedBy = req.user.phoneNo;

    if (!req.file) {
      return res.status(400).json(ApiResponse.error("File is required", 400));
    }

    const file = req.file;
    const fileURL = `/uploads/${file.filename}`;

    const newFile = await TaskFile.uploadFile(
      parseInt(taskId),
      uploadedBy,
      file.originalname,
      fileURL,
      file.mimetype,
      file.size
    );

    logger.info(`File uploaded for task ${taskId} by ${uploadedBy}`);
    res.status(201).json(ApiResponse.success(newFile, 1, 201));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

exports.getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userPhone = req.user.phoneNo;

    const files = await TaskFile.getFilesByTask(parseInt(taskId), userPhone);
    res.json(ApiResponse.success(files, files.length, 200));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userPhone = req.user.phoneNo;

    const file = await TaskFile.deleteFile(parseInt(id), userPhone);

    // Optionally delete from disk
    const localPath = path.join(__dirname, `../public${file.FileURL}`);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

    res.json(ApiResponse.success({ message: "File deleted" }, 1, 200));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

exports.viewFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userPhone = req.user.phoneNo;

    // Get file + validate user access
    const file = await TaskFile.getFileById(id, userPhone);
    if (!file) {
      return res.status(404).json(ApiResponse.error("File not found", 404));
    }

    const filePath = path.join(__dirname, `../public${file.FileURL}`);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json(ApiResponse.error("File missing from server", 404));
    }

    // Set correct headers for inline viewing (browser preview)
    res.setHeader("Content-Type", file.FileType);
    res.setHeader("Content-Disposition", `inline; filename="${file.FileName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    logger.error(`Error viewing file: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userPhone = req.user.phoneNo;

    const file = await TaskFile.getFileById(id, userPhone);
    if (!file) {
      return res.status(404).json(ApiResponse.error("File not found", 404));
    }

    const filePath = path.join(__dirname, `../public${file.FileURL}`);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json(ApiResponse.error("File missing from server", 404));
    }

    res.download(filePath, file.FileName, (err) => {
      if (err) {
        logger.error(`Error downloading file: ${err.message}`);
        if (!res.headersSent)
          res.status(500).json(ApiResponse.error("Download failed", 500));
      }
    });
  } catch (error) {
    logger.error(`Error downloading file: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};
