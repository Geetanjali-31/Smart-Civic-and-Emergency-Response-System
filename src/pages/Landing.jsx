import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertTriangle,
  Siren,
  Activity,
  LayoutDashboard,
  Send,
  RefreshCw,
  Wrench,
  BellRing,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/new-logo.jpeg';

export default function Landing() {
  const { currentUser } = useAuth();
  const features = [
    {
      title: 'Real-time Issue Reporting',
      description: 'Report infrastructural problems or non-emergency situations with a few clicks.',
      icon: AlertTriangle,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Emergency Alert System',
      description: 'Trigger immediate alerts for life-threatening or urgent situations needing fast dispatch.',
      icon: Siren,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Live Issue Tracking',
      description: 'Monitor the exact status and historical timeline of your submitted reports.',
      icon: Activity,
      color: 'text-accent-500',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Smart City Dashboard',
      description: 'Comprehensive analytics and geographical overviews for city authorities and citizens.',
      icon: LayoutDashboard,
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Report issue',
      description: 'Submit an issue with details and location.',
      icon: Send
    },
    {
      num: '02',
      title: 'System sends to department',
      description: 'Our smart routing delivers it to the correct authority.',
      icon: RefreshCw
    },
    {
      num: '03',
      title: 'Authorities resolve issue',
      description: 'Action is taken by the respective personnel.',
      icon: Wrench
    },
    {
      num: '04',
      title: 'Citizen receives update',
      description: 'You get notified instantly upon resolution.',
      icon: BellRing
    }
  ];

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-slate-900 to-slate-900 z-0 border-b border-white/5"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-accent-500/10 blur-3xl z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center mt-12 mb-8">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-sm shadow-sm">
            <span className="mr-2 text-lg leading-none">✨</span>
            <span className="text-sm font-medium text-slate-300 tracking-wide">Next-Gen Urban Management</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Smart Civic & <br className="hidden md:block" />
            <span className="drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">Emergency Response System</span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 font-light">
            Report city issues and emergencies instantly.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 relative z-20">
            {currentUser ? (
              <>
                <Link to="/citizen/dashboard" className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center">
                  Go to Citizen Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/authority/dashboard" className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center">
                  <ShieldCheck className="mr-2 w-5 h-5" /> Authority Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center">
                  Enter Citizen Portal <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center">
                  <ShieldCheck className="mr-2 w-5 h-5" /> Authority Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Emergency Actions */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">One-Tap Emergency Assistance</h2>
            <p className="text-slate-600 mt-2">Get immediate help for critical situations</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center relative z-20">

            {/* Hospital / Ambulance */}
            <Link
              to="/citizen/emergency"
              state={{ type: 'medical' }}
              className="flex-1 w-full flex items-center p-6 bg-white rounded-2xl shadow-sm border-2 border-red-100 hover:border-red-500 hover:shadow-lg transition-all group active:scale-95 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-6 shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-red-600 transition-colors">Accident? Call Ambulance</h3>
                <p className="text-slate-600 text-sm">One tap to dial emergency medical services (108) immediately for accidents or severe injuries.</p>
              </div>
            </Link>

            {/* Police / Crime */}
            <Link
              to="/citizen/emergency"
              state={{ type: 'police' }}
              className="flex-1 w-full text-left flex items-center p-6 bg-white rounded-2xl shadow-sm border-2 border-blue-100 hover:border-blue-500 hover:shadow-lg transition-all group active:scale-95"
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-6 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Crime in Progress? Get Police</h3>
                <p className="text-slate-600 text-sm">One tap to silently share your live location and request immediate police presence.</p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Powerful Capabilities</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Everything you need to keep our city functioning smoothly and safely.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className={`w-14 h-14 rounded-xl ${feature.bgColor} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-6 tracking-tight">Ready to make a difference?</h2>
            <p className="text-xl text-slate-500 mb-8 max-w-2xl mx-auto">Join thousands of citizens actively improving their community every day.</p>
            <Link to={currentUser ? (currentUser.role === 'authority' ? '/authority/dashboard' : '/citizen/dashboard') : '/login'} className="inline-flex items-center px-8 py-4 bg-white text-primary-700 hover:bg-slate-50 rounded-xl font-bold text-lg shadow-xl transition-transform hover:-translate-y-1">
              {currentUser ? 'Return to Dashboard' : 'Join the Network'} <ArrowUpRight className="ml-2 w-6 h-6" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-0.5 bg-slate-200 -z-10"></div>

            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-50 shadow-sm flex items-center justify-center mb-6 relative">
                    <Icon className="w-10 h-10 text-primary-600" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center border-2 border-white">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600 max-w-xs">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
