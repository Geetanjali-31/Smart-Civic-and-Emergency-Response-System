import React, { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Activity, Lock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { generateComplaintId } from '../utils/complaintIdGenerator';
import { useAuth } from '../context/AuthContext';
import { normalizeDepartment, issueMatchesDepartment, DEPT_LABELS } from '../utils/departmentMatcher';

export default function LiveRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine this authority's dept; admin sees all
  const userDeptKey = useMemo(() => {
    if (!currentUser?.department) return 'all';
    return normalizeDepartment(currentUser.department);
  }, [currentUser]);

  const [selectedDepartment, setSelectedDepartment] = useState(userDeptKey);

  // Sync when auth loads async (fixes initial 'all' on first render)
  useEffect(() => {
    setSelectedDepartment(userDeptKey);
  }, [userDeptKey]);

  const fetchLiveRequests = async () => {
    try {
      const data = await api.getServices();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch live requests", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRequests();
    const interval = setInterval(fetchLiveRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, newStatus) => {
    try {
      await api.updateServiceStatus(id, newStatus);
      fetchLiveRequests();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const activeDept = selectedDepartment === 'All' ? 'all' : selectedDepartment;

  const pendingRequests = requests.filter(r => {
    const isPending = r.status === 'pending' || r.status === 'submitted' || r.status === 'verified';
    if (!isPending) return false;
    return issueMatchesDepartment(r, activeDept);
  });

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <Activity className="w-8 h-8 mr-3 text-red-600 animate-pulse" />
            Live Incoming Requests
          </h1>
          <p className="text-slate-500 mt-1 text-lg">Accept, reject, or resolve incoming tickets in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          {userDeptKey !== 'all' ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-xs shadow-md">
              <Lock className="w-3.5 h-3.5" />
              <span>{DEPT_LABELS[userDeptKey] || userDeptKey.toUpperCase()} View</span>
            </div>
          ) : (
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-700 outline-none cursor-pointer hover:bg-slate-800 transition-all"
            >
              <option value="All">All Departments</option>
              {Object.entries(DEPT_LABELS).filter(([k]) => k !== 'all').map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {isLoading && requests.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">Loading live requests...</div>
        ) : pendingRequests.map((req) => {
          const isEmergency = req.category === 'emergency' || req.type === 'Emergency';
          return (
            <div 
              key={req.id} 
              className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden transition-all ${
                isEmergency 
                  ? 'border-l-red-600 border-y border-r border-red-200' 
                  : 'border-l-amber-500 border-y border-r border-slate-200'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <Link to={`/authority/tasks/${req.id}`} className="flex-1 group block">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        isEmergency ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isEmergency ? <ShieldAlert className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                        {req.category || req.type || 'Civic'}
                      </span>
                      <span className="text-sm font-mono text-slate-500 font-medium group-hover:text-primary-600 transition-colors">{req.ticket_id || generateComplaintId(req.title || req.category, req.id)}</span>
                      <span className="flex items-center text-sm font-semibold text-slate-400">
                        <Clock className="w-4 h-4 mr-1" /> {formatTime(req.created_at)}
                      </span>
                    </div>

                    <h2 className={`text-xl font-bold mb-2 group-hover:text-primary-700 transition-colors ${isEmergency ? 'text-red-900 group-hover:text-red-700' : 'text-slate-900'}`}>
                      {req.title || 'Untitled Request'}
                    </h2>
                    <p className="text-slate-600 mb-4 line-clamp-2">{req.description}</p>
                    
                    {req.location && (
                      <div className="flex items-center text-slate-600 font-medium bg-slate-50 inline-flex px-3 py-1.5 rounded-lg border border-slate-200">
                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                        {req.location}
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col sm:flex-row gap-3 md:shrink-0 mt-4 md:mt-0">
                    <button 
                      onClick={() => handleAction(req.id, 'accepted')}
                      className={`flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 rounded-xl font-bold text-white shadow-sm transition-transform active:scale-95 ${
                        isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Accept
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'completed')}
                      className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-semibold transition-colors"
                    >
                      Complete
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                    >
                      <XCircle className="w-5 h-5 mr-1 sm:mr-0" />
                      <span className="sm:hidden ml-1">Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!isLoading && pendingRequests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900">All Clear!</h3>
            <p className="text-slate-500 mt-2">There are currently no live requests pending your review.</p>
          </div>
        )}
      </div>

    </div>
  );
}
