import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { BarChart2, ChevronDown } from 'lucide-react';

// Sample data
const data = [
  { name: 'Alice', votes: 120 },
  { name: 'Bob', votes: 90 },
  { name: 'Charlie', votes: 70 },
  { name: 'Diana', votes: 50 },
  { name: 'Ethan', votes: 85 },
  { name: 'Faith', votes: 60 },
  { name: 'George', votes: 100 },
  { name: 'Hannah', votes: 40 },
];

// Voter Turnout Card
function VoterTurnoutCard() {
  const totalVoters = 1000;
  const votesCast = 650;
  const percentage = ((votesCast / totalVoters) * 100).toFixed(1);

  return (
    <div className="p-4 bg-white rounded-xl shadow mb-4">
      <h4 className="text-lg font-semibold text-slate-700 mb-2">Voter Turnout</h4>
      <p className="text-3xl font-bold text-indigo-600">{percentage}%</p>
      <p className="text-sm text-slate-500">{votesCast} of {totalVoters} voters have voted</p>
    </div>
  );
}

// Election Progress Card
function ElectionProgressCard() {
  const startDate = new Date('2025-07-20');
  const endDate = new Date('2025-07-30');
  const today = new Date();

  const totalDuration = endDate - startDate;
  const elapsed = today - startDate;
  const rawPercentage = (elapsed / totalDuration) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, rawPercentage)).toFixed(1);

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h4 className="text-lg font-semibold text-slate-700 mb-2">Election Progress</h4>
      <p className="text-3xl font-bold text-green-600">{clampedPercentage}%</p>
      <p className="text-sm text-slate-500">From July 20 to July 30, 2025</p>
    </div>
  );
}

// Main Chart Component
function RevenueChart() {
  const [selectedElection, setSelectedElection] = useState('presidential');
  const [showDropdown, setShowDropdown] = useState(false);

  const electionTypes = [
    { value: 'presidential', label: 'Presidential Election' },
    { value: 'governor', label: 'Governor Election' },
    { value: 'senate', label: 'Senate Election' },
    { value: 'house', label: 'House of Representatives' },
    { value: 'local', label: 'Local Government' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Main Chart */}
      <div className="flex-1 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-xl border border-slate-200 dark:border-slate-700 backdrop-blur-md hover:shadow-2xl hover:scale-[1.02] transition duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Live Vote Count Overview
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-Time insights into voting trends
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
              >
                <span>{electionTypes.find(e => e.value === selectedElection)?.label}</span>
                <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                  <div className="py-1">
                    {electionTypes.map((election) => (
                      <button
                        key={election.value}
                        onClick={() => {
                          setSelectedElection(election.value);
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                          selectedElection === election.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                        }`}
                      >
                        {election.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BarChart2 size={16} className="text-white" />
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-400">
                <span className="font-semibold">Vote Count</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-60 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <XAxis
                dataKey="name"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={40}
              >
                <Label value="Candidates" offset={-10} position="insideBottom" fill="#64748b" />
              </XAxis>
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
              >
                <Label value="Vote Count" angle={-90} position="insideLeft" fill="#64748b" />
              </YAxis>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="votes" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side Card */}
      <div className="flex flex-col lg:w-80 gap-4">
        <VoterTurnoutCard />
        <ElectionProgressCard />
      </div>
    </div>
  );
}

export default RevenueChart;
