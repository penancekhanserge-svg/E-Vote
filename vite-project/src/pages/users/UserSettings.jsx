import React, { useEffect, useState } from "react";
import { Save, User } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SettingsPage() {
  const voterId = localStorage.getItem("voterId");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* ───────── LOAD VOTER PROFILE ───────── */
  useEffect(() => {
    const loadProfile = async () => {
      if (!voterId) {
        toast.error("Your session may be inactive. Changes cannot be saved.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("voters")
        .select("full_name, email")
        .eq("id", voterId)
        .single();

      if (error || !data) {
        toast.error("Unable to verify your session. Editing is allowed, saving is disabled.");
        setLoading(false);
        return;
      }

      setFormData({
        fullName: data.full_name,
        email: data.email,
      });

      setLoading(false);
    };

    loadProfile();
  }, [voterId]);

  /* ───────── SAVE PROFILE ───────── */
  const handleSave = async () => {
    if (!voterId) {
      toast.error("Session missing. Please log in again to save changes.");
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("voters")
        .update({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
        })
        .eq("id", voterId);

      if (error) {
        toast.error("Failed to save changes. Please try again.");
        return;
      }

      localStorage.setItem("userName", formData.fullName);
      toast.success("Changes saved successfully.");
    } catch {
      toast.error("Unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ───────── LOADING ───────── */
  if (loading) {
    return <div className="p-8 text-gray-500">Loading profile…</div>;
  }

  /* ───────── UI ───────── */
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Update Your Information
          </h1>
          <p className="mt-2 text-gray-600">
            Keep your profile information up to date
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-500" />
              Basic Information
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md
                           hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
}

export default SettingsPage;