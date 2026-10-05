import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import LotStatusBadge from "../components/LotStatusBadge";
import { useAuth } from "../context/AuthContext";
function LotDetail() {
  const { id } = useParams(),
    navigate = useNavigate();
  const { user } = useAuth();
  const [lot, setLot] = useState(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [saving, setSaving] = useState(false);
  const load = useCallback(() =>
    axiosInstance
      .get(`/lots/${id}`)
      .then((r) => setLot(r.data.data))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load lot."),
      ), [id]);
  useEffect(() => {
    load();
  }, [load]);
  const changeStatus = async () => {
    setSaving(true);
    try {
      const r = await axiosInstance.patch(`/lots/${id}/status`, { status });
      setLot(r.data.data);
      setStatus("");
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update status.");
    } finally {
      setSaving(false);
    }
  };
  if (error && !lot)
    return (
      <div className="empty-state card">
        <h2>Unable to load lot</h2>
        <p>{error}</p>
        <Link className="secondary-btn" to="/lots">
          Back to lots
        </Link>
      </div>
    );
  if (!lot)
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading lot…
      </div>
    );
  const transitions =
    {
      available: ["reserved", "expired"],
      reserved: ["available", "inspected"],
      inspected: ["shipped", "expired"],
      shipped: ["settled", "expired"],
      settled: [],
      expired: [],
    }[lot.status] || [];
  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Lot details</span>
          <h1>{lot.groupId || String(lot._id).slice(-8).toUpperCase()}</h1>
          <p>
            {lot.produceCategoryId?.name || "Produce"} ·{" "}
            {lot.farmerId?.name || "Farmer"}
          </p>
        </div>
        <LotStatusBadge status={lot.status} />
      </div>
      {error && <div className="message error">{error}</div>}
      <div className="detail-grid">
        <div className="card">
          <h2>Batch information</h2>
          <dl className="detail-list">
            <div>
              <dt>Quantity</dt>
              <dd>
                {lot.quantity} {lot.produceCategoryId?.unit || ""}
              </dd>
            </div>
            <div>
              <dt>Farmer</dt>
              <dd>{lot.farmerId?.name || "—"}</dd>
            </div>
            <div>
              <dt>Warehouse</dt>
              <dd>{lot.warehouseId?.name || "Not assigned"}</dd>
            </div>
            <div>
              <dt>Harvest date</dt>
              <dd>{new Date(lot.harvestDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Estimated expiry</dt>
              <dd>{new Date(lot.expiryEstimate).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
        {["admin", "inspector", "warehouse_manager", "logistics"].includes(
          user?.role,
        ) && (
          <div className="card">
            <h2>Update status</h2>
            <p className="muted">
              Only valid lifecycle transitions are offered.
            </p>
            {transitions.length ? (
              <>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Choose next state</option>
                  {transitions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className="primary-btn full-btn"
                  disabled={!status || saving}
                  onClick={changeStatus}
                >
                  {saving ? "Updating…" : "Update status"}
                </button>
              </>
            ) : (
              <p className="empty-inline">
                This lot has reached a terminal state.
              </p>
            )}
          </div>
        )}
      </div>
      <button className="text-btn back-btn" onClick={() => navigate("/lots")}>
        ← Back to lots
      </button>
    </div>
  );
}
export default LotDetail;
