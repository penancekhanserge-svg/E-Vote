import React, { useState, useEffect } from 'react';

function MyResult() {
  const [resultsPublished, setResultsPublished] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const mockResults = {
        isPublished: false,
        candidateName: "John Doe",
        totalVotes: 1245,
        ranking: 2,
        percentage: 24.9,
        electionName: "Presidential Election 2025",
        publishedDate: "Nov 6, 2025",
      };

      setResultsPublished(mockResults.isPublished);
      setResults([mockResults]);
      setLoading(false);
    }, 1000);
  }, []);

  // Loader
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Pending State
  if (!resultsPublished) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center transition-all duration-500 hover:-translate-y-1">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Results Pending</h2>
          <p className="text-gray-600 mb-4">
            Results will be displayed here once published by the election administrator.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg text-left">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm text-yellow-700">
                You’ll be notified when results are published. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Published Results
  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          My Election Results
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">{results[0]?.electionName}</p>
      </header>

      {/* Results Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card Template */}
        {[
          {
            title: "Final Position",
            value: `${results[0]?.ranking}nd`,
            sub: "Place",
            color: "yellow",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0-8a3 3 0 100 6" />
            ),
          },
          {
            title: "Total Votes",
            value: results[0]?.totalVotes?.toLocaleString(),
            sub: "Votes",
            color: "blue",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            ),
          },
          {
            title: "Vote Share",
            value: `${results[0]?.percentage}%`,
            sub: "of total votes",
            color: "purple",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            ),
          },
        ].map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-2xl shadow-lg text-center bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-xl`}
          >
            <div className={`w-12 h-12 bg-${card.color}-200 rounded-full flex items-center justify-center mx-auto mb-3`}>
              <svg className={`w-6 h-6 text-${card.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {card.icon}
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{card.title}</h3>
            <p className={`text-3xl font-bold text-${card.color}-600`}>{card.value}</p>
            <p className="text-sm text-gray-600">{card.sub}</p>
          </div>
        ))}
      </section>

      {/* Detailed Results */}
      <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 text-center sm:text-left">
          Detailed Results
        </h2>
        <div className="space-y-4">
          {[
            { label: "Candidate Name", value: results[0]?.candidateName },
            {
              label: "Election Status",
              value: (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Published
                </span>
              ),
            },
            { label: "Published Date", value: results[0]?.publishedDate },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="font-bold text-gray-900 mt-2 sm:mt-0">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MyResult;
