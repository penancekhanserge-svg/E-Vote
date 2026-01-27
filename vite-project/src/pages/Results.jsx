import React, { useEffect, useState } from "react";
import { UploadCloud, Printer } from "lucide-react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResultsPage() {
  const [elections, setElections] = useState([]);
  const [resultsMap, setResultsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);

  /* ───────────── FETCH COMPLETED ELECTIONS ───────────── */
  useEffect(() => {
    fetchCompletedElections();
  }, []);

  const fetchCompletedElections = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("elections")
      .select(`
        id,
        end_date,
        results_published,
        election_types ( name )
      `)
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

    for (const election of formatted) {
      await fetchResults(election.id);
    }

    setLoading(false);
  };

  /* ───────────── FETCH RESULTS PER ELECTION ───────────── */
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

    const totalVotes = data.reduce((s, r) => s + r.vote_count, 0);

    const formatted = data.map((r, index) => ({
      name: r.candidate_name,
      votes: r.vote_count,
      percentage: totalVotes
        ? ((r.vote_count / totalVotes) * 100).toFixed(1)
        : 0,
      winner: index === 0 && r.vote_count > 0,
    }));

    setResultsMap((p) => ({ ...p, [electionId]: formatted }));
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

  /* ───────────── UI ───────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* MAIN HEADER & CONTROLS (Hidden in Print) */}
      <div className="max-w-6xl mx-auto px-4 py-6 no-print">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Election Results</h1>
            <p className="text-sm text-gray-500">
              All completed elections and their final results.
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
          <p className="text-gray-500">Loading elections...</p>
        ) : elections.length === 0 ? (
          <p className="text-gray-500">No completed elections found.</p>
        ) : null}
      </div>

      {/* PRINTABLE CONTENT AREA */}
      <div id="printable-content" className="max-w-6xl mx-auto px-4 pb-10 space-y-10">
        {!loading && elections.length > 0 && elections.map((election) => {
          const results = resultsMap[election.id] || [];

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
                  {/* STATUS TEXT - Hidden in Print */}
                  <p className="text-sm text-gray-500 mt-1 no-print">
                    Status:{" "}
                    {election.published ? (
                      <span className="text-green-600 font-medium">
                        Published
                      </span>
                    ) : (
                      <span className="text-orange-600 font-medium">
                        Not Published
                      </span>
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
                    {publishingId === election.id ? "Publishing..." : election.published ? "Published" : "Publish"}
                  </button>
                </div>
              </div>

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
                        <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Candidate</th>
                        <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300">Votes</th>
                        <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300">% of Total</th>
                        <th className="p-3 text-center font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.name} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800 border-r border-gray-300">{r.name}</td>
                          <td className="p-3 text-center text-gray-700 border-r border-gray-300">{r.votes}</td>
                          <td className="p-3 text-center text-gray-700 border-r border-gray-300">{r.percentage}%</td>
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

      {/* PRINT STYLES: Aggressive hiding to ensure ONLY this prints */}
      <style>{`
        @media print {
          /* 1. Hide absolutely everything on the page first */
          body * {
            visibility: hidden;
          }

          /* 2. Explicitly show printable container and ALL its children */
          #printable-content, #printable-content * {
            visibility: visible;
          }

          /* 3. Position the printable area to cover the entire paper */
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

          /* 4. Hide elements marked specifically as no-print (double safety) */
          .no-print {
            display: none !important;
          }

          /* 5. Table Styling for Print */
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

          /* 6. Ensure all text is black */
          h1, h2, h3, p, span, div {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}