const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const Users = require("../models/users.model");
const ApiResponse = require("../utils/apiResponse"); // ✅ import the template class
const { default: axios } = require("axios");

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_SECRET = process.env.OTP_SECRET;

/**
 * Generate Access & Refresh Tokens
 */
const generateTokens = async (user) => {
  const payload = {
    id: user.id,
    phoneNo: user.phoneno,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); //till refresh token// short lived
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); // long lived

  return { accessToken, refreshToken };
};

exports.sendOtp = async (req, res) => {
  try {
    const { phoneNo } = req.body;

    if (!phoneNo) {
      return res
        .status(400)
        .json(ApiResponse.error("Phone number is required", 400));
    }

    // ✅ Check if user exists in DB
    const existingUser = await Users.getUserByPhone(phoneNo);
    if (!existingUser) {
      return res
        .status(404)
        .json(ApiResponse.error("User not found. Please register first.", 404));
    }

    const otp = speakeasy.totp({
      secret: `${OTP_SECRET}:${phoneNo}`,
      encoding: "ascii",
      digits: 6,
      step: 30,
    });

    const API_KEY = process.env.TWO_FACTOR_API_KEY;
    // const message = `Your login OTP is ${otp}. It is valid for 30 seconds.`;
    if (process.env.NODE_ENV == "production") {
      const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNo}/${otp}/Otp_template`;
      const response = await axios.get(url);
      console.log("2factor:", response.data);
      console.log(`📲 OTP for ${phoneNo}: ${otp}`);
    }

    // ✅ Build response payload
    const result = {
      message: "OTP sent successfully",
      phoneNo,
    };

    // Only attach OTP in non-production mode
    if (process.env.NODE_ENV !== "production") {
      result.otp = otp;
    }

    res.status(200).json(ApiResponse.success(result, 1));
  } catch (err) {
    res
      .status(500)
      .json(ApiResponse.error(`Error generating OTP: ${err.message}`, 500));
  }
};

// Verify OTP & issue JWT
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNo, otp } = req.body;

    if (!phoneNo || !otp) {
      return res
        .status(400)
        .json(ApiResponse.error("Phone number and OTP are required", 400));
    }

    // ✅ Ensure user exists
    const existingUser = await Users.getUserByPhone(phoneNo);
    if (!existingUser) {
      return res
        .status(404)
        .json(ApiResponse.error("User not found. Please register first.", 404));
    }

    const verified = speakeasy.totp.verify({
      secret: `${OTP_SECRET}:${phoneNo}`,
      encoding: "ascii",
      token: String(otp).padStart(6, "0"),
      digits: 6,
      step: 30,
      window: 2,
    });

    if (!verified) {
      return res
        .status(401)
        .json(ApiResponse.error("Invalid or expired OTP", 401));
    }

    const { accessToken, refreshToken } = await generateTokens(existingUser);
    await Users.saveRefreshToken(existingUser.id, refreshToken);
    // ✅ Issue JWT with userId + phone
    // const userPayload = {
    //   id: existingUser.id,
    //   phoneNo: existingUser.phoneno,
    // };
    // const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json(
      ApiResponse.success(
        {
          message: "OTP verified successfully",
          token: accessToken,
          refreshToken,
          user: existingUser,
        },
        1
      )
    );
  } catch (err) {
    res
      .status(500)
      .json(ApiResponse.error(`Error verifying OTP: ${err.message}`, 500));
  }
};

/**
 * Refresh Access Token (with rotation)
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json(ApiResponse.error("Refresh token required", 400));
    }

    // ✅ Find user by refresh token
    const user = await Users.findByRefreshToken(refreshToken);
    if (!user) {
      return res
        .status(403)
        .json(ApiResponse.error("Invalid refresh token", 403));
    }

    // ✅ Verify refresh token
    jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json(ApiResponse.error("Expired or invalid refresh token", 403));
      }

      // ✅ Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        await generateTokens(user);

      // ✅ Rotate: replace old refresh token with new one
      await Users.updateRefreshToken(user.id, refreshToken, newRefreshToken);

      res.status(200).json(
        ApiResponse.success(
          {
            message: "Token refreshed successfully",
            accessToken,
            refreshToken: newRefreshToken,
          },
          1
        )
      );
    });
  } catch (err) {
    res
      .status(500)
      .json(ApiResponse.error(`Error refreshing token: ${err.message}`, 500));
  }
};

/**
 * Logout → revoke refresh token
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json(ApiResponse.error("Refresh token required", 400));
    }

    await Users.removeRefreshToken(refreshToken);

    res
      .status(200)
      .json(ApiResponse.success({ message: "Logged out successfully" }, 1));
  } catch (err) {
    res
      .status(500)
      .json(ApiResponse.error(`Error during logout: ${err.message}`, 500));
  }
};
