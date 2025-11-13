import React, { useState } from "react";

const electionsData = [
  {
    id: 1,
    name: "Presidential Election",
    candidates: [
      { name: "Alice Johnson", party: "Unity Party" },
      { name: "Bob Smith", party: "Progressive Party" },
      { name: "Eva Martin", party: "Green Alliance" },
    ],
  },
  {
    id: 2,
    name: "Senatorial Election",
    candidates: [
      { name: "Carol White", party: "Freedom Party" },
      { name: "David Brown", party: "Justice Party" },
    ],
  },
  {
    id: 3,
    name: "Local Government Election",
    candidates: [
      { name: "Grace Lee", party: "Community First" },
      { name: "Henry Wilson", party: "People’s Voice" },
    ],
  },
];

export default function VotePage() {
  const [selectedVotes, setSelectedVotes] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

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

  const handleFinalSubmit = () => {
    if (Object.keys(selectedVotes).length !== electionsData.length) {
      alert("Please vote for all elections before confirming.");
      return;
    }
    setSubmitted(true);
    alert("✅ Your votes have been submitted successfully!");
  };

  return (
    <div className="min-h-screen text-gray-900 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-700">🗳 Cast Your Vote</h1>
          <p className="text-gray-500 mt-2">
            Choose your preferred candidate for each election.
          </p>
        </header>

        {/* Elections */}
        {electionsData.map((election) => {
          const selectedCandidate = selectedVotes[election.id];
          return (
            <section
              key={election.id}
              className="border border-gray-200 rounded-lg p-6 mb-8 shadow-sm bg-white hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-4 text-blue-700">
                {election.name}
              </h2>

              <div className="space-y-3">
                {election.candidates.map((candidate) => {
                  const isSelected = selectedCandidate?.name === candidate.name;
                  return (
                    <div
                      key={candidate.name}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-md p-4 transition ${
                        isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      {/* Candidate Info */}
                      <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                        {/* Profile Placeholder */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                          {candidate.name.charAt(0)}
                        </div>

                        {/* Candidate Details */}
                        <div>
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-sm text-gray-500">{candidate.party}</div>
                        </div>
                      </div>

                      {/* Vote Button */}
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                          isSelected
                            ? "bg-blue-600 text-white cursor-default"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                        onClick={() => handleVoteClick(election.id, candidate)}
                        disabled={submitted || isSelected}
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

        {/* Submit Button */}
        <div className="text-center mt-10">
          <button
            onClick={handleFinalSubmit}
            disabled={submitted}
            className={`px-8 py-3 font-semibold rounded-md text-white transition ${
              submitted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitted ? "Votes Submitted ✅" : "Confirm All Votes"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">
              Confirm Your Vote
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to vote for{" "}
              <span className="font-semibold text-blue-700">
                {confirmModal.candidate.name}
              </span>{" "}
              ({confirmModal.candidate.party}) in the{" "}
              <span className="font-semibold">
                {
                  electionsData.find((e) => e.id === confirmModal.electionId)
                    ?.name
                }
              </span>
              ?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmVote}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
