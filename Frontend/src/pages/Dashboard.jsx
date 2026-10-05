import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const canViewOrders = ["admin", "buyer", "warehouse_manager"].includes(
    user?.role,
  );
  const canViewShipments = [
    "admin",
    "warehouse_manager",
    "logistics",
  ].includes(user?.role);
  const [stats, setStats] = useState({
    farmers: 0,
    lots: 0,
    orders: 0,
    shipments: 0,
  });
  const [error, setError] = useState("");
  useEffect(() => {
    const requests = [
      axiosInstance.get("/farmers"),
      axiosInstance.get("/lots"),
    ];
    if (canViewOrders) requests.push(axiosInstance.get("/purchase-orders"));
    if (canViewShipments) requests.push(axiosInstance.get("/shipments"));

    Promise.all(requests)
      .then((responses) => {
        let responseIndex = 2;
        const ordersResponse = canViewOrders
          ? responses[responseIndex++]
          : null;
        const shipmentsResponse = canViewShipments
          ? responses[responseIndex]
          : null;
        setStats({
          farmers: responses[0].data.data?.length || 0,
          lots: responses[1].data.data?.length || 0,
          orders: ordersResponse?.data.data?.length || 0,
          shipments: shipmentsResponse?.data.data?.length || 0,
        });
      })
      .catch(() => setError("Some dashboard data could not be loaded."));
  }, [canViewOrders, canViewShipments]);
  const cards = [
    ["Farmers", stats.farmers, "/farmers", "People in the trading network"],
    ["Lots", stats.lots, "/lots", "Produce lots currently tracked"],
    ...(canViewOrders
      ? [
          [
            "Purchase orders",
            stats.orders,
            "/purchase-orders",
            "Orders and allocations",
          ],
        ]
      : []),
    ...(canViewShipments
      ? [
          [
            "Shipments",
            stats.shipments,
            "/shipments",
            "Active logistics records",
          ],
        ]
      : []),
  ];
  return (
    <div className="dashboard">
      <section className="hero">
        <div>
          <span className="eyebrow">Agricultural trade operations</span>
          <h1>Good to see you, {user?.name?.split(" ")[0] || "there"}.</h1>
          <p>
            Manage produce from farm intake through inspection, allocation,
            logistics and settlement in one workspace.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/lots/new">
              Create a lot
            </Link>
            {["admin", "inspector", "warehouse_manager"].includes(
              user?.role,
            ) && (
              <Link className="secondary-btn" to="/inspections">
                Open inspections
              </Link>
            )}
          </div>
        </div>
        <div className="hero-orb">
          <span>🌱</span>
        </div>
      </section>
      {error && <div className="message error">{error}</div>}
      <section className="stats-grid">
        {cards.map(([label, value, to, desc]) => (
          <Link className="stat-card" to={to} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{desc}</small>
          </Link>
        ))}
      </section>
      <section className="workflow card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Workflow</span>
            <h2>From harvest to settlement</h2>
          </div>
        </div>
        <div className="workflow-grid">
          {[
            ["01", "Register", "Capture farmers, farms and produce lots."],
            ["02", "Inspect", "Grade quality before allocation."],
            ["03", "Move", "Allocate, dispatch and track shipments."],
            ["04", "Settle", "Close fulfilled lots and payments."],
          ].map(([n, t, d]) => (
            <div className="workflow-step" key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
export default Dashboard;
