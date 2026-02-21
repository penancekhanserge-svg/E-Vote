import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart2,
  Award,
  User,
  HelpCircle,
  LogOut,
} from "lucide-react";

const Sidebar = ({ isCollapsed }) => {
  const links = [
    {
      name: "Elections",
      path: "/candidate-dashboard/elections",
      icon: BarChart2,
      color: "text-green-500",
      textSize: "text-lg",
    },
    {
      name: "MyResults",
      path: "/candidate-dashboard/results",
      icon: Award,
      color: "text-yellow-500",
      textSize: "text-lg",
    },
    {
      name: "Profile",
      path: "/candidate-dashboard/profile",
      icon: User,
      color: "text-purple-500",
      textSize: "text-lg",
    },
    {
      name: "Help",
      path: "/candidate-dashboard/help",
      icon: HelpCircle,
      color: "text-teal-500",
      textSize: "text-lg",
    },
  ];

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-52"
      } bg-gradient-to-b from-white to-gray-50 shadow-xl flex flex-col border-r border-gray-100 transition-all duration-300 ease-in-out`}
    >
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
        <img
          src="/logo2.png"
          alt="logo"
          className="h-10 w-10 rounded-lg shadow-sm"
        />
        {!isCollapsed && (
          <span className="font-bold text-xl text-gray-800 tracking-tight">
            VoteSecure
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-1">
        {links.map((link, index) => {
          const Icon = link.icon;

          return (
            <NavLink key={index} to={link.path}>
              {({ isActive }) => (
                <div
                  className={`flex items-center ${
                    isCollapsed ? "justify-center" : "space-x-3"
                  } px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
                    isActive
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {/* Icon */}
                  <span
                    className={`${
                      isActive ? "text-blue-600" : link.color
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  {/* Text */}
                  {!isCollapsed && (
                    <span className={`${link.textSize} font-medium`}>
                      {link.name}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        className={`${isCollapsed ? "p-4" : "p-6"} border-t border-gray-100`}
      >
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/auth/login";
          }}
          className={`flex items-center w-full ${
            isCollapsed ? "justify-center" : "space-x-3"
          } px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200 ease-in-out transform hover:scale-[1.02]`}
        >
          <LogOut className="h-6 w-6" />
          {!isCollapsed && (
            <span className="text-lg font-medium">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
