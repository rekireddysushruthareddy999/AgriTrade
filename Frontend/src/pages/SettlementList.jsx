import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

function SettlementList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [working, setWorking] = useState(null);
  const [batching, setBatching] = useState(false);
  const [cycle, setCycle] = useState(1);

  const load = () =>
    axiosInstance
      .get("/settlements")
      .then((r) => setRows(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load settlements.")
      )
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const pay = async (id) => {
    setWorking(id);
    setError("");
    setSuccessMsg("");
    try {
      await axiosInstance.patch(`/settlements/${id}/pay`);
      setSuccessMsg("Settlement payout marked as paid successfully.");
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to pay settlement.");
    } finally {
      setWorking(null);
    }
  };

  const handleBatchGenerate = async () => {
    setBatching(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await axiosInstance.post("/settlements/batch-generate", {
        cycle: Number(cycle),
        taxRate: 2,
        commissionRate: 1.5,
        freightRate: 1,
      });

      const message =
        res.data?.message || "Batch settlements generated successfully.";
      setSuccessMsg(`⚡ ${message}`);
      load();
    } catch (e) {
      setError(
        e?.response?.data?.message || "Failed to generate batch settlements."
      );
    } finally {
      setBatching(false);
    }
  };

  const canBatch = ["admin", "warehouse_manager", "collection_center", "collection_center_staff"].includes(
    user?.role
  );
  const canPay = ["admin", "warehouse_manager"].includes(user?.role);

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Finance & Transparent Payouts</span>
          <h1>Farmer Settlements</h1>
          <p>Automated payment cycle batching and transparent deduction audits.</p>
        </div>

        {canBatch && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Cycle:
              </label>
              <input
                type="number"
                min="1"
                value={cycle}
                onChange={(e) => setCycle(Math.max(1, Number(e.target.value)))}
                style={{
                  width: 54,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>

            <button
              type="button"
              className="primary-btn"
              disabled={batching}
              onClick={handleBatchGenerate}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>⚡ {batching ? "Clustering Lots…" : "Batch Settle (Union-Find)"}</span>
              <span
                style={{
                  fontSize: 10,
                  background: "rgba(255,255,255,0.25)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                DSA 4.5
              </span>
            </button>
          </div>
        )}
      </div>

      {error && <div className="message error">{error}</div>}
      {successMsg && <div className="message success">{successMsg}</div>}

      {/* Union-Find Batching Info Banner */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid rgba(31,122,69,0.2)",
          borderRadius: 14,
          padding: "12px 18px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <strong style={{ color: "#166534", fontSize: 13 }}>
            🧩 Disjoint Set Union (Union-Find) Batch Engine:
          </strong>
          <span style={{ color: "#374151", fontSize: 13, marginLeft: 8 }}>
            Groups all accepted lots for each farmer into unified settlement sets via union-by-rank and path compression, eliminating micro-payout overhead.
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#166534",
            background: "#dcfce7",
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          O(α(N)) Amortized
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading settlements…
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Batch Group ID</th>
                <th>Farmer</th>
                <th>Cycle</th>
                <th>Lots Count</th>
                <th>Gross Payout</th>
                <th>Deductions</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#15803d",
                        }}
                      >
                        {s.batchGroupId || `BATCH-${String(s._id).slice(-6).toUpperCase()}`}
                      </span>
                    </td>
                    <td>
                      <strong>{s.farmerId?.name || "Farmer"}</strong>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {s.farmerId?.phone || "No phone"}
                      </div>
                    </td>
                    <td>Cycle #{s.cycle}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "#e5e7eb",
                        }}
                      >
                        {s.lotIds?.length || 1} lot(s)
                      </span>
                    </td>
                    <td>₹{Number(s.grossAmount).toLocaleString()}</td>
                    <td>
                      <span style={{ color: "#dc2626" }}>
                        -₹{Number(s.deductions).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#166534", fontSize: 14 }}>
                        ₹{Number(s.netAmount).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span
                        className="tag"
                        style={{
                          background: s.status === "paid" ? "#dcfce7" : "#fef9c3",
                          color: s.status === "paid" ? "#166534" : "#854d0e",
                          fontWeight: 700,
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      {canPay && s.status !== "paid" ? (
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={working === s._id}
                          onClick={() => pay(s._id)}
                          style={{ padding: "6px 12px", fontSize: 12 }}
                        >
                          {working === s._id ? "Processing…" : "Mark Paid"}
                        </button>
                      ) : s.status === "paid" ? (
                        <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                          ✓ Disbursed
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    No settlement batches found. Click "Batch Settle (Union-Find)" to generate cycles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SettlementList;
