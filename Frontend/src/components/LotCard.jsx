import { Link } from "react-router-dom";
import LotStatusBadge from "./LotStatusBadge";

function LotCard({ lot }) {
  const fallbackImg =
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";

  return (
    <article className="card lot-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Product Image Header */}
      <div style={{ position: "relative", width: "100%", height: 160, background: "#f1f5f9" }}>
        <img
          src={lot.imageUrl || fallbackImg}
          alt={lot.produceCategoryId?.name || "Produce lot"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            e.target.src = fallbackImg;
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 6,
          }}
        >
          {lot.grade && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 6,
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
                      ? "#854d0e"
                      : "#b91c1c",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              Grade {lot.grade}
            </span>
          )}
          <LotStatusBadge status={lot.status} />
        </div>
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card-top" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow" style={{ fontSize: 10, padding: "2px 8px" }}>
              {lot.produceCategoryId?.name || "Produce Lot"}
            </span>
            <h3 style={{ margin: "6px 0 0", fontSize: 16 }}>
              {lot.groupId || `LOT-${String(lot._id).slice(-6).toUpperCase()}`}
            </h3>
          </div>
        </div>

        <div className="lot-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Available Qty</span>
            <strong style={{ fontSize: 14 }}>
              {lot.quantity} {lot.produceCategoryId?.unit || "kg"}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Farmer</span>
            <strong style={{ fontSize: 14 }}>{lot.farmerId?.name || "—"}</strong>
          </div>
          {lot.expiryEstimate && (
            <div style={{ gridColumn: "1/-1" }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>FEFO Expiry Estimate</span>
              <strong style={{ fontSize: 12, color: "#d97706" }}>
                {new Date(lot.expiryEstimate).toLocaleDateString()}
              </strong>
            </div>
          )}
        </div>

        <Link
          to={`/lots/${lot._id}`}
          className="secondary-btn"
          style={{ width: "100%", textAlign: "center", marginTop: 4 }}
        >
          View Full Lifecycle Details →
        </Link>
      </div>
    </article>
  );
}

export default LotCard;
