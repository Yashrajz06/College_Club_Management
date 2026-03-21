import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/authSlice';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    studentId: '', department: '', year: '', secretCode: ''
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          studentId: form.studentId || undefined,
          department: form.department || undefined,
          year: form.year || undefined,
          secretCode: form.secretCode || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setCredentials({ user: data.user, token: data.access_token }));
        navigate('/dashboard');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Network error. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">Create an Account</h1>
          <p className="mt-2 text-slate-500">Join your college community on CampusClubs</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" required value={form.name} onChange={set('name')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Riya Sharma" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Student ID</label>
                <input type="text" value={form.studentId} onChange={set('studentId')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. 2022MIT0042" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">College Email</label>
              <input type="email" required value={form.email} onChange={set('email')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="yourname@college.edu" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <select value={form.department} onChange={set('department')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Department</option>
                  <option>Computer Engineering</option>
                  <option>Information Technology</option>
                  <option>Mechanical Engineering</option>
                  <option>Electronics & Telecom</option>
                  <option>Civil Engineering</option>
                  <option>MBA</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
                <select value={form.year} onChange={set('year')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input type="password" required minLength={8} value={form.password} onChange={set('password')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input type="password" required value={form.confirmPassword} onChange={set('confirmPassword')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Repeat password" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Faculty / Admin Registration Code <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input type="password" value={form.secretCode} onChange={set('secretCode')}
                className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-indigo-900 placeholder:text-indigo-300"
                placeholder="Leave blank for Student access" />
            </div>
            <button type="submit" disabled={loading}
              className={`w-full py-4 font-bold text-white rounded-xl shadow-lg transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:-translate-y-1'}`}>
              {loading ? 'Creating Account...' : 'Create My Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? {' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-800">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
