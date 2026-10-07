import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import LotStatusBadge from "../components/LotStatusBadge";
import { useAuth } from "../context/AuthContext";

const LIFECYCLE_STEPS = [
  "created",
  "received",
  "inspected",
  "accepted",
  "stored",
  "allocated",
  "dispatched",
  "delivered",
];

function LotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lot, setLot] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedTargetStatus, setSelectedTargetStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    axiosInstance
      .get(`/lots/${id}`)
      .then((r) => setLot(r.data.data))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load lot.")
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (targetState = null) => {
    const nextState = targetState || selectedTargetStatus;
    if (!nextState) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const r = await axiosInstance.patch(`/lots/${id}/status`, {
        status: nextState,
      });
      setLot((prev) => ({ ...prev, ...r.data.data }));
      setSelectedTargetStatus("");
      setSuccessMsg(`Lot successfully transitioned to "${nextState}".`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update status.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !lot) {
    return (
      <div className="empty-state card">
        <h2>Unable to load lot</h2>
        <p>{error}</p>
        <Link className="secondary-btn" to="/lots">
          Back to lots
        </Link>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading lot details…
      </div>
    );
  }

  // Permitted next states from Directed Graph FSM
  const allowedTransitions = lot.allowedTransitions || [];
  const availableActions = lot.availableActions || [];
  const currentStatus = String(lot.status).toLowerCase();
  const currentStepIdx = LIFECYCLE_STEPS.indexOf(currentStatus);

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Lot Lifecycle Management</span>
          <h1>{lot.groupId || `LOT-${String(lot._id).slice(-8).toUpperCase()}`}</h1>
          <p>
            {lot.produceCategoryId?.name || "Produce"} · Farmer:{" "}
            {lot.farmerId?.name || "—"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lot.grade && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                padding: "6px 12px",
                borderRadius: 8,
                background:
                  lot.grade === "A"
                    ? "#dcfce7"
                    : lot.grade === "B"
                      ? "#fef9c3"
                      : "#fee2e2",
                color:
                  lot.grade === "A"
                    ? "#15803d"
                    : lot.grade === "B"
                      ? "#a16207"
                      : "#b91c1c",
              }}
            >
              Grade {lot.grade}
            </span>
          )}
          <LotStatusBadge status={lot.status} />
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {successMsg && <div className="message success">{successMsg}</div>}

      {/* Visual Directed Graph FSM Stepper */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, color: "#14532d" }}>
            🔄 Finite State Machine (Directed Graph) Pipeline
          </h3>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#15803d",
              background: "#dcfce7",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            DSA 4.2: O(1) Transition Validation
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            padding: "8px 0",
          }}
        >
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isRejected = currentStatus === "rejected";

            return (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 84,
                    padding: "8px 6px",
                    borderRadius: 10,
                    background: isCurrent
                      ? "#15803d"
                      : isCompleted
                        ? "#f0fdf4"
                        : "#f9fafb",
                    color: isCurrent
                      ? "#ffffff"
                      : isCompleted
                        ? "#166534"
                        : "#9ca3af",
                    border: isCurrent
                      ? "2px solid #15803d"
                      : isCompleted
                        ? "1px solid #bbf7d0"
                        : "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    {isCompleted ? "✓" : idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isCurrent ? 800 : 600,
                      textTransform: "capitalize",
                      marginTop: 2,
                    }}
                  >
                    {step}
                  </span>
                </div>

                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <span
                    style={{
                      color: isCompleted ? "#16a34a" : "#d1d5db",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    ➔
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h2>Batch Information</h2>
          <dl className="detail-list">
            <div>
              <dt>Quantity Available</dt>
              <dd>
                <strong>{lot.quantity}</strong> {lot.produceCategoryId?.unit || "units"}
              </dd>
            </div>
            <div>
              <dt>Base Unit Price</dt>
              <dd>
                ₹{lot.pricePerUnit || lot.produceCategoryId?.basePrice || 0} /{" "}
                {lot.produceCategoryId?.unit || "unit"}
              </dd>
            </div>
            <div>
              <dt>Farmer Profile</dt>
              <dd>
                {lot.farmerId?.name || "—"} ({lot.farmerId?.phone || "No phone"})
              </dd>
            </div>
            <div>
              <dt>Warehouse Location</dt>
              <dd>{lot.warehouseId?.name || "Awaiting warehouse assignment"}</dd>
            </div>
            <div>
              <dt>Harvest Date</dt>
              <dd>{new Date(lot.harvestDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Estimated Expiry (FEFO)</dt>
              <dd>
                {new Date(lot.expiryEstimate).toLocaleDateString()}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  (
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(lot.expiryEstimate) - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{" "}
                  days remaining)
                </span>
              </dd>
            </div>
            {lot.groupId && (
              <div>
                <dt>Settlement Batch Group</dt>
                <dd>{lot.groupId}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* FSM Valid Transition Actions */}
        <div className="card">
          <h2>Lifecycle Action Controls</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Valid transitions permitted by Directed Graph FSM from current state (
            <strong>{lot.status}</strong>):
          </p>

          {allowedTransitions.length > 0 ? (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {availableActions.map((action) => (
                <button
                  key={action.toState}
                  type="button"
                  className="primary-btn"
                  disabled={saving}
                  onClick={() => changeStatus(action.toState)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                  }}
                >
                  <span>{action.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.85 }}>
                    ➔ {action.toState}
                  </span>
                </button>
              ))}

              {/* Inspector fast action link */}
              {lot.status === "received" && (
                <Link
                  className="secondary-btn"
                  to="/inspections"
                  style={{ textAlign: "center", marginTop: 6 }}
                >
                  Open Quality Inspection Form
                </Link>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: 16,
                background: "#f9fafb",
                borderRadius: 12,
                textAlign: "center",
                color: "#6b7280",
                marginTop: 12,
              }}
            >
              This lot has reached a terminal state (<strong>{lot.status}</strong>).
              No further state transitions allowed.
            </div>
          )}
        </div>
      </div>

      {/* Inspection Record */}
      {lot.inspections && lot.inspections.length > 0 && (
        <div className="card section-card" style={{ marginTop: 20 }}>
          <h2>Quality Inspection History</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {lot.inspections.map((ins, idx) => (
              <div
                key={ins._id || idx}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Inspector: {ins.inspectorId?.name || "Staff Inspector"} ·{" "}
                    {new Date(ins.inspectedAt).toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: ins.grade === "A" ? "#dcfce7" : "#fef9c3",
                      color: ins.grade === "A" ? "#166534" : "#854d0e",
                    }}
                  >
                    Grade {ins.grade}
                  </span>
                </div>

                {ins.notes && (
                  <p style={{ margin: "4px 0 10px", fontSize: 13, color: "#4b5563" }}>
                    Notes: {ins.notes}
                  </p>
                )}

                {ins.criteriaScores?.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {ins.criteriaScores.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        style={{
                          fontSize: 12,
                          background: "#ffffff",
                          border: "1px solid #d1d5db",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {c.name}: <strong>{c.score}/100</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="text-btn back-btn"
        onClick={() => navigate("/lots")}
        style={{ marginTop: 16 }}
      >
        ← Back to lots
      </button>
    </div>
  );
}

export default LotDetail;
