import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MANDI_COMMODITIES = [
  { name: "Vine Tomato", icon: "🍅", price: "₹28/kg", change: "+4.2%", mandi: "Nalgonda Hub" },
  { name: "Dry Red Chilli", icon: "🌶️", price: "₹165/kg", change: "+1.8%", mandi: "Guntur Mandi" },
  { name: "Red Onion", icon: "🧅", price: "₹32/kg", change: "-2.1%", mandi: "Hyderabad Market" },
  { name: "Sona Masoori Rice", icon: "🌾", price: "₹3,200/q", change: "+0.5%", mandi: "Suryapet Terminal" },
  { name: "Fresh Mango", icon: "🥭", price: "₹85/kg", change: "+6.3%", mandi: "Warangal Hub" },
  { name: "Potato", icon: "🥔", price: "₹22/kg", change: "0.0%", mandi: "Khammam Mandi" },
  { name: "Raw Cotton", icon: "☁️", price: "₹7,450/q", change: "+3.4%", mandi: "Karimnagar" },
];

const FEATURES = [
  {
    icon: "🌾",
    title: "Direct Producer Network",
    desc: "Connect directly with verified farmers. Transparent harvest intake with mandatory produce photography and quality grading.",
    badge: "Fair Pricing",
  },
  {
    icon: "⚡",
    title: "Freshness-First Allocation",
    desc: "Perishable produce is prioritized by harvest freshness and earliest expiry dates, minimizing storage losses for farmers and buyers.",
    badge: "Zero Waste",
  },
  {
    icon: "🚚",
    title: "Optimized Mandi Logistics",
    desc: "Multi-stop delivery routes calculated across regional mandi hubs for lower transport freight costs and prompt market delivery.",
    badge: "Fast Transit",
  },
];

const STATS = [
  { label: "Registered Farmers", value: "500+" },
  { label: "Spoilage Prevented", value: "99.4%" },
  { label: "Produce Dispatched", value: "1,200 T" },
  { label: "Direct Payouts", value: "₹2.4 Cr" },
];

export default function HomePage() {
  const { token, user } = useAuth();

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 12px 64px" }}>
      {/* 1. Translucent Hero Card — Lets background images scroll through */}
      <section
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(6, 78, 59, 0.82) 0%, rgba(6, 95, 70, 0.78) 50%, rgba(4, 120, 87, 0.82) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(167, 243, 208, 0.35)",
          borderRadius: 24,
          padding: "48px 36px",
          color: "#ffffff",
          boxShadow: "0 20px 50px rgba(6, 78, 59, 0.25)",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 255, 255, 0.16)", padding: "6px 16px", borderRadius: 999, marginBottom: 18 }}>
          <span style={{ fontSize: 14 }}>🌾</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#dcfce7" }}>
            AgriTrade · Developed by Sushrutha Reddy Rekireddy
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 4.5vw, 46px)",
            fontWeight: 850,
            margin: "0 0 16px",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "#ffffff",
          }}
        >
          Connecting Farmers Directly to Wholesale Markets
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "#e2e8f0",
            maxWidth: 680,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          Transparent pricing, mandatory harvest photography, smart perishable allocation, and direct bank payouts across regional Mandis.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <Link
            to="/lots"
            className="primary-btn btn-animated"
            style={{
              padding: "13px 28px",
              fontSize: 15,
              fontWeight: 800,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 6px 20px rgba(16, 185, 129, 0.45)",
            }}
          >
            🛒 Explore Produce Marketplace
          </Link>

          {token ? (
            <Link
              to="/lots/new"
              className="secondary-btn btn-animated"
              style={{
                padding: "13px 26px",
                fontSize: 15,
                fontWeight: 750,
                background: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                border: "1.5px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              🌱 Upload Harvest Batch
            </Link>
          ) : (
            <Link
              to="/register"
              className="secondary-btn btn-animated"
              style={{
                padding: "13px 26px",
                fontSize: 15,
                fontWeight: 750,
                background: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                border: "1.5px solid rgba(255, 255, 255, 0.4)",
              }}
            >
              ✨ Join as Farmer or Buyer
            </Link>
          )}

          <Link
            to={token ? "/dashboard" : "/login"}
            className="secondary-btn"
            style={{
              padding: "13px 22px",
              fontSize: 14,
              fontWeight: 700,
              background: "transparent",
              color: "#a7f3d0",
              border: "1px solid rgba(167, 243, 208, 0.4)",
            }}
          >
            {token ? "📊 Dashboard →" : "Sign In →"}
          </Link>
        </div>

        {/* Quick Highlights */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
            paddingTop: 18,
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            fontSize: 13,
            color: "#cbd5e1",
          }}
        >
          <span>✓ Mandatory Product Imagery</span>
          <span>✓ FEFO Spoilage Protection</span>
          <span>✓ Universal Farmer Directory</span>
          <span>✓ Direct Bank Settlements</span>
        </div>
      </section>

      {/* 2. Live Mandi Commodity Price Ticker */}
      <section
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 18,
          padding: "14px 20px",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", display: "inline-block" }} />
            <strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#065f46" }}>
              Live APMC Mandi Market Prices
            </strong>
          </div>
          <span style={{ fontSize: 11, color: "#64748b" }}>Updated real-time across regional mandi hubs</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 10,
          }}
        >
          {MANDI_COMMODITIES.map((c) => (
            <div
              key={c.name}
              style={{
                background: "rgba(248, 250, 252, 0.85)",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {c.icon} {c.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 2 }}>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>{c.price}</strong>
                <span style={{ fontSize: 10, fontWeight: 750, color: c.change.startsWith("+") ? "#16a34a" : "#dc2626" }}>
                  {c.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 3 Simple & Attractive Value Cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="card"
            style={{
              background: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 32 }}>{f.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    background: "#ecfdf5",
                    color: "#065f46",
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: "1px solid #a7f3d0",
                  }}
                >
                  {f.badge}
                </span>
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "#0f172a" }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Impact Statistics Bar */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(240, 253, 244, 0.85) 0%, rgba(236, 253, 245, 0.85) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid #a7f3d0",
          borderRadius: 18,
          padding: "24px 20px",
          boxShadow: "0 6px 20px rgba(16, 185, 129, 0.08)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            textAlign: "center",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#065f46",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Clean CTA Card */}
      <section
        className="card"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid #a7f3d0",
          borderRadius: 20,
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#065f46" }}>
          Ready to Start Direct Agricultural Trading?
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#475569", maxWidth: 520, marginInline: "auto" }}>
          Join thousands of farmers and wholesale buyers already trading transparently across India.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/lots" className="primary-btn btn-animated" style={{ padding: "10px 24px" }}>
            View Active Produce Lots
          </Link>
          <Link to="/farmers" className="secondary-btn btn-animated" style={{ padding: "10px 22px" }}>
            Browse Farmer Directory
          </Link>
        </div>
      </section>

      {/* 6. Platform Developer Showcase Card */}
      <section
        className="card"
        style={{
          marginTop: 24,
          background: "linear-gradient(135deg, rgba(6, 78, 59, 0.88) 0%, rgba(6, 95, 70, 0.82) 50%, rgba(4, 120, 87, 0.88) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1.5px solid rgba(167, 243, 208, 0.45)",
          borderRadius: 20,
          padding: "26px 28px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
          boxShadow: "0 12px 35px rgba(6, 78, 59, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #047857 50%, #f59e0b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 900,
              border: "2.5px solid #ffffff",
              boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
              flexShrink: 0,
            }}
          >
            SR
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 850, color: "#ffffff" }}>
                Sushrutha Reddy Rekireddy
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: "rgba(34, 197, 94, 0.25)",
                  color: "#dcfce7",
                  border: "1px solid #86efac",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                Platform Developer & Creator
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#e2e8f0", maxWidth: 620 }}>
              Platform architect and developer of AgriTrade — digital mandi supply chain, verified harvest intake, freshness-first allocation, and seamless direct settlements.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            to={token ? "/profile" : "/login"}
            className="secondary-btn btn-animated"
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 750,
              background: "rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              textDecoration: "none",
            }}
          >
            {token ? "View Profile →" : "Sign In to Platform →"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 28,
          textAlign: "center",
          color: "#475569",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <p style={{ margin: 0 }}>
          AgriTrade Digital Mandi · Designed, Engineered & Developed by{" "}
          <strong style={{ color: "#065f46" }}>Sushrutha Reddy Rekireddy</strong>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
          Empowering India's Farmers & Wholesale Buyers with Transparent Agricultural Trade.
        </p>
      </footer>
    </div>
  );
}
