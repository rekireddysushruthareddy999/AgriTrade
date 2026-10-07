import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchAutocomplete from "./SearchAutocomplete";

function Navbar() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const role = user?.role;
  const links = token
    ? [
        ["/dashboard", "Dashboard"],
        ["/farmers", "Farmers"],
        ["/lots", "Lots"],
      ]
    : [
        ["/", "Home"],
        ["/lots", "Marketplace"],
        ["/farmers", "Farmers"],
      ];

  if (
    token &&
    [
      "admin",
      "inspector",
      "quality_inspector",
      "warehouse_manager",
      "collection_center",
      "collection_center_staff",
    ].includes(role)
  ) {
    links.push(["/inspections", "Inspections"]);
  }

  if (token && ["admin", "buyer", "farmer", "warehouse_manager"].includes(role)) {
    links.push(["/purchase-orders", "Purchases"]);
  }

  if (
    token &&
    [
      "admin",
      "warehouse_manager",
      "logistics",
      "logistics_coordinator",
      "collection_center",
      "collection_center_staff",
    ].includes(role)
  ) {
    links.push(
      ["/warehouse-inventory", "Warehouses"],
      ["/shipments", "Shipments"]
    );
  }

  if (
    token &&
    [
      "admin",
      "warehouse_manager",
      "farmer",
      "buyer",
      "collection_center",
      "collection_center_staff",
    ].includes(role)
  ) {
    links.push(["/settlements", "Settlements"]);
  }

  if (token && role === "admin") links.push(["/admin", "Admin"]);

  return (
    <nav className="topbar">
      <div
        className="brand-wrap"
        onClick={() => navigate(token ? "/dashboard" : "/")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
      >
        <span className="brand-mark">A</span>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.01em" }}>AgriTrade</span>
          <span style={{ fontSize: 10, color: "#a7f3d0", fontWeight: 700, letterSpacing: "0.04em" }}>
            by Sushrutha Reddy Rekireddy
          </span>
        </div>
      </div>



      <div className="nav-links">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/dashboard" || to === "/"}>
            {label}
          </NavLink>
        ))}
      </div>

      {token ? (
        <div className="nav-user">
          <NavLink
            to="/profile"
            className="user-chip"
            title={`View Profile (${role})`}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              background: "rgba(255,255,255,0.12)",
              padding: "5px 12px 5px 6px",
              borderRadius: 999,
              transition: "all 0.2s ease",
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid #a7f3d0",
                  display: "block",
                }}
              />
            ) : (
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {role === "farmer" ? "👨‍🌾" : role === "buyer" ? "🛒" : role === "inspector" ? "🔬" : role === "admin" ? "👑" : "👤"}
              </span>
            )}
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 13 }}>
              {user?.name || "User"}
            </span>
            <small
              style={{
                color: "#a7f3d0",
                fontSize: 10,
                textTransform: "uppercase",
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              {role?.slice(0, 7)}
            </small>
          </NavLink>
          <button
            className="logout-btn btn-animated"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="nav-user" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <NavLink
            to="/login"
            className="secondary-btn btn-animated"
            style={{
              textDecoration: "none",
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 700,
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            Sign In
          </NavLink>
          <NavLink
            to="/register"
            className="primary-btn btn-animated"
            style={{
              textDecoration: "none",
              padding: "6px 18px",
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            Register
          </NavLink>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
