// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
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
