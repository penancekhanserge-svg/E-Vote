import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  Award,
  Info,
  HelpCircle,
  LogOut,
  Settings
} from "lucide-react";

const Sidebar = ({ isCollapsed }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // Tailwind md breakpoint
        setCollapsed(true);
      } else {
        setCollapsed(isCollapsed);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  const links = [
    { name: "Dashboard", path: "/user-dashboard", icon: <LayoutDashboard className="h-5 w-5 text-gray-700" />, color: "text-blue-500", textSize: "text-lg" },
    { name: "Vote Now", path: "/user-dashboard/vote-cast", icon: <BarChart2 className="h-5 w-5 text-purple-600" />, color: "text-green-500", textSize: "text-lg" },
    { name: "Results", path: "/user-dashboard/result", icon: <Award className="h-5 w-5 text-blue-600" />, color: "text-yellow-500", textSize: "text-lg" },
    { name: "About", path: "/user-dashboard/user-about", icon: <Info className="h-5 w-5 text-sky-500" />, color: "text-orange-500", textSize: "text-lg" },
    { name: "Help", path: "/user-dashboard/user-help", icon: <HelpCircle className="h-5 w-5 text-orange-600" />, color: "text-teal-500", textSize: "text-lg" },
    { name: "Settings", path: "/user-dashboard/user-settings", icon: <Settings className="h-5 w-5 text-gray-600" />, color: "text-red-500", textSize: "text-lg" },
  ];

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-white to-gray-50 shadow-xl flex flex-col border-r border-gray-100 transition-all duration-300 ease-in-out relative`}>
      
      {/* Logo Section */}
      <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
        <img src="/vote3.png" alt="logo" className="h-10 w-10 rounded-lg shadow-sm" />
        {!collapsed && <span className="font-bold text-xl text-gray-800 tracking-tight">VoteSecure</span>}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-1">
        {links.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center group relative' : 'space-x-3'} px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <span className={link.color}>{link.icon}</span>
            {!collapsed && <span className={`${link.textSize} font-medium`}>{link.name}</span>}

            {/* Plain text tooltip for collapsed sidebar */}
            {collapsed && (
              <span className="absolute left-full ml-2 text-gray-800 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {link.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className={`${collapsed ? 'p-4' : 'p-6'} border-t border-gray-100 relative`}>
        <NavLink
          to="/auth/login"
          className={`flex items-center ${collapsed ? 'justify-center group relative' : 'space-x-3'} px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200 ease-in-out transform hover:scale-[1.02]`}
        >
          <LogOut className="h-6 w-6" />
          {!collapsed && <span className="text-lg font-medium">Sign Out</span>}

          {/* Plain text tooltip */}
          {collapsed && (
            <span className="absolute left-full ml-2 text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Sign Out
            </span>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
