import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  ListChecks,
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";

export default function ElectionsPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    electionTypeId: "",
    startDate: "",
    endDate: "",
  });

  const [elections, setElections] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchElections();
    fetchAvailableElectionTypes();
  }, []);

  /* ───────────── FETCH ELECTIONS ───────────── */
  const fetchElections = async () => {
    const { data, error } = await supabase
      .from("elections")
      .select(
        `
        id,
        start_date,
        end_date,
        election_types (
          id,
          name
        )
      `
      )
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Elections error:", error);
      return;
    }

    const today = new Date();

    const base = (data || []).map((e) => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);

      let status = "Upcoming";
      if (today >= start && today <= end) status = "Active";
      if (today > end) status = "Completed";

      return {
        id: e.id,
        type: e.election_types?.name || "Unknown",
        electionTypeId: e.election_types?.id || "",
        startDate: e.start_date,
        endDate: e.end_date,
        status,
      };
    });

    const withDeleteRules = await Promise.all(
      base.map(async (e) => {
        const [candRes, voteRes] = await Promise.all([
          supabase
            .from("candidates")
            .select("id", { count: "exact", head: true })
            .eq("election_id", e.id),
          supabase
            .from("votes")
            .select("id", { count: "exact", head: true })
            .eq("election_id", e.id),
        ]);

        const candidateCount = candRes?.count ?? 0;
        const voteCount = voteRes?.count ?? 0;

        const canDelete = candidateCount === 0 && voteCount === 0;

        let deleteReason = "";
        if (!canDelete) {
          if (voteCount > 0) deleteReason = "Cannot delete: votes already exist for this election.";
          else deleteReason = "Cannot delete: candidates already exist for this election.";
        }

        return {
          ...e,
          candidateCount,
          voteCount,
          canDelete,
          deleteReason,
        };
      })
    );

    setElections(withDeleteRules);
  };

  /* ───────────── FETCH UNUSED ELECTION TYPES ───────────── */
  const fetchAvailableElectionTypes = async () => {
    const { data, error } = await supabase
      .from("election_types")
      .select(`id, name, elections ( id )`);

    if (error) {
      console.error("Types error:", error);
      return;
    }

    const unused = (data || []).filter((t) => !t.elections || t.elections.length === 0);
    setAvailableTypes(unused);
  };

  /* ───────────── STATS ───────────── */
  const totalElections = elections.length;
  const activeElections = elections.filter((e) => e.status === "Active").length;
  const upcomingElections = elections.filter((e) => e.status === "Upcoming").length;
  const completedElections = elections.filter((e) => e.status === "Completed").length;

  /* ───────────── HANDLERS ───────────── */
  const openAddModal = () => {
    setFormData({ electionTypeId: "", startDate: "", endDate: "" });
    setEditMode(false);
    setModalOpen(true);
  };

  const openEditModal = (index) => {
    const e = elections[index];
    setFormData({
      electionTypeId: e.electionTypeId,
      startDate: e.startDate,
      endDate: e.endDate,
    });
    setEditingIndex(index);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const { electionTypeId, startDate, endDate } = formData;
    if (!startDate || !endDate || (!editMode && !electionTypeId)) return;

    setIsSubmitting(true);

    try {
      if (editMode) {
        const election = elections[editingIndex];
        await supabase
          .from("elections")
          .update({
            start_date: startDate,
            end_date: endDate,
          })
          .eq("id", election.id);
      } else {
        await supabase.from("elections").insert({
          election_type_id: electionTypeId,
          start_date: startDate,
          end_date: endDate,
        });
      }

      await fetchElections();
      await fetchAvailableElectionTypes();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save election.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (index) => {
    const e = elections[index];

    if (!e?.canDelete) {
      alert(e?.deleteReason || "Cannot delete this election.");
      return;
    }

    setElectionToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    const election = elections[electionToDelete];

    if (!election?.canDelete) {
      alert(election?.deleteReason || "Cannot delete this election.");
      setDeleteConfirmOpen(false);
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase.from("elections").delete().eq("id", election.id);

      if (error) throw error;

      await fetchElections();
      await fetchAvailableElectionTypes();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete election. It might have associated candidates or votes.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ───────────── UI ───────────── */
  const StatCard = ({ icon, label, count }) => (
    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 md:p-6 rounded-2xl bg-white shadow hover:shadow-md transition border border-slate-100 dark:border-slate-700">
      <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0"> {/* min-w-0 allows text truncation if needed */}
        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 dark:text-white truncate">
          {count}
        </h3>
      </div>
    </div>
  );

  const deleteBtnTitle = (e) =>
    e.canDelete
      ? "Delete"
      : e.voteCount > 0
      ? "Locked: votes exist"
      : "Locked: candidates exist";

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
        Elections Management
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard icon={<ListChecks size={18} className="sm:w-auto sm:h-auto"/>} label="Total Elections" count={totalElections} />
        <StatCard icon={<CheckCircle size={18} className="sm:w-auto sm:h-auto"/>} label="Active Elections" count={activeElections} />
        <StatCard icon={<Clock size={18} className="sm:w-auto sm:h-auto"/>} label="Upcoming Elections" count={upcomingElections} />
        <StatCard icon={<CalendarDays size={18} className="sm:w-auto sm:h-auto"/>} label="Completed Elections" count={completedElections} />
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            Elections List
          </h2>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm sm:text-base"
          >
            <Plus size={16} sm={18} /> <span>Add Election</span>
          </button>
        </div>

        {/* Empty State */}
        {elections.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm sm:text-base">
            No elections found. Create one to get started.
          </div>
        ) : (
          <>
            {/* 📱 MOBILE CARD VIEW */}
            <div className="block sm:hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
              {elections.map((e, idx) => (
                <div
                  key={e.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex justify-between items-start gap-2">
                      {/* Responsive Title with truncation/wrapping */}
                      <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight break-words">
                        {e.type}
                      </h3>
                      {/* Responsive Status Badge */}
                      <span
                        className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                          e.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : e.status === "Completed"
                            ? "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>

                    {/* Locked Message */}
                    {!e.canDelete && (
                      <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 break-words leading-tight mt-1">
                        🔒 {deleteBtnTitle(e)}
                      </p>
                    )}
                  </div>

                  {/* Responsive Date Grid */}
                  <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                      <span className="block text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Start</span>
                      <span className="text-[11px] sm:text-xs font-medium truncate block">
                        {e.startDate}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                      <span className="block text-[10px] uppercase text-gray-400 font-semibold tracking-wider">End</span>
                      <span className="text-[11px] sm:text-xs font-medium truncate block">
                        {e.endDate}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={() => openEditModal(idx)} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => confirmDelete(idx)}
                      disabled={!e.canDelete}
                      title={e.canDelete ? "Delete" : e.deleteReason}
                      className={`p-1.5 rounded-md transition-colors ${
                        e.canDelete
                          ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          : "text-red-600 opacity-40 cursor-not-allowed"
                      }`}
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 🖥️ DESKTOP TABLE VIEW */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase tracking-wider">
                      Election Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {elections.map((e, idx) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-800 dark:text-white">
                        <div className="flex flex-col">
                          <span className="break-words">{e.type}</span>
                          {!e.canDelete && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                              🔒 {deleteBtnTitle(e)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {e.startDate}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {e.endDate}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            e.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : e.status === "Completed"
                              ? "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEditModal(idx)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => confirmDelete(idx)}
                            disabled={!e.canDelete}
                            title={e.canDelete ? "Delete" : e.deleteReason}
                            className={`transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ${
                              e.canDelete
                                ? "text-red-600 hover:text-red-800"
                                : "text-red-600 opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                {editMode ? "Edit Election" : "Create New Election"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {!editMode && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Election Type
                  </label>
                  <div className="relative">
                    <select
                      name="electionTypeId"
                      value={formData.electionTypeId}
                      onChange={handleInputChange}
                      className="w-full appearance-none border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg py-3 pl-4 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm text-base"
                    >
                      <option value="">Select election type</option>
                      {availableTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm text-base"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 transform active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-0 8 8 0 0118 0z"
                        ></path>
                      </svg>
                      <span>{editMode ? "Updating..." : "Creating..."}</span>
                    </>
                  ) : (
                    <span>{editMode ? "Update Election" : "Create Election"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Delete Election?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong>{elections[electionToDelete]?.type}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium transition-colors flex items-center text-sm sm:text-base"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}