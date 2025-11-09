import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function OTPVerify() {
  const [otp, setOtp] = useState(new Array(6).fill(""));

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to the next input if value is entered
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const newOtp = [...otp];

    // Handle backspace
    if (e.key === "Backspace") {
      if (newOtp[index] !== "") {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        const prevInput = e.target.previousElementSibling;
        if (prevInput) prevInput.focus();
      }
    }

    // Arrow navigation
    if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = e.target.previousElementSibling;
      if (prevInput) prevInput.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      const nextInput = e.target.nextElementSibling;
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    if (pasteData && /^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      const inputs = document.querySelectorAll('input[type="text"]');
      if (inputs[5]) inputs[5].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Entered OTP is ${otp.join("")}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/vote3.png"
            alt="voting logo"
            className="mx-auto h-12 sm:h-14 mb-3"
          />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Verify Your Account
          </h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex justify-center flex-wrap gap-2 sm:gap-3 mb-6">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            ))}
          </div>

          <Link
            to="/auth/login"
            className="w-full bg-indigo-600 text-white text-center py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm sm:text-base"
          >
            Verify OTP
          </Link>
        </form>

        {/* Resend section */}
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Didn’t receive the code?{" "}
            <button className="text-indigo-600 hover:underline font-medium">
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
