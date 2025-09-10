const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const Users = require("../models/users.model");
const ApiResponse = require("../utils/ApiResponse"); // ✅ import the template class

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_SECRET = process.env.OTP_SECRET;

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

    console.log(`📲 OTP for ${phoneNo}: ${otp}`);

    res.status(200).json(
      ApiResponse.success(
        {
          message: "OTP sent successfully",
          phoneNo,
          otp, // ❌ remove in production
        },
        1
      )
    );
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

    // ✅ Issue JWT with userId + phone
    const userPayload = {
      id: existingUser.id,
      phoneNo: existingUser.phoneno,
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json(
      ApiResponse.success(
        {
          message: "OTP verified successfully",
          token,
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
