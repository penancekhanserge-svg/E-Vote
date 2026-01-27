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
  
  // Loading state specifically for delete
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchElections();
    fetchAvailableElectionTypes();
  }, []);

  /* ───────────── FETCH ELECTIONS ───────────── */
  const fetchElections = async () => {
    const { data, error } = await supabase
      .from("elections")
      .select(`
        id,
        start_date,
        end_date,
        election_types (
          id,
          name
        )
      `)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Elections error:", error);
      return;
    }

    const today = new Date();

    const formatted = data.map((e) => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);

      let status = "Upcoming";
      if (today >= start && today <= end) status = "Active";
      if (today > end) status = "Completed";

      return {
        id: e.id,
        type: e.election_types.name,
        electionTypeId: e.election_types.id,
        startDate: e.start_date,
        endDate: e.end_date,
        status,
      };
    });

    setElections(formatted);
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

    const unused = data.filter(
      (t) => !t.elections || t.elections.length === 0
    );

    setAvailableTypes(unused);
  };

  /* ───────────── STATS ───────────── */
  const totalElections = elections.length;
  const activeElections = elections.filter((e) => e.status === "Active").length;
  const upcomingElections = elections.filter(
    (e) => e.status === "Upcoming"
  ).length;
  const completedElections = elections.filter(
    (e) => e.status === "Completed"
  ).length;

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
    setElectionToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    const election = elections[electionToDelete];
    
    // Start Deleting State
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("elections")
        .delete()
        .eq("id", election.id);

      if (error) {
        throw error;
      }

      // Success path
      await fetchElections();
      await fetchAvailableElectionTypes();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete election. It might have associated votes.");
    } finally {
      // Stop Deleting State regardless of success or failure
      setIsDeleting(false);
    }
  };

  /* ───────────── UI ───────────── */
  const StatCard = ({ icon, label, count }) => (
    <div className="flex items-center space-x-4 p-4 sm:p-6 rounded-2xl bg-white shadow hover:shadow-md transition border border-slate-100 dark:border-slate-700">
      <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">{label}</p>
        <h3 className="text-xl sm:text-2xl font-semibold">{count}</h3>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
        Elections Management
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={<ListChecks />} label="Total Elections" count={totalElections} />
        <StatCard icon={<CheckCircle />} label="Active Elections" count={activeElections} />
        <StatCard icon={<Clock />} label="Upcoming Elections" count={upcomingElections} />
        <StatCard icon={<CalendarDays />} label="Completed Elections" count={completedElections} />
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
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Election
          </button>
        </div>

        {/* Empty State */}
        {elections.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No elections found. Create one to get started.
          </div>
        ) : (
          <>
            {/* 📱 MOBILE CARD VIEW (Visible only on small screens) */}
            <div className="block sm:hidden p-4 space-y-4">
              {elections.map((e, idx) => (
                <div key={e.id} className="border border-slate-200 rounded-xl p-4 bg-white dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{e.type}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          e.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : e.status === "Completed"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                        {e.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div>
                      <span className="block text-xs uppercase text-gray-400">Start</span>
                      {e.startDate}
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-400">End</span>
                      {e.endDate}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={() => openEditModal(idx)} className="text-blue-600 p-1">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => confirmDelete(idx)} className="text-red-600 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 🖥️ DESKTOP TABLE VIEW (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Election Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Start Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">End Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {elections.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-800 dark:text-white">{e.type}</td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400">{e.startDate}</td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400">{e.endDate}</td>
                      <td className="px-4 sm:px-6 py-3">
                         <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          e.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : e.status === "Completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                        {e.status}
                      </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEditModal(idx)} className="text-blue-600 hover:text-blue-800 transition-colors">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => confirmDelete(idx)} className="text-red-600 hover:text-red-800 transition-colors">
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

      {/* ADD/EDIT MODAL - REDESIGNED */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* HEADER */}
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

            {/* BODY */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Election Type Field */}
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
                      className="w-full appearance-none border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg py-3 pl-4 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm"
                    >
                      <option value="">Select election type</option>
                      {availableTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {/* Custom Arrow Icon for Select */}
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Fields */}
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
                    className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm"
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
                    className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 transform active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-0 8 8 0 0118 0z"></path>
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
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete <strong>{elections[electionToDelete]?.type}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium transition-colors flex items-center"
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