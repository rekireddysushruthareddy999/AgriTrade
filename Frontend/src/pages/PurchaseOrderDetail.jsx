import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
function PurchaseOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  const load = useCallback(() =>
    axiosInstance
      .get(`/purchase-orders/${id}`)
      .then((r) => setOrder(r.data.data))
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load order."),
      ), [id]);
  useEffect(() => {
    load();
  }, [load]);
  const action = async (path) => {
    setWorking(true);
    setError("");
    try {
      await axiosInstance({
        method: path === "allocate" ? "post" : "patch",
        url: `/purchase-orders/${id}/${path}`,
      });
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Action failed.");
    } finally {
      setWorking(false);
    }
  };
  if (!order && !error)
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading purchase order…
      </div>
    );
  if (error && !order)
    return (
      <div className="empty-state card">
        <h2>Unable to load order</h2>
        <p>{error}</p>
        <Link className="secondary-btn" to="/purchase-orders">
          Back
        </Link>
      </div>
    );
  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Purchase order</span>
          <h1>#{String(order._id).slice(-8).toUpperCase()}</h1>
          <p>Buyer: {order.buyerId?.name || "—"}</p>
        </div>
        <span className="tag">{order.status}</span>
      </div>
      {error && <div className="message error">{error}</div>}
      <div className="detail-grid">
        <div className="card">
          <h2>Order summary</h2>
          <dl className="detail-list">
            <div>
              <dt>Buyer</dt>
              <dd>{order.buyerId?.name || "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{order.buyerId?.email || "—"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(order.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Delivery deadline</dt>
              <dd>{new Date(order.deliveryDeadline).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
        <div className="card">
          <h2>Actions</h2>
          <div className="button-stack">
            {!["cancelled", "fulfilled"].includes(order.status) && (
              <button
                className="primary-btn"
                disabled={working}
                onClick={() => action("allocate")}
              >
                Allocate available lots
              </button>
            )}
            {order.status !== "cancelled" && order.status !== "fulfilled" && (
              <button
                className="secondary-btn"
                disabled={working}
                onClick={() => action("confirm-delivery")}
              >
                Confirm delivery
              </button>
            )}
            {order.status !== "cancelled" && order.status !== "fulfilled" && (
              <button
                className="danger-btn"
                disabled={working}
                onClick={() => action("cancel")}
              >
                Cancel order
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="card section-card">
        <h2>Requested items</h2>
        <div className="table-wrap nested">
          <table>
            <thead>
              <tr>
                <th>Produce</th>
                <th>Requested</th>
                <th>Fulfilled</th>
                <th>Allocated lots</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((i) => (
                <tr key={i._id}>
                  <td>{i.produceCategoryId?.name || "—"}</td>
                  <td>
                    {i.quantityRequested} {i.produceCategoryId?.unit || ""}
                  </td>
                  <td>{i.quantityFulfilled}</td>
                  <td>{i.allocatedLots?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Link className="text-btn back-btn" to="/purchase-orders">
        ← Back to orders
      </Link>
    </div>
  );
}
export default PurchaseOrderDetail;
