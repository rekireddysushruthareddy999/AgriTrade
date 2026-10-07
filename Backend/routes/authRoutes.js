const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  refresh,
  getProfile,
  updateProfile,
} = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);

router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);

module.exports = router;
