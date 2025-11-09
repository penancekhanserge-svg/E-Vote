import React from 'react';

function About() {
  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      {/* About Card */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:scale-[1.01] transition-transform">
        <h1 className="text-xl font-bold text-black mb-4">
          About VoteSecure
        </h1>

        <p className="text-black text-base md:text-lg leading-relaxed mb-6">
          VoteSecure is a modern, secure voting platform designed to make digital elections transparent, trusted, and accessible to everyone. 
          Whether you're a voter, candidate, or admin, our goal is to ensure that your voice is heard clearly and securely.
        </p>

        <h2 className="text-xl font-bold text-black mb-3">
          Our Core Values
        </h2>
        <ul className="space-y-3 text-black list-disc list-inside">
          <li><span className="font-bold">Transparency:</span> Every step of the voting process is verifiable and auditable.</li>
          <li><span className="font-bold">Security:</span> Built using best-in-class security standards and encryption.</li>
          <li><span className="font-bold">Accessibility:</span> Designed to be inclusive and easy to use across devices and demographics.</li>
          <li><span className="font-bold">Integrity:</span> Fair elections are non-negotiable — results are protected from tampering or bias.</li>
        </ul>
      </div>

      {/* Features Section */}
      <h2 className="text-xl font-bold text-black mt-10 mb-4">
        Why Choose VoteSecure?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:scale-[1.01] transition-transform">
          <h3 className="text-lg font-bold mb-2 text-black">End-to-End Encryption</h3>
          <p className="text-black text-sm">
            Every vote is encrypted to ensure privacy and prevent tampering.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:scale-[1.01] transition-transform">
          <h3 className="text-lg font-bold mb-2 text-black">Real-Time Results</h3>
          <p className="text-black text-sm">
            Get instant access to election outcomes as soon as voting ends.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:scale-[1.01] transition-transform">
          <h3 className="text-lg font-bold mb-2 text-black">User-Friendly Interface</h3>
          <p className="text-black text-sm">
            Simple navigation for both voters and administrators of all levels.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <h2 className="text-xl font-bold text-black mt-10 mb-4">
        Meet the Team
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Team Card */}
        <div className="bg-white p-6 rounded-xl shadow-md text-center border border-gray-200 hover:shadow-lg transition">
          <img src="/profile.jpg" alt="Serge Johnson" className="w-20 h-20 rounded-full mx-auto mb-3 ring-2 ring-gray-200" />
          <h3 className="text-lg font-bold text-black">Serge Johnson</h3>
          <p className="text-black text-sm">Lead Developer & Admin</p>
        </div>

        {/* CTA Card */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold mb-2 text-black">Ready to Experience Fair & Secure Elections?</h2>
          <p className="mb-4 text-black">Join us today and take part in the future of transparent voting</p>
          <button className="bg-black text-white font-semibold px-5 py-2 rounded-xl hover:bg-gray-800 transition">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default About;
