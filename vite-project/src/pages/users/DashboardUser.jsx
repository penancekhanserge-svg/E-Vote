import React from "react";
import { 
  CheckCircle2, 
  Calendar, 
  Users, 
  Vote, 
  Megaphone, 
  Clock,
  TrendingUp
} from "lucide-react";

function DashboardUser() {
  const upcomingEvents = [
    { title: "Voting Ends", date: "Aug 20, 2025", icon: <Clock className="w-4 h-4 text-red-600" /> },
    { title: "Results Announcement", date: "Aug 22, 2025", icon: <TrendingUp className="w-4 h-4 text-green-600" /> },
  ];

  const announcements = [
    {
      text: "Voting starts on Aug 10, 2025",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      icon: <Calendar className="w-4 h-4" />
    },
    {
      text: "Voting ends on Aug 20, 2025",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      icon: <Calendar className="w-4 h-4" />
    },
    {
      text: "Results will be published on Aug 22, 2025",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />
    },
  ];

  return (
    // ✅ Removed the white container background (was bg-white)
    <div className="p-6 space-y-6 min-h-screen">
      {/* Welcome + Stats */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Welcome back, John
        </h2>
        <p className="text-gray-600 mt-1">Here’s the latest about the election</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Your Voting Status
              </h3>
              <p className="text-2xl font-bold text-green-600">Voted</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Registered Candidates
              </h3>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Total Voters
              </h3>
              <p className="text-2xl font-bold text-purple-600">5,000</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Vote className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Megaphone className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Announcements</h3>
        </div>
        <ul className="space-y-3">
          {announcements.map((item, index) => (
            <li
              key={index}
              className={`p-4 rounded-lg ${item.bgColor} flex items-start space-x-3`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className={`text-sm font-medium ${item.textColor}`}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Upcoming Events
          </h3>
        </div>
        <ul className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  {event.icon}
                </div>
                <span className="font-medium text-gray-800">{event.title}</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {event.date}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DashboardUser;
