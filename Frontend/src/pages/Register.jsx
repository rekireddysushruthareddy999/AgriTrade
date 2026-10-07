import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
function Register() {
  const navigate = useNavigate(),
    { register } = useAuth();
  const [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "farmer",
      regionId: "",
    }),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [showPass, setShowPass] = useState(false),
    [showConfirmPass, setShowConfirmPass] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters long.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register({ ...form, regionId: form.regionId.trim() || undefined });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to register.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Join AgriTrade · Sushrutha Reddy Rekireddy</span>
          <h1>Create account</h1>
          <p>
            Start with a farmer or buyer account. Administrator accounts are
            managed separately.
          </p>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
            </select>
          </label>
          <label>
            Region name or ID <span className="muted">(optional)</span>
            <input
              value={form.regionId}
              onChange={(e) => setForm({ ...form, regionId: e.target.value })}
              placeholder="e.g. Nalgonda or region ObjectId"
            />
          </label>
          <label>
            Password
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                title={showPass ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  background: "transparent",
                  border: 0,
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#64748b",
                  boxShadow: "none",
                  padding: "4px 6px",
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </label>
          <label>
            Confirm password
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showConfirmPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                title={showConfirmPass ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  background: "transparent",
                  border: 0,
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#64748b",
                  boxShadow: "none",
                  padding: "4px 6px",
                }}
              >
                {showConfirmPass ? "🙈" : "👁️"}
              </button>
            </div>
          </label>
          {error && <div className="message error">{error}</div>}
          <button type="submit" className="primary-btn btn-animated" disabled={loading} style={{ width: "100%", marginTop: 6 }}>
            {loading ? "Creating Account…" : "Create AgriTrade Account →"}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
export default Register;
