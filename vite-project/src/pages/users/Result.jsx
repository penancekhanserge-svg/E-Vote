import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { BarChart3, Clock, FileText, Trophy, RefreshCw, Award } from "lucide-react";

function MyResult() {
  const [loading, setLoading] = useState(true);
  const [publishedElections, setPublishedElections] = useState([]);
  const [resultsMap, setResultsMap] = useState({});

  useEffect(() => {
    fetchPublishedResults();
  }, []);

  const fetchPublishedResults = async () => {
    setLoading(true);

    /* 1️⃣ Fetch all completed & published elections */
    const { data: elections, error } = await supabase
      .from("elections")
      .select(`
        id,
        election_types ( name )
      `)
      .lt("end_date", new Date().toISOString())
      .eq("results_published", true)
      .order("end_date", { ascending: false });

    if (error) {
      console.error("Elections error:", error);
      setLoading(false);
      return;
    }

    setPublishedElections(elections || []);

    /* 2️⃣ Fetch results for EACH election */
    const resultsObject = {};

    // Run requests in parallel for better performance
    const promises = elections.map(async (election) => {
      const { data: votes } = await supabase
        .from("election_vote_results")
        .select("candidate_name, vote_count")
        .eq("election_id", election.id)
        .order("vote_count", { ascending: false });

      const totalVotes = (votes || []).reduce((sum, r) => sum + r.vote_count, 0);

      resultsObject[election.id] = (votes || []).map((r) => ({
        candidateName: r.candidate_name,
        votes: r.vote_count,
        percentage: totalVotes
          ? ((r.vote_count / totalVotes) * 100).toFixed(1)
          : "0.0",
      }));
    });

    await Promise.all(promises);
    setResultsMap(resultsObject);
    setLoading(false);
  };

  /* ───────────── LOADING STATE ───────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 animate-pulse">Loading official results...</h2>
        </div>
      </div>
    );
  }

  /* ───────────── EMPTY STATE ───────────── */
  if (publishedElections.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
             <FileText className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Results Pending</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Official election results have not been published yet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  /* ───────────── RESULTS VIEW ───────────── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <div className="flex items-center justify-center mb-6 gap-3">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shadow-sm">
            <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Election Results
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Official certified results for published elections
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Stacked Elections (1 Column) for Full Width Table */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        {publishedElections.map((election, idx) => {
          const results = resultsMap[election.id] || [];
          const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
          const winnerName = results.length > 0 ? results[0].candidateName : null;

          return (
            <div key={election.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              
              {/* Election Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                    {election.election_types?.name}
                  </h2>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Closed</span>
                  </div>
                </div>
                
                {/* Stats Summary */}
                <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                  <span>Total Votes: <strong className="text-slate-800 dark:text-slate-200">{totalVotes.toLocaleString()}</strong></span>
                  {winnerName && (
                    <span className="flex items-center gap-1">
                      Winner: <strong className="text-indigo-600 dark:text-indigo-400">{winnerName}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Empty State */}
              {results.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No votes recorded for this election.
                </div>
              ) : (
                <>
                  {/* 📱 MOBILE CARD VIEW (Visible only on small screens) */}
                  <div className="sm:hidden space-y-3 px-4 pb-4">
                    {results.map((r) => (
                      <div 
                        key={r.candidateName} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                          r.candidateName === winnerName
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                            {r.candidateName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                              {r.candidateName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">
                                {r.votes.toLocaleString()} votes
                              </span>
                              {r.candidateName === winnerName && (
                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                                  <Award className="w-3.5 h-3.5" /> Winner
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-2xl sm:text-3xl font-bold ${
                            r.candidateName === winnerName
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {r.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 🖥️ DESKTOP TABLE VIEW (Visible on medium+ screens) */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg">
                    <table className="w-full text-sm sm:text-base border-collapse table-fixed" style={{ tableLayout: 'fixed' }}>
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left font-semibold rounded-tl-lg">Candidate</th>
                          <th className="px-4 sm:px-6 py-3 text-center font-semibold rounded-tl-lg">Votes</th>
                          <th className="px-4 sm:px-6 py-3 text-center font-semibold rounded-tl-lg">% of Total</th>
                          <th className="px-4 sm:px-6 py-3 text-center font-semibold rounded-tl-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                        {results.map((r) => (
                          <tr key={r.candidateName} className="h-10 align-middle transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className={`px-4 sm:px-6 py-2 font-medium text-slate-800 dark:text-white truncate ${
                                r.candidateName === winnerName
                                  ? 'text-indigo-700 dark:text-indigo-400 font-bold'
                                  : ''
                            }`}>
                              {r.candidateName}
                              {r.candidateName === winnerName && (
                                <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                                  <Award className="w-4 h-4" /> Winner
                                </span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                              {r.votes}
                            </td>
                            <td className="px-4 sm:px-6 py-2 text-center text-slate-600 dark:text-slate-300">
                              {r.percentage}%
                            </td>
                            <td className="px-4 sm:px-6 py-2 text-center">
                              {r.candidateName === winnerName ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wide">
                                  Winner
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 text-xs font-medium">
                                  Trailing
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyResult;