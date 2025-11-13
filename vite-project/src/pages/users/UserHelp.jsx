import React, { useState } from 'react';

function Support() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer:
        'Sign Out to the login page and click on "Forgot Password". Follow the instructions to reset your password.',
    },
    {
      question: 'How do I cast my vote?',
      answer:
        'Navigate to the "Vote Now" section on your dashboard, select your preferred candidate, and click "Submit Vote". Your vote will be securely recorded and encrypted.',
    },
    {
      question: 'Can I change my vote after submitting it?',
      answer:
        'No. Once a vote is submitted, it cannot be changed. Review your choice carefully before confirming.',
    },
    {
      question: 'How do I check my voting status?',
      answer:
        'Check your voting status on the top-right corner of the dashboard under "My Voting Status".',
    },
    {
      question: 'When will I see the results?',
      answer:
        'Results are announced on the date specified in the "Upcoming Events" section of your dashboard.',
    },
    {
      question: 'Is my vote anonymous?',
      answer:
        'Yes. Your identity is never linked to your vote. All votes are encrypted and stored securely.',
    },
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      `Request sent!\n\nName: ${formData.fullName}\nEmail: ${formData.email}\nSubject: ${formData.subject}\nMessage: ${formData.message}`
    );
    handleReset();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-700">
          Support & Help Center
        </h1>
        <p className="mt-2 text-black text-base max-w-xl mx-auto">
          Need assistance? Browse our FAQs or reach out to our support team directly.
        </p>
      </div>

      {/* FAQ + Contact Form Cards */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* FAQ Card */}
        <div className="flex-1 bg-white shadow-xl border border-blue-200 rounded-2xl p-6 transition">
          <h2 className="text-xl font-semibold text-blue-700 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-md overflow-hidden border border-blue-200">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left px-5 py-3 font-medium text-black flex justify-between items-center bg-white hover:bg-blue-50 transition"
                >
                  {faq.question}
                  <span className="text-xl font-bold">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </button>
                {activeIndex === index && (
                  <div className="px-5 py-3 text-black text-sm bg-blue-50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="flex-1 bg-white shadow-xl border border-blue-200 rounded-2xl p-6 transition">
          <h2 className="text-xl font-semibold text-blue-700 mb-6">
            Contact Support
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full px-4 py-3 rounded-lg border border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 rounded-lg border border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              required
              className="w-full px-4 py-3 rounded-lg border border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message"
              rows={5}
              required
              className="w-full px-4 py-3 rounded-lg border border-blue-200 bg-white text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between gap-4">
              <button
                type="reset"
                onClick={handleReset}
                className="w-full py-2 rounded-lg bg-blue-100 text-black hover:bg-blue-200 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition"
              >
                Send Request
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Download Manual Row */}
      <div className="flex flex-col md:flex-row gap-8 mt-10">
        {/* Download Manual */}
        <div className="flex-1 bg-white shadow-xl rounded-2xl p-6 border border-blue-200 transition hover:scale-[1.01]">
          <h2 className="text-xl font-semibold text-blue-700 mb-3">
            Download User Manual
          </h2>
          <p className="text-black mb-4 text-sm">
            Need help navigating the system? Download our comprehensive user manual to get started quickly.
          </p>
          <a
            href="/manuals/user-manual.pdf"
            download
            className="inline-block bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            ⬇️ Download Manual (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}

export default Support;
