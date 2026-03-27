import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiFetch } from './lib/api';
import type { RootState } from './store';

export default function CreateClub() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [vpEmailOrId, setVpEmailOrId] = useState('');
  const [coordinatorEmailOrId, setCoordinatorEmailOrId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/club/request', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          category,
          vpEmailOrId,
          coordinatorEmailOrId,
        }),
      });
      alert(
        'Club request submitted successfully. Admin approval will trigger the President entry token mint.',
      );
      navigate('/');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">
          Start a New Club
        </h2>
        <p className="mt-2 text-slate-500">
          Submit a college-scoped request with your founding team. Once approved,
          leadership roles and token sync hooks are applied automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Club Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="e.g. AI & Robotics Society"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="Technology">Technology & Engineering</option>
            <option value="Arts">Arts & Culture</option>
            <option value="Sports">Sports & Wellness</option>
            <option value="Academic">Academic & Research</option>
            <option value="Social">Social Impact</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Proposed Vice President (email or student ID)
            </label>
            <input
              type="text"
              required
              value={vpEmailOrId}
              onChange={(e) => setVpEmailOrId(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. vp@college.edu or 2022MIT0042"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Proposed Faculty Coordinator (email or student ID)
            </label>
            <input
              type="text"
              required
              value={coordinatorEmailOrId}
              onChange={(e) => setCoordinatorEmailOrId(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. faculty@college.edu"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Detailed Vision & Description
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            placeholder="Describe your club mission, event ideas, and why it adds value to the campus."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 font-bold text-white rounded-xl shadow-lg transition-all ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-1'
          }`}
        >
          {loading ? 'Submitting Proposal...' : 'Submit Club Proposal'}
        </button>
      </form>
    </div>
  );
}
