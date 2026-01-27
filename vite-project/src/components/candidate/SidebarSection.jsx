import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  Award,
  User,
  Info,
  HelpCircle,
  LogOut,
  Settings
} from "lucide-react";

const Sidebar = ({ isCollapsed }) => {
  const links = [
    { 
      name: "Dashboard", 
      path: "/candidate-dashboard/", 
      icon: <LayoutDashboard className="h-5 w-5 text-gray-700" />,
      color: "text-blue-500",
      textSize: "text-lg"
    },
    { 
      name: "Elections", 
      path: "/candidate-dashboard/elections", 
      icon: <BarChart2 className="h-5 w-5 text-purple-600" />,
      color: "text-green-500",
      textSize: "text-lg"
    },
    { 
      name: "MyResults", 
      path: "/candidate-dashboard/results", 
      icon: <Award className="h-5 w-5 text-blue-600" />,
      color: "text-yellow-500",
      textSize: "text-lg"
    },
    { 
      name: "Profile", 
      path: "/candidate-dashboard/profile", 
      icon: <User className="h-5 w-5 text-green-600" />,
      color: "text-purple-500",
      textSize: "text-lg"
    },
    
    { 
      name: "Help", 
      path: "/candidate-dashboard/help", 
      icon: <HelpCircle className="h-5 w-5 text-orange-600" />,
      color: "text-teal-500",
      textSize: "text-lg"
    },
    
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-52'} bg-gradient-to-b from-white to-gray-50 shadow-xl flex flex-col border-r border-gray-100 transition-all duration-300 ease-in-out`}>
      {/* Logo Section */}
      <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
        <img src="/vote3.png" alt="logo" className="h-10 w-10 rounded-lg shadow-sm" />
        {!isCollapsed && (
          <span className="font-bold text-xl text-gray-800 tracking-tight">VoteSecure</span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-1">
        {links.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <span className={({ isActive }) => 
              isActive ? "text-white" : `${link.color} group-hover:text-gray-700`
            }>
              {link.icon}
            </span>
            {!isCollapsed && <span className={`${link.textSize} font-medium`}>{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className={`${isCollapsed ? "p-4" : "p-6"} border-t border-gray-100`}>
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
    {!isCollapsed && <span className="text-lg font-medium">Sign Out</span>}
  </button>
</div>

    </div>
  );
};

export default Sidebar;
