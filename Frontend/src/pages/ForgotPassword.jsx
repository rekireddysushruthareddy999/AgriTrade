import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
function ForgotPassword() {
  const [identifier, setIdentifier] = useState(""),
    [message, setMessage] = useState(""),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setToken("");
    setLoading(true);
    try {
      const r = await axiosInstance.post("/auth/forgot-password", {
        identifier,
      });
      setMessage(r.data.message);
      if (r.data.data?.resetToken) setToken(r.data.data.resetToken);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to request a reset.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Account recovery</span>
          <h1>Reset password</h1>
          <p>Enter the email or phone linked to your account.</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Email or phone
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </label>
          {error && <div className="message error">{error}</div>}
          {message && <div className="message success">{message}</div>}
          {token && (
            <div className="reset-token">
              <strong>Development reset token</strong>
              <code>{token}</code>
              <Link to={`/reset-password?token=${encodeURIComponent(token)}`}>
                Continue to reset password
              </Link>
            </div>
          )}
          <button disabled={loading}>
            {loading ? "Requesting…" : "Request reset"}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
export default ForgotPassword;
