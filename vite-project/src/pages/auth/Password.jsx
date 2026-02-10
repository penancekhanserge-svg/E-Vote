import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

function Password() {

  // Controls which step of the reset flow is currently active
  // 1 = enter email, 2 = verify OTP, 3 = reset password, 4 = success
  const [step, setStep] = useState(1);

  // Stores user email input
  const [email, setEmail] = useState('');

  // Stores OTP code entered by user
  const [otp, setOtp] = useState('');

  // Stores new password
  const [newPassword, setNewPassword] = useState('');

  // Stores confirmation password
  const [confirmPassword, setConfirmPassword] = useState('');

  // Stores reset token returned after OTP verification
  const [resetToken, setResetToken] = useState(null);

  // Global loading state for buttons and requests
  const [loading, setLoading] = useState(false);

  // Toggle visibility of new password field
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Toggle visibility of confirm password field
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Supabase Edge Functions base URL from env
  const API = import.meta.env.VITE_SUPABASE_URL;

  // Supabase anon key for authorization header
  const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;


  
  // STEP 1 — SEND RESET OTP
 
  const handleEmailSubmit = async (e) => {
    e.preventDefault(); // prevent form reload
    setLoading(true);   // show loading state

    try {
      // Call your Supabase edge function to send OTP
      const res = await fetch(`${API}/functions/v1/send-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      // If request failed, show error toast
      if (!res.ok) {
        toast.error(data.error || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      // Success — notify user and move to OTP step
      toast.success('OTP sent to your email.');
      setStep(2);

    } catch {
      // Network or unexpected error
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // STEP 2 — VERIFY OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call edge function to verify OTP
      const res = await fetch(`${API}/functions/v1/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON}`,
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      // Handle invalid OTP
      if (!res.ok) {
        toast.error(data.error || 'Invalid OTP');
        setLoading(false);
        return;
      }

      // Save reset token returned from backend
      setResetToken(data.resetToken);

      // Move to password reset step
      toast.success('OTP verified successfully.');
      setStep(3);

    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  
  // PASSWORD STRENGTH CHECK
 
  const validatePassword = (pwd) => {
    // Requires:
    // lowercase + uppercase + number + special char + min length 8
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(pwd);
  };


  // =========================
  // STEP 3 — RESET PASSWORD
  // =========================
  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Validate password strength first
    if (!validatePassword(newPassword)) {
      toast.error(
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
      );
      return;
    }

    // Ensure both password fields match
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Call edge function to update password
      const res = await fetch(`${API}/functions/v1/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON}`,
        },
        body: JSON.stringify({
          email,
          reset_token: resetToken,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      // Handle backend error
      if (!res.ok) {
        toast.error(data.error || 'Password reset failed');
        setLoading(false);
        return;
      }

      // Success — move to final step
      toast.success('Password reset successful!');
      setStep(4);

    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  
  // UI STEP RENDERER
  const renderStep = () => {
    switch (step) {

      // STEP 1 UI — EMAIL FORM
      case 1:
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            {/* Submit button shows loading text when active */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-4 py-3 rounded-md transition duration-300 shadow-md"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        );


      // STEP 2 UI — OTP FORM
      case 2:
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
              {/* Helper text showing target email */}
              <p className="text-xs text-gray-500 mt-1">
                We've sent a 6-digit verification code to {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-4 py-3 rounded-md transition duration-300 shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        );


      // STEP 3 UI — NEW PASSWORD FORM
      case 3:
        return (
          <form onSubmit={handlePasswordReset} className="space-y-5">

            {/* New password field with show/hide toggle */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Confirm password field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-4 py-3 rounded-md transition duration-300 shadow-md"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        );


      // STEP 4 UI — SUCCESS SCREEN
      case 4:
        return (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Password Reset Successful!
            </h3>
            <p className="text-gray-600">
              Your password has been successfully reset.
            </p>

            <Link
              to="/auth/login"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-md"
            >
              Go to Login
            </Link>
          </div>
        );

      default:
        return null;
    }
  };


  
  // MAIN PAGE LAYOUT
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-6">

        {/* Logo + App Name */}
        <div className="flex items-center justify-center space-x-3">
          <img src="/logo2.png" alt="Logo" className="h-20 w-20 object-contain" />
          <h1 className="text-2xl font-bold text-indigo-700">VoteSecure</h1>
        </div>

        {/* Dynamic title based on step */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify Email'}
            {step === 3 && 'Reset Password'}
            {step === 4 && 'Success'}
          </h2>
        </div>

        {/* Render correct step UI */}
        {renderStep()}

        {/* Back to login link shown until success */}
        {step < 4 && (
          <div className="text-sm text-center text-gray-600">
            <Link to="/auth/login" className="text-indigo-600 hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </div>

      {/* Toast notification container */}
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

export default Password;
