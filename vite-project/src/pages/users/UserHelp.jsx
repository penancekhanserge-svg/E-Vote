import React, { useState } from 'react';
import emailjs from "emailjs-com";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Support() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      question: 'How do I reset my admin password?',
      answer:
        'Go to your profile settings and click on "Change Password". Follow the instructions to reset your password.',
    },
    {
      question: 'Can I publish results after submission?',
      answer:
        'Yes, results can be published anytime unless locked by the system admin.',
    },
    {
      question: 'How can I reach technical support?',
      answer:
        'Use the contact form below or email support@electionportal.com.',
    },
    {
      question: 'How do I update election details?',
      answer:
        'Navigate to the Election Management panel, select the election, and click "Edit".',
    },
    {
      question: 'Can I export election results?',
      answer:
        'You can export election results as PDFs by using the Export PDF button on the results page.',
    },
    {
      question: 'How do I add new candidates?',
      answer:
        'Go to the Election Management panel, select the election, and use the Add Candidate button.',
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
    setLoading(true);

    emailjs.send(
      "service_ojhb2v1",      // Service ID
      "template_chxvk3p",     // Template ID
      formData,               // { fullName, email, subject, message }
      "vupOZWa7Do2QknCAp"     // Public Key
    )
    .then(() => {
      toast.success("Message sent successfully!");
      handleReset();
    })
    .catch((error) => {
      console.error("EmailJS error:", error);
      toast.error("Failed to send message");
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-indigo-700 dark:text-indigo-400">
          Support & Help Center
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-base max-w-xl mx-auto">
          Need assistance? Browse our FAQs or reach out to our support team directly.
        </p>
      </div>

      {/* FAQ + Contact Form Cards */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* FAQ Card */}
        <div className="flex-1 bg-gradient-to-br from-indigo-100 to-white dark:from-slate-800 dark:to-slate-900 shadow-2xl border border-indigo-200 dark:border-slate-700 rounded-2xl p-6 transition">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-md overflow-hidden border border-indigo-200 dark:border-slate-600"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left px-5 py-3 font-medium text-sm text-gray-800 dark:text-white flex justify-between items-center bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"
                >
                  {faq.question}
                  <span className="text-xl font-bold">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </button>
                {activeIndex === index && (
                  <div className="px-5 py-3 text-gray-600 dark:text-gray-300 text-sm bg-indigo-50 dark:bg-slate-800">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="flex-1 bg-gradient-to-br from-indigo-100 to-white dark:from-slate-800 dark:to-slate-900 shadow-2xl border border-indigo-200 dark:border-slate-700 rounded-2xl p-6 transition">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-white mb-6">
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message"
              rows={5}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-between gap-4">
              <button
                type="reset"
                onClick={handleReset}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition disabled:opacity-60"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded-lg text-white transition
                  ${loading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                  }
                `}
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default Support;