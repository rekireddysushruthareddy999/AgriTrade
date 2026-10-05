import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
function WarehouseInventory() {
  const [warehouses, setWarehouses] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    axiosInstance
      .get("/warehouses")
      .then((r) => setWarehouses(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load warehouses."),
      )
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Storage</span>
        <h1>Warehouse inventory</h1>
        <p>Capacity, occupancy and current stock by hub.</p>
      </div>
      {error && <div className="message error">{error}</div>}
      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading warehouses…
        </div>
      ) : (
        <div className="cards-grid">
          {warehouses.length ? (
            warehouses.map((w) => (
              <article className="card warehouse-card" key={w._id}>
                <div className="card-top">
                  <div>
                    <h3>{w.name}</h3>
                    <p className="muted">{w.location}</p>
                  </div>
                  <span className="tag">{w.availableCapacity} free</span>
                </div>
                <div className="capacity-bar">
                  <span
                    style={{
                      width: `${Math.min(100, ((w.currentOccupancy || 0) / Math.max(1, w.capacity)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="capacity-labels">
                  <span>{w.currentOccupancy || 0} occupied</span>
                  <span>{w.capacity} total</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state card">
              <h3>No warehouses</h3>
              <p>There are no warehouses available for this account.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default WarehouseInventory;
