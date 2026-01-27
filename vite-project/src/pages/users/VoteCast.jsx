import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Inbox } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function VotePage() {
  const voterId = localStorage.getItem("userId");

  const [elections, setElections] = useState([]);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ───────── FETCH ACTIVE ELECTIONS + CANDIDATES ───────── */
  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from("elections")
      .select(`
        id,
        election_types ( name ),
        candidates (
          id,
          full_name,
          party,
          photo_url
        )
      `)
      .lte("start_date", today)
      .gte("end_date", today);

    if (error) {
      console.error(error);
      toast.error("Failed to load elections. Please try again later.");
      setLoading(false);
      return;
    }

    setElections(
      (data || []).map((e) => ({
        id: e.id,
        name: e.election_types.name,
        candidates: e.candidates,
      }))
    );
    setLoading(false);
  };

  /* ───────── SELECT VOTE (TEMP ONLY) ───────── */
  const handleVoteClick = (electionId, candidate) => {
    if (submitted) return;
    setConfirmModal({ electionId, candidate });
  };

  const confirmVote = () => {
    setSelectedVotes((prev) => ({
      ...prev,
      [confirmModal.electionId]: confirmModal.candidate,
    }));
    setConfirmModal(null);
  };

  /* ───────── FINAL SUBMIT ───────── */
  const handleFinalSubmit = async () => {
    // Validation: Ensure a vote is cast for every available election
    if (Object.keys(selectedVotes).length !== elections.length) {
      toast.error("Please vote in all elections before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      // Loop through elections and insert votes
      for (const election of elections) {
        const candidate = selectedVotes[election.id];

        const { error } = await supabase.from("votes").insert({
          voter_id: voterId,
          election_id: election.id,
          candidate_id: candidate.id,
        });

        if (error) {
          // Handle specific error if user already voted
          if (error.code === "23505") {
            throw new Error("You have already voted in one or more of these elections.");
          } else {
            throw error;
          }
        }
      }

      setSubmitted(true);
      toast.success("✅ Your votes have been submitted successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit votes.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-700">Cast Your Vote</h1>
          <p className="text-gray-500 mt-2">
            Choose your preferred candidate for each election.
          </p>
        </header>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* EMPTY STATE: NO ELECTIONS */}
            {elections.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                <div className="bg-blue-50 p-6 rounded-full mb-6">
                  <Inbox className="w-16 h-16 text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  No Active Elections
                </h2>
                <p className="text-gray-500 text-center max-w-md">
                  There are currently no active elections available for voting. 
                  Please check back later.
                </p>
              </div>
            ) : (
              <>
                {/* ELECTIONS LIST */}
                {elections.map((election) => {
                  const selectedCandidate = selectedVotes[election.id];
                  return (
                    <section
                      key={election.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm hover:shadow-md transition"
                    >
                      <h2 className="text-xl font-semibold mb-4 text-blue-700">
                        {election.name}
                      </h2>

                      <div className="space-y-3">
                        {election.candidates.map((candidate) => {
                          const isSelected =
                            selectedCandidate?.id === candidate.id;

                          return (
                            <div
                              key={candidate.id}
                              className={`flex items-center justify-between border rounded p-4 ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {candidate.photo_url ? (
                                  <img
                                    src={candidate.photo_url}
                                    alt={candidate.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                                    {candidate.full_name.charAt(0)}
                                  </div>
                                )}

                                <div>
                                  <div className="font-medium">
                                    {candidate.full_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {candidate.party}
                                  </div>
                                </div>
                              </div>

                              <button
                                disabled={submitted || isSelected}
                                onClick={() =>
                                  handleVoteClick(election.id, candidate)
                                }
                                className={`px-4 py-2 rounded text-sm font-semibold ${
                                  isSelected
                                    ? "bg-blue-600 text-white cursor-default"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                              >
                                {isSelected ? "Selected" : "Vote"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {/* SUBMIT BUTTON (Only shows if elections exist) */}
                {elections.length > 0 && (
                  <div className="text-center mt-10">
                    <button
                      onClick={handleFinalSubmit}
                      disabled={submitted || submitting}
                      className={`px-8 py-3 rounded font-semibold text-white transition ${
                        submitted
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {submitting
                        ? "Submitting..."
                        : submitted
                        ? "Votes Submitted"
                        : "Confirm All Votes"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">
              Confirm Your Vote
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to vote for{" "}
              <span className="font-semibold text-blue-700">
                {confirmModal.candidate.full_name}
              </span>{" "}
              ({confirmModal.candidate.party}) in the{" "}
              <span className="font-semibold">
                {elections.find((e) => e.id === confirmModal.electionId)
                  ?.name}
              </span>
              ?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmVote}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST CONTAINER */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}