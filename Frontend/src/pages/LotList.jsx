/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import LotCard from "../components/LotCard";
function LotList() {
  const { user } = useAuth();
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'settled'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    const params = {};
    if (activeTab === "settled") {
      params.status = "settled";
    } else if (status) {
      params.status = status;
    }
    // If activeTab is 'active' and no status is picked, backend excludes 'settled' automatically

    axiosInstance
      .get("/lots", { params })
      .then((r) => setLots(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load lots.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, activeTab]);

  const visible = useMemo(
    () =>
      lots.filter((l) =>
        `${l.groupId || ""} ${l.produceCategoryId?.name || ""} ${l.farmerId?.name || ""} ${l.originLocation || ""} ${l.destinationLocation || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [lots, search],
  );

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Supply & Intake</span>
          <h1>Produce Lot Registry</h1>
          <p>
            Track active harvest batches and storage allocations. Settled lots are automatically archived.
          </p>
        </div>
        {["admin", "farmer"].includes(user?.role) && (
          <Link to="/lots/new" className="primary-btn btn-animated">
            + Create Produce Lot
          </Link>
        )}
      </div>

      {/* Active vs Settled Archive Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          className={activeTab === "active" ? "primary-btn" : "secondary-btn"}
          onClick={() => {
            setActiveTab("active");
            setStatus("");
          }}
          style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700 }}
        >
          🌿 Active Marketplace Lots
        </button>
        <button
          type="button"
          className={activeTab === "settled" ? "primary-btn" : "secondary-btn"}
          onClick={() => {
            setActiveTab("settled");
            setStatus("settled");
          }}
          style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700 }}
        >
          💰 Settled / Archived Lots
        </button>
      </div>

      <div className="toolbar">
        <input
          aria-label="Search lots"
          placeholder="Search by crop, farmer, origin or destination…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {activeTab === "active" && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All active statuses (settled excluded)</option>
            {[
              "created",
              "received",
              "inspected",
              "accepted",
              "stored",
              "allocated",
              "dispatched",
              "delivered",
              "available",
              "rejected",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && (
        <div className="message error">
          {error}{" "}
          <button className="text-btn" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading lots…
        </div>
      ) : (
        <div className="cards-grid">
          {visible.length ? (
            visible.map((l) => <LotCard key={l._id} lot={l} />)
          ) : (
            <div className="empty-state card">No lots match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
export default LotList;
