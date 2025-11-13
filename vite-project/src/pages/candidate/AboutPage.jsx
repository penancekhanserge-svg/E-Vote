import React from 'react';

function About() {
  return (
    <div className="min-h-screen  text-gray-900 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Title Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-700 mb-3">About VoteSecure</h1>
          <p className="text-lg text-blue-900">
            Empowering digital democracy through trust, transparency, and technology.
          </p>
        </div>

        {/* About Section */}
        <div className="bg-white border border-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Who We Are</h2>
          <p className="text-gray-700 leading-relaxed text-base md:text-lg">
            <span className="font-semibold text-blue-600">VoteSecure</span> is a modern, secure voting platform 
            designed to make digital elections transparent, trusted, and accessible to everyone. 
            Whether you're a voter, candidate, or admin, our goal is to ensure your voice is heard 
            clearly and securely.
          </p>
        </div>

        {/* Values Section */}
        <div>
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Transparency", desc: "Every step of the voting process is verifiable and auditable." },
              { title: "Security", desc: "Built with top-tier encryption and data protection standards." },
              { title: "Accessibility", desc: "Inclusive, intuitive design for all users and devices." },
              { title: "Integrity", desc: "Ensuring fair, tamper-proof elections for every participant." },
            ].map((val) => (
              <div
                key={val.title}
                className="bg-white border border-blue-100 p-6 rounded-xl shadow-md hover:scale-[1.02] transition-transform"
              >
                <h3 className="text-lg font-bold text-blue-700 mb-2">{val.title}</h3>
                <p className="text-gray-700">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div>
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Why Choose VoteSecure?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "End-to-End Encryption", desc: "Every vote is encrypted to ensure privacy and prevent tampering." },
              { title: "Real-Time Results", desc: "Access verified results instantly once voting ends." },
              { title: "User-Friendly Interface", desc: "Simple navigation for both voters and administrators." },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white text-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition"
              >
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-700 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div>
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Team Card */}
            <div className="bg-white border border-blue-100 p-8 rounded-xl text-center shadow-lg hover:shadow-xl transition">
              <img
                src="/profile.jpg"
                alt="Serge Johnson"
                className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-blue-100"
              />
              <h3 className="text-lg font-bold text-blue-700">Serge Johnson</h3>
              <p className="text-gray-600 text-sm">Lead Developer & Admin</p>
            </div>

            {/* CTA Card */}
            <div className="bg-white p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition">
              <h2 className="text-2xl font-bold mb-3 text-blue-700">Ready for Secure Elections?</h2>
              <p className="mb-5 text-gray-700">
                Join us and take part in shaping a transparent, trustworthy digital democracy.
              </p>
              <button className="bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-800 transition">
                Get Started
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default About;
