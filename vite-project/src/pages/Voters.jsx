import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const mockVotersInit = [];

function Voters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mockVoters, setMockVoters] = useState(mockVotersInit);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const votersPerPage = 10;

  // Popups
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);

  // Form (Edit only)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  /* ================= FETCH VOTERS ================= */
  useEffect(() => {
    fetchVoters();

    // Auto-refresh so "Voted/Not Voted" updates without reloading page
    const interval = setInterval(() => {
      fetchVoters(true); // silent refresh
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Computes status from votes table (source of truth) and optionally syncs has_voted.
   */
  const fetchVoters = async (silent = false) => {
    const { data: votersData, error: votersErr } = await supabase
      .from("voters")
      .select("id, full_name, email, has_voted");

    if (votersErr) {
      if (!silent) alert(votersErr.message);
      return;
    }

    // Pull all voter_ids that have votes (any election)
    const { data: votesData, error: votesErr } = await supabase
      .from("votes")
      .select("voter_id");

    if (votesErr) {
      // fallback to has_voted column
      setMockVoters(
        (votersData || []).map((v) => ({
          id: v.id,
          name: v.full_name,
          email: v.email,
          status: v.has_voted ? "Voted" : "Not Voted",
        }))
      );
      return;
    }

    const votedSet = new Set((votesData || []).map((x) => x.voter_id));

    const mapped = (votersData || []).map((v) => {
      const votedByVotesTable = votedSet.has(v.id);
      const voted = Boolean(v.has_voted) || votedByVotesTable;

      return {
        id: v.id,
        name: v.full_name,
        email: v.email,
        status: voted ? "Voted" : "Not Voted",
        _has_voted_db: Boolean(v.has_voted),
        _has_vote_row: votedByVotesTable,
      };
    });

    setMockVoters(mapped);

    // Optional sync: set has_voted true in DB if they have vote row but has_voted false
    const toSyncIds = mapped
      .filter((v) => v._has_vote_row && !v._has_voted_db)
      .map((v) => v.id);

    if (toSyncIds.length > 0) {
      await supabase.from("voters").update({ has_voted: true }).in("id", toSyncIds);
    }
  };

  /* ================= FILTER & PAGINATION ================= */
  const filteredVoters = mockVoters.filter(
    (voter) =>
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastVoter = currentPage * votersPerPage;
  const indexOfFirstVoter = indexOfLastVoter - votersPerPage;
  const currentVoters = filteredVoters.slice(indexOfFirstVoter, indexOfLastVoter);

  const totalPages = Math.ceil(filteredVoters.length / votersPerPage);

  const total = mockVoters.length;
  const voted = mockVoters.filter((v) => v.status === "Voted").length;
  const notVoted = total - voted;

  const handleFormChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ================= EDIT ================= */
  const openEditPopup = (voter) => {
    setSelectedVoter(voter);
    setFormData({
      name: voter.name,
      email: voter.email,
    });
    setShowEditPopup(true);
  };

  const saveEditVoter = async () => {
    if (!formData.name || !formData.email) return alert("Please fill in all fields");

    try {
      const { error } = await supabase
        .from("voters")
        .update({
          full_name: formData.name,
          email: formData.email,
        })
        .eq("id", selectedVoter.id);

      if (error) {
        if (error.code === "23505") {
          alert("Another voter already uses this email");
        } else {
          alert(error.message);
        }
        return;
      }

      alert("Voter updated successfully");

      setShowEditPopup(false);
      setSelectedVoter(null);
      fetchVoters();
    } catch {
      alert("Failed to update voter");
    }
  };

  /* ================= DELETE ================= */
  const openDeletePopup = (voter) => {
    setSelectedVoter(voter);
    setShowDeletePopup(true);
  };

  const deleteVoter = async () => {
    if (!selectedVoter?.id) {
      alert("No voter selected");
      return;
    }

    const { error } = await supabase.from("voters").delete().eq("id", selectedVoter.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Voter deleted successfully");

    setShowDeletePopup(false);
    setSelectedVoter(null);
    fetchVoters();
  };

  const closePopups = () => {
    setShowEditPopup(false);
    setShowDeletePopup(false);
    setSelectedVoter(null);
  };

  return (
    <div className="pb-6 px-4 sm:px-6 md:px-10 min-h-screen dark:bg-slate-950">
      {/* Header */}
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Voters</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage and view all registered voters.
        </p>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Registered Voters"
          count={total}
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Voted"
          count={voted}
        />
        <StatCard
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          label="Not Voted"
          count={notVoted}
        />
      </div>

      {/* Controls: Search only */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
        <div className="w-full sm:max-w-md relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search voters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Empty State */}
      {currentVoters.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500">No voters found matching your search.</p>
        </div>
      ) : (
        <>
          {/* 📱 MOBILE CARD VIEW */}
          <div className="sm:hidden space-y-4">
            {currentVoters.map((voter, idx) => (
              <div
                key={voter.id || idx}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {voter.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {voter.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                      voter.status === "Voted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {voter.status}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button
                    onClick={() => openEditPopup(voter)}
                    className="flex items-center gap-1 text-sm text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    onClick={() => openDeletePopup(voter)}
                    className="flex items-center gap-1 text-sm text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 🖥️ DESKTOP TABLE VIEW */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="min-w-full text-sm md:text-base border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {currentVoters.map((voter, idx) => (
                  <tr
                    key={voter.id || idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                      {voter.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 break-all">
                      {voter.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block ${
                          voter.status === "Voted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        } text-xs font-semibold px-2.5 py-1 rounded-full`}
                      >
                        {voter.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditPopup(voter)}
                          className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 transition-colors p-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeletePopup(voter)}
                          className="text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 px-2 sm:px-0">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* EDIT POPUP */}
      {showEditPopup && (
        <Popup title="Edit Voter" onClose={closePopups}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEditVoter();
            }}
            className="space-y-4"
          >
            <InputField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
            />
            <button className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition font-medium flex items-center justify-center">
              Save Changes
            </button>
          </form>
        </Popup>
      )}

      {/* DELETE POPUP */}
      {showDeletePopup && (
        <Popup title="Confirm Delete" onClose={closePopups}>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-white">
              {selectedVoter?.name}
            </strong>
            ?
          </p>
          <button
            onClick={deleteVoter}
            className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-medium"
          >
            Delete
          </button>
        </Popup>
      )}
    </div>
  );
}

/* ===== COMPONENTS ===== */

function StatCard({ icon, label, count }) {
  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm sm:shadow-md rounded-xl p-4 sm:p-6 flex items-center space-x-4 hover:shadow-lg transition border border-slate-100 dark:border-slate-800">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 sm:p-3 rounded-full shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          {label}
        </p>
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
          {count}
        </h3>
      </div>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
      {children}
    </th>
  );
}

function InputField({ label, name, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 
        text-slate-800 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
    </div>
  );
}

function Popup({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in duration-200">
        <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-white pr-6">
          {title}
        </h2>
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default Voters;
