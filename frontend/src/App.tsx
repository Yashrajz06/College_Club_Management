import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { clearCredentials } from './store/authSlice';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import PresidentDashboard from './PresidentDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import SponsorCRM from './SponsorCRM';
import AIPosterCreator from './AIPosterCreator';
import Home from './Home';
import CreateClub from './CreateClub';
import MemberDashboard from './MemberDashboard';
import EventDetails from './EventDetails';
import AttendanceTracker from './AttendanceTracker';
import LedgerPage from './LedgerPage';
import PhotoGallery from './PhotoGallery';
import TaskBoard from './TaskBoard';
import { ToastContainer } from './notifications';
import { Link } from 'react-router-dom';
import CreateEvent from './CreateEvent';
import PublishEvents from './PublishEvents';
import SetPassword from './SetPassword';
import AdminCoordinators from './AdminCoordinators';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <ToastContainer />
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              CampusClubs
            </Link>
            <nav className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3 flex-wrap">
                  <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/create-club" className="text-sm font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                    + Start a Club
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-800">Admin</Link>
                  )}
                  {(user?.role === 'PRESIDENT' || user?.role === 'VP') && (
                    <div className="flex items-center space-x-1 sm:space-x-3">
                      <Link to="/manage-club" className="text-sm font-medium text-slate-700 hover:text-blue-600 px-2 py-1 transition-colors">Manage Club</Link>
                      
                      {/* Events Dropdown */}
                      <div className="relative group">
                        <button className="text-sm font-medium text-slate-700 hover:text-purple-600 px-2 py-1 flex items-center gap-1 transition-colors">
                          Events ▾
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
                          <Link to="/create-event" className="block px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700">Create Event</Link>
                          <Link to="/publish-events" className="block px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">Publish Events</Link>
                          <Link to="/attendance" className="block px-4 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-700">Attendance</Link>
                          <Link to="/gallery" className="block px-4 py-2 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700">Photo Gallery</Link>
                        </div>
                      </div>

                      {/* Tools Dropdown */}
                      <div className="relative group">
                        <button className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-2 py-1 flex items-center gap-1 transition-colors">
                          Tools ▾
                        </button>
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1 z-50">
                          <Link to="/taskboard" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Task Board</Link>
                          <Link to="/ledger" className="block px-4 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">Financial Ledger</Link>
                          <Link to="/finances" className="block px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700">Sponsor CRM</Link>
                          <div className="border-t border-slate-100 my-1"></div>
                          <Link to="/studio" className="block px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 flex items-center gap-2"><span>✨</span> AI Studio</Link>
                        </div>
                      </div>
                    </div>
                  )}
                  {user?.role === 'COORDINATOR' && (
                    <Link to="/coordinator" className="text-sm font-medium text-blue-600 hover:text-blue-800">Review Events</Link>
                  )}
                  <span className="text-sm font-medium text-slate-600 hidden md:inline">
                    {user?.name} <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full ml-1">{user?.role}</span>
                  </span>
                  <button onClick={handleLogout} className="text-sm font-medium text-rose-500 hover:text-rose-700 transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign In</Link>
                  <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg rounded-lg transition-all">
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<MemberDashboard />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/create-club" element={<CreateClub />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/coordinators" element={<AdminCoordinators />} />
            <Route path="/manage-club" element={<PresidentDashboard />} />
            <Route path="/coordinator" element={<CoordinatorDashboard />} />
            <Route path="/finances" element={<SponsorCRM />} />
            <Route path="/studio" element={<AIPosterCreator />} />
            <Route path="/attendance" element={<AttendanceTracker />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/gallery" element={<PhotoGallery />} />
            <Route path="/taskboard" element={<TaskBoard />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/publish-events" element={<PublishEvents />} />
            <Route path="/set-password" element={<SetPassword />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-100 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} CampusClubs — All Rights Reserved
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
