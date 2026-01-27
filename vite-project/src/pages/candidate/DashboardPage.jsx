import React from "react";

const CandidateDashboard = () => {
  // Candidate's registered elections
  const myElections = [
    { id: 'presidential', title: 'Presidential Election 2025', status: 'Ongoing', startDate: 'March 1, 2025', endDate: 'March 15, 2025' },
    { id: 'local', title: 'Local Government Chairperson', status: 'Upcoming', startDate: 'January 15, 2025', endDate: 'January 25, 2025' }
  ];

  return (
    <div className="p-6 space-y-6  min-h-screen">

      {/* Elections Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">My Elections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myElections.map(election => (
            <div
              key={election.id}
              className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    election.status === 'Ongoing' ? 'bg-green-100 text-green-800' :
                    election.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  {election.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Voting Start: <span className="font-medium">{election.startDate}</span>
              </p>
              <p className="text-sm text-gray-500">
                Voting End: <span className="font-medium">{election.endDate}</span>
              </p>
              <p className="mt-2 text-gray-500 text-sm italic">
                Results will be visible once published
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
        <ul className="space-y-4">
          {myElections.map(election => (
            <li key={election.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">{election.title} Voting Starts</span>
              <span className="text-sm text-gray-500 font-medium bg-green-50 px-3 py-1 rounded-full">{election.startDate}</span>
            </li>
          ))}
          <li className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <span className="text-sm font-medium text-gray-700">Results Announcement</span>
            <span className="text-sm text-gray-500 font-medium bg-purple-50 px-3 py-1 rounded-full">Aug 22, 2025</span>
          </li>
        </ul>
      </div>

    </div>
  );
};

export default CandidateDashboard;
