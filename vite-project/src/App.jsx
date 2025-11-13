import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Admin dashboard imports
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import Candidates from './pages/Candidates';
import Voters from './pages/Voters';
import Elections from './pages/Elections';
import Results from './pages/Results';
import Settings from './pages/Settings';
import Support from './pages/Support';
import About from './pages/About';

// Candidates Dashboard imports
import CandidateDashboard from './pages/CandidateDashboard';
import ElectionsPage from './pages/candidate/ElectionsPage';
import MyResult from './pages/candidate/MyResult';
import DashboardPage from './pages/candidate/DashboardPage';
import AboutPage from './pages/candidate/AboutPage';
import Help from './pages/candidate/Help';
import SettingsPage from './pages/candidate/SettingsPage';
import Profile from './pages/candidate/Profile';

// Register, Login, OTP and Forgotten Password imports
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import OTPVerify from './pages/auth/OTPVerify';
import Password from './pages/auth/Password';

// User dashboard imports
import UserDashboard from './pages/UserDashboard';
import DashboardUser from './pages/users/DashboardUser';
import UserSettings from './pages/users/UserSettings';
import UserHelp from './pages/users/UserHelp';
import Result from './pages/users/Result';
import UserAbout from './pages/users/UserAbout';
import VoteCast from './pages/users/VoteCast';
import { LeafyGreen } from 'lucide-react';






// AppContent contains dashboard layout
function AppContent() {
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = location.pathname;

  const onPageChange = (page) => {
    navigate(page);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <Sidebar
        sidebarCollapsed={sideBarCollapsed}
        onToggleSidebar={() => setSideBarCollapsed(!sideBarCollapsed)}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />

      {/* Main area with header and routed content */}
      <div className="flex-1 flex flex-col h-full">
        <Header
          sidebarCollapsed={sideBarCollapsed}
          onToggleSidebar={() => setSideBarCollapsed(!sideBarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6 space-y-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/voters" element={<Voters />} />
              <Route path="/elections" element={<Elections />} />
              <Route path="/results" element={<Results />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// App includes route distinction
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - no sidebar/header */}
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/OTPVerify" element={<OTPVerify />} />
        <Route path="/auth/password" element={<Password />} />

        {/* Candidates Dashboard Routings */}
        <Route path="/candidate-dashboard" element={<CandidateDashboard />}>
          <Route index element={<DashboardPage />} />
          <Route path="elections" element={<ElectionsPage />} />
          <Route path="results" element={<MyResult />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="help" element={<Help />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* User Dashboard Routings */}
        <Route path="/user-dashboard" element={<UserDashboard />}>
          <Route index element={<DashboardUser />} />
          <Route path="user-settings" element={<UserSettings />} />
          <Route path="user-help" element={<UserHelp />} />
          <Route path="result" element={<Result />} />
          <Route path="user-about" element={<UserAbout />} />
          <Route path="vote-cast" element={<VoteCast />} />
          
        </Route>


        

        {/* Default route - show register page first */}
        <Route path="/" element={<Register />} />
        
        {/* Protected Routes - wrapped inside layout */}
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
