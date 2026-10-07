import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">AgriTrade Secure Access · Sushrutha Reddy Rekireddy</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage your agricultural supply chain operations.</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            Email or Phone Number
            <input
              autoComplete="username"
              placeholder="e.g. farmer1@agritrade.com or 9000000002"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              required
            />
          </label>

          <label>
            Password
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  background: "transparent",
                  border: 0,
                  fontSize: 18,
                  cursor: "pointer",
                  padding: "4px 6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  minHeight: "auto",
                  boxShadow: "none",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {error && <div className="message error">{error}</div>}

          <button type="submit" className="primary-btn btn-animated" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? "Verifying Credentials…" : "Sign In to AgriTrade →"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/register">Create new account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
