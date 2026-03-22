// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
import React from 'react'
import RevenueChart from './RevenueChart';

function ChartSection() {
  // Render: returns the visible UI structure for this component.
  return (
    <div className='grid grid-cols-1 xl-grid-cols-4 gap-6'>
        <div className='xl:cols-span-2'>
            <RevenueChart />
        </div>
    </div>
  )
}

export default ChartSection
