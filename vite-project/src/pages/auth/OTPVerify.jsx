import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function OTPVerify() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const email = new URLSearchParams(window.location.search).get("email");

  /* ───────── OTP INPUT LOGIC ───────── */
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const newOtp = [...otp];
    if (e.key === "Backspace") {
      if (newOtp[index] !== "") {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        e.target.previousElementSibling?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.target.previousElementSibling?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.target.nextElementSibling?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(pasteData)) {
      setOtp(pasteData.split(""));
    }
  };

  /* ───────── VERIFY OTP ───────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast.error("Please enter the full 6-digit OTP.");
      return;
    }

    if (!email) {
      toast.error("Invalid verification session. Please register again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, otp: enteredOtp }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("OTP verified successfully!");
      
      setTimeout(() => navigate("/auth/login"), 1500);

    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  /* ───────── RESEND OTP (FIXED) ───────── */
  const handleResendOtp = async () => {
    if (!email) {
      toast.error("Invalid session. Please register again.");
      return;
    }

    setResending(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      // 🔒 LOCKED → START SERVER-DRIVEN COUNTDOWN
      if (response.status === 429 && result.retry_after) {
        toast.error("Too many requests. Please wait before retrying.");

        setCooldown(result.retry_after);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setResending(false);
        return;
      }

      if (!response.ok) {
        toast.error(result.error || "Failed to resend OTP.");
        setResending(false);
        return;
      }

      toast.success("A new OTP has been sent to your email.");

      // ⏱ 30s cooldown after each successful resend
      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <img src="/logo2.png" alt="logo" className="mx-auto h-12 mb-3" />
          <h2 className="text-xl font-bold text-gray-800">
            Verify Your Account
          </h2>
          <p className="text-gray-500 mt-2">
            Enter 6-digit code sent to your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex gap-2 mb-6">
            {otp.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* RESEND SECTION */}
        <div className="text-center mt-4">
          <button
            onClick={handleResendOtp}
            disabled={resending || cooldown > 0}
            className="text-indigo-600 font-medium hover:underline disabled:text-gray-400"
          >
            {cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : resending
              ? "Resending…"
              : "Resend OTP"}
          </button>
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