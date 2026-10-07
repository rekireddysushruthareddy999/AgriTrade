import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

function PurchaseOrderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create Purchase Order Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    produceCategoryId: "",
    quantityRequested: "100",
    deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    deliveryAddress: "Central Mandi Distribution Terminal, Hub 1",
    autoAllocate: true,
    notes: "Express fulfillment via FEFO Min-Heap",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/purchase-orders"),
      axiosInstance.get("/produce-categories"),
    ])
      .then(([ordersRes, catsRes]) => {
        setOrders(ordersRes.data.data || []);
        const catList = catsRes.data.data || [];
        setCategories(catList);

        // Pre-fill from query params if redirected from Buy Produce button
        const catParam = searchParams.get("category");
        const qtyParam = searchParams.get("qty");
        const buyLotParam = searchParams.get("buyLot");

        if (catParam || buyLotParam) {
          setShowCreateModal(true);
          setForm((prev) => ({
            ...prev,
            produceCategoryId: catParam || (catList[0] ? catList[0]._id : ""),
            quantityRequested: qtyParam || "100",
            notes: buyLotParam
              ? `Procurement request linked to Lot ${buyLotParam.slice(-6).toUpperCase()}`
              : prev.notes,
          }));
        } else if (catList.length > 0 && !form.produceCategoryId) {
          setForm((prev) => ({ ...prev, produceCategoryId: catList[0]._id }));
        }
      })
      .catch((e) =>
        setError(
          e?.response?.data?.message || "Unable to load purchase orders."
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.produceCategoryId) {
      return setError("Please select a produce category.");
    }
    if (Number(form.quantityRequested) <= 0) {
      return setError("Quantity must be greater than zero.");
    }
    if (!form.deliveryDeadline) {
      return setError("Please select a delivery deadline.");
    }

    setSubmitting(true);
    try {
      const payload = {
        deliveryDeadline: form.deliveryDeadline,
        deliveryLocation: {
          address: form.deliveryAddress,
          city: "Regional Mandi Hub",
        },
        notes: form.notes,
        autoAllocate: form.autoAllocate,
        items: [
          {
            produceCategoryId: form.produceCategoryId,
            quantityRequested: Number(form.quantityRequested),
          },
        ],
      };

      const res = await axiosInstance.post("/purchase-orders", payload);
      const created = res.data.data;
      const isAllocated =
        created.status === "allocated" || created.status === "partially_fulfilled";

      setSuccessMsg(
        isAllocated
          ? `✓ Purchase Order #${String(created._id).slice(-8).toUpperCase()} created & stock allocated instantly via DSA 4.1 FEFO Min-Heap!`
          : `✓ Purchase Order #${String(created._id).slice(-8).toUpperCase()} created successfully!`
      );

      setShowCreateModal(false);
      // Clean query params
      setSearchParams({});
      load();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to create purchase order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "allocated":
        return { bg: "#dcfce7", color: "#166534", border: "#86efac" };
      case "partially_fulfilled":
        return { bg: "#fef9c3", color: "#854d0e", border: "#fde047" };
      case "delivered":
        return { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc" };
      case "cancelled":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
    }
  };

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Procurement & Demand · DSA 4.1 FEFO Heap</span>
          <h1>Purchase Orders & Produce Procurement</h1>
          <p>
            Procure harvested crops from farmers. Orders are automatically fulfilled using the First-Expired-First-Out Min-Heap algorithm.
          </p>
        </div>
        <button
          type="button"
          className="primary-btn btn-animated"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <span>🛒</span>
          <span>+ Create Purchase Order</span>
        </button>
      </div>

      {/* DSA 4.1 Architecture Card */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          border: "1.5px solid #a7f3d0",
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#10b981",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 15, color: "#065f46" }}>
                DSA 4.1: Perishable Warehouse Allocation Engine (FEFO Min-Heap)
              </strong>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                O(log N) Priority Queue
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#047857" }}>
              Every procurement order prioritizes soonest-to-expire lots first to minimize spoilage across agricultural storage hubs.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setShowCreateModal(true)}
          style={{ fontSize: 12, padding: "6px 14px", fontWeight: 700 }}
        >
          ⚡ Place Order with FEFO Allocation
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {successMsg && <div className="message success">{successMsg}</div>}

      {/* Modal: Create Purchase Order */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1.5px solid #10b981",
              borderRadius: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#059669",
                  }}
                >
                  Procurement Form · DSA 4.1 FEFO
                </span>
                <h2 style={{ margin: "2px 0 0", fontSize: 20 }}>
                  🛒 Create Purchase Order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setSearchParams({});
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: "grid", gap: 16 }}>
              <label>
                Produce Category to Buy *
                <select
                  value={form.produceCategoryId}
                  onChange={(e) =>
                    setForm({ ...form, produceCategoryId: e.target.value })
                  }
                  required
                >
                  <option value="">Select produce commodity</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.unit || "kg"}) · Base: ₹{c.basePrice || 0}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  Quantity to Procure *
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={form.quantityRequested}
                    onChange={(e) =>
                      setForm({ ...form, quantityRequested: e.target.value })
                    }
                    placeholder="e.g. 500"
                    required
                  />
                </label>

                <label>
                  Delivery Deadline *
                  <input
                    type="date"
                    value={form.deliveryDeadline}
                    onChange={(e) =>
                      setForm({ ...form, deliveryDeadline: e.target.value })
                    }
                    required
                  />
                </label>
              </div>

              <label>
                Destination Delivery Location *
                <input
                  value={form.deliveryAddress}
                  onChange={(e) =>
                    setForm({ ...form, deliveryAddress: e.target.value })
                  }
                  placeholder="e.g. APMC Mandi Yard #3, Guntur Market"
                  required
                />
              </label>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <input
                  type="checkbox"
                  id="autoAllocate"
                  checked={form.autoAllocate}
                  onChange={(e) =>
                    setForm({ ...form, autoAllocate: e.target.checked })
                  }
                  style={{ marginTop: 3, width: 18, height: 18, cursor: "pointer" }}
                />
                <label htmlFor="autoAllocate" style={{ margin: 0, cursor: "pointer" }}>
                  <strong style={{ color: "#065f46", fontSize: 13, display: "block" }}>
                    ⚡ Instant Auto-Allocate via FEFO Min-Heap (DSA 4.1)
                  </strong>
                  <span style={{ fontSize: 12, color: "#047857" }}>
                    Immediately draws available warehouse produce lots prioritized by earliest expiry dates to minimize perishability losses.
                  </span>
                </label>
              </div>

              <label>
                Order Notes / Specifications
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Grade A preferred, urgent delivery"
                />
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSearchParams({});
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn btn-animated"
                  disabled={submitting}
                  style={{ minWidth: 160 }}
                >
                  {submitting ? "Processing…" : "Confirm & Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading orders…
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Produce Commodity</th>
                <th>Requested Qty</th>
                <th>Fulfilled (FEFO)</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o) => {
                  const firstItem = o.items?.[0];
                  const st = getStatusColor(o.status);
                  const totalRequested = o.items?.reduce(
                    (s, i) => s + (i.quantityRequested || 0),
                    0
                  ) || 0;
                  const totalFulfilled = o.items?.reduce(
                    (s, i) => s + (i.quantityFulfilled || 0),
                    0
                  ) || 0;
                  const pct =
                    totalRequested > 0
                      ? Math.min(100, Math.round((totalFulfilled / totalRequested) * 100))
                      : 0;

                  return (
                    <tr key={o._id}>
                      <td>
                        <strong style={{ fontFamily: "monospace" }}>
                          #{String(o._id).slice(-8).toUpperCase()}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <strong>{o.buyerId?.name || "Market Buyer"}</strong>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {o.buyerId?.email || o.buyerId?.phone || "—"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{firstItem?.produceCategoryId?.name || "Produce"}</strong>
                        {o.items?.length > 1 && (
                          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>
                            (+{o.items.length - 1} more)
                          </span>
                        )}
                      </td>
                      <td>
                        {totalRequested}{" "}
                        {firstItem?.produceCategoryId?.unit || "kg"}
                      </td>
                      <td>
                        <div>
                          <strong>
                            {totalFulfilled} / {totalRequested} {firstItem?.produceCategoryId?.unit || "kg"}
                          </strong>
                          <div
                            style={{
                              fontSize: 11,
                              color: pct === 100 ? "#16a34a" : "#d97706",
                              fontWeight: 700,
                            }}
                          >
                            {pct}% fulfilled
                          </div>
                        </div>
                      </td>
                      <td>{new Date(o.deliveryDeadline).toLocaleDateString()}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 750,
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                            textTransform: "capitalize",
                          }}
                        >
                          {o.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="table-link"
                          to={`/purchase-orders/${o._id}`}
                          style={{ fontWeight: 700 }}
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-cell" style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🛒</div>
                    <strong>No purchase orders found.</strong>
                    <p style={{ margin: "4px 0 12px", color: "#64748b" }}>
                      Place your first produce procurement order with instant FEFO Min-Heap allocation.
                    </p>
                    <button
                      type="button"
                      className="primary-btn btn-animated"
                      onClick={() => setShowCreateModal(true)}
                    >
                      + Create Purchase Order Now
                    </button>
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

export default PurchaseOrderList;
