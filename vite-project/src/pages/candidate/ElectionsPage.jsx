// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
import React, { useEffect, useState } from "react"; // React hooks
import { supabase } from "../../supabaseClient"; // Supabase client

const ElectionsPage = () => {
  // State: tracks local values needed to render and update the screen.
  const [loading, setLoading] = useState(true); // Loading state
  const [myId, setMyId] = useState(""); // Logged in candidate/user id
  const [election, setElection] = useState(null); // Single election object

  // Effects: run startup logic and react to dependency changes.
  useEffect(() => {
    load(); // Fetch data on mount
  }, []);

  const load = async () => {
    setLoading(true); // Start loading
    try {
      const candidateId = localStorage.getItem("userId") || ""; // Read user id
      setMyId(candidateId); // Store user id

      if (!candidateId) return; // Stop if no user

      // Fetch candidate to get election_id
      const { data: candidate, error: cErr } = await supabase
        .from("candidates")
        .select("id,election_id")
        .eq("id", candidateId)
        .single();
      if (cErr || !candidate?.election_id) return; // Stop if no election

      // Fetch election details (with type name)
      const { data: e, error: eErr } = await supabase
        .from("elections")
        .select("id,start_date,end_date,election_types(name)")
        .eq("id", candidate.election_id)
        .single();
      if (eErr || !e) return; // Stop if election missing

      // Fetch contestants for that election
      const { data: contestants, error: tErr } = await supabase
        .from("candidates")
        .select("id,full_name")
        .eq("election_id", candidate.election_id);
      if (tErr) return; // Stop if contestants fetch fails

      // Compute election status
      const now = new Date(); // Current time
      const start = new Date(e.start_date); // Start date
      const end = new Date(e.end_date); // End date
      const status =
        start <= now && end >= now ? "Ongoing" : end < now ? "Completed" : "Upcoming"; // Status

      // Store final minimal election object
      setElection({
        id: e.id, // Election id
        title: e.election_types?.name || "Election", // Title
        status, // Status
        contestants: contestants || [], // Contestants list
      });
    } catch (err) {
      console.error(err); // Log unexpected errors
    } finally {
      setLoading(false); // End loading
    }
  };

  if (loading) {
  // Render: returns the visible UI structure for this component.
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <p className="text-gray-500">No election found.</p>
      </div>
    );
  }

  // Helper to get initials for avatar
  // Data loading: retrieves records from APIs or the database.
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* PAGE HEADER */}
        <div className="bg-white px-6 py-6 sm:px-8 sm:py-8 border-b border-slate-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Candidates for {election.title}
          </h1>
          <div className="mt-2">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                election.status === 'Ongoing' ? 'bg-green-50 text-green-700 border-green-200' : 
                election.status === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-200' : 
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
              {election.status}
            </span>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* WHITE HEADER WITH THICK BORDER */}
            <thead className="bg-white border-b-2 border-slate-200">
              <tr>
                <th className="py-5 pl-6 pr-4 text-xs font-extrabold uppercase tracking-wider text-slate-700 w-16">
                  #
                </th>
                <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Candidate Name
                </th>
                <th className="py-5 pl-4 pr-6 text-right text-xs font-extrabold uppercase tracking-wider text-slate-700 w-32">
                  Status
                </th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {election.contestants.map((c, idx) => {
                const isMe = String(c.id) === String(myId);

                return (
                  <tr 
                    key={c.id} 
                    className={`group hover:bg-slate-50 transition-colors ${isMe ? 'bg-indigo-50/40' : ''}`}
                  >
                    <td className="py-4 pl-6 pr-4 text-sm text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-300 shadow-sm">
                          {getInitials(c.full_name)}
                        </div>
                        <span className={`text-sm sm:text-base font-medium text-slate-900 ${isMe ? 'text-indigo-700' : ''}`}>
                          {c.full_name || "Unknown Candidate"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right">
                      {isMe ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600/20">
                          YOU
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ElectionsPage;
