import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

function PurchaseOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(() => {
    axiosInstance
      .get(`/purchase-orders/${id}`)
      .then((r) => setOrder(r.data.data))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load purchase order.")
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (path) => {
    setWorking(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await axiosInstance({
        method: path === "allocate" ? "post" : "patch",
        url: `/purchase-orders/${id}/${path}`,
      });
      if (path === "allocate") {
        setSuccessMsg("Stock allocated via FEFO Min-Heap engine (soonest-to-expire lots prioritized)!");
      } else if (path === "confirm-delivery") {
        setSuccessMsg("Order delivery confirmed and lots transitioned to delivered state!");
      } else {
        setSuccessMsg(`Action "${path}" completed successfully.`);
      }
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Action failed.");
    } finally {
      setWorking(false);
    }
  };

  if (!order && !error) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading purchase order…
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="empty-state card">
        <h2>Unable to load order</h2>
        <p>{error}</p>
        <Link className="secondary-btn" to="/purchase-orders">
          Back
        </Link>
      </div>
    );
  }

  const allAllocatedLots = order.items?.flatMap((i) => i.allocatedLots || []) || [];

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Procurement & Order Allocation</span>
          <h1>Purchase Order #{String(order._id).slice(-8).toUpperCase()}</h1>
          <p>Buyer: {order.buyerId?.name || "—"} ({order.buyerId?.email || "No email"})</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="tag" style={{ textTransform: "capitalize", fontWeight: 700 }}>
            {order.status.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {successMsg && <div className="message success">{successMsg}</div>}

      <div className="detail-grid">
        <div className="card">
          <h2>Order Summary</h2>
          <dl className="detail-list">
            <div>
              <dt>Buyer</dt>
              <dd>{order.buyerId?.name || "—"}</dd>
            </div>
            <div>
              <dt>Buyer Contact</dt>
              <dd>{order.buyerId?.phone || order.buyerId?.email || "—"}</dd>
            </div>
            <div>
              <dt>Order Created</dt>
              <dd>{new Date(order.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Delivery Deadline</dt>
              <dd>{new Date(order.deliveryDeadline).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Delivery Location</dt>
              <dd>{order.deliveryLocation?.address || "Primary Hub"}</dd>
            </div>
            {order.notes && (
              <div>
                <dt>Notes</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="card">
          <h2>Allocation & Actions</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            AgriTrade allocates warehouse inventory using the <strong>FEFO Min-Heap Engine</strong>,
            automatically drawing soonest-to-expire lots first.
          </p>

          <div className="button-stack" style={{ marginTop: 16 }}>
            {!["cancelled", "fulfilled", "delivered"].includes(order.status) && (
              <button
                type="button"
                className="primary-btn"
                disabled={working}
                onClick={() => action("allocate")}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>⚡ Allocate Stock (FEFO Min-Heap)</span>
                <span style={{ fontSize: 11, opacity: 0.85 }}>DSA 4.1</span>
              </button>
            )}

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                type="button"
                className="secondary-btn"
                disabled={working}
                onClick={() => action("confirm-delivery")}
              >
                Confirm Buyer Delivery
              </button>
            )}

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                type="button"
                className="danger-btn"
                disabled={working}
                onClick={() => action("cancel")}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requested Line Items */}
      <div className="card section-card" style={{ marginTop: 20 }}>
        <h2>Requested Produce Items</h2>
        <div className="table-wrap nested">
          <table>
            <thead>
              <tr>
                <th>Produce Category</th>
                <th>Requested Qty</th>
                <th>Fulfilled Qty</th>
                <th>Fulfillment Rate</th>
                <th>Allocated Lots</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => {
                const requested = item.quantityRequested || 0;
                const fulfilled = item.quantityFulfilled || 0;
                const pct = requested > 0 ? Math.min(100, Math.round((fulfilled / requested) * 100)) : 0;

                return (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.produceCategoryId?.name || "—"}</strong>
                    </td>
                    <td>
                      {requested} {item.produceCategoryId?.unit || "kg"}
                    </td>
                    <td>
                      {fulfilled} {item.produceCategoryId?.unit || "kg"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            background: "#e5e7eb",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: pct >= 100 ? "#15803d" : "#eab308",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "#f0fdf4",
                          color: "#166534",
                        }}
                      >
                        {item.allocatedLots?.length || 0} lot(s)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocated FEFO Lots Breakdown */}
      {allAllocatedLots.length > 0 && (
        <div className="card section-card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Allocated Produce Lots (FEFO Heap Audit)</h2>
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
              FEFO Min-Heap Dispatched
            </span>
          </div>

          <div className="table-wrap nested">
            <table>
              <thead>
                <tr>
                  <th>Lot ID</th>
                  <th>Quantity Allocated</th>
                  <th>Quality Grade</th>
                  <th>Expiry Date</th>
                  <th>Warehouse Hub</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allAllocatedLots.map((lot, idx) => (
                  <tr key={lot._id || idx}>
                    <td>
                      <Link to={`/lots/${lot._id}`} style={{ fontWeight: 600, color: "#1f7a45" }}>
                        LOT-{String(lot._id).slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td>{lot.quantity} units</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>Grade {lot.grade || "A"}</span>
                    </td>
                    <td>{lot.expiryEstimate ? new Date(lot.expiryEstimate).toLocaleDateString() : "—"}</td>
                    <td>{lot.warehouseId?.name || "Local Depot"}</td>
                    <td>
                      <span className="tag" style={{ fontSize: 11 }}>
                        {lot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Link className="text-btn back-btn" to="/purchase-orders" style={{ marginTop: 16 }}>
        ← Back to orders
      </Link>
    </div>
  );
}

export default PurchaseOrderDetail;
