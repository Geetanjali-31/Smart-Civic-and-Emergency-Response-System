import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, FileWarning, Home, LogIn } from 'lucide-react';
import logo from '../assets/new-logo.jpeg';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Report Issue', path: '/citizen/report', icon: FileWarning },
    { name: 'Emergency', path: '/citizen/emergency', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Navigation */}
      <nav className="bg-primary-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3 group">
                <div 
                  className="h-16 w-16 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-primary-500/20 transition-transform hover:scale-105"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLogoModalOpen(true);
                  }}
                >
                  <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">सेवाSetu</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary-700 text-white font-medium' : 'text-primary-50 hover:bg-primary-500 hover:text-white'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
              <div className="pl-4 ml-2 border-l border-primary-500">
                <div className="flex items-center space-x-2 pl-4 ml-2 border-l border-primary-500">
                  <Link
                    to="/login"
                    className="flex items-center px-4 py-2 text-sm rounded-md font-semibold bg-primary-700 text-white hover:bg-primary-800 transition-colors shadow-sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center px-4 py-2 text-sm rounded-md font-semibold bg-white text-primary-600 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-primary-500 hover:text-white focus:outline-none transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary-600 shadow-inner">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-md text-base transition-colors ${isActive ? 'bg-primary-700 text-white font-medium' : 'text-primary-50 hover:bg-primary-500'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 mt-2 border-t border-primary-500 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full px-3 py-3 rounded-md text-base font-semibold bg-primary-700 text-white hover:bg-primary-800 transition-colors shadow-sm"
                >
                  <LogIn className="h-5 w-5 mr-3" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full px-3 py-3 rounded-md text-base font-semibold bg-white text-primary-600 hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow w-full">
        <div className="animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="h-16 w-16 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden cursor-pointer transition-transform hover:scale-105"
                onClick={() => setIsLogoModalOpen(true)}
              >
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Smart Civic System</span>
            </div>
            <p className="text-sm max-w-xs text-slate-400">
              Empowering citizens and authorities to build safer, smarter communities through rapid response and real-time tracking.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="hover:text-white transition-colors flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-2"></div>About Us</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-2"></div>City Services</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-2"></div>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Emergency Services</h3>
            <p className="text-sm mb-4 text-slate-400">For life-threatening emergencies, call <strong className="text-white">911</strong> immediately.</p>
            <Link to="/citizen/emergency" className="inline-flex items-center text-accent-500 hover:text-accent-400 text-sm font-semibold transition-colors">
              Report Non-Life-Threatening Emergency
              <span className="ml-1 text-lg leading-none">&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Smart Civic & Emergency Response System. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

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
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
