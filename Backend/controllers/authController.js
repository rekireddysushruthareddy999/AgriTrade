const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Region = require("../models/Region");
const { getJwtSecret } = require("../config/env");
const { successResponse } = require("../utils/apiResponse");
const getSecret = () => getJwtSecret();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveRegionId = async (rawRegionId) => {
  const candidate = typeof rawRegionId === "string" ? rawRegionId.trim() : "";
  if (!candidate) return null;

  if (mongoose.Types.ObjectId.isValid(candidate)) {
    return new mongoose.Types.ObjectId(candidate);
  }

  const existingRegion = await Region.findOne({
    $or: [
      { name: { $regex: `^${escapeRegex(candidate)}$`, $options: "i" } },
      { code: { $regex: `^${escapeRegex(candidate)}$`, $options: "i" } },
    ],
  }).lean();

  if (existingRegion) return existingRegion._id;

  const regionName = candidate.replace(/\s+/g, " ").trim();
  const regionCode =
    regionName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "REG";

  const createdRegion = await Region.findOneAndUpdate(
    { name: regionName },
    { name: regionName, code: regionCode },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return createdRegion._id;
};
const sanitizeUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  regionId: u.regionId,
  createdAt: u.createdAt,
});
const generateToken = (u) =>
  jwt.sign(
    { id: String(u._id), email: u.email, phone: u.phone, role: u.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" },
  );
const validatePassword = (p) => typeof p === "string" && p.length >= 8;
const register = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role = "farmer",
    regionId,
  } = req.body;
  const normalizedRole = String(role || "farmer").trim().toLowerCase();
  const normalizedRegionId =
    typeof regionId === "string" ? regionId.trim() : regionId;

  if (!name || !email || !phone || !password)
    return res.status(400).json({
      success: false,
      message: "Name, email, phone and password are required.",
    });
  if (!validatePassword(password))
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long.",
    });
  const allowed = ["farmer", "buyer"];
  if (!allowed.includes(normalizedRole))
    return res.status(403).json({
      success: false,
      message:
        "Public registration is available for farmer and buyer accounts only.",
    });
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = String(phone).trim();
  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
  });
  if (existing)
    return res.status(409).json({
      success: false,
      message: `An account with this ${existing.email === normalizedEmail ? "email" : "phone number"} already exists.`,
    });
  const resolvedRegionId = await resolveRegionId(
    normalizedRegionId || (normalizedRole === "farmer" ? "Unassigned" : ""),
  );

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash: await bcrypt.hash(password, 12),
    role: normalizedRole,
    regionId: resolvedRegionId || null,
  });
  if (normalizedRole === "farmer") {
    await Farmer.findOneAndUpdate(
      { phone: normalizedPhone },
      {
        name: user.name,
        phone: normalizedPhone,
        regionId: resolvedRegionId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  return successResponse(res, 201, "User registered successfully.", {
    user: sanitizeUser(user),
    token: generateToken(user),
  });
};
const login = async (req, res) => {
  const { identifier, email, phone, password } = req.body;
  const loginIdentifier = String(identifier || email || phone || "").trim();
  if (!loginIdentifier || !password)
    return res.status(400).json({
      success: false,
      message: "Email or phone and password are required.",
    });
  const user = await User.findOne({
    $or: [{ email: loginIdentifier.toLowerCase() }, { phone: loginIdentifier }],
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res
      .status(401)
      .json({ success: false, message: "Invalid login credentials." });
  return successResponse(res, 200, "User logged in successfully.", {
    user: sanitizeUser(user),
    token: generateToken(user),
  });
};
const forgotPassword = async (req, res) => {
  const identifier = String(
    req.body.identifier || req.body.email || req.body.phone || "",
  ).trim();
  if (!identifier)
    return res
      .status(400)
      .json({ success: false, message: "Email or phone is required." });
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });
  const generic = {
    message:
      "If an account matches that contact, a password reset token has been generated.",
  };
  if (!user) return successResponse(res, 200, generic.message, null);
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(token).digest("hex");
  user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  const data =
    process.env.NODE_ENV === "production"
      ? null
      : { resetToken: token, expiresInMinutes: 15 };
  return successResponse(res, 200, generic.message, data);
};
const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  if (!token || !newPassword || newPassword !== confirmPassword)
    return res.status(400).json({
      success: false,
      message:
        "Token, matching new password and confirm password are required.",
    });
  if (!validatePassword(newPassword))
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long.",
    });
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user)
    return res
      .status(400)
      .json({ success: false, message: "Reset token is invalid or expired." });
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetToken = null;
  user.resetTokenExpiresAt = null;
  await user.save();
  return successResponse(res, 200, "Password reset successful.", null);
};
const refresh = async (req, res) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer "))
    return res
      .status(401)
      .json({ success: false, message: "Token is required." });
  try {
    const decoded = jwt.verify(header.slice(7), getSecret());
    const user = await User.findById(decoded.id);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User account no longer exists." });
    return successResponse(res, 200, "Token refreshed successfully.", {
      user: sanitizeUser(user),
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Unauthorized: invalid token.",
    });
  }
};
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  refresh,
  getSecret,
  resolveRegionId,
};
