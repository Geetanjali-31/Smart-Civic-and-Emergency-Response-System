import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MapPin, Calendar, Clock, ArrowUpRight, CheckCircle2, AlertCircle, Loader2, List, Siren, Users, Activity, Info, Trash2, Building2, Lock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generateComplaintId } from '../utils/complaintIdGenerator';
import { formatDateDMY } from '../utils/dateFormatter';
import { normalizeDepartment, issueMatchesDepartment, DEPT_LABELS } from '../utils/departmentMatcher';

export default function IssueTracking() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthority = location.pathname.startsWith('/authority');
  const basePath = isAuthority ? '/authority/tasks' : '/citizen/tracking';

  // Derive the authority's department from their logged-in profile
  const userDeptKey = useMemo(() => {
    if (!isAuthority || !currentUser?.department) return 'all';
    return normalizeDepartment(currentUser.department);
  }, [isAuthority, currentUser]);

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all complaints and start lodging afresh?")) {
      await api.clearAllServices();
      setIssues([]);
    }
  };
  
  // Determine initial tab based on route
  const getInitialTab = () => {
    if (location.pathname.includes('complaints') || location.pathname.includes('tasks')) return 'my';
    return 'community';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [issues, setIssues] = useState([]);

  // Update tab if location changes (e.g. clicking different sidebar links)
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    async function fetchIssues() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        let data;
        if (activeTab === 'my') {
          data = isAuthority 
            ? await api.getAssignedTasks(token) 
            : await api.getMyServices(token);
        } else {
          data = await api.getServices(token);
        }
        setIssues(data || []);
      } catch (error) {
        console.error("Failed to fetch issues:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIssues();
  }, [activeTab, location.pathname]);

  // Default to user's own department; admin ('all') sees everything
  // useEffect keeps it in sync when auth loads async
  const [departmentFilter, setDepartmentFilter] = useState(userDeptKey);
  useEffect(() => {
    setDepartmentFilter(userDeptKey);
  }, [userDeptKey]);

  const filteredIssues = useMemo(() => {
    return (issues || []).filter(issue => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
                           (issue.title || '').toLowerCase().includes(searchLower) || 
                           (issue.id || '').toString().includes(searchLower) ||
                           (issue.ticket_id || '').toLowerCase().includes(searchLower) ||
                           (issue.category || '').toLowerCase().includes(searchLower) ||
                           (issue.sub_category || '').toLowerCase().includes(searchLower) ||
                           (issue.location || '').toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'All Statuses' || (issue.status || '').toLowerCase() === statusFilter.toLowerCase();
      
      const activeDept = departmentFilter === 'All' ? 'all' : departmentFilter;
      const matchesDept = issueMatchesDepartment(issue, activeDept);

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [issues, searchTerm, statusFilter, departmentFilter]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'completed': 
      case 'resolved': return (
        <span className="flex items-center bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
        </span>
      );
      case 'accepted':
      case 'in progress': return (
        <span className="flex items-center bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-100 shadow-sm">
          <Clock className="w-3 h-3 mr-1" /> In Progress
        </span>
      );
      case 'pending': return (
        <span className="flex items-center bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
          <AlertCircle className="w-3 h-3 mr-1" /> Pending
        </span>
      );
      default: return (
        <span className="flex items-center bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-100">
          {status}
        </span>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header Section */}
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
          {activeTab === 'my' 
            ? (isAuthority ? 'Assigned Tasks' : 'My Incident Reports') 
            : (isAuthority ? 'All Community Reports' : 'Community Issue Tracker')}
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl font-medium">
          {activeTab === 'my' 
            ? (isAuthority ? 'Manage and track tasks specifically assigned to you for resolution.' : 'Access and manage the status of all issues you have reported to the authorities.') 
            : (isAuthority ? 'Browse the global feed of all community reports for full context.' : 'Browse and track the status of community-reported issues. Your transparency into civic progress.')}
        </p>
      </div>

      {/* Tab Switcher & Clear Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm">
          <button
            onClick={() => navigate(isAuthority ? '/authority/tasks' : '/citizen/complaints')}
            className={`flex items-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'my' 
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            {isAuthority ? 'Assigned Tasks' : 'My Complaints'}
          </button>
          <button
            onClick={() => navigate(isAuthority ? '/authority/reports' : '/citizen/tracking')}
            className={`flex items-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'community' 
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            {isAuthority ? 'All Reports' : 'Track Status'}
          </button>
        </div>

        {issues.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
            title="Clear all existing complaints and start afresh"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear All Complaints
          </button>
        )}
      </div>

      {/* Glassmorphic Search and Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 mb-8 flex flex-col md:flex-row gap-4 ring-1 ring-slate-200/50">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500" />
          <input 
            type="text" 
            placeholder="Search by ID or keyword..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Department Filter - Locked to user's own dept; admin can switch */}
          {isAuthority && userDeptKey !== 'all' ? (
            <div className="flex items-center gap-2 px-4 py-3.5 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-md">
              <Lock className="w-4 h-4" />
              <span>{DEPT_LABELS[userDeptKey] || userDeptKey.toUpperCase()} Only</span>
            </div>
          ) : (
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="appearance-none bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-10 py-4 text-slate-700 font-bold outline-none focus:bg-white focus:border-primary-500 transition-all min-w-[200px]"
              >
                <option value="all">All Departments</option>
                {Object.entries(DEPT_LABELS).filter(([k]) => k !== 'all').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-10 py-4 text-slate-700 font-bold outline-none focus:bg-white focus:border-primary-500 transition-all min-w-[180px]"
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issue Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          [1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-3xl border border-slate-100 p-8 flex gap-6 animate-pulse">
               <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
               <div className="flex-1 space-y-4">
                 <div className="h-4 bg-slate-200 w-24 rounded-full"></div>
                 <div className="h-8 bg-slate-200 w-3/4 rounded-xl"></div>
                 <div className="h-4 bg-slate-200 w-1/2 rounded-full"></div>
               </div>
            </div>
          ))
        ) : filteredIssues.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Info className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No matching issues found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <div key={issue.id} className="group relative bg-white rounded-3xl border border-slate-200/60 p-1 hover:border-primary-400/50 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
                
                {/* Visual Category Icon */}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${
                  issue.category === 'emergency' ? 'bg-red-50 text-red-500 shadow-inner' : 'bg-indigo-50 text-indigo-500 shadow-inner'
                }`}>
                  <div className="relative">
                    {issue.category === 'emergency' ? <Siren className="w-10 h-10" /> : <MapPin className="w-10 h-10" />}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center p-0.5">
                      <div className={`w-full h-full rounded-full ${issue.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="flex-grow space-y-3 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 font-mono">
                      #{issue.ticket_id || generateComplaintId(issue.sub_category || issue.category || issue.title, issue.id)}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                      issue.category === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {issue.category}
                    </span>
                    {getStatusBadge(issue.status)}
                  </div>
                  
                  <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight">
                    <Link to={`${basePath}/${issue.id}`}>{issue.title}</Link>
                  </h3>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-slate-500 font-medium text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-slate-300" />
                      {issue.location}
                    </div>
                    <div className="flex items-center font-mono text-xs">
                      <Calendar className="w-4 h-4 mr-2 text-slate-300" />
                      {formatDateDMY(issue.created_at || Date.now())}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto shrink-0">
                  <Link 
                    to={`${basePath}/${issue.id}`} 
                    className="flex-1 text-center px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center"
                  >
                    View Status <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
              
              {/* Decorative progress bar at bottom of card */}
              <div className="absolute bottom-0 left-0 h-1 bg-primary-500 transition-all duration-700 w-0 group-hover:w-full opacity-60"></div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 text-center">
        <p className="text-slate-400 text-sm font-medium">Showing {filteredIssues.length} of {issues.length} reported issues</p>
      </div>
    </div>
  );
}
