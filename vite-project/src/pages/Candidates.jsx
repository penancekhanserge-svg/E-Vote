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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CandidateSummaryPage() {
  /* ================= STATE ================= */
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Password toggles
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

  /* ================= ENV / EDGE FUNCTION ================= */
  const API = import.meta.env.VITE_SUPABASE_URL;
  const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchElections = async () => {
    const { data, error } = await supabase
      .from("elections")
      .select(`id, election_types ( name )`);

    if (error) {
      toast.error("Failed to load elections: " + error.message);
      return;
    }
    setElections(data || []);
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

    if (error) {
      toast.error("Failed to load candidates: " + error.message);
      return;
    }

    setCandidates(
      (data || []).map((c) => ({
        ...c,
        electionName: c.elections?.election_types?.name || "",
      }))
    );
  };

  /* ================= IMAGE COMPRESSION ================= */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };

        img.onerror = reject;
      };

      reader.onerror = reject;
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
            name: candidate.full_name || "",
            email: candidate.email || "",
            party: candidate.party || "",
            region: candidate.region || "",
            electionId: candidate.election_id || "",
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoadingAction(true);
      const compressedBase64 = await compressImage(file);
      setFormData((p) => ({ ...p, photo: compressedBase64 }));
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to process image.");
      toast.error("Failed to process image.");
    } finally {
      setLoadingAction(false);
    }
  };

  /* ================= OPTIONAL FRONT DUPLICATE CHECK ================= */
  const checkEmailAcrossTables = async (email) => {
    try {
      const [voterCheck, adminCheck, candidateCheck] = await Promise.all([
        supabase.from("voters").select("id").eq("email", email).maybeSingle(),
        supabase.from("admins").select("id").eq("email", email).maybeSingle(),
        supabase.from("candidates").select("id").eq("email", email).maybeSingle(),
      ]);

      if (voterCheck?.data) return "voter";
      if (adminCheck?.data) return "admin";
      if (candidateCheck?.data) return "candidate";
      return null;
    } catch (err) {
      console.error("Email check failed:", err);
      return null;
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setErrorMsg("");

    const email = formData.email.toLowerCase().trim();
    const isEditMode = editIndex !== null;

    if (!formData.photo) {
      const msg = "Profile picture is required.";
      setErrorMsg(msg);
      toast.error(msg);
      setLoadingAction(false);
      return;
    }

    // Register mode password validation
    if (!isEditMode) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

      if (!passwordRegex.test(formData.password)) {
        const msg =
          "Password must be at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.";
        setErrorMsg(msg);
        toast.error(msg);
        setLoadingAction(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        const msg = "Passwords do not match.";
        setErrorMsg(msg);
        toast.error(msg);
        setLoadingAction(false);
        return;
      }

      // Optional front duplicate check (server also checks)
      const foundIn = await checkEmailAcrossTables(email);
      if (foundIn) {
        const msg =
          foundIn === "voter"
            ? "This email is already registered as a Voter."
            : foundIn === "admin"
            ? "This email is already registered as an Admin."
            : "This email is already registered as a Candidate.";
        setErrorMsg(msg);
        toast.error(msg);
        setLoadingAction(false);
        return;
      }
    }

    try {
      if (isEditMode) {
        // EDIT MODE: keep direct update
        const payload = {
          full_name: formData.name.toUpperCase(),
          email,
          party: formData.party.toUpperCase(),
          region: formData.region,
          election_id: formData.electionId,
          photo_url: formData.photo,
        };

        const response = await supabase
          .from("candidates")
          .update(payload)
          .eq("id", candidates[editIndex].id)
          .select()
          .single();

        if (response.error) {
          const msg = response.error.message || "Failed to update candidate.";
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }

        toast.success("Candidate updated successfully!");
        await fetchCandidates();
        closeModal();
        return;
      }
      

      // hash password client-side with bcrypt
      const hashedPassword = await bcrypt.hash(formData.password, 10);

      // REGISTER MODE: call Edge Function
      const res = await fetch(`${API}/functions/v1/register-candidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON}`,
          apikey: ANON,
        },
        body: JSON.stringify({
          full_name: formData.name,
          email,
          party: formData.party,
          region: formData.region,
          election_id: formData.electionId,
          photo_url: formData.photo,

          // send BOTH
          password_hash: hashedPassword,
          password_plain: formData.password
        }),

      });

      let data = null;
      try {
         data = await res.json();
        } catch {
        data = null;
      }

      if (!res.ok) {
       const msg =
           data?.message ||   
           data?.error ||
           data?.details ||
           "Server error";

      setErrorMsg(msg);
      toast.error(msg);
      return;
      }


      toast.success("Candidate registered! Email sent successfully.");
      await fetchCandidates();
      closeModal();
    } catch (err) {
      console.error(err);
      const msg = "Something went wrong. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    setLoadingAction(true);

    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", candidates[confirmDeleteIndex].id);

    if (!error) {
      setCandidates(candidates.filter((_, idx) => idx !== confirmDeleteIndex));
      toast.success("Candidate deleted successfully!");
    } else {
      toast.error("Failed to delete candidate: " + error.message);
    }

    setLoadingAction(false);
    setConfirmDeleteIndex(null);
  };

  /* ================= PAGINATION ================= */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = candidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(candidates.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /* ================= STATS ================= */
  const totalCandidates = candidates.length;
  const uniqueRegionsCount = new Set(candidates.map((c) => c.region)).size;

  const SummaryCard = ({ icon, label, count }) => (
    <div className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-6 rounded-2xl shadow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="p-2 sm:p-3 rounded-full bg-gray-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
          {count}
        </h3>
      </div>
    </div>
  );

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
            Candidates Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and view all registered candidates
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-sm flex items-center justify-center gap-2 text-sm font-medium"
        >
          <User size={18} />
          Register Candidate
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <SummaryCard icon={<User size={20} className="sm:w-6 sm:h-6" />} label="Total Candidates" count={totalCandidates} />
        <SummaryCard icon={<MapPin size={20} className="sm:w-6 sm:h-6" />} label="Regions Represented" count={uniqueRegionsCount} />
        <SummaryCard icon={<BarChart2 size={20} className="sm:w-6 sm:h-6" />} label="Total Votes" count={0} />
      </div>

      {/* MOBILE CARD VIEW (< 640px) */}
      <div className="block sm:hidden space-y-4 mb-6">
        {currentCandidates.length > 0 ? (
          currentCandidates.map((c, idx) => {
            const globalIndex = indexOfFirstItem + idx;
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              >
                {/* Header: Photo + Name + Badge */}
                <div className="flex items-center gap-3 mb-4">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <User size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                      {c.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {c.email}
                    </p>
                  </div>
                  <div className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded text-xs font-semibold">
                    {c.party}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mb-4">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Region</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block">{c.region}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider">Election</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block">{c.electionName}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openModal(c, globalIndex)}
                    className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteIndex(globalIndex)}
                    className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-500">
            No candidates found.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= 640px) */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 shadow rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-indigo-50 dark:bg-indigo-900/40 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {["Profile", "Name", "Email", "Party", "Region", "Election", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentCandidates.length > 0 ? (
                currentCandidates.map((c, idx) => {
                  const globalIndex = indexOfFirstItem + idx;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.photo_url ? (
                          <img src={c.photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <User size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800 dark:text-white">
                        {c.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-slate-400 text-sm">
                        {c.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-white text-sm">
                        {c.party}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-white text-sm">
                        {c.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-white text-sm">
                        {c.electionName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(c, globalIndex)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/50 transition"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteIndex(globalIndex)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500 dark:text-slate-400">
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalCandidates > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-white dark:bg-slate-900 px-4 py-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 gap-4">
          <div className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 text-center sm:text-left">
            Showing <span className="font-bold text-slate-900 dark:text-white">{indexOfFirstItem + 1}</span> to{" "}
            <span className="font-bold text-slate-900 dark:text-white">{Math.min(indexOfLastItem, totalCandidates)}</span> of{" "}
            <span className="font-bold text-slate-900 dark:text-white">{totalCandidates}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Previous
            </button>
            <span className="px-2 text-sm font-semibold text-gray-600 dark:text-slate-400 whitespace-nowrap">
              Pg {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editIndex !== null ? "Edit Candidate" : "Register Candidate"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-100 dark:border-red-800">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <input
                    required
                    placeholder="Full Name"
                    className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  />

                  <input
                    required
                    type="email"
                    placeholder="Email Address"
                    className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    disabled={editIndex !== null}
                  />

                  <input
                    required
                    placeholder="Political Party"
                    className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                    value={formData.party}
                    onChange={(e) => setFormData((p) => ({ ...p, party: e.target.value }))}
                  />

                  <select
                    required
                    className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                    value={formData.region}
                    onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
                  >
                    <option value="">Select Region</option>
                    {cameroonRegions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select
                    required
                    className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                    value={formData.electionId}
                    onChange={(e) => setFormData((p) => ({ ...p, electionId: e.target.value }))}
                    disabled={editIndex !== null}
                  >
                    <option value="">Select Election</option>
                    {elections.map((el) => (
                      <option key={el.id} value={el.id}>
                        {el.election_types?.name}
                      </option>
                    ))}
                  </select>

                  {/* PASSWORDS only in register mode */}
                  {editIndex === null && (
                    <>
                      <div className="relative">
                        <input
                          required
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg pr-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                          value={formData.password}
                          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          required
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg pr-10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-slate-400"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Photo Upload */}
                  <label
                    className={`flex flex-col items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 cursor-pointer border-2 p-4 rounded-xl text-center transition-all ${
                      !formData.photo
                        ? "border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                        : "border-solid border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    }`}
                  >
                    <UploadCloud size={24} />
                    <span className="text-sm font-medium">
                      {formData.photo ? "Photo Uploaded" : "Upload Photo (Required)"}
                    </span>
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>

                  {formData.photo && (
                    <div className="flex justify-center py-2">
                      <img src={formData.photo} alt="Preview" className="h-24 w-24 object-cover rounded-full border-2 border-white dark:border-slate-700 shadow-md" />
                    </div>
                  )}

                  <button
                    disabled={loadingAction}
                    className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50 font-medium shadow-sm"
                  >
                    {loadingAction
                      ? editIndex !== null
                        ? "Updating..."
                        : "Registering..."
                      : editIndex !== null
                      ? "Update Candidate"
                      : "Register Candidate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-center text-slate-800 dark:text-white">
              Delete Candidate
            </h3>
            <p className="mb-6 text-center text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
              Are you sure you want to delete this candidate? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmDeleteIndex(null)}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-medium text-sm w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 dark:bg-red-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 hover:bg-red-700 dark:hover:bg-red-600 transition font-medium text-sm w-full sm:w-auto shadow-sm"
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