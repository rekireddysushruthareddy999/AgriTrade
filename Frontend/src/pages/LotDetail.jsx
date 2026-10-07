import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import LotStatusBadge from "../components/LotStatusBadge";
import { useAuth } from "../context/AuthContext";

const LIFECYCLE_STEPS = [
  { id: "created", label: "Created", icon: "🌱", role: "Farmer" },
  { id: "received", label: "Received", icon: "📦", role: "Collection Staff" },
  { id: "inspected", label: "Inspected", icon: "🔬", role: "Inspector" },
  { id: "accepted", label: "Accepted", icon: "✅", role: "Inspector / Hub" },
  { id: "stored", label: "Stored", icon: "🏬", role: "Warehouse Mgr" },
  { id: "allocated", label: "Allocated", icon: "⚡", role: "Buyer / System" },
  { id: "dispatched", label: "Dispatched", icon: "🚚", role: "Logistics" },
  { id: "delivered", label: "Delivered", icon: "📥", role: "Buyer" },
  { id: "settled", label: "Settled", icon: "💰", role: "Finance / Admin" },
];

const ACTION_DESCRIPTIONS = {
  received: { label: "Receive Lot at Collection Center", icon: "📦", color: "#059669" },
  inspected: { label: "Move to Quality Inspection", icon: "🔬", color: "#0284c7" },
  accepted: { label: "Accept Lot Quality (Pass)", icon: "✅", color: "#059669" },
  rejected: { label: "Reject Lot Quality (Defective)", icon: "❌", color: "#dc2626" },
  stored: { label: "Move to Warehouse Storage Racks", icon: "🏬", color: "#475569" },
  allocated: { label: "Allocate to Purchase Order (FEFO)", icon: "⚡", color: "#d97706" },
  dispatched: { label: "Dispatch Carrier Shipment", icon: "🚚", color: "#7c3aed" },
  delivered: { label: "Confirm Buyer Delivery Receipt", icon: "📥", color: "#059669" },
  settled: { label: "Finalize Farmer Settlement Payout", icon: "💰", color: "#0d9488" },
};

function LotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lot, setLot] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Inspection sub-form state
  const [showInspectionBox, setShowInspectionBox] = useState(false);
  const [inspMoisture, setInspMoisture] = useState(85);
  const [inspPurity, setInspPurity] = useState(90);
  const [inspSize, setInspSize] = useState(80);
  const [inspNotes, setInspNotes] = useState("");
  const [submittingInsp, setSubmittingInsp] = useState(false);

  // Admin simulation state
  const [adminTargetStatus, setAdminTargetStatus] = useState("");

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

  const changeStatus = async (targetState, isOverride = false) => {
    if (!targetState) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload = { status: targetState };
      if (isOverride) payload.adminOverride = true;

      const r = await axiosInstance.patch(`/lots/${id}/status`, payload);
      setLot((prev) => ({ ...prev, ...r.data.data }));
      setSuccessMsg(`✓ Lot successfully transitioned to "${targetState}".`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update status.");
    } finally {
      setSaving(false);
    }
  };

  const calculateLiveGrade = () => {
    const avg = (Number(inspMoisture) + Number(inspPurity) + Number(inspSize)) / 3;
    if (avg >= 85) return "A";
    if (avg >= 70) return "B";
    if (avg >= 55) return "C";
    if (avg >= 40) return "D";
    return "F";
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingInsp(true);
    setError("");
    setSuccessMsg("");

    const criteriaScores = [
      { name: "Moisture Content", score: Number(inspMoisture) },
      { name: "Produce Purity", score: Number(inspPurity) },
      { name: "Size & Appearance", score: Number(inspSize) },
    ];
    const grade = calculateLiveGrade();

    try {
      await axiosInstance.post(`/lots/${id}/inspections`, {
        criteriaScores,
        grade,
        notes: inspNotes || `Quality grading: Grade ${grade} awarded.`,
      });
      setSuccessMsg(`✓ Inspection recorded: Grade ${grade} awarded. Lot advanced!`);
      setShowInspectionBox(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit quality inspection.");
    } finally {
      setSubmittingInsp(false);
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

  const allowedTransitions = lot.allowedTransitions || [];
  const availableActions = lot.availableActions || [];
  const currentStatus = String(lot.status).toLowerCase();
  const currentStepIdx = LIFECYCLE_STEPS.findIndex((s) => s.id === currentStatus);
  const liveGrade = calculateLiveGrade();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Produce Lifecycle Tracking · Harvest-to-Mandi Pipeline</span>
          <h1>{lot.groupId || `LOT-${String(lot._id).slice(-8).toUpperCase()}`}</h1>
          <p>
            {lot.produceCategoryId?.name || "Produce"} · Farmer:{" "}
            <strong>{lot.farmerId?.name || "—"}</strong> ({lot.farmerId?.phone || "No phone"})
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {lot.grade && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                padding: "6px 14px",
                borderRadius: 10,
                background:
                  lot.grade === "A"
                    ? "#dcfce7"
                    : lot.grade === "B"
                      ? "#fef9c3"
                      : lot.grade === "C"
                        ? "#e0e7ff"
                        : "#fee2e2",
                color:
                  lot.grade === "A"
                    ? "#15803d"
                    : lot.grade === "B"
                      ? "#a16207"
                      : lot.grade === "C"
                        ? "#4338ca"
                        : "#b91c1c",
                border: "1px solid currentColor",
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

      {/* 1. Visual Lifecycle Pipeline Stepper */}
      <div className="card" style={{ marginBottom: 24, padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
              🔄 Harvest-to-Mandi Lifecycle Pipeline
            </h3>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
              Every harvest batch progresses through verified agricultural milestones from field intake to mandi delivery.
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#059669",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "5px 10px",
              borderRadius: 8,
            }}
          >
            Verified Stage Progression
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            padding: "10px 4px 14px",
          }}
        >
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx >= 0 && idx < currentStepIdx;
            const isCurrent = step.id === currentStatus;
            const isNext = allowedTransitions.includes(step.id);
            const isClickable = isNext && !saving;

            return (
              <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div
                  onClick={() => isClickable && changeStatus(step.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 96,
                    padding: "10px 8px",
                    borderRadius: 14,
                    background: isCurrent
                      ? "linear-gradient(135deg, #059669, #10b981)"
                      : isCompleted
                        ? "#f0fdf4"
                        : isNext
                          ? "#fffbeb"
                          : "#f8fafc",
                    color: isCurrent
                      ? "#ffffff"
                      : isCompleted
                        ? "#15803d"
                        : isNext
                          ? "#b45309"
                          : "#64748b",
                    border: isCurrent
                      ? "2px solid #059669"
                      : isCompleted
                        ? "1px solid #bbf7d0"
                        : isNext
                          ? "2px dashed #f59e0b"
                          : "1px solid #e2e8f0",
                    cursor: isClickable ? "pointer" : "default",
                    transform: isCurrent ? "scale(1.04)" : "none",
                    boxShadow: isCurrent ? "0 8px 20px -4px rgba(5, 150, 105, 0.4)" : "none",
                    transition: "all 0.2s ease",
                  }}
                  title={isClickable ? `Click to advance to ${step.label}` : step.label}
                >
                  <span style={{ fontSize: 18, marginBottom: 2 }}>{step.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "capitalize" }}>
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      opacity: isCurrent ? 0.9 : 0.7,
                      marginTop: 2,
                    }}
                  >
                    {isCurrent ? "Active State" : isCompleted ? "Completed" : isNext ? "Next Step ➔" : step.role}
                  </span>
                </div>

                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <span
                    style={{
                      color: isCompleted ? "#10b981" : "#cbd5e1",
                      fontWeight: 800,
                      fontSize: 14,
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

      {/* Main Grid: Details + Lifecycle Controls */}
      <div className="detail-grid">
        {/* Left: Batch Information Card */}
        <div className="card">
          <h2>Batch Information</h2>

          {lot.imageUrl && (
            <div
              style={{
                margin: "12px 0 18px",
                borderRadius: 14,
                overflow: "hidden",
                maxHeight: 240,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={lot.imageUrl}
                alt={lot.produceCategoryId?.name || "Produce lot photo"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          <dl className="detail-list">
            <div>
              <dt>Produce Category</dt>
              <dd>
                <strong>{lot.produceCategoryId?.name || "—"}</strong>
              </dd>
            </div>
            <div>
              <dt>Physical Quantity</dt>
              <dd>
                <strong>{lot.quantity}</strong> {lot.produceCategoryId?.unit || "kg"}
              </dd>
            </div>
            <div>
              <dt>Base Price Per Unit</dt>
              <dd>₹{lot.pricePerUnit || lot.produceCategoryId?.basePrice || 0} / {lot.produceCategoryId?.unit || "kg"}</dd>
            </div>
            <div>
              <dt>Current Lifecycle Status</dt>
              <dd>
                <LotStatusBadge status={lot.status} />
              </dd>
            </div>
            <div>
              <dt>Harvest Date</dt>
              <dd>{lot.harvestDate ? new Date(lot.harvestDate).toLocaleDateString() : "—"}</dd>
            </div>
            <div>
              <dt>Estimated Expiry</dt>
              <dd>
                {lot.expiryEstimate ? new Date(lot.expiryEstimate).toLocaleDateString() : "—"}
              </dd>
            </div>
            <div>
              <dt>Storage Hub / Warehouse</dt>
              <dd>
                {lot.warehouseId?.name
                  ? `${lot.warehouseId.name} (${lot.warehouseId.location || "Regional Hub"})`
                  : "Not assigned yet"}
              </dd>
            </div>
            <div>
              <dt>Origin / Farm Gate (From)</dt>
              <dd>
                📍 <strong>{lot.originLocation || lot.farmId?.location || "Farm Gate (Producer Origin)"}</strong>
              </dd>
            </div>
            <div>
              <dt>Destination / Storage Hub (To)</dt>
              <dd>
                🏬 <strong>{lot.destinationLocation || (lot.warehouseId?.name ? `${lot.warehouseId.name} · ${lot.warehouseId.location || "Hub"}` : "Central Storage Mandi")}</strong>
              </dd>
            </div>
            <div>
              <dt>Farmer Owner</dt>
              <dd>{lot.farmerId?.name || "—"}</dd>
            </div>
            {lot.groupId && (
              <div>
                <dt>Settlement Batch Group</dt>
                <dd>
                  <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                    {lot.groupId}
                  </code>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Right: Lifecycle Action Controls Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 6px" }}>⚡ Lifecycle Action Controls</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Available next steps from current status (<strong>{lot.status}</strong>) in the supply chain:
            </p>
          </div>

          {/* Action Buttons */}
          {allowedTransitions.length > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              {availableActions.map((action) => {
                const desc = ACTION_DESCRIPTIONS[action.toState] || {
                  label: action.label,
                  icon: "➔",
                  color: "#059669",
                };

                return (
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
                      padding: "14px 18px",
                      fontSize: 14,
                      background:
                        action.toState === "rejected"
                          ? "#ef4444"
                          : action.toState === "settled"
                            ? "linear-gradient(135deg, #0d9488, #14b8a6)"
                            : undefined,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{desc.icon}</span>
                      <span>{desc.label}</span>
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        opacity: 0.9,
                        background: "rgba(255,255,255,0.2)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 800,
                      }}
                    >
                      ➔ {action.toState}
                    </span>
                  </button>
                );
              })}

              {/* Inline Quality Inspection Button if received or created */}
              {["created", "received", "inspected"].includes(currentStatus) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowInspectionBox(!showInspectionBox)}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 750,
                  }}
                >
                  <span>🔬</span>
                  <span>{showInspectionBox ? "Hide Quality Grading Form" : "Open Quality Grading & Inspection Tool"}</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: 18,
                background: currentStatus === "settled" ? "#f0fdf4" : "#f8fafc",
                border: currentStatus === "settled" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                borderRadius: 14,
                textAlign: "center",
                color: currentStatus === "settled" ? "#166534" : "#64748b",
              }}
            >
              {currentStatus === "settled" ? (
                <>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>💰</div>
                  <strong>Settlement Finalized!</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Produce lot is delivered and clustered in settlement batch {lot.groupId || "BATCH-FINAL"}.
                  </p>
                </>
              ) : currentStatus === "rejected" ? (
                <>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>❌</div>
                  <strong>Lot Rejected</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Lot failed quality grading criteria. Terminal state reached.
                  </p>
                </>
              ) : (
                <>
                  This lot has reached state <strong>{lot.status}</strong>.
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Next step requires downstream purchase order dispatch or delivery confirmation.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Buy Produce Callout */}
          {["stored", "accepted", "available"].includes(currentStatus) && Number(lot.quantity) > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
                border: "1.5px solid #10b981",
                borderRadius: 14,
                padding: 16,
                marginTop: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 750, color: "#065f46" }}>
                  🛒 Commercial Procurement Ready
                </span>
                <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                  Freshness Guaranteed
                </span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#334155" }}>
                Procure this produce lot directly. Stock allocation prioritizes batches with earliest expiration dates to guarantee peak harvest freshness.
              </p>
              <button
                type="button"
                className="primary-btn btn-animated"
                style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 750 }}
                onClick={() =>
                  navigate(
                    `/purchase-orders?buyLot=${lot._id}&category=${lot.produceCategoryId?._id}&qty=${lot.quantity}`
                  )
                }
              >
                🛒 Buy Produce / Create Purchase Order →
              </button>
            </div>
          )}

          {/* Quick Inspection Grader Panel */}
          {showInspectionBox && (
            <div
              style={{
                padding: 18,
                background: "#f8fafc",
                borderRadius: 16,
                border: "1px solid #cbd5e1",
                marginTop: 8,
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800 }}>
                🔬 Quality Inspector Grading Panel
              </h3>
              <form onSubmit={handleInspectionSubmit} style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>Moisture Content Score</span>
                    <strong>{inspMoisture}/100</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={inspMoisture}
                    onChange={(e) => setInspMoisture(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>Produce Purity Score</span>
                    <strong>{inspPurity}/100</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={inspPurity}
                    onChange={(e) => setInspPurity(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>Size & Uniformity Score</span>
                    <strong>{inspSize}/100</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={inspSize}
                    onChange={(e) => setInspSize(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: liveGrade === "A" ? "#dcfce7" : liveGrade === "F" ? "#fee2e2" : "#fef9c3",
                    color: liveGrade === "A" ? "#15803d" : liveGrade === "F" ? "#b91c1c" : "#a16207",
                    fontWeight: 800,
                  }}
                >
                  <span>Projected Quality Grade:</span>
                  <span style={{ fontSize: 16 }}>Grade {liveGrade}</span>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Inspector observations and notes…"
                    value={inspNotes}
                    onChange={(e) => setInspNotes(e.target.value)}
                    style={{ fontSize: 13, padding: "8px 12px" }}
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submittingInsp}
                  style={{ width: "100%" }}
                >
                  {submittingInsp ? "Recording Inspection…" : `Submit Inspection (Grade ${liveGrade}) ➔`}
                </button>
              </form>
            </div>
          )}

          {/* Admin Testing & Simulation Override Tool */}
          {user?.role === "admin" && (
            <div
              style={{
                marginTop: "auto",
                padding: 16,
                background: "#f1f5f9",
                borderRadius: 14,
                border: "1px dashed #94a3b8",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>👑</span>
                <strong style={{ fontSize: 12 }}>Admin Lifecycle Testing Simulator</strong>
              </div>
              <p className="muted" style={{ fontSize: 11, margin: "0 0 10px" }}>
                As an Admin, test jumping directly to any lifecycle state to verify downstream workflows:
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={adminTargetStatus}
                  onChange={(e) => setAdminTargetStatus(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                >
                  <option value="">Choose target state…</option>
                  {LIFECYCLE_STEPS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={!adminTargetStatus || saving}
                  onClick={() => changeStatus(adminTargetStatus, true)}
                  style={{ fontSize: 12, padding: "8px 12px", whiteSpace: "nowrap" }}
                >
                  Jump State ➔
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quality Inspection History Table */}
      {lot.inspections && lot.inspections.length > 0 && (
        <div className="card section-card" style={{ marginTop: 24 }}>
          <h2>🔬 Official Quality Inspection Records</h2>
          <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
            {lot.inspections.map((ins, idx) => (
              <div
                key={ins._id || idx}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: 14 }}>
                    Inspector: {ins.inspectorId?.name || "Staff Inspector"} ·{" "}
                    {new Date(ins.inspectedAt).toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: 8,
                      background: ins.grade === "A" ? "#dcfce7" : ins.grade === "F" ? "#fee2e2" : "#fef9c3",
                      color: ins.grade === "A" ? "#15803d" : ins.grade === "F" ? "#b91c1c" : "#a16207",
                    }}
                  >
                    Grade {ins.grade}
                  </span>
                </div>

                {ins.notes && (
                  <p style={{ margin: "4px 0 10px", fontSize: 13, color: "var(--muted)" }}>
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
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: 8,
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
        style={{ marginTop: 20 }}
      >
        ← Back to lot registry
      </button>
    </div>
  );
}

export default LotDetail;
