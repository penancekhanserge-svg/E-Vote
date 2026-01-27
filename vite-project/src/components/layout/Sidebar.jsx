import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  List,
  Settings,
  HelpCircle,
  LogOut,
  ClipboardList,
  Menu,
} from "lucide-react";

function Sidebar({ currentPage }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const adminName = localStorage.getItem("userName");

  // Auto collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const isActive = (path) => currentPage === path;

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Voters", path: "/dashboard/voters", icon: <Users className="w-5 h-5 text-green-600" /> },
    { name: "Candidates", path: "/dashboard/candidates", icon: <Users className="w-5 h-5 text-yellow-600" /> },
    { name: "Elections", path: "/dashboard/elections", icon: <List className="w-5 h-5 text-purple-600" /> },
    { name: "Results", path: "/dashboard/results", icon: <ClipboardList className="w-5 h-5 text-blue-600" /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings className="w-5 h-5 text-gray-600" /> },
    { name: "Support", path: "/dashboard/support", icon: <HelpCircle className="w-5 h-5 text-orange-600" /> },
  ];

  return (
    <div
      className={`transition-all duration-300 ease-in-out
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
      border-r border-slate-200/50 dark:border-slate-700/50
      flex flex-col relative z-50 h-screen
      overflow-visible
      ${sidebarCollapsed ? "w-20" : "w-52"}`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!sidebarCollapsed && (
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg">
                <img src="/logo2.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}

            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-slate-800 dark:text-white">VoteSecure</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-visible">
        {links.map((link, idx) => (
          <Link
            key={idx}
            to={link.path}
            className={`relative overflow-visible flex items-center
              ${sidebarCollapsed ? "justify-center" : "space-x-3"}
              p-2 rounded-lg transition-colors group
              ${
                isActive(link.path)
                  ? "bg-blue-500 text-white shadow"
                  : "hover:bg-blue-400 hover:text-white"
              }`}
          >
            <span
              className={
                isActive(link.path)
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300 group-hover:text-white"
              }
            >
              {link.icon}
            </span>

            {!sidebarCollapsed && <span className="font-medium">{link.name}</span>}

            {/* TEXT ONLY LABEL */}
            {sidebarCollapsed && (
              <span
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2
                text-sm font-medium text-slate-800 dark:text-slate-200
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                pointer-events-none whitespace-nowrap
                z-[9999]"
              >
                {link.name}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
<div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
  <button
    onClick={() => {
      // clear ALL session data
      localStorage.clear();

      // force redirect (prevents back navigation)
      window.location.href = "/auth/login";
    }}
    className={`relative overflow-visible flex items-center
      ${sidebarCollapsed ? "justify-center" : "space-x-3"}
      p-3 rounded-xl group
      bg-slate-50 dark:bg-slate-800/50
      text-red-600 hover:bg-red-400 hover:text-white
      transition-colors w-full`}
  >
    <LogOut className="w-5 h-5" />

    {!sidebarCollapsed && (
      <span className="font-medium">Logout</span>
    )}

    {sidebarCollapsed && (
      <span
        className="absolute left-full ml-3 top-1/2 -translate-y-1/2
        text-sm font-medium text-red-600
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none whitespace-nowrap
        z-[9999]"
      >
        Logout
      </span>
    )}
  </button>
</div>


    </div>
  );
}

export default Sidebar;
