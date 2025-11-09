import React, { useState } from 'react';

function Settings() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = (e) => {
    e.preventDefault();
    alert('Profile updated!');
  };

  const handleSubmitPassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New passwords don't match!");
      return;
    }
    alert('Password changed!');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">
      {/* Profile Info */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 dark:text-indigo-400">Profile Information</h2>
        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={profile.name}
            onChange={handleProfileChange}
            className="w-full px-4 py-2 border rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={profile.email}
            onChange={handleProfileChange}
            className="w-full px-4 py-2 border rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition">
            Save Profile
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 dark:text-indigo-400">Change Password</h2>
        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <input
            type="password"
            name="current"
            placeholder="Current Password"
            value={passwords.current}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 border rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
            required
          />
          <input
            type="password"
            name="new"
            placeholder="New Password"
            value={passwords.new}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 border rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
            required
          />
          <input
            type="password"
            name="confirm"
            placeholder="Confirm New Password"
            value={passwords.confirm}
            onChange={handlePasswordChange}
            className="w-full px-4 py-2 border rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
            required
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition">
            Change Password
          </button>
        </form>
      </section>
    </div>
  );
}

export default Settings;
