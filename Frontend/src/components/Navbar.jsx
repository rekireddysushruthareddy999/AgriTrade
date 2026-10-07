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

  if (["admin", "buyer", "warehouse_manager"].includes(role)) {
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
        <span className="user-chip" title={`Role: ${role}`}>
          {user?.name || "User"}{" "}
          <small style={{ opacity: 0.75, fontSize: 10 }}>({role})</small>
        </span>
        <button
          className="logout-btn"
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
