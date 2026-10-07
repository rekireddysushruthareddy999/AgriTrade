import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import RouteMapView from "../components/RouteMapView";

function ShipmentTracker() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(null);
  const [activeTab, setActiveTab] = useState("shipments"); // 'shipments' | 'optimizer'

  const load = () =>
    axiosInstance
      .get("/shipments")
      .then((r) => setShipments(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load shipments.")
      )
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const action = async (s, path) => {
    setWorking(s._id);
    try {
      await axiosInstance.patch(`/shipments/${s._id}/${path}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update shipment.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Logistics & Fleet Operations</span>
          <h1>Shipment Tracker & Route Optimizer</h1>
          <p>
            Monitor dispatched vehicles, transit legs, and compute optimized multi-stop mandi delivery routes.
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={activeTab === "shipments" ? "primary-btn" : "secondary-btn"}
            onClick={() => setActiveTab("shipments")}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            🚚 Active Shipments ({shipments.length})
          </button>
          <button
            type="button"
            className={activeTab === "optimizer" ? "primary-btn" : "secondary-btn"}
            onClick={() => setActiveTab("optimizer")}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            🗺️ Mandi Route Planner
          </button>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}

      {/* Mandi Route Planner tab */}
      {activeTab === "optimizer" && (
        <div style={{ marginBottom: 24 }}>
          <RouteMapView />
        </div>
      )}

      {/* Active Shipments tab */}
      {activeTab === "shipments" && (
        <>
          {loading ? (
            <div className="loading-state">
              <span className="spinner" />
              Loading shipments…
            </div>
          ) : shipments.length ? (
            <div className="cards-grid">
              {shipments.map((s) => (
                <article className="card" key={s._id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="card-top">
                    <div>
                      <h3 style={{ margin: 0 }}>
                        Shipment #{String(s._id).slice(-8).toUpperCase()}
                      </h3>
                      <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                        Vehicle: <strong>{s.vehicleId?.regNumber || "Assigned Carrier"}</strong> (
                        {s.vehicleId?.currentLocation || "In transit"})
                      </p>
                    </div>
                    <span
                      className="tag"
                      style={{
                        background:
                          s.status === "delivered"
                            ? "#dcfce7"
                            : s.status === "in_transit"
                              ? "#e0f2fe"
                              : "#fef9c3",
                        color:
                          s.status === "delivered"
                            ? "#15803d"
                            : s.status === "in_transit"
                              ? "#0369a1"
                              : "#854d0e",
                        fontWeight: 700,
                      }}
                    >
                      {s.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  {/* Route details if attached */}
                  {s.routeDetails?.totalDistanceKm > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        background: "#f0fdf4",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #bbf7d0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#166534", fontWeight: 700 }}>
                        ⚡ Optimized Transit Path:
                      </span>
                      <span style={{ color: "#166534", fontWeight: 800 }}>
                        {s.routeDetails.totalDistanceKm} km
                      </span>
                    </div>
                  )}

                  {/* Route Steps Line */}
                  <div className="route-line">
                    {(s.stops?.length
                      ? s.stops
                      : ["Origin Hub", "Collection Center", "Buyer Destination"]
                    ).map((stop, i) => {
                      const stopName = typeof stop === "object" ? stop.name || stop.id || "Waypoint" : String(stop);
                      return (
                        <div className="route-stop" key={`${stopName}-${i}`}>
                          <span>{i + 1}</span>
                          <strong>{stopName}</strong>
                          {i < (s.stops?.length || 3) - 1 && <i />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="card-actions" style={{ marginTop: "auto" }}>
                    {s.status === "pending" && (
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={working === s._id}
                        onClick={() => action(s, "dispatch")}
                      >
                        {working === s._id ? "Dispatching…" : "Dispatch Carrier"}
                      </button>
                    )}
                    {s.status === "in_transit" && (
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={working === s._id}
                        onClick={() => action(s, "deliver")}
                      >
                        {working === s._id ? "Updating…" : "Confirm Delivery"}
                      </button>
                    )}
                    {s.status === "delivered" && (
                      <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>
                        ✓ Completed & Delivered
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <h3>No shipments in transit</h3>
              <p>
                Shipment records will appear here once allocated purchase orders are dispatched.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ShipmentTracker;
