import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
function ShipmentTracker() {
  const [shipments, setShipments] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [working, setWorking] = useState(null);
  const load = () =>
    axiosInstance
      .get("/shipments")
      .then((r) => setShipments(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load shipments."),
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
      <div className="page-header">
        <span className="eyebrow">Logistics</span>
        <h1>Shipment tracker</h1>
        <p>Monitor vehicle assignment and shipment progress.</p>
      </div>
      {error && <div className="message error">{error}</div>}
      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading shipments…
        </div>
      ) : shipments.length ? (
        <div className="cards-grid">
          {shipments.map((s) => (
            <article className="card" key={s._id}>
              <div className="card-top">
                <div>
                  <h3>Shipment {String(s._id).slice(-8).toUpperCase()}</h3>
                  <p className="muted">
                    Vehicle: {s.vehicleId?.regNumber || "—"}
                  </p>
                </div>
                <span className="tag">{s.status.replaceAll("_", " ")}</span>
              </div>
              <div className="route-line">
                {(s.stops?.length
                  ? s.stops
                  : ["Origin", "Warehouse", "Destination"]
                ).map((stop, i) => (
                  <div className="route-stop" key={`${stop}-${i}`}>
                    <span>{i + 1}</span>
                    <strong>{stop}</strong>
                    {i < (s.stops?.length || 3) - 1 && <i />}
                  </div>
                ))}
              </div>
              <div className="card-actions">
                {s.status === "pending" && (
                  <button
                    className="primary-btn"
                    disabled={working === s._id}
                    onClick={() => action(s, "dispatch")}
                  >
                    Dispatch
                  </button>
                )}
                {s.status === "in_transit" && (
                  <button
                    className="primary-btn"
                    disabled={working === s._id}
                    onClick={() => action(s, "deliver")}
                  >
                    Mark delivered
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <h3>No shipments yet</h3>
          <p>
            Shipment records will appear here once a purchase order is
            dispatched.
          </p>
        </div>
      )}
    </div>
  );
}
export default ShipmentTracker;
