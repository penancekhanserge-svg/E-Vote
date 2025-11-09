import React, { useEffect, useState } from 'react';
import { User, MapPin, BarChart2, Edit3, Trash2, X, UploadCloud, Printer } from 'lucide-react';

export default function CandidateSummaryPage() {
  const [candidates, setCandidates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', region: '', party: '', photo: '', electionType: '' });
  const [editIndex, setEditIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

  const cameroonRegions = ['Adamawa','Centre','East','Far North','Littoral','North','Northwest','South','Southwest','West'];
  const electionTypes = ['Presidential','Parliamentary','Local','Senatorial'];

  useEffect(() => {
    const saved = localStorage.getItem('candidates');
    if (saved) setCandidates(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('candidates', JSON.stringify(candidates));
  }, [candidates]);

  const openModal = (candidate = null, index = null) => {
    setEditIndex(index);
    setFormData(candidate || { name: '', email: '', region: '', party: '', photo: '', electionType: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', email: '', region: '', party: '', photo: '', electionType: '' });
    setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = [...candidates];
    if (editIndex !== null) updated[editIndex] = { ...updated[editIndex], ...formData, photo: formData.photo || updated[editIndex].photo };
    else updated.push({ ...formData, votes: 0 });
    setCandidates(updated);
    closeModal();
  };

  const handleDelete = (index) => {
    setCandidates(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
    reader.readAsDataURL(file);
  };

  const totalCandidates = candidates.length;
  const uniqueRegionsCount = [...new Set(candidates.map(c => c.region))].length;
  const totalVotes = candidates.reduce((acc, c) => acc + (c.votes || 0), 0);

  const printList = () => {
    const printContents = document.getElementById('printable-table').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `<h1 style="text-align:center; margin-bottom: 20px;">Registered Candidates</h1>${printContents}`;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  function SummaryCard({ icon, label, count, bgColor, hoverBgColor }) {
    return (
      <div className={`flex items-center space-x-4 p-6 rounded-2xl shadow-md transition ${bgColor} ${hoverBgColor}`}>
        <div className="p-3 rounded-full bg-white shadow">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{count}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-10 pb-6 max-w-7xl mx-auto print:p-0">
      {/* Header */}
      <header className="mb-4 print:hidden text-center sm:text-left">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Candidates Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Monitor total candidates, regions represented, and total votes.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-4 print:hidden">
        <SummaryCard 
          icon={<User className="w-7 h-7 text-purple-600" />} 
          label="Total Candidates" 
          count={totalCandidates} 
          bgColor="bg-white" 
          hoverBgColor="hover:shadow-lg"
        />
        <SummaryCard 
          icon={<MapPin className="w-7 h-7 text-teal-600" />} 
          label="Regions with Candidates" 
          count={uniqueRegionsCount} 
          bgColor="bg-white" 
          hoverBgColor="hover:shadow-lg"
        />
        <SummaryCard 
          icon={<BarChart2 className="w-7 h-7 text-indigo-600" />} 
          label="Total Votes" 
          count={totalVotes} 
          bgColor="bg-white" 
          hoverBgColor="hover:shadow-lg"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-3 print:hidden">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Candidates List</h2>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => openModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow transition"
          >
            Register Candidate
          </button>
          <button 
            onClick={printList} 
            className="flex items-center gap-2 bg-white text-blue-600 font-medium py-2 px-4 rounded-lg shadow border border-gray-300 hover:bg-blue-600 hover:text-white transition"
          >
            <Printer className="w-5 h-5" /> Print List
          </button>
        </div>
      </div>

      {/* Table */}
      <div id="printable-table" className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Desktop Table */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden sm:table">
          <thead className="bg-indigo-100 dark:bg-indigo-900">
            <tr>{['Profile','Full Name','Email','Party','Region','Election Type','Votes','Actions'].map((h,i)=><th key={i} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {candidates.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">{c.photo ? <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center"><User className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>}</td>
                <td className="px-6 py-4">{c.name}</td>
                <td className="px-6 py-4 break-all">{c.email}</td>
                <td className="px-6 py-4">{c.party}</td>
                <td className="px-6 py-4">{c.region}</td>
                <td className="px-6 py-4">{c.electionType}</td>
                <td className="px-6 py-4">{c.votes}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={()=>openModal(c,idx)} className="text-indigo-600 hover:text-indigo-800"><Edit3 className="w-5 h-5"/></button>
                  <button onClick={()=>setConfirmDeleteIndex(idx)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-4 p-2">
          {candidates.map((c, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
              <div className="flex items-center gap-3 mb-2">
                {c.photo ? <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center"><User className="w-5 h-5 text-gray-500 dark:text-gray-400"/></div>}
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 dark:text-white">{c.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 break-all">{c.email}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Party: {c.party}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Region: {c.region}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Election Type: {c.electionType}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Votes: {c.votes}</p>
              <div className="flex gap-3 mt-2">
                <button onClick={()=>openModal(c,idx)} className="text-indigo-600 hover:text-indigo-800"><Edit3 className="w-5 h-5"/></button>
                <button onClick={()=>setConfirmDeleteIndex(idx)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-500 hover:text-red-500"><X className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{editIndex !== null ? 'Edit Candidate' : 'Register Candidate'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Full Name" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"/>
              <input type="email" placeholder="Email" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"/>
              <input type="text" placeholder="Party" value={formData.party} onChange={(e)=>setFormData({...formData,party:e.target.value})} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"/>
              <select value={formData.region} onChange={(e)=>setFormData({...formData,region:e.target.value})} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"><option value="">Select Region</option>{cameroonRegions.map((r,i)=><option key={i} value={r}>{r}</option>)}</select>
              <select value={formData.electionType} onChange={(e)=>setFormData({...formData,electionType:e.target.value})} required className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"><option value="">Select Election Type</option>{electionTypes.map((t,i)=><option key={i} value={t}>{t}</option>)}</select>
              <label className="flex items-center gap-2 text-indigo-600 cursor-pointer"><UploadCloud className="w-5 h-5"/> Upload Photo <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/></label>
              {formData.photo && <img src={formData.photo} alt="Preview" className="w-16 h-16 rounded-full object-cover"/>}
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">{editIndex!==null?'Update':'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDeleteIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm relative">
            <button onClick={()=>setConfirmDeleteIndex(null)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500"><X className="w-5 h-5"/></button>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete candidate <strong>{candidates[confirmDeleteIndex]?.name}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={()=>setConfirmDeleteIndex(null)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">Cancel</button>
              <button onClick={()=>{handleDelete(confirmDeleteIndex); setConfirmDeleteIndex(null);}} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
