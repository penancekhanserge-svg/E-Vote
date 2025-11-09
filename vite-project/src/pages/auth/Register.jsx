import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!formData.firstName.trim()) newErrors.firstName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';

    if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password =
        'Password must have at least 8 characters, one uppercase, one lowercase, one number, and one special character.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Register data:', formData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-800 shadow-lg rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 h-auto lg:h-[90vh]">
        
        {/* Left: Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-start h-full overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center mb-4">
            <img
              src="/logo1.jpg"
              alt="Logo"
              className="w-8 h-8 rounded-full ring-2 mr-3"
            />
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              VoteSecure
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1">
            Register Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mb-5">
            Please fill in the form below to create your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.firstName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                } bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none`}
                placeholder="Enter your full name"
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Email */}
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
                  errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                } bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none`}
                  placeholder="Enter strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Register Button */}
            <Link
              to="/auth/OTPVerify"
              onClick={(e) => {
                if (!validateForm()) e.preventDefault();
              }}
              className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition text-sm sm:text-base"
            >
              Register
            </Link>

            {/* Already have account */}
            <div className="text-center mt-2">
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="text-indigo-600 hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Right: Image */}
        <div className="relative hidden lg:flex items-center justify-center h-full">
          <img
            src="/background.jpg"
            alt="Voting"
            className="object-cover h-full w-full"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-white text-center px-6 sm:px-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Welcome to VoteSecure
              </h3>
              <p className="text-sm sm:text-base leading-relaxed">
                A modern platform for secure and transparent digital voting.
                Empowering voters and admins with a seamless experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
