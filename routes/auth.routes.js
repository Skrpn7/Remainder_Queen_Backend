const express = require("express");
const {
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/refresh", refreshToken);
router.post("/logout", logout);

module.exports = router;
