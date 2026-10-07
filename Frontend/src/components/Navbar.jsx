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
      "collection_center",
      "collection_center_staff",
    ].includes(role)
  ) {
    links.push(["/settlements", "Settlements"]);
  }

  if (role === "admin") links.push(["/admin", "Admin"]);

  const handleSearchSelect = (item) => {
    if (!item) return;
    if (item.type === "lot") {
      navigate(`/lots/${item.id}`);
    } else if (item.type === "farmer") {
      navigate("/farmers");
    } else if (item.type === "warehouse") {
      navigate("/warehouse-inventory");
    } else {
      navigate("/lots");
    }
  };

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

      <div style={{ flex: "0 1 320px", margin: "0 14px" }}>
        <SearchAutocomplete
          placeholder="🔍 Instant Trie Search..."
          onSelect={handleSearchSelect}
        />
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
