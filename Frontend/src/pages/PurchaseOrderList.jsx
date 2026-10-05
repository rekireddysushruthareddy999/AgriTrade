import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
function PurchaseOrderList() {
  const [orders, setOrders] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    axiosInstance
      .get("/purchase-orders")
      .then((r) => setOrders(r.data.data || []))
      .catch((e) =>
        setError(
          e?.response?.data?.message || "Unable to load purchase orders.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Procurement</span>
        <h1>Purchase orders</h1>
        <p>Review buyer demand and allocation progress.</p>
      </div>
      {error && <div className="message error">{error}</div>}
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
                <th>Order</th>
                <th>Buyer</th>
                <th>Items</th>
                <th>Deadline</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td>{String(o._id).slice(-8).toUpperCase()}</td>
                    <td>{o.buyerId?.name || "—"}</td>
                    <td>{o.items?.length || 0}</td>
                    <td>{new Date(o.deliveryDeadline).toLocaleDateString()}</td>
                    <td>
                      <span className="tag">{o.status}</span>
                    </td>
                    <td>
                      <Link
                        className="table-link"
                        to={`/purchase-orders/${o._id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No purchase orders found.
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
