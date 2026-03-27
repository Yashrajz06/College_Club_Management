import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { clearCredentials } from './store/authSlice';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import PresidentDashboard from './PresidentDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import SponsorCRM from './SponsorCRM';
import AIStudio from './AIStudio';
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
import { useEffect } from 'react';
import { reconnectPeraWallet } from './lib/pera';
import { CollegeSwitcher } from './CollegeSwitcher';
import Profile from './Profile';
import Governance from './Governance';
import TreasuryExplorer from './TreasuryExplorer';
import MyTokens from './MyTokens';
import AnalyticsDashboard from './AnalyticsDashboard';
import PublicVerifyAsset from './PublicVerifyAsset';
import PublicVerifyToken from './PublicVerifyToken';
import { ThemeProvider } from './ThemeProvider';
import { getDefaultRouteForRole, type AppRole } from './lib/routing';

type GuardProps = {
  children: ReactElement;
  allowedRoles?: AppRole[];
};

function ProtectedRoute({ children, allowedRoles }: GuardProps) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as AppRole)) {
    return <Navigate to={getDefaultRouteForRole(user.role as AppRole)} replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role as AppRole)} replace />;
  }

  return children;
}

function DashboardRoute() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'COORDINATOR':
      return <CoordinatorDashboard />;
    case 'PRESIDENT':
    case 'VP':
      return <PresidentDashboard />;
    case 'MEMBER':
    case 'GUEST':
    default:
      return <MemberDashboard />;
  }
}

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    reconnectPeraWallet();
  }, []);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
          <ToastContainer />
          <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600" style={{ color: 'var(--brand-primary)' }}>
                  CampusClubs
                </Link>
                <CollegeSwitcher />
              </div>
              <nav className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3 flex-wrap">
                    <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/analytics" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                      <span>📊</span> Analytics
                    </Link>
                    <Link to="/my-tokens" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
                      <span>🪙</span> My Tokens
                    </Link>
                    <Link to="/create-club" className="text-sm font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)', color: 'var(--brand-primary)' }}>
                      + Start a Club
                    </Link>
                    <Link to="/governance" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                      Governance
                    </Link>
                    <Link to="/treasury" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
                      Treasury
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
                            <Link to="/treasury" className="block px-4 py-2 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700">Treasury Explorer</Link>
                            <Link to="/attendance" className="block px-4 py-2 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700">Attendance PoP</Link>
                            <Link to="/sponsors" className="block px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700">Sponsor CRM</Link>
                            <div className="border-t border-slate-100 my-1"></div>
                            <Link to="/studio" className="block px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 flex items-center gap-2"><span>✨</span> AI Studio</Link>
                          </div>
                        </div>
                      </div>
                    )}
                    {user?.role === 'COORDINATOR' && (
                      <Link to="/coordinator" className="text-sm font-medium text-blue-600 hover:text-blue-800">Review Events</Link>
                    )}
                    <Link to="/profile" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                      {user?.name}
                    </Link>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{user?.role}</span>
                    <button onClick={handleLogout} className="text-sm font-medium text-rose-500 hover:text-rose-700 transition-colors">
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign In</Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg rounded-lg transition-all" style={{ backgroundImage: 'linear-gradient(to right, var(--brand-primary), #4338ca)' }}>
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
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route
                path="/my-tokens"
                element={
                  <ProtectedRoute>
                    <MyTokens />
                  </ProtectedRoute>
                }
              />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route
                path="/create-club"
                element={
                  <ProtectedRoute allowedRoles={['MEMBER', 'PRESIDENT', 'VP']}>
                    <CreateClub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/coordinators"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminCoordinators />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-club"
                element={
                  <ProtectedRoute allowedRoles={['PRESIDENT', 'VP']}>
                    <PresidentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator"
                element={
                  <ProtectedRoute allowedRoles={['COORDINATOR']}>
                    <CoordinatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finances"
                element={
                  <ProtectedRoute allowedRoles={['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN']}>
                    <SponsorCRM />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studio"
                element={
                  <ProtectedRoute>
                    <AIStudio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute allowedRoles={['PRESIDENT', 'VP', 'COORDINATOR']}>
                    <AttendanceTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ledger"
                element={
                  <ProtectedRoute allowedRoles={['PRESIDENT', 'VP', 'COORDINATOR', 'ADMIN']}>
                    <LedgerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gallery"
                element={
                  <ProtectedRoute>
                    <PhotoGallery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/taskboard"
                element={
                  <ProtectedRoute>
                    <TaskBoard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-event"
                element={
                  <ProtectedRoute allowedRoles={['PRESIDENT', 'VP']}>
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route path="/publish-events" element={<PublishEvents />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/governance"
                element={
                  <ProtectedRoute>
                    <Governance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/treasury"
                element={
                  <ProtectedRoute>
                    <TreasuryExplorer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/verify/:assetId" element={<PublicVerifyAsset />} />
              <Route path="/verify/token/:assetId" element={<PublicVerifyToken />} />
            </Routes>
          </main>

          <footer className="bg-white border-t border-slate-100 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
              © {new Date().getFullYear()} CampusClubs — All Rights Reserved
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
