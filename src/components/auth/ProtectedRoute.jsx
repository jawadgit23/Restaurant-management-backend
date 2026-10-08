import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isBackendConfigured } from "../../lib/apiClient";

function ProtectedRoute({ children }) {
  const { isStaff, loading } = useAuth();
  const location = useLocation();

  // Without a backend the dashboard runs as an open demo on sample data.
  if (!isBackendConfigured) return children;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  // Only restaurant admins / super admins may enter the dashboard (customers are bounced to login)
  if (!isStaff) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
