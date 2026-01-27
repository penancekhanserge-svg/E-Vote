import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";

const HeaderSection = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // GET USER NAME FROM SESSION
  const userName = localStorage.getItem("userName") || "Voter";

  const handleSettingsClick = () => {
    navigate("/user-dashboard/user-settings");
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/auth/login");
  };

  return (
    <header className="bg-white shadow px-4 sm:px-6 py-4">
      <div className="flex justify-between items-center">
        {/* LEFT SECTION */}
        <div className="leading-tight">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
            User Dashboard
          </h1>
          <p className="hidden sm:block text-sm text-gray-500">
            Welcome back {userName}, let’s deliver a fair election
          </p>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Settings button (desktop only) */}
          <button
            onClick={handleSettingsClick}
            className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>

          {/* PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <img
                src="/profile.jpg"
                alt="profile"
                className="w-9 h-9 rounded-full border object-cover"
              />

              {/* Hide name on small screens */}
              <span className="hidden md:block font-medium text-gray-700">
                {userName}
              </span>

              <ChevronDown className="hidden sm:block h-4 w-4 text-gray-600" />
            </button>

            {/* DROPDOWN */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                  <h3 className="text-white font-semibold text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Account
                  </h3>
                  <p className="text-xs text-indigo-100 mt-1 truncate">
                    {userName}
                  </p>
                </div>

                <div className="py-2">
                  {/* Mobile settings */}
                  <button
                    onClick={handleSettingsClick}
                    className="sm:hidden w-full flex items-center px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-600" />
                    Settings
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                    localStorage.clear();
                    window.location.href = "/auth/login";
                 }}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                 >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE SUBTITLE */}
      <p className="sm:hidden mt-2 text-sm text-gray-500">
        Welcome back {userName}, let’s deliver a fair election
      </p>
    </header>
  );
};

export default HeaderSection;
