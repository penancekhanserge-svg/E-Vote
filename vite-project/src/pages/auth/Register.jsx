import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bcrypt from "bcryptjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../../supabaseClient"; // Ensure you have your client imported

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    region_id: "",
    department_id: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Regions & Departments
  const [regions, setRegions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch regions on mount
  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    setLoadingRegions(true);
    const { data, error } = await supabase
      .from("regions")
      .select("id, name")
      .order("name");

    setLoadingRegions(false);

    if (error) {
      console.error("Error fetching regions:", error);
      toast.error("Failed to load regions.");
      return;
    }
    setRegions(data || []);
  };

  const fetchDepartmentsByRegion = async (regionId) => {
    if (!regionId) {
      setDepartments([]);
      return;
    }

    setLoadingDepartments(true);
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, region_id")
      .eq("region_id", regionId)
      .order("name");

    setLoadingDepartments(false);

    if (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments.");
      return;
    }
    setDepartments(data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If region changes, reset department and load departments for that region
    if (name === "region_id") {
      setFormData((prev) => ({
        ...prev,
        region_id: value,
        department_id: "",
      }));
      fetchDepartmentsByRegion(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear department error also when changing region
    if (name === "region_id" && errors.department_id) {
      setErrors((prev) => ({ ...prev, department_id: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.region_id) newErrors.region_id = "Please select your region";
    if (!formData.department_id)
      newErrors.department_id = "Please select your department";

    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";

    if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must have at least 8 characters, one uppercase, one lowercase, one number, and one special character.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ───────── CHECK IF EMAIL EXISTS IN ANY TABLE ───────── */
  const checkIfEmailExists = async (email) => {
    try {
      // Query all three tables in parallel for efficiency
      const [voterCheck, adminCheck, candidateCheck] = await Promise.all([
        supabase.from("voters").select("email").eq("email", email).maybeSingle(),
        supabase.from("admins").select("email").eq("email", email).maybeSingle(),
        supabase.from("candidates").select("email").eq("email", email).maybeSingle(),
      ]);

      if (voterCheck.data || adminCheck.data || candidateCheck.data) {
        return true; // Email exists
      }
      return false; // Email is free
    } catch (error) {
      console.error("Error checking email existence:", error);
      return false; // Proceed on error to let backend handle it
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Check email existence in Voters, Admins, and Candidates tables
      const emailExists = await checkIfEmailExists(formData.email);

      if (emailExists) {
        toast.error("This email is already registered (as Voter, Admin, or Candidate).");
        setLoading(false);
        return;
      }

      // 2. If email is unique, proceed with password hashing
      const hashedPassword = await bcrypt.hash(formData.password, 10);

      // 3. Send OTP / Register via Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            password: hashedPassword,
            region_id: formData.region_id,
            department_id: formData.department_id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result?.error || result?.message || "Failed to send OTP";
        toast.error(`Error: ${errorMessage}`);
        setLoading(false);
        return;
      }

      // Success Case
      toast.success("OTP sent successfully. Check your email.");
      setLoading(false);

      setTimeout(() => {
        window.location.href = `/auth/OTPVerify?email=${formData.email}`;
      }, 1500);
    } catch (err) {
      toast.error("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-800 shadow-lg rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 h-auto lg:h-[90vh]">
        {/* LEFT FORM SECTION */}
        <div className="p-6 sm:p-8 flex flex-col justify-start h-full overflow-y-auto">
          <div className="flex items-center mb-4">
            <img src="/logo2.png" alt="Logo" className="w-20 h-20 rounded-full mr-3" />
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              VoteSecure
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1">
            Register Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mb-5">
            Fill in the form below to create your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.full_name ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                } bg-white dark:bg-slate-900 text-sm`}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.email ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                } bg-white dark:bg-slate-900 text-sm`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* REGION */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Birth Region
              </label>
              <select
                name="region_id"
                value={formData.region_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.region_id ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                } bg-white dark:bg-slate-900 text-sm`}
              >
                <option value="">
                  {loadingRegions ? "Loading regions..." : "-- Select Region --"}
                </option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.region_id && (
                <p className="text-xs text-red-600 mt-1">{errors.region_id}</p>
              )}
            </div>

            {/* DEPARTMENT */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Birth Department
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                disabled={!formData.region_id || loadingDepartments}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.department_id ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                } bg-white dark:bg-slate-900 text-sm disabled:opacity-60`}
              >
                <option value="">
                  {!formData.region_id
                    ? "Select region first"
                    : loadingDepartments
                    ? "Loading departments..."
                    : "-- Select Department --"}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="text-xs text-red-600 mt-1">{errors.department_id}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    errors.password ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                  } bg-white dark:bg-slate-900 text-sm`}
                  placeholder="Enter strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 text-slate-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-slate-300 dark:border-slate-600"
                  } bg-white dark:bg-slate-900 text-sm`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 text-slate-500"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? "Validating..." : "Register"}
            </button>
          </form>

          <div className="text-center mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-indigo-600 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT IMAGE SECTION */}
        <div className="relative hidden lg:flex items-center justify-center h-full">
          <img src="/background.jpg" alt="Voting" className="object-cover h-full w-full" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-white text-center px-6 sm:px-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Welcome to VoteSecure</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                A modern platform for secure digital voting. Transparent. Reliable. Simple.
              </p>
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

export default Register;
