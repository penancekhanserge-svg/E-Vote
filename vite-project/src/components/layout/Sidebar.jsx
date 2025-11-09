import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, List, Info, Settings, HelpCircle, LogOut, ClipboardList, Menu } from 'lucide-react';

function Sidebar({ currentPage }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024); // collapse below lg breakpoint
    };

    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const isActive = (path) => currentPage === path;

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Voters", path: "/voters", icon: <Users className="w-5 h-5 text-green-600" /> },
    { name: "Candidates", path: "/candidates", icon: <Users className="w-5 h-5 text-yellow-600" /> },
    { name: "Elections", path: "/elections", icon: <List className="w-5 h-5 text-purple-600" /> },
    { name: "Results", path: "/results", icon: <ClipboardList className="w-5 h-5 text-blue-600" /> },
    { name: "About", path: "/about", icon: <Info className="w-5 h-5 text-sky-500" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5 text-gray-600" /> },
    { name: "Support", path: "/support", icon: <HelpCircle className="w-5 h-5 text-orange-600" /> },
  ];

  return (
    <div className={`transition-all duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col relative z-10 h-screen ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Logo Section */}
      <div className='p-6 border-b border-slate-200/50 dark:border-slate-700/50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-800 rounded-xl flex items-center justify-center shadow-lg'>
              <img src="/vote3.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className='font-bold text-slate-800 dark:text-white'>VoteSecure</h1>
                <p className='text-xs text-slate-500 dark:text-slate-400'>Admin Panel</p>
              </div>
            )}
          </div>
          <button onClick={toggleSidebar} className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-2 overflow-auto'>
        {links.map((link, idx) => (
          <Link
            key={idx}
            to={link.path}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg transition-colors group
              ${isActive(link.path) ? 'bg-blue-500 text-white shadow hover:bg-blue-600 hover:ring-2 hover:ring-blue-300' : 'hover:bg-blue-500 hover:text-white'}`}
          >
            <span className={isActive(link.path) ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-white'}>
              {link.icon}
            </span>
            {!sidebarCollapsed && <span className="font-medium">{link.name}</span>}
          </Link>
        ))}

        <Link
          to="/auth/login"
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-300 hover:text-white transition`}
        >
          <LogOut className='w-5 h-5' />
          {!sidebarCollapsed && <span className="font-medium">LogOut</span>}
        </Link>
      </nav>

      {/* User Profile */}
      <div className='p-4 border-t border-slate-200/50 dark:border-slate-700/50'>
        <div className='flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50'>
          <img src='/profile.jpg' alt='user' className='w-10 h-10 rounded-full ring-2 ring-blue-100' />
          {!sidebarCollapsed && (
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-slate-800 dark:text-white truncate'>Serge Johnson</p>
              <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>Administrator</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
