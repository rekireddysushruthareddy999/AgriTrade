/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import InspectionForm from "../components/InspectionForm";
import LotStatusBadge from "../components/LotStatusBadge";
function InspectionQueue() {
  const [lots, setLots] = useState([]),
    [completed, setCompleted] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [savingId, setSavingId] = useState(null);
  const load = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/lots", { params: { status: "available" } }),
      axiosInstance.get("/lots", { params: { status: "reserved" } }),
      axiosInstance.get("/inspections"),
    ])
      .then(([a, b, c]) => {
        setLots([...(a.data.data || []), ...(b.data.data || [])]);
        setCompleted(c.data.data || []);
      })
      .catch((e) =>
        setError(
          e?.response?.data?.message || "Unable to load inspection queue.",
        ),
      )
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const submit = async (payload) => {
    setSavingId(payload.lotId);
    try {
      await axiosInstance.post("/inspections", payload);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save inspection.");
    } finally {
      setSavingId(null);
    }
  };
  if (loading)
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading inspection queue…
      </div>
    );
  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Quality control</span>
        <h1>Inspection queue</h1>
        <p>Grade available and reserved lots before shipment.</p>
      </div>
      {error && <div className="message error">{error}</div>}
      <div className="section-heading">
        <h2>
          Awaiting inspection <span className="count-pill">{lots.length}</span>
        </h2>
      </div>
      {lots.length ? (
        <div className="cards-grid">
          {lots.map((l) => (
            <div className="card" key={l._id}>
              <div className="card-top">
                <div>
                  <h3>{l.produceCategoryId?.name || "Produce lot"}</h3>
                  <p className="muted">
                    {l.farmerId?.name || "Unknown farmer"} · {l.quantity}{" "}
                    {l.produceCategoryId?.unit || ""}
                  </p>
                </div>
                <LotStatusBadge status={l.status} />
              </div>
              <InspectionForm
                lotId={l._id}
                onSubmit={submit}
                disabled={savingId === l._id}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <h3>Queue is clear</h3>
          <p>No available or reserved lots are waiting for inspection.</p>
        </div>
      )}
      <div className="section-heading completed-heading">
        <h2>
          Recent inspections{" "}
          <span className="count-pill">{completed.length}</span>
        </h2>
      </div>
      {completed.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th>Grade</th>
                <th>Inspector</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {completed.slice(0, 20).map((i) => (
                <tr key={i._id}>
                  <td>{i.lotId?.groupId || i.lotId?._id || "—"}</td>
                  <td>
                    <LotStatusBadge status={i.grade} />
                  </td>
                  <td>{i.inspectorId?.name || "—"}</td>
                  <td>{new Date(i.inspectedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
export default InspectionQueue;
