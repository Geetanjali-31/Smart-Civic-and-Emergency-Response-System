import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightLeft, 
  FileWarning, 
  Clock, 
  Loader2,
  Check,
  Search,
  History,
  ListFilter
} from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_DEPARTMENTS } from '../utils/smartRoutingEngine';
import { formatDateTimeDMY } from '../utils/dateFormatter';

export default function ControllerDashboard() {
  const [pendingQueue, setPendingQueue] = useState([]);
  const [processedQueue, setProcessedQueue] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeptMap, setSelectedDeptMap] = useState({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getControllerQueue();
      if (data && typeof data === 'object' && Array.isArray(data.pending)) {
        setPendingQueue(data.pending);
        setProcessedQueue(data.processed || []);
      } else if (Array.isArray(data)) {
        setPendingQueue(data);
        setProcessedQueue([]);
      }
    } catch (e) {
      console.error("Failed to fetch controller queue", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReroute = async (serviceId, currentSuggestedDept) => {
    const targetDept = selectedDeptMap[serviceId] || currentSuggestedDept || 'municipal';

    try {
      await api.rerouteService(serviceId, targetDept, `Verified & routed to ${targetDept.toUpperCase()} Department by Controller`);
      setActionSuccessMsg(`Complaint #${serviceId} successfully verified & routed to ${targetDept.toUpperCase()} Department!`);
      setTimeout(() => setActionSuccessMsg(''), 5000);
      fetchQueue();
    } catch (e) {
      alert("Failed to reroute complaint.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Controller Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 rounded-3xl p-8 text-white mb-8 border border-amber-900/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold text-xs uppercase tracking-widest rounded-full border border-amber-500/30">
              System Role: Controller & Verification Command
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2 flex items-center gap-3">
              <ShieldAlert className="w-9 h-9 text-amber-500" /> Controller Review Queue
            </h1>
            <p className="text-slate-400 text-sm mt-1">Review category mismatches, critical alerts, and re-assign complaints across departments.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-center min-w-[120px]">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block mb-1">Pending Review</span>
              <p className="text-3xl font-extrabold text-amber-400">{pendingQueue.length}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center min-w-[120px]">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block mb-1">Processed</span>
              <p className="text-3xl font-extrabold text-emerald-400">{processedQueue.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold text-sm flex items-center shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-600 shrink-0" />
          {actionSuccessMsg}
        </div>
      )}

      {/* Controller Queue Navigation Tabs */}
      <div className="flex gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-4 h-4" /> Pending Review ({pendingQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> Action History ({processedQueue.length})
        </button>
      </div>

      {/* TAB 1: Pending Review Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 font-bold flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
              Loading Controller Queue...
            </div>
          ) : pendingQueue.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-slate-900">All Queue Items Verified!</h3>
              <p className="text-sm text-slate-500 font-normal">No complaints currently require Controller review. Normal complaints bypass directly to departments!</p>
            </div>
          ) : (
            pendingQueue.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col lg:flex-row justify-between gap-8 hover:shadow-lg transition-all">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      #{item.ticket_id || item.id}
                    </span>
                    {item.is_category_mismatch && (
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Category Mismatch Flagged
                      </span>
                    )}
                    {item.is_fast_tracked && (
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 flex items-center">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Critical Parallel Monitor
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
                    <p className="text-slate-600 text-base mt-1">{item.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-600">
                    <div>
                      <span className="text-slate-400 uppercase tracking-widest font-bold block mb-1">Citizen Selected Category</span>
                      <span className="font-bold text-slate-900 capitalize">{item.category}</span>
                    </div>
                    <div>
                      <span className="text-amber-600 uppercase tracking-widest font-bold block mb-1">Suggested Department</span>
                      <span className="font-bold text-amber-700 capitalize">{(item.suggested_department || item.department || 'municipal').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Re-route Control Panel */}
                <div className="w-full lg:w-80 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Re-Assign Department</label>
                    <select
                      value={selectedDeptMap[item.id] || item.suggested_department || item.department || 'municipal'}
                      onChange={e => setSelectedDeptMap({ ...selectedDeptMap, [item.id]: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 outline-none"
                    >
                      {Object.values(DEFAULT_DEPARTMENTS).map(d => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleReroute(item.id, item.suggested_department || item.department)}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center active:scale-95"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Approve & Route Ticket
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Controller Action History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {processedQueue.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">
              No Controller decisions recorded yet in this session.
            </div>
          ) : (
            processedQueue.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      #{item.ticket_id || item.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {item.controller_action}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-1">{item.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 font-mono">
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Processed: {formatDateTimeDMY(item.controller_action_at)}</span>
                    <span>Assigned Dept: {(item.department || '').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
