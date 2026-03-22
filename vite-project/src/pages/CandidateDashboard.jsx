// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarSection from "../components/candidate/SidebarSection";
import HeaderSection from "../components/candidate/HeaderSection";

const CandidateDashboard = () => {
  // State: tracks local values needed to render and update the screen.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Render: returns the visible UI structure for this component.
  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarSection isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <HeaderSection onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;
