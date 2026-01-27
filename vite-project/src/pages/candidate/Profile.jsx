import React, { useState } from 'react';
import { Mail } from 'lucide-react';

function Profile() {
  const [candidate] = useState({
    fullName: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    party: "Democratic Party",
    region: "California",
    electionTypes: ["Presidential", "Parliamentary"],
    profileImage: "/profile.jpg"
  });

  return (
    <div className="min-h-screen  flex items-start justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-8 flex items-center bg-white shadow-sm">
            <img
              className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
              src={candidate.profileImage}
              alt={candidate.fullName}
            />
            <div className="ml-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{candidate.fullName}</h1>
            </div>
          </div>

          {/* Info Section */}
          <div className="px-6 py-6 space-y-4">
            {/* Email */}
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700 text-sm sm:text-base break-words">{candidate.email}</span>
            </div>

            {/* Party */}
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-gray-600 w-28">Party:</span>
              <span className="text-gray-700">{candidate.party}</span>
            </div>

            {/* Region */}
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-gray-600 w-28">Region:</span>
              <span className="text-gray-700">{candidate.region}</span>
            </div>

            {/* Election Types */}
            <div className="flex items-start space-x-3">
              <span className="font-semibold text-gray-600 w-28">Elections:</span>
              <div className="flex flex-wrap gap-2">
                {candidate.electionTypes.map((type, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
