import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const featureCards = [
  {
    title: "Farmer onboarding",
    text: "Register farms, validate growers, and align produce with trusted trading partners.",
  },
  {
    title: "Lot visibility",
    text: "Track inventory, quality checks, allocations, and movement through every stage of the chain.",
  },
  {
    title: "Smarter logistics",
    text: "Coordinate shipments, warehouse flow, and settlements from one operational dashboard.",
  },
];

function HomePage() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="home-page">
      <section className="hero home-hero">
        <div>
          <span className="eyebrow">Build resilient agri supply chains</span>
          <h1>From harvest to settlement, every step stays visible.</h1>
          <p>
            AgriTrade helps farmers, buyers, warehouses, and logistics teams
            coordinate produce movement, inspections, and payments in a single,
            transparent workflow.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/register">
              Create account
            </Link>
            <Link className="secondary-btn" to="/login">
              Sign in
            </Link>
          </div>
        </div>
        <div className="hero-orb" aria-label="AgriTrade overview">
          <span>🌾</span>
        </div>
      </section>

      <section className="stats-grid home-stats">
        <div className="stat-card">
          <span>Active farms</span>
          <strong>1.2K</strong>
          <small>Connected growers and sourcing partners</small>
        </div>
        <div className="stat-card">
          <span>Produce lots</span>
          <strong>8.4K</strong>
          <small>Inspected, tracked, and allocated in real time</small>
        </div>
        <div className="stat-card">
          <span>Shipments</span>
          <strong>96%</strong>
          <small>On-time dispatch and warehouse scheduling</small>
        </div>
        <div className="stat-card">
          <span>Settlements</span>
          <strong>24/7</strong>
          <small>Fast reconciliation and payment visibility</small>
        </div>
      </section>

      <section className="card home-features">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Why teams choose AgriTrade</span>
            <h2>Operational clarity across the agricultural value chain</h2>
          </div>
        </div>
        <div className="feature-grid">
          {featureCards.map(({ title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">✓</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
