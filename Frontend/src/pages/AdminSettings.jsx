import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
function AdminSettings() {
  const [users, setUsers] = useState([]),
    [health, setHealth] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([axiosInstance.get("/users"), axiosInstance.get("/health")])
      .then(([u, h]) => {
        setUsers(u.data.data || []);
        setHealth(h.data);
      })
      .catch((e) =>
        setError(
          e?.response?.data?.message || "Unable to load administration data.",
        ),
      );
  }, []);
  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Administration</span>
        <h1>System overview</h1>
        <p>Operational visibility for the AgriTrade platform.</p>
      </div>
      {error && <div className="message error">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Registered users</span>
          <strong>{users.length}</strong>
          <small>Across platform roles</small>
        </div>
        <div className="stat-card">
          <span>Database</span>
          <strong>{health?.database || "—"}</strong>
          <small>Current connection state</small>
        </div>
        <div className="stat-card">
          <span>API</span>
          <strong>{health?.status || "—"}</strong>
          <small>Service health endpoint</small>
        </div>
      </div>
      <div className="card section-card">
        <h2>User directory</h2>
        <div className="table-wrap nested">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="tag">{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default AdminSettings;
