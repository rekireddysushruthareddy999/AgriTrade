import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
function ResetPassword() {
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const [form, setForm] = useState({
      token: params.get("token") || "",
      newPassword: "",
      confirmPassword: "",
    }),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (form.newPassword.length < 8)
      return setError("Password must be at least 8 characters long.");
    if (form.newPassword !== form.confirmPassword)
      return setError("Passwords do not match.");
    setLoading(true);
    try {
      const r = await axiosInstance.post("/auth/reset-password", form);
      setMessage(r.data.message);
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Account recovery</span>
          <h1>Choose a new password</h1>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Reset token
            <input
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              minLength={8}
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
          </label>
          {error && <div className="message error">{error}</div>}
          {message && <div className="message success">{message}</div>}
          <button disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
export default ResetPassword;
