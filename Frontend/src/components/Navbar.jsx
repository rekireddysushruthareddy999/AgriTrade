import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchAutocomplete from "./SearchAutocomplete";

function Navbar() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  if (!token) return null;

  const role = user?.role;
  const links = [
    ["/dashboard", "Dashboard"],
    ["/farmers", "Farmers"],
    ["/lots", "Lots"],
  ];

  if (
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

  if (["admin", "buyer", "farmer", "warehouse_manager"].includes(role)) {
    links.push(["/purchase-orders", "Purchases"]);
  }

  if (
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

  if (role === "admin") links.push(["/admin", "Admin"]);

  return (
    <nav className="topbar">
      <div
        className="brand-wrap"
        onClick={() => navigate("/dashboard")}
        style={{ cursor: "pointer" }}
      >
        <span className="brand-mark">A</span>
        <span>AgriTrade</span>
      </div>

      {/* Stylish Name Pill in place of search bar: Sushrutha Reddy Rekireddy */}
      <div
        className="user-greeting-pill"
        onClick={() => navigate("/profile")}
        title="View profile: Sushrutha Reddy Rekireddy"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 95, 70, 0.35) 50%, rgba(245, 158, 11, 0.18) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid rgba(167, 243, 208, 0.45)",
          padding: "7px 18px 7px 8px",
          borderRadius: 999,
          cursor: "pointer",
          margin: "0 18px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981 0%, #047857 50%, #f59e0b 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 850,
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(16, 185, 129, 0.45)",
            border: "2px solid #ffffff",
            flexShrink: 0,
          }}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Sushrutha Reddy Rekireddy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span>SR</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                color: "#ffffff",
                fontWeight: 850,
                fontSize: 14.5,
                letterSpacing: "0.02em",
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                background: "linear-gradient(90deg, #ffffff 0%, #dcfce7 65%, #fef08a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {user?.name && user.name.toLowerCase() !== "user" ? user.name : "Sushrutha Reddy Rekireddy"}
            </span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                display: "inline-block",
              }}
              title="Active & Verified"
            />
          </div>
          <span
            style={{
              color: "#a7f3d0",
              fontSize: 10.5,
              textTransform: "uppercase",
              fontWeight: 750,
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>✨</span>
            <span>
              {role === "farmer"
                ? "Verified Grower & Producer"
                : role === "buyer"
                  ? "Verified Commercial Buyer"
                  : role === "admin"
                    ? "Platform Administrator"
                    : "Premier Member"}
            </span>
          </span>
        </div>
      </div>

      <div className="nav-links">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/dashboard"}>
            {label}
          </NavLink>
        ))}
      </div>

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
    </nav>
  );
}

export default Navbar;
