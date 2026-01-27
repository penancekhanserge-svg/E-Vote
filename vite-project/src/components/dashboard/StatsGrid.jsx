import { useEffect, useState } from "react";
import { UserCheck, Users, CalendarDays, CheckCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";

function StatsGrid() {
  const [stats, setStats] = useState({
    voters: 0,
    candidates: 0,
    activeElections: 0,
    votes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  /* ───────────── FETCH ALL STATS ───────────── */
  const fetchStats = async () => {
    setLoading(true);

    try {
      const [
        votersRes,
        candidatesRes,
        activeElectionsRes,
        votesRes,
      ] = await Promise.all([
        // Registered voters
        supabase
          .from("voters")
          .select("*", { count: "exact", head: true }),

        // Candidates
        supabase
          .from("candidates")
          .select("*", { count: "exact", head: true }),

        // ✅ Active elections (VIEW – already filtered)
        supabase
          .from("active_elections")
          .select("*", { count: "exact", head: true }),

        // Votes cast
        supabase
          .from("votes")
          .select("*", { count: "exact", head: true }),
      ]);

      setStats({
        voters: votersRes.count ?? 0,
        candidates: candidatesRes.count ?? 0,
        activeElections: activeElectionsRes.count ?? 0,
        votes: votesRes.count ?? 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ───────────── STAT CARD ───────────── */
  const StatCard = ({ label, value, icon, bg, darkBg }) => (
    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition duration-300">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-full ${bg} dark:${darkBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>

      <p className="text-3xl font-bold text-slate-800 dark:text-white">
        {loading ? "—" : value}
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Registered Voters"
        value={stats.voters}
        bg="bg-blue-100"
        darkBg="bg-blue-900"
        icon={<UserCheck className="text-blue-600 dark:text-blue-300 w-5 h-5" />}
      />

      <StatCard
        label="Candidates"
        value={stats.candidates}
        bg="bg-green-100"
        darkBg="bg-green-900"
        icon={<Users className="text-green-600 dark:text-green-300 w-5 h-5" />}
      />

      <StatCard
        label="Active Elections"
        value={stats.activeElections}
        bg="bg-yellow-100"
        darkBg="bg-yellow-900"
        icon={<CalendarDays className="text-yellow-600 dark:text-yellow-300 w-5 h-5" />}
      />

      <StatCard
        label="Votes Cast"
        value={stats.votes}
        bg="bg-red-100"
        darkBg="bg-red-900"
        icon={<CheckCircle className="text-red-600 dark:text-red-300 w-5 h-5" />}
      />
    </div>
  );
}

export default StatsGrid;
