const User = require("../models/users.model");
const logger = require("../logger");
const ApiResponse = require("../utils/apiResponse");

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { name, phoneno } = req.body;
    if (!name || !phoneno) {
      return res
        .status(400)
        .json(ApiResponse.error("name and phoneno are required", 400));
    }

    const IsuserExist = await User.getUserByPhone(phoneno);
    if (IsuserExist) {
      return res
        .status(409)
        .json(ApiResponse.error("User with this phone number already exists", 409));
    }

    const user = await User.createUser(name, phoneno);
    logger.info(`User created: ${user.name} (${user.phoneno})`);

    return res.status(201).json(ApiResponse.success(user, 0, 201));
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error(error.message, 500));
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.getUsers();
    return res.json(ApiResponse.success(users, users.length, 200));
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error(error.message, 500));
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) {
      logger.warn(`User not found with ID: ${req.params.id}`);
      return res
        .status(404)
        .json(ApiResponse.error("User not found", 404));
    }
    return res.json(ApiResponse.success(user, 0, 200));
  } catch (error) {
    logger.error(`Error fetching user by ID: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error(error.message, 500));
  }
};
