import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { BarChart2, ChevronDown } from "lucide-react";
import { supabase } from "../../supabaseClient";

export default function RevenueChart() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  /* ───────────── FETCH ACTIVE ELECTIONS (WITH JOIN) ───────────── */
  useEffect(() => {
    fetchActiveElections();
  }, []);

  const fetchActiveElections = async () => {
    setErrorMsg("");

    const { data, error } = await supabase
      .from("active_elections")
      .select(`
        id,
        election_type_id,
        election_types (
          name
        )
      `);

    if (error) {
      console.error("Active elections error:", error);
      setErrorMsg(error.message);
      return;
    }

    const formattedElections = (data || []).map((row) => ({
      id: row.id,
      election_type_id: row.election_type_id,
      election_name: row.election_types?.name || "Unnamed election",
    }));

    setElections(formattedElections);

    if (formattedElections.length > 0) {
      setSelectedElection(formattedElections[0]);
    }
  };

  /* ───────────── FETCH VOTE RESULTS ───────────── */
  useEffect(() => {
    if (selectedElection?.id) {
      fetchVoteResults(selectedElection.id);
    }
  }, [selectedElection]);

  const fetchVoteResults = async (electionId) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("election_vote_results")
      .select("candidate_name, vote_count")
      .eq("election_id", electionId)
      .order("vote_count", { ascending: false });

    if (error) {
      console.error("Vote results error:", error);
      setChartData([]);
    } else {
      setChartData(
        (data || []).map((row) => ({
          name: row.candidate_name,
          votes: row.vote_count,
        }))
      );
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Main Card: Removed hard border, added soft shadow and rounded corners */}
      <div className="flex-1 w-full p-6 rounded-2xl bg-white shadow-lg flex flex-col min-h-[500px]">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Live Vote Count Overview</h3>
            <p className="text-sm text-slate-500 mt-1">
              Real-time insights from active elections
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* DROPDOWN */}
            <div className="relative w-full md:w-64">
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-sm transition-colors border-0 ring-1 ring-slate-200"
              >
                <span className="truncate">
                  {selectedElection?.election_name || "Select election"}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform text-slate-400 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-full bg-white rounded-xl shadow-xl z-20 overflow-hidden ring-1 ring-slate-100">
                  {elections.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setSelectedElection(e);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        selectedElection?.id === e.id
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {e.election_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LEGEND */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <BarChart2 size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metric</span>
                <span className="text-sm font-bold text-slate-700">Vote Count</span>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center">
            <span className="mr-2">⚠️</span> {errorMsg}
          </div>
        )}

        {/* CHART CONTAINER */}
        <div className="flex-1 bg-slate-50/50 rounded-2xl p-4 md:p-6 relative w-full h-full min-h-[400px]">
          {loading && elections.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              Loading chart data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8" // Slate-400 (Softer than black)
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  height={80}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                >
                  <Label
                    value="Candidates"
                    position="insideBottom"
                    offset={-5}
                    className="fill-slate-400 text-xs font-semibold"
                  />
                </XAxis>
                
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={40}
                >
                  <Label
                    value="Votes"
                    angle={-90}
                    position="insideLeft"
                    className="fill-slate-400 text-xs font-semibold"
                  />
                </YAxis>

                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9', // Very light border
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#1e293b'
                  }}
                  itemStyle={{ color: '#4f46e5' }}
                />

                <Bar
                  dataKey="votes"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  barSize={36}
                  className="hover:opacity-90 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {!loading && chartData.length === 0 && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <BarChart2 size={48} className="mb-2 opacity-20" />
              <p className="text-sm">No votes recorded for this election yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}