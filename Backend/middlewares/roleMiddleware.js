const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat().map((role) => String(role).toLowerCase());
  return (req, res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!role) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!roles.includes(role)) return res.status(403).json({ success: false, message: "You do not have permission to perform this action." });
    return next();
  };
};
const requireAnyRole = (roles) => requireRole(...roles);
const allowRoles = (...roles) => requireRole(...roles);
module.exports = { requireRole, requireAnyRole, allowRoles, roleMiddleware: requireRole };
