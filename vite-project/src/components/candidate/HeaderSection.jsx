import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  User,
  LogOut,
  Menu,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const HeaderSection = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // ✅ SESSION DATA
  const userName = localStorage.getItem("userName") || "Candidate";
  const userId = localStorage.getItem("userId");

  /* ================= FETCH PROFILE PHOTO ================= */

  useEffect(() => {
    fetchProfilePhoto();
  }, []);

  const fetchProfilePhoto = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("candidates")
      .select("photo_url")
      .eq("id", userId)
      .single();

    if (!error && data?.photo_url) {
      setProfilePhoto(data.photo_url);
    }
  };

  /* ================= HANDLERS ================= */

  const handleSettingsClick = () => {
    navigate("/candidate-dashboard/settings");
  };

  const handleViewProfile = () => {
    navigate("/candidate-dashboard/profile");
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/auth/login");
  };

  /* ================= UI ================= */

  return (
    <header className="bg-white shadow px-4 sm:px-6 py-4">
      <div className="flex justify-between items-center">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <div className="leading-tight">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              Candidate Dashboard
            </h1>
            <p className="hidden sm:block text-sm text-gray-500">
              Welcome back {userName}, let’s deliver a fair election
            </p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <img
                src={profilePhoto || "/avatar.png"}
                alt="profile"
                className="w-9 h-9 rounded-full border object-cover"
              />

              <span className="hidden md:block font-medium text-gray-700">
                {userName}
              </span>

              <ChevronDown className="hidden sm:block h-4 w-4 text-gray-600" />
            </button>

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

                  <button
                    onClick={handleViewProfile}
                    className="w-full flex items-center px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 mr-3 text-gray-600" />
                    View Profile
                  </button>

                  

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={handleSignOut}
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
