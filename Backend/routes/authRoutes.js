const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  refresh,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);

module.exports = router;
