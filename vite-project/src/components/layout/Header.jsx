import {
  ChevronDown,
  Settings as SettingsIcon,
  LogOut,
  
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../supabaseClient";

function Header({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  // PROFILE MENU
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4 transition-colors duration-200 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* LEFT - Mobile Optimized */}
        {/* Removed 'hidden md:block' to show title on mobile */}
        <div>
          {/* Title: Always visible, but smaller on mobile */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">
            Dashboard
          </h1>
          {/* Subtitle: Hidden on mobile (sm:block) to save space */}
          <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
            Welcome {userName || "Admin"}, let's deliver a fair election
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* PROFILE */}
          <div
            ref={profileRef}
            className="relative flex items-center pl-3 border-l border-slate-200 dark:border-slate-700"
          >
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="flex items-center space-x-2 sm:space-x-3
                         hover:bg-slate-100 dark:hover:bg-slate-800
                         rounded-lg px-2 py-1 transition-colors"
            >
              <img
                src="/profile.jpg"
                alt="user"
                className="w-10 h-10 rounded-full ring-2 ring-blue-100 dark:ring-blue-900"
              />

              {/* Name hidden on mobile to keep it compact */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-200">
                  {userName || "Administrator"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Administrator
                </p>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* DROPDOWN */}
            {showProfileMenu && (
              <div className="absolute right-0 top-14 w-64
                              bg-white dark:bg-slate-800
                              rounded-xl shadow-xl
                              border border-slate-200 dark:border-slate-700
                              z-[9999]">
                <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {userName || "Administrator"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Admin Account
                  </p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => navigate("/settings")}
                    className="w-full flex items-center gap-3 px-4 py-2
                               text-sm text-slate-700 dark:text-slate-200
                               hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Account Settings
                  </button>

                  <button
                    onClick={() => {
                     // clear admin session (manual auth)
                    localStorage.removeItem("adminId");
                    localStorage.removeItem("userName");
                    localStorage.removeItem("role");

                    // force clean redirect
                    window.location.href = "/auth/login";
        }}
                    className="w-full flex items-center gap-3 px-4 py-2
                    text-sm text-red-600
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-colors"
              >
                     <LogOut className="w-4 h-4" />
                    Logout
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
