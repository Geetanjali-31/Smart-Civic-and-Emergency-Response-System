import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Activity, 
  Loader2, 
  ArrowUpRight,
  ShieldAlert,
  FileCheck,
  Upload,
  Check,
  Search,
  Filter
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { DEFAULT_DEPARTMENTS } from '../utils/smartRoutingEngine';
import { getSlaStatus } from '../utils/slaEngine';
import { formatDateDMY } from '../utils/dateFormatter';

export default function DepartmentDashboard() {
  const { deptCode } = useParams();
  const activeDeptCode = (deptCode || 'municipal').toLowerCase();
  const deptInfo = DEFAULT_DEPARTMENTS[activeDeptCode] || DEFAULT_DEPARTMENTS['municipal'];

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchDepartmentData = async () => {
    setIsLoading(true);
    try {
      const all = await api.getServices();
      const deptFiltered = (all || []).filter(s => (s.department || 'municipal').toLowerCase() === activeDeptCode);
      setServices(deptFiltered);
    } catch (e) {
      console.error("Failed to fetch department services", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [activeDeptCode]);

  const pendingCount = services.filter(s => ['submitted', 'verified', 'assigned'].includes((s.status || '').toLowerCase())).length;
  const inProgressCount = services.filter(s => ['accepted', 'in_progress'].includes((s.status || '').toLowerCase())).length;
  const resolvedCount = services.filter(s => ['resolved', 'feedback_received', 'closed'].includes((s.status || '').toLowerCase())).length;

  const filteredServices = services.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || (s.title || '').toLowerCase().includes(term) || (s.ticket_id || '').toLowerCase().includes(term) || (s.location || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || (s.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Department Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white mb-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-primary-500/20 text-primary-300 font-mono font-bold text-xs uppercase tracking-widest rounded-full border border-primary-500/30">
                Department Code: {deptInfo.code.toUpperCase()}
              </span>
              <span className="flex items-center text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                Smart Routing Sync Active
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">{deptInfo.name}</h1>
            <p className="text-slate-400 text-sm mt-1">Automated dispatch, SLA tracking, and officer resolution portal.</p>
          </div>

          {/* Department Switcher Tabs */}
          <div className="flex flex-wrap gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            {Object.values(DEFAULT_DEPARTMENTS).map(d => (
              <Link
                key={d.code}
                to={`/department/${d.code}`}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  activeDeptCode === d.code 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d.code.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Routed</p>
          <p className="text-3xl font-extrabold text-slate-900">{services.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Assignment</p>
          <p className="text-3xl font-extrabold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">In Progress</p>
          <p className="text-3xl font-extrabold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Resolved</p>
          <p className="text-3xl font-extrabold text-emerald-600">{resolvedCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket ID, title, or location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'submitted', 'assigned', 'accepted', 'in_progress', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === status 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-bold flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
            Loading Department Workload...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">
            No complaints found for this department filter.
          </div>
        ) : (
          filteredServices.map(service => {
            const sla = getSlaStatus(service);
            return (
              <div key={service.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100">
                      #{service.ticket_id || service.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      service.priority === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Priority: {service.priority || 'Medium'}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      sla.isBreached ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      SLA: {sla.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{service.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-1">{service.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {service.location}</span>
                    <span className="flex items-center font-mono"><Clock className="w-3.5 h-3.5 mr-1" /> {formatDateDMY(service.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                  <Link
                    to={`/authority/tasks/${service.id}`}
                    className="flex-1 md:flex-initial px-5 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm text-center flex items-center justify-center"
                  >
                    Manage & Resolve <ArrowUpRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
