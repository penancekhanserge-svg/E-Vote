import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  // ✅ SINGLE SOURCE OF TRUTH
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  /* ================= NO SESSION ================= */
  if (!userId || !userRole) {
    return <Navigate to="/auth/login" replace />;
  }

  /* ================= ROLE NOT ALLOWED ================= */
  if (Array.isArray(allowedRoles) && !allowedRoles.includes(userRole)) {
    return <Navigate to="/auth/login" replace />;
  }

  /* ================= ACCESS GRANTED ================= */
  return <Outlet />;
};

export default ProtectedRoute;
