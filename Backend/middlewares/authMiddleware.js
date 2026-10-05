const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/env");

const getSecret = () => getJwtSecret();

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(header.slice(7), getSecret());
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid authentication token.",
    });
  }
};

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    req.user = jwt.verify(header.slice(7), getSecret());
  } catch {
    req.user = null;
  }
  return next();
};

module.exports = {
  authenticate,
  authMiddleware: authenticate,
  optionalAuth,
  getSecret,
};
