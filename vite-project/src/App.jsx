import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";

/* ===================== ADMIN DASHBOARD ===================== */
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./components/dashboard/Dashboard";
import Candidates from "./pages/Candidates";
import Voters from "./pages/Voters";
import Elections from "./pages/Elections";
import Results from "./pages/Results";
import Settings from "./pages/Settings";
import Support from "./pages/Support";

/* ===================== CANDIDATE DASHBOARD ===================== */
import CandidateDashboard from "./pages/CandidateDashboard";
import DashboardPage from "./pages/candidate/DashboardPage";
import ElectionsPage from "./pages/candidate/ElectionsPage";
import MyResult from "./pages/candidate/MyResult";
import Help from "./pages/candidate/Help";
import Profile from "./pages/candidate/Profile";

/* ===================== USER DASHBOARD ===================== */
import UserDashboard from "./pages/UserDashboard";
import UserSettings from "./pages/users/UserSettings";
import UserHelp from "./pages/users/UserHelp";
import Result from "./pages/users/Result";
import VoteCast from "./pages/users/VoteCast";

/* ===================== AUTH PAGES ===================== */
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import OTPVerify from "./pages/auth/OTPVerify";
import Password from "./pages/auth/Password";

/* ========================================================= */
/* ===================== ADMIN LAYOUT ====================== */
/* ========================================================= */

function AdminLayout() {
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const [theme, setTheme] = useState("light");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Sidebar
        sidebarCollapsed={sideBarCollapsed}
        onToggleSidebar={() => setSideBarCollapsed(!sideBarCollapsed)}
        currentPage={location.pathname}
        onPageChange={(page) => navigate(page)}
      />

      <div className="flex-1 flex flex-col h-full">
        <Header
          sidebarCollapsed={sideBarCollapsed}
          onToggleSidebar={() => setSideBarCollapsed(!sideBarCollapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <Routes>
              {/* index === /dashboard */}
              <Route index element={<Dashboard />} />
              <Route path="candidates" element={<Candidates />} />
              <Route path="voters" element={<Voters />} />
              <Route path="elections" element={<Elections />} />
              <Route path="results" element={<Results />} />
              <Route path="settings" element={<Settings />} />
              <Route path="support" element={<Support />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ========================================================= */
/* ========================= APP =========================== */
/* ========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/OTPVerify" element={<OTPVerify />} />
        <Route path="/auth/password" element={<Password />} />

        {/* ========== ADMIN (PROTECTED) ========== */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/dashboard/*" element={<AdminLayout />} />
        </Route>

        {/* ========== CANDIDATE (PROTECTED) ========== */}
        <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
          <Route path="/candidate-dashboard" element={<CandidateDashboard />}>
            <Route index element={<DashboardPage />} />
            <Route path="elections" element={<ElectionsPage />} />
            <Route path="results" element={<MyResult />} />
            <Route path="help" element={<Help />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* ========== VOTER (PROTECTED) ========== */}
        <Route element={<ProtectedRoute allowedRoles={["voter"]} />}>
          <Route path="/user-dashboard" element={<UserDashboard />}>
            <Route path="user-settings" element={<UserSettings />} />
            <Route path="user-help" element={<UserHelp />} />
            <Route path="result" element={<Result />} />
            <Route path="vote-cast" element={<VoteCast />} />
          </Route>
        </Route>

        {/* ========== BLOCK EVERYTHING ELSE ========== */}
        <Route path="*" element={<Navigate to="/auth/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
