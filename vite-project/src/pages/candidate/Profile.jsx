import React, { useEffect, useState } from "react";
import { Mail, MapPin, Users } from "lucide-react";
import { supabase } from "../../supabaseClient";

function Profile({ candidateId }) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH FROM SUPABASE ================= */

  useEffect(() => {
    fetchProfile();
  }, [candidateId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ USE userId instead of candidate_id
      const id = candidateId || localStorage.getItem("userId");

      if (!id) {
        setError("No candidate id provided");
        return;
      }

      const { data, error } = await supabase
        .from("candidates")
        .select(`
          id,
          full_name,
          email,
          party,
          region,
          photo_url,
          elections (
            election_types ( name )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setCandidate({
        fullName: data.full_name,
        email: data.email,
        party: data.party,
        region: data.region,
        profileImage: data.photo_url,
        electionName: data.elections?.election_types?.name || "Election",
      });

    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || "Profile not found"}
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">

          {/* Header */}
          <div className="px-6 py-8 flex items-center bg-white shadow-sm">
            <img
              className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
              src={candidate.profileImage || "/avatar.png"}
              alt={candidate.fullName}
            />

            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {candidate.fullName}
              </h1>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 py-6 space-y-4">

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700 break-words">
                {candidate.email}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-600 w-28">
                Party:
              </span>
              <span className="text-gray-700">
                {candidate.party}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-600 w-28">
                Region:
              </span>
              <span className="text-gray-700">
                {candidate.region}
              </span>
            </div>

            <div className="flex items-start space-x-3">
              <span className="font-semibold text-gray-600 w-28">
                Election:
              </span>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium">
                {candidate.electionName}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
