import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ roles }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-state"><span className="spinner" />Checking session…</div>;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles?.length && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
export default ProtectedRoute;
