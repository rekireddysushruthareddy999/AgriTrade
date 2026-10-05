/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import LotCard from "../components/LotCard";
function LotList() {
  const { user } = useAuth();
  const [lots, setLots] = useState([]),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    axiosInstance
      .get("/lots", { params: status ? { status } : undefined })
      .then((r) => setLots(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load lots."),
      )
      .finally(() => setLoading(false));
  };
  useEffect(load, [status]);
  const visible = useMemo(
    () =>
      lots.filter((l) =>
        `${l.groupId || ""} ${l.produceCategoryId?.name || ""} ${l.farmerId?.name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [lots, search],
  );
  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Supply</span>
          <h1>Lot registry</h1>
          <p>Track harvest batches, quality state and warehouse assignment.</p>
        </div>
        {["admin", "farmer"].includes(user?.role) && (
          <Link to="/lots/new" className="primary-btn">
            + Create lot
          </Link>
        )}
      </div>
      <div className="toolbar">
        <input
          aria-label="Search lots"
          placeholder="Search by group, crop or farmer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {[
            "available",
            "reserved",
            "inspected",
            "shipped",
            "settled",
            "expired",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
