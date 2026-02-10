import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import bcrypt from "bcryptjs";
import { supabase } from "../../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      /* ───────────── CHECK ADMIN ───────────── */
      const { data: admin } = await supabase
        .from("admins")
        .select("id, full_name, email, password")
        .eq("email", email)
        .maybeSingle();

      if (admin && admin.password) {
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
          toast.error("Invalid email or password.");
          return;
        }

        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userId", admin.id);
        localStorage.setItem("admin_id", admin.id);
        localStorage.setItem("userName", admin.full_name);
        localStorage.setItem("userEmail", admin.email);

        navigate("/dashboard");
        return;
      }

      /* ───────────── CHECK CANDIDATE ───────────── */
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id, full_name, email, password")
        .eq("email", email)
        .maybeSingle();

      if (candidate && candidate.password) {
        const match = await bcrypt.compare(password, candidate.password);
        if (!match) {
          toast.error("Invalid email or password.");
          return;
        }

        localStorage.setItem("userRole", "candidate");
        localStorage.setItem("userId", candidate.id);
        localStorage.setItem("userName", candidate.full_name);
        localStorage.setItem("userEmail", candidate.email);

        navigate("/candidate-dashboard");
        return;
      }

      /* ───────────── CHECK VOTER ───────────── */
      const { data: voter } = await supabase
        .from("voters")
        .select("id, full_name, email, password")
        .eq("email", email)
        .maybeSingle();

      if (voter && voter.password) {
        const match = await bcrypt.compare(password, voter.password);
        if (!match) {
          toast.error("Invalid email or password.");
          return;
        }

        localStorage.setItem("userRole", "voter");
        localStorage.setItem("userId", voter.id);
        localStorage.setItem("voterId", voter.id);
        localStorage.setItem("userName", voter.full_name);
        localStorage.setItem("userEmail", voter.email);

        navigate("/user-dashboard");
        return;
      }

      toast.error("Account not found.");

    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 space-y-6">

        <div className="text-center">
          <img src="/logo2.png" alt="Logo" className="h-20 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-indigo-700">VoteSecure</h1>
          <p className="text-gray-500 text-sm">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-md px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-sm font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <Link to="/auth/password" className="text-indigo-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/auth/register" className="text-indigo-600 hover:underline">
            Register
          </Link>
        </div>

      </div>

      
      
      {/* Toastify Container */}
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

