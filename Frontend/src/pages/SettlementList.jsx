import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
function SettlementList() {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [working, setWorking] = useState(null);
  const load = () =>
    axiosInstance
      .get("/settlements")
      .then((r) => setRows(r.data.data || []))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load settlements."),
      )
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const pay = async (id) => {
    setWorking(id);
    try {
      await axiosInstance.patch(`/settlements/${id}/pay`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to pay settlement.");
    } finally {
      setWorking(null);
    }
  };
  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Finance</span>
        <h1>Settlements</h1>
        <p>Review farmer settlement cycles and payment status.</p>
      </div>
      {error && <div className="message error">{error}</div>}
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
                <th>Farmer</th>
                <th>Cycle</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((s) => (
                  <tr key={s._id}>
                    <td>{s.farmerId?.name || "—"}</td>
                    <td>{s.cycle}</td>
                    <td>₹{Number(s.grossAmount).toLocaleString()}</td>
                    <td>₹{Number(s.deductions).toLocaleString()}</td>
                    <td>₹{Number(s.netAmount).toLocaleString()}</td>
                    <td>
                      <span className="tag">{s.status}</span>
                    </td>
                    <td>
                      {s.status !== "paid" && (
                        <button
                          className="text-btn"
                          disabled={working === s._id}
                          onClick={() => pay(s._id)}
                        >
                          {working === s._id ? "Paying…" : "Mark paid"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No settlement records found.
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
