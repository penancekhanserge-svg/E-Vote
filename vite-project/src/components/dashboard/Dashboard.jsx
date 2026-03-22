// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
import React from 'react'
import StatsGrid from './StatsGrid';
import ChartSection from './ChartSection';

function Dashboard() {
  // Render: returns the visible UI structure for this component.
  return (
    <div className='space-y-6'>
        {/* stats Grid */}
        <StatsGrid />

        {/* Chart Section */}
        <ChartSection />

    </div>
  )
}

export default Dashboard
