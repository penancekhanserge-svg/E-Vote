import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function Settings() {
  const [profile, setProfile] = useState({
    id: "",          // ✅ UUID loaded dynamically
    name: "",
    email: "",
    role: "admin",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  /* ───────── LOAD ADMIN PROFILE ───────── */
  useEffect(() => {
    const loadAdminProfile = async () => {
      const adminId = localStorage.getItem("admin_id");

      if (!adminId) {
        setError("Admin session not found. Please login again.");
        return;
      }

      const { data, error } = await supabase
        .from("admins")
        .select("id, full_name, email, role")
        .eq("id", adminId)
        .single();

      if (error) {
        console.error("Load admin error:", error);
        setError("Failed to load profile.");
        return;
      }

      setProfile({
        id: data.id,
        name: data.full_name,
        email: data.email,
        role: data.role,
      });
    };

    loadAdminProfile();
  }, []);

  /* ───────── INPUT HANDLERS ───────── */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ───────── SAVE PROFILE ───────── */
  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    if (!profile.id) {
      setError("Admin session expired. Please login again.");
      return;
    }

    if (!profile.name.trim() || !profile.email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(profile.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("admins")
        .update({
          full_name: profile.name,
          email: profile.email,
        })
        .eq("id", profile.id); // ✅ ALWAYS VALID

      if (error) {
        console.error("Update error:", error);
        setError(error.message || "Failed to save changes.");
        return;
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your personal information and account details
        </p>
      </div>

      {/* Profile Card */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-5 px-8 py-6 border-b border-gray-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update your basic account details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input
                type="text"
                value={profile.role}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg text-white font-medium
                ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Settings;
