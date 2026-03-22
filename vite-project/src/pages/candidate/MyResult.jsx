// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";

function MyResult() {
  // State: tracks local values needed to render and update the screen.
  const [resultsPublished, setResultsPublished] = useState(false);
  const [results, setResults] = useState([]);
  const [electionName, setElectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  // Effects: run startup logic and react to dependency changes.
  useEffect(() => {
    fetchMyResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data loading: retrieves records from APIs or the database.
  const fetchMyResult = async () => {
    try {
      setLoading(true);

      const candidateId = localStorage.getItem("userId");
      setMyId(candidateId);

      if (!candidateId) {
        setResultsPublished(false);
        return;
      }

      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .select("id, election_id")
        .eq("id", candidateId)
        .single();

      if (candidateError) throw candidateError;

      if (!candidate?.election_id) {
        setResultsPublished(false);
        return;
      }

      const { data: election, error: electionError } = await supabase
        .from("elections")
        .select(
          `
          id,
          results_published,
          election_types ( name )
        `
        )
        .eq("id", candidate.election_id)
        .single();

      if (electionError) throw electionError;

      if (!election?.results_published) {
        setResultsPublished(false);
        return;
      }

      setResultsPublished(true);
      setElectionName(election.election_types?.name || "Election");

      const { data: allResults, error: resultsError } = await supabase
        .from("election_vote_results")
        .select("candidate_id, candidate_name, vote_count")
        .eq("election_id", candidate.election_id)
        .order("vote_count", { ascending: false });

      if (resultsError) throw resultsError;

      if (!allResults?.length) {
        setResults([]);
        return;
      }

      const totalVotes = allResults.reduce(
        (sum, r) => sum + (Number(r.vote_count) || 0),
        0
      );

  // Helpers: reusable utility logic used by this module.
      const formatted = allResults.map((r, index) => ({
        ...r,
        rank: index + 1,
        vote_count: Number(r.vote_count) || 0,
        percentage: totalVotes
          ? ((Number(r.vote_count) / totalVotes) * 100).toFixed(1)
          : "0.0",
      }));

      setResults(formatted);
    } catch (err) {
      console.error("RESULT ERROR:", err);
      setResultsPublished(false);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = results.reduce((s, r) => s + (Number(r.vote_count) || 0), 0);
    const myRow = results.find((r) => String(r.candidate_id) === String(myId));

    return {
      totalVotes: total,
      totalCandidates: results.length,
      myRank: myRow?.rank ?? null,
      myVotes: myRow?.vote_count ?? null,
      myPercent: myRow?.percentage ?? null,
      winner: results?.[0]?.candidate_name ?? null,
    };
  }, [results, myId]);

  const getRankLabel = (rank) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  if (loading) {
  // Render: returns the visible UI structure for this component.
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 backdrop-blur border border-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Please wait</p>
              <p className="text-lg font-semibold text-slate-900">
                Loading results...
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-3 w-11/12 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-3 w-9/12 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-3 w-10/12 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!resultsPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur border border-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-700">i</span>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Results Pending
          </h2>
          <p className="mt-2 text-slate-600">
            Results will appear once published by the admin.
          </p>

          <p className="mt-4 text-xs text-slate-500">
            If you believe this is a mistake, contact the election committee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur border border-white shadow-sm">
            <span className="text-sm font-semibold text-slate-700">
              Official Results
            </span>
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Election Results
          </h1>
          <p className="mt-2 text-slate-600">{electionName}</p>
        </div>

        {/* SUMMARY CARDS (hover effects) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/90 border border-slate-200 rounded-2xl shadow p-5 transition hover:shadow-lg hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500">TOTAL VOTES</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.totalVotes.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Counted across all candidates
            </p>
          </div>

          <div className="bg-white/90 border border-slate-200 rounded-2xl shadow p-5 transition hover:shadow-lg hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500">CANDIDATES</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary.totalCandidates.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Listed in this election
            </p>
          </div>

          <div className="bg-white/90 border border-slate-200 rounded-2xl shadow p-5 transition hover:shadow-lg hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500">WINNER</p>
            <p className="mt-1 text-lg font-bold text-slate-900 truncate">
              {summary.winner || "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Ranked #1 by votes</p>
          </div>

          <div className="bg-white/90 border border-slate-200 rounded-2xl shadow p-5 transition hover:shadow-lg hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500">YOUR POSITION</p>
            {summary.myRank ? (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {getRankLabel(summary.myRank)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {Number(summary.myVotes || 0).toLocaleString()} votes ·{" "}
                  {summary.myPercent}%
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-900">—</p>
                <p className="mt-1 text-xs text-slate-500">
                  Not found in this results list
                </p>
              </>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-white">
            <p className="text-sm font-bold text-slate-900">
              Candidates Ranking
            </p>
            <p className="text-xs text-slate-500">
              Sorted by vote count (highest to lowest)
            </p>
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse bg-white">
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Rank
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Candidate
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-700 text-center">
                    Votes
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-700 text-center">
                    %
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-700 text-center">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {results.map((r) => {
                  const isMe = String(r.candidate_id) === String(myId);
                  const isWinner = r.rank === 1;

                  return (
                    <tr
                      key={r.candidate_id}
                      className={[
                        "border-b border-slate-100",
                        "hover:bg-slate-50 transition",
                        isMe ? "bg-amber-50/60" : "bg-white",
                      ].join(" ")}
                    >
                      <td className="p-4 font-semibold text-slate-900">
                        {r.rank}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "text-slate-900",
                              isMe ? "font-bold" : "font-medium",
                            ].join(" ")}
                          >
                            {r.candidate_name}
                          </span>

                          {isMe && (
                            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded-full">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-center font-semibold text-slate-900">
                        {Number(r.vote_count || 0).toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                          {r.percentage}%
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {isWinner ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                            Winner
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white">
            <span>
              Tip: your row is highlighted in{" "}
              <span className="font-semibold text-slate-700">light amber</span>.
            </span>
            <span>
              Data source:{" "}
              <span className="font-mono text-slate-600">
                election_vote_results
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyResult;
