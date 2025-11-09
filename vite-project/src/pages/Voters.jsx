import React, { useState } from 'react';
import { Users, CheckCircle, XCircle, Search, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

const mockVotersInit = [
  { name: 'John Serge', email: 'john@gmail.com', voterId: 'VTR001', status: 'Not Voted' },
  { name: 'Mary Anne', email: 'mary@gmail.com', voterId: 'VTR002', status: 'Voted' },
  { name: 'Peter Doe', email: 'peter@gmail.com', voterId: 'VTR003', status: 'Not Voted' },
  { name: 'Alice Smith', email: 'alice@gmail.com', voterId: 'VTR004', status: 'Voted' },
  { name: 'Rose Kay', email: 'rose@gmail.com', voterId: 'VTR005', status: 'Voted' },
  { name: 'Sam Lee', email: 'sam@gmail.com', voterId: 'VTR006', status: 'Not Voted' },
  { name: 'Ella Joe', email: 'ella@gmail.com', voterId: 'VTR007', status: 'Voted' },
  { name: 'Mark Twin', email: 'mark@gmail.com', voterId: 'VTR008', status: 'Not Voted' },
  { name: 'Lucy Heart', email: 'lucy@gmail.com', voterId: 'VTR009', status: 'Voted' },
  { name: 'Tom Hardy', email: 'tom@gmail.com', voterId: 'VTR010', status: 'Not Voted' },
];

function Voters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [mockVoters, setMockVoters] = useState(mockVotersInit);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const votersPerPage = 5;

  // Popups
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);

  // Form
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Filtered voters
  const filteredVoters = mockVoters.filter(voter =>
    voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.voterId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastVoter = currentPage * votersPerPage;
  const indexOfFirstVoter = indexOfLastVoter - votersPerPage;
  const currentVoters = filteredVoters.slice(indexOfFirstVoter, indexOfLastVoter);
  const totalPages = Math.ceil(filteredVoters.length / votersPerPage);

  const total = mockVoters.length;
  const voted = mockVoters.filter(v => v.status === 'Voted').length;
  const notVoted = total - voted;

  const handleFormChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddPopup = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setShowAddPopup(true);
  };

  const addVoter = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return alert('Please fill in all fields');
    }

    if (formData.password !== formData.confirmPassword) {
      return alert('Passwords do not match');
    }

    // Password strength validation
    const password = formData.password;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const specialChar = /[!@#$%^&*]/.test(password);

    if (!uppercase || !lowercase || !number || !specialChar) {
      return alert('Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)');
    }

    const newVoter = {
      name: formData.name,
      email: formData.email,
      voterId: 'VTR' + String(mockVoters.length + 1).padStart(3, '0'),
      status: 'Not Voted',
      password: formData.password // stored but not shown in table
    };

    setMockVoters(prev => [...prev, newVoter]);
    setShowAddPopup(false);
  };

  const openEditPopup = voter => {
    setSelectedVoter(voter);
    setFormData({ name: voter.name, email: voter.email, password: '', confirmPassword: '' });
    setShowEditPopup(true);
  };

  const saveEditVoter = () => {
    if (!formData.name || !formData.email) return alert('Please fill in all fields');
    setMockVoters(prev =>
      prev.map(v =>
        v.voterId === selectedVoter.voterId ? { ...v, name: formData.name, email: formData.email } : v
      )
    );
    setShowEditPopup(false);
    setSelectedVoter(null);
  };

  const openDeletePopup = voter => {
    setSelectedVoter(voter);
    setShowDeletePopup(true);
  };

  const deleteVoter = () => {
    setMockVoters(prev => prev.filter(v => v.voterId !== selectedVoter.voterId));
    setShowDeletePopup(false);
    setSelectedVoter(null);
  };

  const closePopups = () => {
    setShowAddPopup(false);
    setShowEditPopup(false);
    setShowDeletePopup(false);
    setSelectedVoter(null);
  };

  return (
    <div className='pb-6 px-4 sm:px-6 md:px-10'>
      {/* Header */}
      <div className='mb-6 text-center sm:text-left'>
        <h2 className='text-2xl font-bold text-slate-800 dark:text-white'>Voters</h2>
        <p className='text-sm text-slate-500 dark:text-slate-400'>Manage and view all registered voters.</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6'>
        <StatCard icon={<Users className='w-6 h-6 text-blue-600' />} label="Registered Voters" count={total} />
        <StatCard icon={<CheckCircle className='w-6 h-6 text-green-600' />} label="Voted" count={voted} />
        <StatCard icon={<XCircle className='w-6 h-6 text-red-600' />} label="Not Voted" count={notVoted} />
      </div>

      {/* Search */}
      <div className='w-full max-w-md mb-6 mx-auto sm:mx-0'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Search voters...'
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
          />
        </div>
      </div>

      {/* Title & Button */}
      <div className='flex flex-col sm:flex-row items-center justify-between mb-4 gap-3'>
        <h3 className='text-lg font-semibold text-slate-800 dark:text-white'>Voter List</h3>
        <button
          className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-md transition w-full sm:w-auto'
          onClick={openAddPopup}
        >
          + Add Voter
        </button>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className='hidden sm:table min-w-full border border-slate-200 dark:border-slate-700 rounded-lg'>
          <thead className='bg-slate-200 dark:bg-slate-800'>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Voter ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200 dark:divide-slate-700 text-sm bg-white dark:bg-slate-900'>
            {mockVoters.map((voter, idx) => (
              <tr key={idx}>
                <td className='px-4 py-3'>{voter.name}</td>
                <td className='px-4 py-3 break-all'>{voter.email}</td>
                <td className='px-4 py-3'>{voter.voterId}</td>
                <td className='px-4 py-3'>
                  <span className={`inline-block ${voter.status === 'Voted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-semibold px-2 py-1 rounded-full`}>
                    {voter.status}
                  </span>
                </td>
                <td className='px-4 py-3 flex space-x-2'>
                  <button onClick={() => openEditPopup(voter)} className='text-blue-600 hover:text-blue-800'>
                    <Pencil className='w-4 h-4' />
                  </button>
                  <button onClick={() => openDeletePopup(voter)} className='text-red-600 hover:text-red-800'>
                    <Trash2 className='w-4 h-4' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Popup */}
      {showAddPopup && (
        <VoterPopup
          title="Add New Voter"
          formData={formData}
          handleChange={handleFormChange}
          onClose={closePopups}
          onSubmit={addVoter}
          submitLabel="Add"
          includePassword
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />
      )}

      {/* Edit Popup */}
      {showEditPopup && (
        <VoterPopup
          title="Edit Voter"
          formData={formData}
          handleChange={handleFormChange}
          onClose={closePopups}
          onSubmit={saveEditVoter}
          submitLabel="Save"
        />
      )}

      {/* Delete Popup */}
      {showDeletePopup && (
        <Popup title="Confirm Delete" onClose={closePopups}>
          <p className="mb-4">Are you sure you want to delete voter <strong>{selectedVoter?.name}</strong>?</p>
          <div className="flex justify-end space-x-2">
            <button onClick={closePopups} className="btn-cancel rounded-lg px-4 py-2 font-semibold transition hover:bg-blue-100">Cancel</button>
            <button onClick={deleteVoter} className="btn-submit rounded-lg px-4 py-2 font-semibold transition hover:bg-blue-700">Delete</button>
          </div>
        </Popup>
      )}
    </div>
  );
}

// Components
function StatCard({ icon, label, count }) {
  return (
    <div className='bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 flex items-center space-x-4 hover:shadow-lg transition'>
      <div className='bg-blue-100 dark:bg-blue-800 p-3 rounded-full'>{icon}</div>
      <div>
        <p className='text-sm text-slate-500 dark:text-slate-400'>{label}</p>
        <h3 className='text-xl font-bold text-slate-800 dark:text-white'>{count}</h3>
      </div>
    </div>
  );
}

function TableHead({ children }) {
  return <th className='px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300'>{children}</th>;
}

function VoterPopup({ title, formData, handleChange, onClose, onSubmit, submitLabel, includePassword, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword }) {
  return (
    <Popup title={title} onClose={onClose}>
      <form
        onSubmit={e => { e.preventDefault(); onSubmit(); }}
        className='space-y-4'
      >
        <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} />
        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />

        {includePassword && (
          <>
            <PasswordField label="Password" name="password" value={formData.password} onChange={handleChange} show={showPassword} toggleShow={() => setShowPassword(prev => !prev)} />
            <PasswordField label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirmPassword} toggleShow={() => setShowConfirmPassword(prev => !prev)} />
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="btn-cancel rounded-lg px-4 py-2 font-semibold transition hover:bg-blue-100">Cancel</button>
          <button type="submit" className="btn-submit rounded-lg px-4 py-2 font-semibold transition hover:bg-blue-700">{submitLabel}</button>
        </div>
      </form>
    </Popup>
  );
}

function PasswordField({ label, name, value, onChange, show, toggleShow }) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className='w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500" onClick={toggleShow}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </span>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} className='w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition' />
    </div>
  );
}

function Popup({ title, children, onClose }) {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full p-6 relative'>
        <h2 className='text-xl font-semibold mb-4 text-slate-800 dark:text-white'>{title}</h2>
        {children}
        <button onClick={onClose} className='absolute top-3 right-3 text-slate-500 hover:text-slate-700'>&times;</button>
      </div>
    </div>
  );
}

// Buttons CSS
const btnStyles = `
.btn-cancel { background: #e0f2fe; color:#2563eb; padding:0.5rem 1rem; border-radius:0.5rem; font-weight:600; cursor:pointer; }
.btn-cancel:hover { background: #bae6fd; }
.btn-submit { background:#2563eb; color:white; padding:0.5rem 1rem; border-radius:0.5rem; font-weight:600; cursor:pointer; }
.btn-submit:hover { background:#1e40af; }
`;

export default Voters;
