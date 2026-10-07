import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

function RouteMapView({ stops = [], initialStart = null, onRouteOptimized = null }) {
  const [networkNodes, setNetworkNodes] = useState([]);
  const [selectedStops, setSelectedStops] = useState(
    stops.length ? stops.map((s) => s.id || s) : ["NALGONDA_CC", "SURYAPET_WH"]
  );
  const [startPoint, setStartPoint] = useState(initialStart || "HYD_HUB");
  const [destination, setDestination] = useState("GUNTUR_BUYER");
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch available logistics network nodes
  useEffect(() => {
    axiosInstance
      .get("/logistics/network")
      .then((res) => {
        if (res.data?.data?.nodes) {
          setNetworkNodes(res.data.data.nodes);
        }
      })
      .catch((err) => console.warn("Logistics network load error:", err));
  }, []);

  const runDijkstraOptimization = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post("/logistics/optimize-route", {
        startPoint,
        stops: selectedStops,
        endPoint: destination,
      });

      const data = response.data?.data;
      setRouteResult(data);
      if (onRouteOptimized) onRouteOptimized(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Route optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStop = (nodeId) => {
    if (selectedStops.includes(nodeId)) {
      setSelectedStops(selectedStops.filter((id) => id !== nodeId));
    } else {
      setSelectedStops([...selectedStops, nodeId]);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 18,
        background: "#ffffff",
        border: "1px solid rgba(31, 122, 69, 0.18)",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
          borderBottom: "1px solid #f0fdf4",
          paddingBottom: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#14532d", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🗺️</span> Dijkstra Logistics Route Optimization
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Weighted Graph shortest-path calculation across regional hubs and collection centers.
          </p>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 999,
            background: "#dcfce7",
            color: "#166534",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          DSA 4.3: Dijkstra O((V+E) log V)
        </span>
      </div>

      {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Interactive Hub Selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 16,
          background: "#f9fafb",
          padding: 14,
          borderRadius: 14,
        }}
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Origin Hub (Start)
          </label>
          <select
            value={startPoint}
            onChange={(e) => setStartPoint(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            <option value="HYD_HUB">Hyderabad Central Hub (HYD)</option>
            <option value="NALGONDA_CC">Nalgonda Collection Center</option>
            <option value="WARANGAL_MKT">Warangal Agri Market</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Buyer Terminal (Destination)
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            <option value="GUNTUR_BUYER">Guntur Processing Plant</option>
            <option value="VIJAYAWADA_BUYER">Vijayawada Wholesale Terminal</option>
            <option value="HYD_HUB">Hyderabad Central Hub</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            type="button"
            className="primary-btn"
            onClick={runDijkstraOptimization}
            disabled={loading}
            style={{ width: "100%", height: 38 }}
          >
            {loading ? "Computing Path…" : "⚡ Compute Shortest Route"}
          </button>
        </div>
      </div>

      {/* Checkbox Stops Selection */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>
          Waypoints to visit (Pickups / Warehouses):
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "NALGONDA_CC", label: "Nalgonda CC" },
            { id: "SURYAPET_WH", label: "Suryapet WH" },
            { id: "WARANGAL_MKT", label: "Warangal Mkt" },
            { id: "KHAMMAM_CC", label: "Khammam CC" },
            { id: "KARIMNAGAR_WH", label: "Karimnagar WH" },
          ].map((item) => {
            const isChecked = selectedStops.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleStop(item.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isChecked ? "1.5px solid #1f7a45" : "1px solid #d1d5db",
                  background: isChecked ? "#ecfdf5" : "#ffffff",
                  color: isChecked ? "#065f46" : "#4b5563",
                  transition: "all 0.15s ease",
                }}
              >
                {isChecked ? "✓ " : "+ "} {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results View */}
      {routeResult && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid rgba(31, 122, 69, 0.25)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                Optimized Dispatch Plan
              </span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#064e3b", marginTop: 2 }}>
                {routeResult.totalDistanceKm} km total distance
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: 13, color: "#065f46" }}>
              ⏱️ Est. Travel Time: <strong>{Math.round((routeResult.totalDistanceKm / 50) * 60)} mins</strong> (~
              {(routeResult.totalDistanceKm / 50).toFixed(1)} hrs)
            </div>
          </div>

          {/* Stepper Timeline */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", padding: "10px 0" }}>
            {routeResult.optimalSequence?.map((node, idx) => (
              <div key={`${node.id || node}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    background: idx === 0 ? "#15803d" : idx === routeResult.optimalSequence.length - 1 ? "#047857" : "#ffffff",
                    color: idx === 0 || idx === routeResult.optimalSequence.length - 1 ? "#ffffff" : "#111827",
                    border: "1.5px solid #15803d",
                    borderRadius: 10,
                    padding: "8px 12px",
                    minWidth: 120,
                    textAlign: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.8 }}>
                    {idx === 0 ? "Start" : idx === routeResult.optimalSequence.length - 1 ? "Buyer Dest" : `Stop ${idx}`}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                    {node.name || node.label || node.id || node}
                  </div>
                </div>

                {idx < routeResult.optimalSequence.length - 1 && (
                  <div style={{ color: "#15803d", fontWeight: 800, fontSize: 14 }}>➔</div>
                )}
              </div>
            ))}
          </div>

          {/* Leg breakdown table */}
          {routeResult.legDetails?.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#166534", marginBottom: 6 }}>Leg Breakdown:</div>
              <div style={{ display: "grid", gap: 6 }}>
                {routeResult.legDetails.map((leg, lIdx) => (
                  <div
                    key={lIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #dcfce7",
                    }}
                  >
                    <span>
                      <strong>Leg {lIdx + 1}:</strong> {leg.from} ➔ {leg.to}
                    </span>
                    <span style={{ fontWeight: 600, color: "#166534" }}>
                      {leg.distanceKm} km ({leg.estimatedTimeMinutes}m)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RouteMapView;
