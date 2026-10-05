import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  if (!token) return null;

  const role = user?.role;
  const links = [
    ["/", "Dashboard"],
    ["/farmers", "Farmers"],
    ["/lots", "Lots"],
  ];
  if (["admin", "inspector", "warehouse_manager"].includes(role)) {
    links.push(["/inspections", "Inspections"]);
  }
  if (["admin", "buyer", "warehouse_manager"].includes(role)) {
    links.push(["/purchase-orders", "Purchases"]);
  }
  if (["admin", "warehouse_manager", "logistics"].includes(role)) {
    links.push(
      ["/warehouse-inventory", "Warehouses"],
      ["/shipments", "Shipments"],
    );
  }
  if (["admin", "warehouse_manager", "farmer"].includes(role)) {
    links.push(["/settlements", "Settlements"]);
  }
  if (role === "admin") links.push(["/admin", "Admin"]);

  return (
    <nav className="topbar">
      <div className="brand-wrap">
        <span className="brand-mark">A</span>
        <span>AgriTrade</span>
      </div>
      <div className="nav-links">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {label}
          </NavLink>
        ))}
      </div>
      <div className="nav-user">
        <span className="user-chip">{user?.name || "User"}</span>
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
