import React, { useState, useEffect } from "react";
import {
  User,
  MapPin,
  BarChart2,
  Edit3,
  Trash2,
  X,
  UploadCloud,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import bcrypt from "bcryptjs";

export default function CandidateSummaryPage() {
  /* ================= STATE ================= */
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    region: "",
    party: "",
    electionId: "",
    photo: "",
    password: "",
    confirmPassword: "",
  });

  /* ================= CONSTANTS ================= */
  const cameroonRegions = [
    "Adamawa",
    "Centre",
    "East",
    "Far North",
    "Littoral",
    "North",
    "Northwest",
    "South",
    "Southwest",
    "West",
  ];

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchCandidates();
    fetchElections();
  }, []);

  const fetchElections = async () => {
    const { data, error } = await supabase
      .from("elections")
      .select(`id, election_types ( name )`);

    if (!error) setElections(data || []);
  };

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(`
        id,
        full_name,
        email,
        party,
        region,
        photo_url,
        election_id,
        elections (
          election_types ( name )
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCandidates(
        data.map((c) => ({
          ...c,
          electionName: c.elections?.election_types?.name || "",
        }))
      );
    }
  };

  /* ================= IMAGE COMPRESSION UTIL ================= */
  // This compresses the image in the browser before upload to make it SUPER FAST
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; // Resize to small width for profile
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to JPEG with 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  /* ================= MODAL ================= */
  const openModal = (candidate = null, index = null) => {
    setErrorMsg("");
    setEditIndex(index);
    setShowPassword(false);
    setShowConfirmPassword(false);

    setFormData(
      candidate
        ? {
            name: candidate.full_name,
            email: candidate.email,
            party: candidate.party,
            region: candidate.region,
            electionId: candidate.election_id,
            photo: candidate.photo_url || "",
            password: "",
            confirmPassword: "",
          }
        : {
            name: "",
            email: "",
            region: "",
            party: "",
            electionId: "",
            photo: "",
            password: "",
            confirmPassword: "",
          }
    );

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditIndex(null);
    setErrorMsg("");
  };

  /* ================= IMAGE PREVIEW WITH COMPRESSION ================= */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoadingAction(true); // Show loading briefly while compressing
      const compressedBase64 = await compressImage(file);
      setFormData((p) => ({ ...p, photo: compressedBase64 }));
      setLoadingAction(false);
    } catch (error) {
      console.error("Image processing failed", error);
      setErrorMsg("Failed to process image.");
      setLoadingAction(false);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setErrorMsg("");

    const email = formData.email.toLowerCase().trim();
    const isEditMode = editIndex !== null;

    // 1. Validate Photo (Must be uploaded)
    if (!formData.photo) {
      setErrorMsg("Profile picture is required.");
      setLoadingAction(false);
      return;
    }

    // 2. Validate Passwords (Only required for new candidates)
    if (!isEditMode) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      
      if (!passwordRegex.test(formData.password)) {
        setErrorMsg(
          "Password must be at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
        );
        setLoadingAction(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setErrorMsg("Passwords do not match.");
        setLoadingAction(false);
        return;
      }
    }

    /* 🔒 PREVENT DUPLICATE / MULTI-ELECTION */
    if (!isEditMode) {
      const { data: existing } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        setErrorMsg(
          "This candidate is already registered and cannot contest another election."
        );
        setLoadingAction(false);
        return;
      }
    }

    // Prepare payload
    let payload = {
      full_name: formData.name.toUpperCase(),
      email,
      party: formData.party.toUpperCase(),
      region: formData.region,
      election_id: formData.electionId,
      photo_url: formData.photo,
    };

    // 3. Hash Password if provided (Optimized for speed: saltRounds = 2)
    if (!isEditMode && formData.password) {
      const saltRounds = 2; 
      const hashedPassword = await bcrypt.hash(formData.password, saltRounds);
      payload.password = hashedPassword;
    }

    let response;
    if (isEditMode) {
      response = await supabase
        .from("candidates")
        .update(payload)
        .eq("id", candidates[editIndex].id)
        .select()
        .single();

      if (response.error) {
        setErrorMsg(response.error.message || "Failed to update candidate.");
        setLoadingAction(false);
        return;
      }

      // Optimistic Update for Edit
      const updatedList = [...candidates];
      const electionName = elections.find(e => e.id === formData.electionId)?.election_types?.name || "";
      updatedList[editIndex] = {
        ...response.data,
        electionName: electionName
      };
      setCandidates(updatedList);

    } else {
      // Insert new candidate
      response = await supabase
        .from("candidates")
        .insert(payload)
        .select()
        .single();

      if (response.error) {
        setErrorMsg(response.error.message || "Failed to save candidate.");
        setLoadingAction(false);
        return;
      }

      // Optimistic Update for Register (Instant)
      const newCandidate = response.data;
      const electionName = elections.find(e => e.id === formData.electionId)?.election_types?.name || "";
      setCandidates([{ ...newCandidate, electionName }, ...candidates]);
    }

    setLoadingAction(false);
    closeModal();
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    setLoadingAction(true);
    
    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", candidates[confirmDeleteIndex].id);

    if (!error) {
      // Optimistic Update
      setCandidates(candidates.filter((_, idx) => idx !== confirmDeleteIndex));
    } else {
      setErrorMsg("Failed to delete candidate.");
    }

    setLoadingAction(false);
    setConfirmDeleteIndex(null);
  };

  /* ================= PAGINATION LOGIC ================= */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = candidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(candidates.length / itemsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /* ================= STATS ================= */
  const totalCandidates = candidates.length;
  const uniqueRegionsCount = new Set(candidates.map((c) => c.region)).size;

  function SummaryCard({ icon, label, count }) {
    return (
      <div className="flex items-center space-x-4 p-6 rounded-2xl shadow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="p-3 rounded-full bg-gray-50 dark:bg-slate-700">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{count}</h3>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto px-4 pb-6">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Candidates Overview</h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-4">
        <SummaryCard icon={<User />} label="Total Candidates" count={totalCandidates} />
        <SummaryCard icon={<MapPin />} label="Regions Represented" count={uniqueRegionsCount} />
        <SummaryCard icon={<BarChart2 />} label="Total Votes" count={0} />
      </div>

      <button
        onClick={() => openModal()}
        className="bg-indigo-600 text-white px-4 py-2 rounded mb-4 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition"
      >
        Register Candidate
      </button>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 shadow rounded overflow-hidden border border-slate-200 dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-indigo-100 dark:bg-indigo-900">
            <tr>
              {["Profile", "Name", "Email", "Party", "Region", "Election", "Actions"].map(
                (h) => (
                  <th key={h} className="px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {currentCandidates.length > 0 ? (
              currentCandidates.map((c, idx) => {
                // Calculate the global index because the map is on the sliced array
                const globalIndex = indexOfFirstItem + idx;
                return (
                  <tr key={c.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-2">
                      {c.photo_url ? (
                        <img src={c.photo_url} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="text-slate-400 dark:text-slate-500" />
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-white">{c.full_name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-400">{c.email}</td>
                    <td className="px-4 py-2 text-slate-800 dark:text-white">{c.party}</td>
                    <td className="px-4 py-2 text-slate-800 dark:text-white">{c.region}</td>
                    <td className="px-4 py-2 text-slate-800 dark:text-white">{c.electionName}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => openModal(c, globalIndex)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/50 transition"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteIndex(globalIndex)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/50 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-slate-400">
                  No candidates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalCandidates > 0 && (
        <div className="flex items-center justify-between mt-4 bg-white dark:bg-slate-900 px-4 py-3 rounded shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-gray-700 dark:text-slate-300">
            Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to{" "}
            <span className="font-bold">{Math.min(indexOfLastItem, totalCandidates)}</span> of{" "}
            <span className="font-bold">{totalCandidates}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Previous
            </button>
            {/* Simple Page Number Indicator (can be expanded for more complex pagination) */}
            <span className="flex items-center px-2 text-sm font-semibold text-gray-600 dark:text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded w-full max-w-md relative max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <button onClick={closeModal} className="absolute top-3 right-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
              <X />
            </button>

            <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">
              {editIndex !== null ? "Edit Candidate" : "Register Candidate"}
            </h2>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-2 rounded text-sm mb-3 border border-red-200 dark:border-red-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Full Name" className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <input required type="email" placeholder="Email"
                className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={editIndex !== null}
              />

              <input required placeholder="Party"
                className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value })}
              />

              <select required className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              >
                <option value="">Select Region</option>
                {cameroonRegions.map((r) => <option key={r}>{r}</option>)}
              </select>

              <select required className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                value={formData.electionId}
                onChange={(e) => setFormData({ ...formData, electionId: e.target.value })}
                disabled={editIndex !== null}
              >
                <option value="">Select Election</option>
                {elections.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.election_types.name}
                  </option>
                ))}
              </select>

              {/* PASSWORD SECTION - ONLY VISIBLE IN REGISTER MODE */}
              {editIndex === null && (
                <>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded pr-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded pr-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </>
              )}

              <label className={`flex gap-2 text-indigo-600 dark:text-indigo-400 cursor-pointer border-2 p-3 rounded text-center justify-center ${!formData.photo ? 'border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800' : 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50'}`}>
                <UploadCloud />
                {formData.photo ? "Photo Ready" : "Upload Photo (Required)"}
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>

              {formData.photo && (
                <div className="flex justify-center">
                    <img src={formData.photo} alt="Preview" className="h-20 w-20 object-cover rounded-full shadow-sm" />
                </div>
              )}

              <button disabled={loadingAction}
                className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50">
                {loadingAction
                  ? editIndex !== null ? "Updating..." : "Registering..."
                  : editIndex !== null ? "Update" : "Register"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDeleteIndex !== null && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">Delete Candidate</h3>
            <p className="mb-4 text-gray-600 dark:text-slate-400">Are you sure you want to delete this candidate? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteIndex(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition">Cancel</button>
              <button
                onClick={handleDelete}
                className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-red-700 dark:hover:bg-red-600 transition"
                disabled={loadingAction}
              >
                {loadingAction ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}