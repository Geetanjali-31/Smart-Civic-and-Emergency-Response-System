import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Siren, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDateTimeDMY } from '../utils/dateFormatter';

import { normalizeDepartment, issueMatchesDepartment, DEPT_LABELS } from '../utils/departmentMatcher';

export default function AuthorityDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    emergencies: 0,
    pendingCivic: 0,
    myTasks: 0
  });
  const [priorityAlerts, setPriorityAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const userDeptKey = normalizeDepartment(currentUser?.department);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const allServices = await api.getServices(token);
        const myAssigned = await api.getAssignedTasks(token);

        // Filter services for this department (or all for admin)
        const deptServices = allServices.filter(s => issueMatchesDepartment(s, userDeptKey));

        const unresolvedCivic = deptServices.filter(s => s.category !== 'emergency' && !['resolved', 'completed', 'closed'].includes((s.status || '').toLowerCase())).length;

        setStats({
          total: deptServices.length,
          emergencies: deptServices.filter(s => s.category === 'emergency' && !['resolved', 'completed', 'closed'].includes((s.status || '').toLowerCase())).length,
          pendingCivic: deptServices.filter(s => s.category !== 'emergency' && (s.status || '').toLowerCase() === 'submitted').length,
          unresolvedCivic: unresolvedCivic,
          myTasks: myAssigned.length
        });

        // Get top 2 pending emergencies as priority alerts for this department
        const alerts = deptServices
          .filter(s => s.category === 'emergency' && (s.status === 'pending' || s.status === 'submitted' || s.status === 'assigned'))
          .slice(0, 2);
        setPriorityAlerts(alerts);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [userDeptKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight tracking-tight">Authority Dispatch Center</h1>
          <p className="text-slate-500 mt-1 text-lg">Welcome, <span className="font-bold text-slate-700">{currentUser?.username || currentUser?.email?.split('@')[0] || 'Officer'}</span>{currentUser?.department && currentUser.department !== 'all' ? ` — ${currentUser.department.charAt(0).toUpperCase() + currentUser.department.slice(1)} Department` : ' — Admin View'}.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/authority/tasks" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> My Assigned Tasks ({stats.myTasks})
          </Link>
          <Link to="/authority/requests" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center">
            <Activity className="w-5 h-5 mr-2" /> Live Tracker
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Requests (24h)</p>
              <p className="text-4xl font-extrabold text-slate-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 mt-4 flex items-center">
            <TrendingUpIcon className="w-4 h-4 mr-1" /> {stats.total > 0 ? 'Live data active' : 'No data yet'}
          </p>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border-2 border-red-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Active Emergencies</p>
              <p className="text-4xl font-extrabold text-red-700">{stats.emergencies}</p>
            </div>
            <div className="w-12 h-12 bg-red-100/80 text-red-600 rounded-xl flex items-center justify-center animate-pulse">
              <Siren className="w-6 h-6" />
            </div>
          </div>
          <Link to="/authority/requests" className="text-sm font-bold text-red-700 mt-4 flex items-center hover:text-red-800">
            View priority dispatch <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Civic Issues</p>
              <p className="text-4xl font-extrabold text-slate-900">{stats.pendingCivic}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-amber-600 mt-4 flex items-center">
            <Clock className="w-4 h-4 mr-1" /> {stats.pendingCivic} require assignment
          </p>
        </div>
      </div>

      {/* Priority Alerts Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
          Priority Alerts Requires Immediate Action
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {priorityAlerts.length > 0 ? priorityAlerts.map(alert => (
            <div key={alert.id} className="bg-white rounded-2xl shadow-md border-l-4 border-l-red-600 border-y border-r border-slate-200 overflow-hidden relative group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 p-4">
                 <span className="animate-ping absolute right-4 top-4 inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-2 text-red-700 font-bold tracking-wider text-xs uppercase mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Priority {alert.category}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 pr-8">{alert.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{alert.description}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-600 mb-6 space-y-2 sm:space-y-0 sm:space-x-4 font-medium">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-slate-400" />{alert.location}</span>
                  <span className="flex items-center font-mono"><Clock className="w-4 h-4 mr-1.5 text-slate-400" />{formatDateTimeDMY(alert.created_at)}</span>
                </div>

                <div className="flex gap-3">
                  <Link to={`/authority/tasks/${alert.id}`} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold flex justify-center items-center transition-colors active:scale-95 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> View Emergency
                  </Link>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold">
              No immediate priority alerts found. System normal.
            </div>
          )}
        </div>
      </div>

      {/* System Status / Quick Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg">
           <h3 className="text-lg font-bold mb-4 flex items-center">
             <Activity className="w-5 h-5 mr-2 text-emerald-400" /> System Metrics
           </h3>
           <div className="space-y-4">
             <div className="flex justify-between items-end border-b border-slate-800 pb-2">
               <span className="text-slate-400 font-medium">Total Civic Complaints</span>
               <span className="text-2xl font-bold text-white">{stats.total} <span className="text-base text-slate-500 font-normal">reports</span></span>
             </div>
             <div className="flex justify-between items-end border-b border-slate-800 pb-2">
               <span className="text-slate-400 font-medium">Active Emergencies</span>
               <span className="text-2xl font-bold text-white">{stats.emergencies} <span className="text-base text-slate-500 font-normal">open</span></span>
             </div>
             <div className="flex justify-between items-end pb-2">
               <span className="text-slate-400 font-medium">Unresolved Civic Tickets</span>
               <span className="text-2xl font-bold text-white">{stats.unresolvedCivic}</span>
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <MapPin className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">City-Wide Interactive Map</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Access the real-time geographic distribution of all incidents to optimize unit placement.</p>
          <Link to="/authority/map" className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors w-full sm:w-auto border border-slate-200 shadow-sm">
            Open Map View
          </Link>
        </div>
      </div>

    </div>
  );
}

// Simple icon component for trend line
function TrendingUpIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
