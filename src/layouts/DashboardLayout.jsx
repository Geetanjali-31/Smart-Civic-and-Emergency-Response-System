import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Menu,
  X,
  ShieldAlert,
  LayoutDashboard,
  FileWarning,
  Activity,
  Bell,
  List,
  User,
  Map as MapIcon,
  LogOut,
  ArrowLeft,
  Home
} from 'lucide-react';
import logo from '../assets/new-logo.jpeg';

export default function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const fetchUnreadStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await api.getNotifications(token);
          setHasUnread(data.some(n => n.is_unread));
        }
      } catch (err) {
        console.error("Failed to fetch notifications for badge", err);
      }
    };
    fetchUnreadStatus();
  }, [location.pathname]);

  const isAuthority = location.pathname.startsWith('/authority');
  const basePath = isAuthority ? '/authority' : '/citizen';

  const citizenNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
    { name: 'Report Issue', path: '/citizen/report', icon: FileWarning },
    { name: 'Emergency Help', path: '/citizen/emergency', icon: ShieldAlert, highlight: true },
    { name: 'My Complaints', path: '/citizen/complaints', icon: List },
    { name: 'Track Status', path: '/citizen/tracking', icon: Activity },
    { name: 'Notifications', path: '/citizen/notifications', icon: Bell },
  ];

  const authorityNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/authority/dashboard', icon: LayoutDashboard },
    { name: 'Live Requests', path: '/authority/requests', icon: Bell, highlight: true },
    { name: 'Assigned Tasks', path: '/authority/tasks', icon: List },
    { name: 'Map View', path: '/authority/map', icon: MapIcon },
    { name: 'Notifications', path: '/authority/notifications', icon: Bell },
    { name: 'Profile', path: '/authority/profile', icon: User },
  ];

  const navItems = role === 'citizen' ? citizenNav : authorityNav;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950">
          <Link to="/" className="flex items-center space-x-3 text-white">
            <div
              className="h-14 w-14 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden cursor-pointer transition-transform hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                setIsLogoModalOpen(true);
              }}
            >
              <img src={logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">System Portal</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">
            {isAuthority ? 'Authority Mode' : 'Citizen Mode'}
          </p>
          <div className="flex items-center space-x-3 mt-3 bg-slate-800 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">{currentUser?.email || currentUser?.phoneNumber || 'User'}</span>
              <span className="text-xs text-slate-400">{role === 'authority' ? 'Dispatcher' : 'Resident'}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (location.pathname === basePath && link.path === `${basePath}/dashboard`);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-primary-600 text-white font-medium'
                  : link.highlight
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? '' : link.highlight ? 'text-red-400' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>



        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3 text-slate-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative z-20">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-end lg:justify-between items-center">
            <div className="hidden lg:flex items-center space-x-3 text-slate-800 font-semibold text-lg">
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-slate-500 hover:text-slate-900" />
              </button>
              <span>{navItems.find(l => l.path === location.pathname)?.name || 'Dashboard'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to={`${basePath}/notifications`} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </Link>
              <Link to={`${basePath}/profile`} className="hidden sm:flex items-center space-x-3 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-white transition-all">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-primary-100 transition-colors">
                  {currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[150px]">{currentUser?.email || currentUser?.phoneNumber || 'User'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto w-full relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Full Screen Logo Modal */}
      {isLogoModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsLogoModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center animate-in zoom-in duration-200">
            <button
              className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 bg-slate-900/50 rounded-full"
              onClick={() => setIsLogoModalOpen(false)}
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={logo}
              alt="Full Logo"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  );
}
