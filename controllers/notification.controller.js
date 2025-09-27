const Users = require("../models/users.model");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../logger");

// Update user push token
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userPhone = req.user.phoneNo;

    if (!pushToken) {
      return res
        .status(400)
        .json(ApiResponse.error("Push token is required", 400));
    }

    const updated = await Users.updateUserPushToken(userPhone, pushToken);

    if (updated) {
      logger.info(`Push token updated for user: ${userPhone}`);
      res.json(
        ApiResponse.success(
          { message: "Push token updated successfully" },
          1,
          200
        )
      );
    } else {
      res.status(404).json(ApiResponse.error("User not found", 404));
    }
  } catch (error) {
    logger.error(`Error updating push token: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};

// Get user push token
exports.getPushToken = async (req, res) => {
  try {
    const userPhone = req.user.phoneNo;
    const pushToken = await Users.getUserPushToken(userPhone);

    res.json(ApiResponse.success({ pushToken: pushToken || null }, 1, 200));
  } catch (error) {
    logger.error(`Error getting push token: ${error.message}`);
    res.status(500).json(ApiResponse.error(error.message, 500));
  }
};
