import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const COMMODITY_TICKERS = [
  { name: "Vine Tomato", icon: "🍅", price: "₹28/kg", change: "+4.2%", up: true, mandi: "Nalgonda" },
  { name: "Dry Red Chilli", icon: "🌶️", price: "₹165/kg", change: "+1.8%", up: true, mandi: "Guntur" },
  { name: "Nashik Red Onion", icon: "🧅", price: "₹32/kg", change: "-2.1%", up: false, mandi: "Hyderabad" },
  { name: "Sona Masoori Rice", icon: "🌾", price: "₹3,200/q", change: "+0.5%", up: true, mandi: "Suryapet" },
  { name: "Alphonso Mango", icon: "🥭", price: "₹85/kg", change: "+6.3%", up: true, mandi: "Warangal" },
  { name: "Organic Potato", icon: "🥔", price: "₹22/kg", change: "0.0%", up: true, mandi: "Khammam" },
  { name: "Raw Cotton", icon: "☁️", price: "₹7,450/q", change: "+3.4%", up: true, mandi: "Karimnagar" },
];

const DSA_PILLARS = [
  {
    id: "fefo",
    badge: "DSA 4.1",
    tag: "Warehouse Allocation",
    title: "FEFO Min-Heap Engine",
    complexity: "O(log n) Push / O(1) Peek",
    icon: "⚡",
    color: "#059669",
    bg: "#ecfdf5",
    desc: "Perishable produce spoils if shipped FIFO or at random. AgriTrade's Min-Heap keys on expiry date and freshness scores to pop soonest-to-expire lots first for purchase orders, driving inventory waste toward zero.",
  },
  {
    id: "fsm",
    badge: "DSA 4.2",
    tag: "Lifecycle Integrity",
    title: "Directed Graph (FSM)",
    complexity: "O(1) Edge Lookup / BFS",
    icon: "🔄",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Produce passes through 8 strict stages. Transitions are modeled as a directed graph adjacency list, preventing invalid jumps (e.g. dispatched to received) and walking BFS to generate valid next actions dynamically for UI buttons.",
  },
  {
    id: "dijkstra",
    badge: "DSA 4.3",
    tag: "Fleet Logistics",
    title: "Weighted Graph + Dijkstra",
    complexity: "O((V + E) log V)",
    icon: "🗺️",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "Shipments aggregate produce lots across multiple collection centers and warehouses before buyer delivery. Dijkstra computes the lowest-cost route over road-weighted networks with full waypoint path reconstruction.",
  },
  {
    id: "trie",
    badge: "DSA 4.4",
    tag: "Type-Ahead Search",
    title: "Search Autocomplete Trie",
    complexity: "O(L) Prefix Length",
    icon: "🔍",
    color: "#ea580c",
    bg: "#fff7ed",
    desc: "Eliminates database-heavy SQL/regex scans. A memory-efficient prefix tree indexes farmers, produce categories, and warehouse hubs with subword tokenization, delivering sub-millisecond autocomplete as users type.",
  },
  {
    id: "dsu",
    badge: "DSA 4.5",
    tag: "Settlement Batching",
    title: "Union-Find (Disjoint Set)",
    complexity: "Amortized O(α(N))",
    icon: "🧩",
    color: "#0891b2",
    bg: "#ecfeff",
    desc: "Farmers supply multiple lots across different purchase orders within a payout cycle. Disjoint Set Union with path compression and rank clusters all accepted lots per farmer into a unified settlement batch, eliminating micro-payout overhead.",
  },
];

const LIFECYCLE_STAGES = [
  {
    step: 1,
    id: "created",
    title: "Harvest Created",
    role: "Farmer",
    icon: "🌱",
    summary: "Farmer registers produce lot with harvest date, estimated expiry, and mandatory crop photography.",
  },
  {
    step: 2,
    id: "received",
    title: "Center Intake",
    role: "Collection Center",
    icon: "📦",
    summary: "Staff checks in the lot at the local collection hub, logs physical quantity, and queues it for grading.",
  },
  {
    step: 3,
    id: "inspected",
    title: "Quality Grading",
    role: "Quality Inspector",
    icon: "🔬",
    summary: "Inspected against configurable produce criteria (firmness, moisture, size) and awarded an official Grade A-F.",
  },
  {
    step: 4,
    id: "accepted",
    title: "Accepted / Stored",
    role: "Warehouse Manager",
    icon: "🏬",
    summary: "Accepted lots are assigned to warehouse racks with expiry timestamps inserted into the FEFO Min-Heap.",
  },
  {
    step: 5,
    id: "allocated",
    title: "Order Allocation",
    role: "Buyer / System",
    icon: "⚡",
    summary: "Purchase orders trigger the FEFO engine, which pops the earliest expiring stock first to fulfill line items.",
  },
  {
    step: 6,
    id: "dispatched",
    title: "Carrier Dispatch",
    role: "Logistics Lead",
    icon: "🚚",
    summary: "Vehicle assigned and dispatched along a Dijkstra-optimized multi-stop route with GPS waypoint tracking.",
  },
  {
    step: 7,
    id: "delivered",
    title: "Buyer Delivery",
    role: "Buyer",
    icon: "✅",
    summary: "Buyer confirms fulfillment delivery receipt; inventory movements and lot statuses transition to delivered.",
  },
  {
    step: 8,
    id: "settled",
    title: "Union-Find Settlement",
    role: "Finance & Admin",
    icon: "💰",
    summary: "All delivered lots for each farmer are grouped via Union-Find for automated, transparent cycle payouts.",
  },
];

const DEMO_ACCOUNTS = [
  { role: "Farmer", email: "farmer1@agritrade.com", desc: "Upload lots with images, track grading, view payouts", icon: "👨‍🌾" },
  { role: "Collection Staff", email: "staff@agritrade.com", desc: "Onboard farmers, receive lots, manage regional intake", icon: "🏢" },
  { role: "Quality Inspector", email: "inspector@agritrade.com", desc: "Grade lots with weighted criteria, award grades A-F", icon: "🔬" },
  { role: "Buyer", email: "buyer1@agritrade.com", desc: "Create purchase orders, allocate lots, track shipments", icon: "🛒" },
  { role: "Logistics Lead", email: "logistics@agritrade.com", desc: "Dijkstra route planner, carrier assignment, dispatch", icon: "🚚" },
  { role: "System Admin", email: "admin@agritrade.com", desc: "Platform oversight, Union-Find settlement runs, regions", icon: "👑" },
];

function HomePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState(0);
  const [copiedRole, setCopiedRole] = useState(null);
  const [quickLogging, setQuickLogging] = useState(false);

  const handleQuickLogin = async (email) => {
    setQuickLogging(true);
    try {
      if (login) {
        await login(email, "AgriTrade@2028");
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    } finally {
      setQuickLogging(false);
    }
  };

  const copyCreds = (email, role) => {
    navigator.clipboard?.writeText(`${email}\nAgriTrade@2028`);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  return (
    <div className="home-page" style={{ display: "flex", flexDirection: "column", gap: 48, paddingBottom: 40 }}>
      {/* 1. Hero Section */}
      <section
        className="home-hero"
        style={{
          position: "relative",
          borderRadius: 28,
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 85%, #059669 100%)",
          color: "#ffffff",
          padding: "54px 44px",
          boxShadow: "0 25px 60px -15px rgba(6, 78, 59, 0.35)",
          overflow: "hidden",
        }}
      >
        {/* Ambient background glows */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: 200,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 740 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "#a7f3d0",
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 14 }}>🌾</span>
            <span>Farm Produce Procurement & Algorithmic Supply Chain</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.3rem, 5vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              margin: "0 0 18px",
              color: "#ffffff",
            }}
          >
            From Farm Gate to Financial Settlement,{" "}
            <span style={{ color: "#fef08a", display: "inline" }}>Every Step Transparent.</span>
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.65,
              color: "#e2e8f0",
              margin: "0 0 28px",
              maxWidth: 660,
            }}
          >
            AgriTrade digitizes the agricultural value chain with end-to-end lot traceability,
            objective quality grading, FEFO warehouse inventory management, Dijkstra route dispatch,
            and automated farmer batch settlements.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            {user ? (
              <Link
                to="/dashboard"
                className="primary-btn"
                style={{
                  background: "#ffffff",
                  color: "#065f46",
                  fontSize: 15,
                  fontWeight: 800,
                  padding: "13px 26px",
                  borderRadius: 14,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                }}
              >
                Go to Operational Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="primary-btn"
                  style={{
                    background: "#ffffff",
                    color: "#065f46",
                    fontSize: 15,
                    fontWeight: 800,
                    padding: "13px 26px",
                    borderRadius: 14,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  }}
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="secondary-btn"
                  style={{
                    background: "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(10px)",
                    color: "#ffffff",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "13px 24px",
                    borderRadius: 14,
                  }}
                >
                  Sign In
                </Link>
              </>
            )}

            <a
              href="#demo-credentials"
              style={{
                color: "#fde68a",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
              }}
            >
              <span>⚡ Try 6 Role Demos</span>
              <span>↓</span>
            </a>
          </div>

          {/* Quick Badges */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: 12,
              color: "#cbd5e1",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong style={{ color: "#a7f3d0" }}>✓</strong> Mandatory Produce Photo Intake
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong style={{ color: "#a7f3d0" }}>✓</strong> First-Expired-First-Out Min-Heap
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong style={{ color: "#a7f3d0" }}>✓</strong> Dijkstra Multi-Stop Routing
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong style={{ color: "#a7f3d0" }}>✓</strong> Region-Scoped RBAC Security
            </span>
          </div>
        </div>
      </section>

      {/* 2. Live Agricultural Commodity Market Ticker */}
      <section style={{ margin: "-18px 0" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.25)",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#065f46", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Live APMC Mandi Commodity Benchmark Prices
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#64748b" }}>Updated real-time across regional hubs</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {COMMODITY_TICKERS.map((item) => (
              <div
                key={item.name}
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                  <span>{item.icon} {item.name}</span>
                  <span style={{ fontWeight: 700, color: item.up ? "#059669" : "#dc2626" }}>
                    {item.change}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                  {item.price}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  Mandi: {item.mandi}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The 5 DSA Standout Modules */}
      <section>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 32px" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#059669",
              background: "#ecfdf5",
              padding: "4px 12px",
              borderRadius: 999,
            }}
          >
            DSA Capstone Architecture
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "12px 0 10px" }}>
            5 High-Impact Data Structures Driving Real Trade
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#64748b", margin: 0 }}>
            AgriTrade is built on deep algorithmic value. Every standout feature solves an actual agricultural supply chain vulnerability.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {DSA_PILLARS.map((dsa) => (
            <article
              key={dsa.id}
              className="card"
              style={{
                borderRadius: 20,
                border: "1px solid #e2e8f0",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: dsa.bg,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 22,
                  }}
                >
                  {dsa.icon}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: dsa.bg,
                      color: dsa.color,
                      padding: "3px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {dsa.badge}
                  </span>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, fontFamily: "monospace" }}>
                    {dsa.complexity}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: dsa.color, textTransform: "uppercase" }}>
                  {dsa.tag}
                </span>
                <h3 style={{ margin: "4px 0 8px", fontSize: 18, color: "#0f172a" }}>{dsa.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{dsa.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Interactive 8-Stage Produce Journey Timeline */}
      <section
        style={{
          background: "#ffffff",
          borderRadius: 24,
          padding: 32,
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#059669" }}>
              Canonical FSM Lifecycle
            </span>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: "4px 0 0" }}>
              The 8-Stage Produce Lifecycle Journey
            </h2>
          </div>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Click any step to inspect role permissions and state transitions
          </span>
        </div>

        {/* Stepper Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {LIFECYCLE_STAGES.map((st, i) => {
            const isActive = activeStage === i;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStage(i)}
                style={{
                  padding: "12px 8px",
                  borderRadius: 14,
                  border: isActive ? "2px solid #059669" : "1px solid #e2e8f0",
                  background: isActive ? "#ecfdf5" : "#f8fafc",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 18 }}>{st.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: isActive ? "#065f46" : "#334155" }}>
                  {st.step}. {st.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage Active Detail Box */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #a7f3d0",
            borderRadius: 18,
            padding: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{LIFECYCLE_STAGES[activeStage].icon}</span>
              <h3 style={{ margin: 0, fontSize: 18, color: "#065f46" }}>
                Stage {LIFECYCLE_STAGES[activeStage].step}: {LIFECYCLE_STAGES[activeStage].title}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: "#10b981",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                Owner: {LIFECYCLE_STAGES[activeStage].role}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#1e3a2f", lineHeight: 1.6 }}>
              {LIFECYCLE_STAGES[activeStage].summary}
            </p>
          </div>

          <Link
            to="/lots"
            className="primary-btn"
            style={{ padding: "10px 18px", fontSize: 13, borderRadius: 10 }}
          >
            Explore Lots Pipeline →
          </Link>
        </div>
      </section>

      {/* 5. Live 1-Click Demo Accounts Quick-Launch */}
      <section id="demo-credentials">
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 28px" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#d97706",
              background: "#fef3c7",
              padding: "4px 12px",
              borderRadius: 999,
            }}
          >
            Instant Evaluation
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "12px 0 10px" }}>
            Try All 6 Roles With 1-Click Credentials
          </h2>
          <p style={{ fontSize: "1.05rem", color: "#64748b", margin: 0 }}>
            All accounts come pre-loaded with password <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>AgriTrade@2028</code>. Click below to sign in or copy credentials.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {DEMO_ACCOUNTS.map((acc) => (
            <div
              key={acc.role}
              className="card"
              style={{
                borderRadius: 18,
                border: "1px solid #e2e8f0",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{acc.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>{acc.role}</h3>
                  <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>{acc.email}</div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: "#64748b", flex: 1 }}>{acc.desc}</p>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={quickLogging}
                  onClick={() => handleQuickLogin(acc.email)}
                  style={{ flex: 1, fontSize: 12, padding: "8px 12px", minHeight: 36 }}
                >
                  {quickLogging ? "Logging In…" : "Instant Login"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => copyCreds(acc.email, acc.role)}
                  style={{ fontSize: 12, padding: "8px 12px", minHeight: 36 }}
                  title="Copy email & password to clipboard"
                >
                  {copiedRole === acc.role ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Platform Key Metrics */}
      <section
        style={{
          background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
          color: "#ffffff",
          borderRadius: 24,
          padding: "40px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
          textAlign: "center",
        }}
      >
        <div>
          <strong style={{ fontSize: "2.8rem", fontWeight: 900, color: "#fef08a", display: "block" }}>
            0%
          </strong>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Warehouse Stock Spoilage</span>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#a7f3d0" }}>FEFO Min-Heap prioritization</p>
        </div>

        <div>
          <strong style={{ fontSize: "2.8rem", fontWeight: 900, color: "#ffffff", display: "block" }}>
            8
          </strong>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Canonical FSM States</span>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#a7f3d0" }}>Strict Directed Graph integrity</p>
        </div>

        <div>
          <strong style={{ fontSize: "2.8rem", fontWeight: 900, color: "#fef08a", display: "block" }}>
            &lt; 5ms
          </strong>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Prefix Search Latency</span>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#a7f3d0" }}>In-memory Trie architecture</p>
        </div>

        <div>
          <strong style={{ fontSize: "2.8rem", fontWeight: 900, color: "#ffffff", display: "block" }}>
            100%
          </strong>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Audited Batch Settlements</span>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#a7f3d0" }}>Union-Find grouped payouts</p>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: 24,
          padding: "44px 36px",
          textAlign: "center",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.04)",
        }}
      >
        <span style={{ fontSize: 32 }}>🌾</span>
        <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: "12px 0 8px" }}>
          Ready to Modernize Farm Produce Trade?
        </h2>
        <p style={{ fontSize: "1.05rem", color: "#64748b", maxWidth: 560, margin: "0 auto 24px" }}>
          Experience transparent quality grading, automated route optimization, and reliable farmer settlements.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/register"
            className="primary-btn"
            style={{ fontSize: 15, padding: "12px 28px", borderRadius: 12 }}
          >
            Create Your Account
          </Link>
          <Link
            to="/login"
            className="secondary-btn"
            style={{ fontSize: 15, padding: "12px 24px", borderRadius: 12 }}
          >
            Sign In to Portal
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
