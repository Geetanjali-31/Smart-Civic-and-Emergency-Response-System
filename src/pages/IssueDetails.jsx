import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  FileWarning,
  MessageSquare,
  ArrowLeft,
  Activity,
  User,
  Image as ImageIcon,
  Calendar,
  ChevronRight,
  Siren,
  Info,
  Loader2
} from 'lucide-react';

import { api } from '../services/api';
import { formatDateTimeDMY } from '../utils/dateFormatter';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const INDORE_BOUNDS = L.latLngBounds(
  L.latLng(22.45, 75.60),   // SW
  L.latLng(22.95, 76.15)   // NE
);

const detailPinIcon = new L.DivIcon({
  html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#4f46e5;border:3px solid white;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(79,70,229,0.6)"></div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
});

export default function IssueDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthority = location.pathname.startsWith('/authority');

  const [isLoading, setIsLoading] = useState(true);
  const [issue, setIssue] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Clean 7-stage status mapping for lifecycle UI
  const statusFlow = ['submitted', 'verified', 'assigned', 'accepted', 'in_progress', 'resolved', 'closed'];

  const [proofUrl, setProofUrl] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleProofSubmit = async (e) => {
    e.preventDefault();
    if (!proofUrl) {
      alert("Please provide a proof image URL or photo evidence.");
      return;
    }
    setIsSubmittingProof(true);
    try {
      const targetId = issue?.id || id;
      const updated = await api.resolveServiceWithProof(targetId, proofUrl, resolutionNotes);
      setIssue(updated);
      alert("Resolution proof uploaded successfully!");
    } catch (e) {
      alert("Failed to submit resolution proof: " + e.message);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const targetId = issue?.id || id;
      const updated = await api.submitFeedback(targetId, feedbackRating, feedbackComments);
      setIssue(prev => ({
        ...prev,
        ...updated,
        status: 'closed',
        feedback_rating: feedbackRating,
        feedback_comments: feedbackComments
      }));
      alert("Thank you for your feedback! The complaint has been automatically closed.");
    } catch (e) {
      alert("Failed to submit feedback: " + e.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    async function fetchIssue() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const data = await api.getServices(token);
        const found = data.find(i =>
          i.id === parseInt(id) ||
          i.id === id ||
          i.id?.toString() === id?.toString() ||
          i.ticket_id === id
        );
        setIssue(found);
      } catch (error) {
        console.error("Failed to fetch issue details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIssue();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    try {
      const targetId = issue?.id || id;
      const updated = await api.updateServiceStatus(targetId, newStatus);
      setIssue(prev => ({
        ...prev,
        ...updated,
        status: newStatus,
        location: updated?.location || prev?.location,
        created_at: updated?.created_at || prev?.created_at,
        title: updated?.title || prev?.title,
        ticket_id: updated?.ticket_id || prev?.ticket_id
      }));
    } catch (error) {
      alert("Failed to update status: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-full w-24 mb-10"></div>
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="flex gap-6 items-center mb-8">
            <div className="w-20 h-20 bg-slate-200 rounded-2xl"></div>
            <div className="space-y-3 flex-1">
              <div className="h-8 bg-slate-200 rounded-xl w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded-full w-1/4"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded-full w-full"></div>
            <div className="h-4 bg-slate-200 rounded-full w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Info className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Report Not Found</h2>
        <p className="text-slate-500 text-lg mb-10 font-medium">The request with ID #{id} was not found in the system archives.</p>
        <button onClick={() => navigate(-1)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95">Go Back</button>
      </div>
    );
  }

  const normalizeStatus = (statusStr = '') => {
    const s = (statusStr || '').toLowerCase().trim();
    if (s === 'pending' || s === 'new' || s === 'submitted') return 'submitted';
    if (s === 'verified') return 'verified';
    if (s === 'assigned') return 'assigned';
    if (s === 'accepted' || s === 'accept') return 'accepted';
    if (s === 'in progress' || s === 'in_progress' || s === 'deploy personnel') return 'in_progress';
    if (s === 'resolved' || s === 'completed') return 'resolved';
    if (s === 'closed' || s === 'close' || s === 'feedback_received' || s === 'feedback') return 'closed';
    return 'submitted';
  };

  const currentStatus = normalizeStatus(issue.status);
  const currentStepIndex = Math.max(0, statusFlow.indexOf(currentStatus));
  const isEmergency = issue.category?.toLowerCase() === 'emergency';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

      <button
        onClick={() => navigate(-1)}
        className="group flex items-center text-sm font-black text-slate-400 hover:text-slate-900 transition-all mb-10 uppercase tracking-widest"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-slate-900 group-hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* Main Details Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Glassmorphic Header Card */}
          <div className={`relative overflow-hidden bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 transition-all`}>
            {/* Color Accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${isEmergency ? 'bg-red-500' : 'bg-indigo-500'}`}></div>

            <div className="p-8 md:p-12">
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${isEmergency ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                  {isEmergency ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> : <FileWarning className="w-3.5 h-3.5 mr-1.5" />}
                  {isEmergency ? 'Emergency Service' : 'Civic Report'}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 font-mono">Report ID #{issue.ticket_id || issue.id}</span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-3 py-1.5 bg-indigo-50/50 rounded-full border border-indigo-100/50">{issue.category}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                {issue.title}
              </h1>

              <div className="prose prose-slate max-w-none mb-10">
                <p className="text-xl text-slate-600 leading-relaxed font-medium">{issue.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mr-4 shrink-0">
                    <MapPin className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Incident Location</p>
                    <p className="text-slate-900 font-bold">{issue.location || 'Indore, Madhya Pradesh'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mr-4 shrink-0">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Time Reported</p>
                    <p className="text-slate-900 font-bold">
                      {formatDateTimeDMY(issue.created_at) || formatDateTimeDMY(new Date())}
                    </p>
                  </div>
                </div>
                {issue.assigned_to && (
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mr-4 shrink-0">
                      <User className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Responder</p>
                      <p className="text-emerald-700 font-bold">Case Worker #{issue.assigned_to}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Incident Location Map */}
              {(() => {
                const lat = parseFloat(issue.latitude || issue.lat) || 22.7196;
                const lng = parseFloat(issue.longitude || issue.lng) || 75.8577;
                return (
                  <div className="mt-8 bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center">
                        <MapPin className="w-4 h-4 mr-1.5 text-primary-500" /> Incident Location Map
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">GPS: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                    </div>
                    <div className="w-full h-64 relative">
                      <MapContainer
                        center={[lat, lng]}
                        zoom={14}
                        minZoom={12}
                        maxZoom={18}
                        maxBounds={INDORE_BOUNDS}
                        maxBoundsViscosity={1.0}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; Google Maps'
                          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                        />
                        <Marker position={[lat, lng]} icon={detailPinIcon}>
                          <Popup>
                            <div className="p-1 font-sans">
                              <b className="text-xs text-primary-600 uppercase font-bold">{issue.category}</b>
                              <p className="text-xs font-bold text-slate-900 my-0.5">{issue.title}</p>
                              <p className="text-[11px] text-slate-500">{issue.location}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Attachments Section */}
          {issue.image_url && (
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 p-8 md:p-10 transition-all">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center tracking-tight">
                <ImageIcon className="w-7 h-7 mr-3 text-slate-400" /> Photo Evidence
              </h2>
              <div className="group relative aspect-video bg-slate-100 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner">
                <img src={issue.image_url} alt="Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            </div>
          )}

          {/* Resolution Proof Upload (Visible to Authority when in progress or resolved) */}
          {isAuthority && (
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 p-8 md:p-10">
              <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center">
                <CheckCircle2 className="w-7 h-7 mr-3 text-emerald-500" /> Resolution Proof & Notes
              </h2>
              {issue.resolution_proof_url ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Resolution Notes</p>
                    <p className="text-slate-900 font-medium text-sm">{issue.resolution_notes || 'Issue resolved on site.'}</p>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={issue.resolution_proof_url} alt="Resolution Proof" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProofSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Proof Image URL / Photo</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/resolution_proof.jpg"
                      value={proofUrl}
                      onChange={e => setProofUrl(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Resolution Work Summary</label>
                    <textarea
                      rows="2"
                      placeholder="Summarize actions taken to fix the complaint..."
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingProof}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
                  >
                    {isSubmittingProof ? 'Uploading Proof...' : 'Upload Proof & Mark Resolved'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Citizen Rating & Feedback (Visible to Citizens when resolved) */}
          {!isAuthority && ['resolved', 'feedback_received', 'closed'].includes((issue.status || '').toLowerCase()) && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-4">
              <h2 className="text-2xl font-black flex items-center">⭐ Rate Service Resolution</h2>
              {issue.feedback_rating ? (
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-yellow-400 text-lg font-bold">{'★'.repeat(issue.feedback_rating)}{'☆'.repeat(5 - issue.feedback_rating)} ({issue.feedback_rating}/5 Stars)</p>
                  <p className="text-slate-300 text-sm">{issue.feedback_comments || 'No comments provided.'}</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`text-2xl p-2 rounded-xl transition-all ${feedbackRating >= star ? 'bg-yellow-400 text-slate-900 scale-110' : 'bg-white/10 text-white'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows="2"
                      placeholder="Leave your comments or feedback..."
                      value={feedbackComments}
                      onChange={e => setFeedbackComments(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm outline-none resize-none"
                    ></textarea>
                  </div>
                  <button type="submit" disabled={isSubmittingFeedback} className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-extrabold rounded-xl text-sm shadow-lg transition-all">
                    Submit Citizen Rating
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Audit Log Timeline */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 p-8 md:p-10">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-3 text-primary-600" /> Audit Log & Event Timeline
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {(issue.audit_logs && issue.audit_logs.length > 0) ? (
                issue.audit_logs.map(log => (
                  <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 uppercase tracking-wider">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateTimeDMY(log.timestamp)}</span>
                    </div>
                    <p className="text-slate-600">{log.comments}</p>
                    <span className="text-[10px] font-mono text-primary-600 font-bold block">Actor: {log.actor_name} ({log.actor_role})</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">No audit events recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Status Column */}
        <div className="space-y-8">

          {/* Resolution Status Card */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 p-8 md:p-10 relative overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Current Status</h2>

            <div className="space-y-8 relative">
              {/* Connecting path line */}
              <div className="absolute left-[1.375rem] top-2 bottom-2 w-1 bg-slate-100 rounded-full" aria-hidden="true"></div>

              {statusFlow.map((step, index) => {
                const isCompleted = index < currentStepIndex || currentStatus === 'closed' || (currentStatus === 'resolved' && index <= currentStepIndex);
                const isCurrent = index === currentStepIndex && currentStatus !== 'closed';

                return (
                  <div key={step} className="relative flex items-center group">
                    <div className={`relative z-10 w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all duration-500 shadow-lg ${isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-100'
                        : isCurrent
                          ? (isEmergency ? 'bg-red-600 border-red-500 text-white scale-110 shadow-red-200' : 'bg-primary-600 border-primary-500 text-white scale-110 shadow-primary-200')
                          : 'bg-white border-slate-200 text-slate-300'
                      }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : isCurrent ? (
                        <Activity className="w-6 h-6 text-white animate-pulse" />
                      ) : (
                        <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-5">
                      <h3 className={`text-sm font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                        {step.replace('_', ' ')}
                      </h3>
                      {isCurrent && (
                        <div className="mt-1 flex items-center text-[10px] font-bold text-primary-500 animate-in fade-in slide-in-from-left-2 transition-all">
                          ACTIVE STEP <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Authority Action Panel (Only visible to Authority) */}
            {isAuthority && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Command Action Console</p>
                <div className="relative group">
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={isUpdating}
                    className="w-full appearance-none bg-slate-900 border-none text-white text-sm font-black rounded-2xl px-6 py-4 cursor-pointer hover:bg-slate-800 transition-all outline-none pr-12 shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                  >
                    <option value="submitted">SUBMITTED</option>
                    <option value="verified">VERIFIED</option>
                    <option value="assigned">ASSIGNED TO OFFICER</option>
                    <option value="accepted">ACCEPT CASE</option>
                    <option value="in_progress">DEPLOY PERSONNEL (IN PROGRESS)</option>
                    <option value="resolved">RESOLVED & FEEDBACK</option>
                    <option value="closed" disabled={!issue.feedback_rating}>
                      CLOSED {!issue.feedback_rating ? '(AWAITING FEEDBACK)' : ''}
                    </option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none rotate-90" />
                </div>
                {!issue.feedback_rating && currentStatus === 'resolved' && (
                  <p className="mt-3 text-xs font-bold text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    ⏳ Awaiting Citizen Rating & Feedback. Ticket cannot be closed until citizen rates the resolution.
                  </p>
                )}
                {isUpdating && <div className="mt-4 flex items-center justify-center text-[10px] font-black text-primary-500 uppercase tracking-widest animate-pulse"><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Synchronizing...</div>}
              </div>
            )}
          </div>

          {/* Citizen Feedback & Rating Card (Prominently displayed when status is resolved/closed) */}
          {!isAuthority && ['resolved', 'feedback_received', 'closed'].includes(currentStatus) && (
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-amber-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">Citizen Feedback & Rating</h3>
                  <p className="text-xs text-amber-100 font-medium">How satisfied are you with the resolution?</p>
                </div>
              </div>

              {issue.feedback_rating ? (
                <div className="p-4 bg-white/15 rounded-2xl border border-white/20 space-y-2 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Your Rating</span>
                    <span className="text-yellow-300 text-lg font-black">{'★'.repeat(issue.feedback_rating)}{'☆'.repeat(5 - issue.feedback_rating)} ({issue.feedback_rating}/5)</span>
                  </div>
                  {issue.feedback_comments && (
                    <p className="text-white text-xs font-medium italic">"{issue.feedback_comments}"</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-100 block mb-2">Select Rating</label>
                    <div className="flex justify-between gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-base transition-all ${feedbackRating >= star
                              ? 'bg-yellow-400 text-slate-900 shadow-md scale-105'
                              : 'bg-white/15 text-white hover:bg-white/25'
                            }`}
                        >
                          ★ {star}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows="2"
                      placeholder="Share your comments or feedback on the resolution..."
                      value={feedbackComments}
                      onChange={e => setFeedbackComments(e.target.value)}
                      className="w-full p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-amber-200/70 text-xs outline-none resize-none font-medium"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {isSubmittingFeedback ? 'Submitting Feedback...' : 'Submit Feedback & Close Ticket'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Action Info */}
          {!isAuthority && (
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-xl font-black mb-4 flex items-center">
                <Siren className="w-6 h-6 mr-3" /> Still Need Help?
              </h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6">
                If the situation has escalated, please use our one-tap emergency response for faster dispatch.
              </p>
              <Link to="/citizen/emergency" className="block w-full text-center py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:shadow-indigo-500/20 transition-all active:scale-95">Rapid Assistance</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
