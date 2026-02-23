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

  /* ✅ CANDIDATE FAQS */
  const faqs = [
    {
      question: 'How do I reset my candidate account password?',
      answer:
        'Go to the login page and click “Forgot Password”. Enter your registered candidate email address and follow the reset instructions sent to your inbox.',
    },
    {
      question: 'How do I reset my candidate account password?',
      answer:
      'Candidate passwords cannot be reset directly by candidates. Please contact the system administrator or support team to request a password reset. Your identity will be verified before a new password is issued.',
    },

    {
      question: 'How do I know which election I am registered for?',
      answer:
        'Your assigned election appears on your candidate dashboard and profile page. It shows the election type and region you are registered to participate in.',
    },
    {
      question: 'Can I change my party or region after registration?',
      answer:
        'Party or region changes usually require admin approval. Please contact support with your request and supporting details for verification.',
    },
    {
      question: 'Why is my candidate profile photo not showing?',
      answer:
        'Make sure you uploaded a valid image during registration or profile update. If the issue persists, try uploading again or contact support.',
    },
    {
      question: 'Can I access voting results as a candidate?',
      answer:
        'Yes. Depending on system settings, candidates can view election results or vote counts from their dashboard once results are published.',
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
      "service_zns4e17",
      "template_chxvk3p",
      formData,
      "vupOZWa7Do2QknCAp"
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
          Candidate Support Center
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-base max-w-xl mx-auto">
          Need assistance with your candidate account? Browse FAQs or contact support.
        </p>
      </div>

      {/* FAQ + Contact Form Cards */}
      <div className="flex flex-col md:flex-row gap-8">

        {/* FAQ Card */}
        <div className="flex-1 bg-gradient-to-br from-indigo-100 to-white dark:from-slate-800 dark:to-slate-900 shadow-2xl border border-indigo-200 dark:border-slate-700 rounded-2xl p-6 transition">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-white mb-6">
            Candidate FAQs
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
                className="w-full py-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition disabled:opacity-60"
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
                  }`}
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>

          </form>
        </div>

      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

export default Support;
