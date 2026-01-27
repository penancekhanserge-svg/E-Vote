import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const ElectionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [myElections, setMyElections] = useState([]);

  useEffect(() => {
    fetchMyElections();
  }, []);

  const fetchMyElections = async () => {
    setLoading(true);

    /* 1️⃣ Get logged-in user */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      return;
    }

    /* 2️⃣ Get candidate profile */
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (candidateError || !candidate) {
      setLoading(false);
      return;
    }

    /* 3️⃣ Fetch elections this candidate is contesting */
    const { data, error } = await supabase
      .from("candidates_elections")
      .select(`
        election: elections (
          id,
          start_date,
          end_date,
          election_types ( name ),
          candidates_elections (
            candidate: candidates ( full_name )
          )
        )
      `)
      .eq("candidate_id", candidate.id);

    if (error || !data) {
      setLoading(false);
      return;
    }

    /* 4️⃣ Format elections */
    const now = new Date();

    const formatted = data.map((row) => {
      const election = row.election;

      let status = "Upcoming";
      if (new Date(election.start_date) <= now && new Date(election.end_date) >= now) {
        status = "Ongoing";
      } else if (new Date(election.end_date) < now) {
        status = "Completed";
      }

      return {
        id: election.id,
        title: election.election_types?.name || "Election",
        date: new Date(election.start_date).toDateString(),
        status,
        contestants: election.candidates_elections.map(
          (ce) => ce.candidate.full_name
        ),
      };
    });

    setMyElections(formatted);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Ongoing":
        return "bg-green-100 text-green-800";
      case "Upcoming":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /* ───────────── LOADING ───────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 px-4">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          My Elections
        </h1>

        {myElections.length === 0 && (
          <p className="text-center text-gray-500">
            You are not registered in any elections yet.
          </p>
        )}

        <div className="grid gap-6">
          {myElections.map((election) => (
            <div
              key={election.id}
              className="bg-white rounded-xl shadow-sm p-6 transition hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {election.title}
                  </h2>
                  <p className="text-gray-500">{election.date}</p>
                </div>
                <span
                  className={`mt-3 sm:mt-0 text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(
                    election.status
                  )}`}
                >
                  {election.status}
                </span>
              </div>

              {/* Contestants */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Contestants
                </p>
                <div className="flex flex-wrap gap-2">
                  {election.contestants.map((name) => (
                    <span
                      key={name}
                      className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElectionsPage;
