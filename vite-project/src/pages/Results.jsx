import React, { useEffect, useMemo, useState } from "react";
import { UploadCloud, Printer, ChevronDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * FIXES + UPGRADES (based on your goal: Region -> Department totals + Region totals)
 * - Keeps your existing candidate results table (from election_vote_results view)
 * - Adds "Results by Region" and "Results by Department (within Region)" computed from votes -> voters -> regions/departments
 * - Works with your votes table DDL:
 *   votes(voter_id, election_id, candidate_id)
 *   voters(region_id, department_id)
 *   regions(name), departments(name)
 */

export default function ResultsPage() {
  const [elections, setElections] = useState([]);
  const [resultsMap, setResultsMap] = useState({}); // candidate totals per election (from view)
  const [regionMap, setRegionMap] = useState({}); // region/department totals per election (computed)
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [openRegionForElection, setOpenRegionForElection] = useState({}); // electionId -> boolean/expanded

  /* ───────────── FETCH COMPLETED ELECTIONS ───────────── */
  useEffect(() => {
    fetchCompletedElections();
    // eslint-disable-next-line
  }, []);

  const fetchCompletedElections = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("elections")
      .select(
        `
        id,
        end_date,
        results_published,
        election_types ( name )
      `
      )
      .lt("end_date", new Date().toISOString())
      .order("end_date", { ascending: false });

    if (error) {
      toast.error("Failed to load elections: " + error.message);
      setLoading(false);
      return;
    }

    const formatted = (data || []).map((e) => ({
      id: e.id,
      name: e.election_types?.name || "Unnamed Election",
      published: e.results_published,
    }));

    setElections(formatted);

    // fetch both candidate totals + region breakdown for each election
    for (const election of formatted) {
      await Promise.all([fetchResults(election.id), fetchRegionBreakdown(election.id)]);
    }

    setLoading(false);
  };

  /* ───────────── FETCH CANDIDATE TOTALS PER ELECTION ───────────── */
  const fetchResults = async (electionId) => {
    const { data, error } = await supabase
      .from("election_vote_results")
      .select("candidate_name, vote_count")
      .eq("election_id", electionId)
      .order("vote_count", { ascending: false });

    if (error) {
      setResultsMap((p) => ({ ...p, [electionId]: [] }));
      return;
    }

    const totalVotes = (data || []).reduce((s, r) => s + (r.vote_count || 0), 0);

    const formatted = (data || []).map((r, index) => ({
      name: r.candidate_name,
      votes: r.vote_count,
      percentage: totalVotes ? ((r.vote_count / totalVotes) * 100).toFixed(1) : 0,
      winner: index === 0 && r.vote_count > 0,
    }));

    setResultsMap((p) => ({ ...p, [electionId]: formatted }));
  };

  /* ───────────── FETCH REGION/DEPARTMENT BREAKDOWN (FROM votes -> voters -> regions/departments) ───────────── */
  const fetchRegionBreakdown = async (electionId) => {
    // This query relies on your foreign keys:
    // votes.voter_id -> voters.id
    // voters.region_id -> regions.id
    // voters.department_id -> departments.id
    const { data, error } = await supabase
      .from("votes")
      .select(
        `
        id,
        voter:voters(
          id,
          region:regions(name),
          department:departments(name)
        )
      `
      )
      .eq("election_id", electionId);

    if (error) {
      console.error("Region breakdown error:", error);
      setRegionMap((p) => ({
        ...p,
        [electionId]: { regions: [], totalVotes: 0 },
      }));
      return;
    }

    const rows = data || [];
    const totalVotes = rows.length;

    // Aggregate: region -> total, departments -> totals
    const regionAgg = new Map();

    for (const row of rows) {
      const regionName = row?.voter?.region?.name || "Unknown Region";
      const deptName = row?.voter?.department?.name || "Unknown Department";

      if (!regionAgg.has(regionName)) {
        regionAgg.set(regionName, {
          region: regionName,
          total: 0,
          departments: new Map(),
        });
      }

      const rObj = regionAgg.get(regionName);
      rObj.total += 1;

      if (!rObj.departments.has(deptName)) {
        rObj.departments.set(deptName, { department: deptName, total: 0 });
      }
      rObj.departments.get(deptName).total += 1;
    }

    // Convert to arrays and sort
    const regions = Array.from(regionAgg.values())
      .map((r) => ({
        region: r.region,
        total: r.total,
        percentage: totalVotes ? ((r.total / totalVotes) * 100).toFixed(1) : "0.0",
        departments: Array.from(r.departments.values())
          .sort((a, b) => b.total - a.total)
          .map((d) => ({
            ...d,
            percentage: r.total ? ((d.total / r.total) * 100).toFixed(1) : "0.0",
          })),
      }))
      .sort((a, b) => b.total - a.total);

    setRegionMap((p) => ({
      ...p,
      [electionId]: { regions, totalVotes },
    }));
  };

  /* ───────────── PUBLISH RESULTS ───────────── */
  const handlePublish = async (electionId) => {
    setPublishingId(electionId);

    const { error } = await supabase
      .from("elections")
      .update({ results_published: true })
      .eq("id", electionId);

    if (!error) {
      toast.success("Results published successfully!");
      fetchCompletedElections();
    } else {
      toast.error("Failed to publish results.");
    }

    setPublishingId(null);
  };

  /* ───────────── PRINT ALL ───────────── */
  const handlePrintAll = () => {
    window.print();
  };

  const toggleRegionPanel = (electionId) => {
    setOpenRegionForElection((prev) => ({
      ...prev,
      [electionId]: !prev[electionId],
    }));
  };

  /* ───────────── UI ───────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* MAIN HEADER & CONTROLS (Hidden in Print) */}
      <div className="max-w-6xl mx-auto px-4 py-6 no-print">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Election Results</h1>
            <p className="text-sm text-gray-500">
              All completed elections and their final results (Candidate totals + Region/Department breakdown).
            </p>
          </div>

          <button
            onClick={handlePrintAll}
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer size={16} className="mr-2" /> Print All
          </button>
        </header>

        {loading ? (
          <p className="text-gray-500 mt-3">Loading elections...</p>
        ) : elections.length === 0 ? (
          <p className="text-gray-500 mt-3">No completed elections found.</p>
        ) : null}
      </div>

      {/* PRINTABLE CONTENT AREA */}
      <div id="printable-content" className="max-w-6xl mx-auto px-4 pb-10 space-y-10">
        {!loading &&
          elections.length > 0 &&
          elections.map((election) => {
            const results = resultsMap[election.id] || [];
            const rb = regionMap[election.id] || { regions: [], totalVotes: 0 };

            const topCandidate = results?.[0]?.name || "N/A";
            const totalVotes = useMemoSafeTotalVotes(results, rb);

            return (
              <div
                key={election.id}
                className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-100 break-inside-avoid"
              >
                {/* HEADER: Name and Status/Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                      {election.name}
                    </h2>

                    {/* Summary (visible on screen + print) */}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <SummaryChip label="Total Votes" value={totalVotes} />
                      <SummaryChip label="Top Candidate" value={topCandidate} />
                      <SummaryChip label="Regions Counted" value={rb.regions.length} />
                    </div>

                    {/* STATUS TEXT - Hidden in Print */}
                    <p className="text-sm text-gray-500 mt-2 no-print">
                      Status:{" "}
                      {election.published ? (
                        <span className="text-green-600 font-medium">Published</span>
                      ) : (
                        <span className="text-orange-600 font-medium">Not Published</span>
                      )}
                    </p>
                  </div>

                  {/* PUBLISH BUTTON - Hidden in Print */}
                  <div className="no-print">
                    <button
                      onClick={() => handlePublish(election.id)}
                      disabled={election.published || publishingId === election.id}
                      className={`flex items-center px-4 py-2 rounded text-white transition-colors ${
                        election.published
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <UploadCloud size={16} className="mr-2" />
                      {publishingId === election.id
                        ? "Publishing..."
                        : election.published
                        ? "Published"
                        : "Publish"}
                    </button>
                  </div>
                </div>

                {/* REGION / DEPARTMENT BREAKDOWN (New) */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      Results by Region & Department
                    </h3>

                    {/* Toggle on screen (always expanded in print) */}
                    <button
                      type="button"
                      onClick={() => toggleRegionPanel(election.id)}
                      className="no-print flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <span className="mr-1">
                        {openRegionForElection[election.id] ? "Hide" : "Show"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          openRegionForElection[election.id] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* content */}
                  <div
                    className={`mt-3 ${
                      openRegionForElection[election.id] ? "block" : "hidden"
                    } print:block`}
                  >
                    {rb.regions.length === 0 ? (
                      <p className="text-gray-500 italic">No region/department data found.</p>
                    ) : (
                      <div className="space-y-3">
                        {rb.regions.map((reg) => (
                          <details
                            key={reg.region}
                            className="rounded-lg border border-gray-200"
                            open
                          >
                            <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{reg.region}</p>
                                <p className="text-xs text-gray-500">
                                  Total: {reg.total} ({reg.percentage}% of all votes)
                                </p>
                              </div>
                              <span className="text-sm font-bold text-gray-800">
                                {reg.total}
                              </span>
                            </summary>

                            <div className="px-4 pb-4 overflow-x-auto">
                              <table className="w-full text-sm border-collapse border border-gray-200">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-200">
                                      Department
                                    </th>
                                    <th className="p-2 text-center font-semibold text-gray-700 border-r border-gray-200">
                                      Votes
                                    </th>
                                    <th className="p-2 text-center font-semibold text-gray-700">
                                      % of Region
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reg.departments.map((d) => (
                                    <tr
                                      key={d.department}
                                      className="border-b border-gray-200"
                                    >
                                      <td className="p-2 text-gray-800 border-r border-gray-200">
                                        {d.department}
                                      </td>
                                      <td className="p-2 text-center text-gray-700 border-r border-gray-200">
                                        {d.total}
                                      </td>
                                      <td className="p-2 text-center text-gray-700">
                                        {d.percentage}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CANDIDATE TOTALS (Your existing section) */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Overall Candidate Totals
                  </h3>

                  {/* EMPTY STATE */}
                  {results.length === 0 ? (
                    <p className="text-gray-500 italic">No votes recorded.</p>
                  ) : (
                    <>
                      {/* 📱 MOBILE CARD VIEW (Visible only on small screens, Hidden in Print) */}
                      <div className="block md:hidden no-print space-y-3">
                        {results.map((r) => (
                          <div
                            key={r.name}
                            className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="font-bold text-gray-900">{r.name}</div>
                              {r.winner && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  Winner
                                </span>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-xl font-bold text-gray-800">{r.votes}</div>
                              <div className="text-sm text-gray-500">{r.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 🖥️ DESKTOP TABLE VIEW (Visible on medium+ screens and in Print) */}
                      <table className="hidden md:table w-full text-sm md:text-base border-collapse border border-gray-300 print:table">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">
                              Candidate
                            </th>
                            <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300">
                              Votes
                            </th>
                            <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300">
                              % of Total
                            </th>
                            <th className="p-3 text-center font-semibold text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r) => (
                            <tr key={r.name} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-800 border-r border-gray-300">
                                {r.name}
                              </td>
                              <td className="p-3 text-center text-gray-700 border-r border-gray-300">
                                {r.votes}
                              </td>
                              <td className="p-3 text-center text-gray-700 border-r border-gray-300">
                                {r.percentage}%
                              </td>
                              <td className="p-3 text-center font-bold">
                                {r.winner ? (
                                  <span className="text-green-600">Winner</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #printable-content, #printable-content * {
            visibility: visible;
          }

          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            background-color: white;
            z-index: 9999;
          }

          .no-print {
            display: none !important;
          }

          table {
            width: 100% !important;
            border: 1px solid #000 !important;
          }

          th, td {
            border: 1px solid #000 !important;
            color: #000 !important;
            background-color: transparent !important;
          }

          th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          h1, h2, h3, p, span, div {
            color: #000 !important;
          }

          details {
            border: 1px solid #000 !important;
          }

          summary {
            list-style: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- helpers ---------- */

function SummaryChip({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * Safe total votes: prefer region breakdown total if candidate view is empty,
 * otherwise candidate results total is inferred from sum of votes in view.
 */
function useMemoSafeTotalVotes(candidateResults, regionBreakdown) {
  // cannot use React hook here; just compute safely in render
  const candidateTotal = (candidateResults || []).reduce((s, r) => s + (r.votes || 0), 0);
  if (candidateTotal > 0) return candidateTotal;
  return regionBreakdown?.totalVotes || 0;
}
