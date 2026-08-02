import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import {
  FileWarning,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Activity,
  X,
  Map as MapIcon
} from 'lucide-react';
import { api } from '../services/api';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red emergency marker
const emergencyIcon = new L.DivIcon({
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#dc2626;border:3px solid white;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(220,38,38,0.6)"></div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32],
});

// Custom blue civic marker
const civicIcon = new L.DivIcon({
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid white;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(37,99,235,0.6)"></div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32],
});

const INDORE_CENTER = [22.7196, 75.8577];
const INDORE_BOUNDS = L.latLngBounds(
  L.latLng(22.45, 75.60),   // SW
  L.latLng(22.95, 76.15)   // NE
);

function getIssueCoordinates(issue, idx) {
  let lat = issue.latitude !== undefined && issue.latitude !== null ? parseFloat(issue.latitude) : parseFloat(issue.lat);
  let lng = issue.longitude !== undefined && issue.longitude !== null ? parseFloat(issue.longitude) : parseFloat(issue.lng);

  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return { lat, lng };
  }

  if (issue.location) {
    const coordMatch = issue.location.match(/(-?\d+\.\d+)\s*°?\s*[NS]?,?\s*(-?\d+\.\d+)\s*°?\s*[EW]?/i);
    if (coordMatch) {
      lat = parseFloat(coordMatch[1]);
      lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }

  const locLower = (issue.location || '').toLowerCase();
  if (locLower.includes('vijay nagar')) return { lat: 22.7533, lng: 75.8937 };
  if (locLower.includes('rajwada')) return { lat: 22.7196, lng: 75.8577 };
  if (locLower.includes('palasia')) return { lat: 22.7244, lng: 75.8839 };
  if (locLower.includes('vaishali nagar')) return { lat: 22.7001, lng: 75.8340 };
  if (locLower.includes('sudama nagar')) return { lat: 22.6958, lng: 75.8239 };

  return {
    lat: 22.7196 + ((idx * 17) % 50 - 25) * 0.0015,
    lng: 75.8577 + ((idx * 23) % 50 - 25) * 0.0015
  };
}

export default function CitizenDashboard() {
  const { currentUser } = useAuth();
  const [allReports, setAllReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const data = await api.getMyServices(token);
        setAllReports(data || []);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'accepted': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pending': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
      case 'resolved': return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
      case 'accepted': return <Clock className="w-4 h-4 mr-1.5" />;
      case 'pending': return <AlertCircle className="w-4 h-4 mr-1.5" />;
      case 'rejected': return <X className="w-4 h-4 mr-1.5" />;
      default: return null;
    }
  };

  const resolvedCount = allReports.filter(r => ['completed', 'resolved', 'closed'].includes((r.status || '').toLowerCase())).length;
  const pendingCount = allReports.length - resolvedCount;
  const recentReports = allReports.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      {/* Welcome & Overview Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome, {currentUser?.username || currentUser?.email?.split('@')[0] || 'there'}! 👋</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Your community dashboard for civic engagement.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/citizen/complaints" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Complaints</p>
            <p className="text-4xl font-bold text-slate-900 mt-1">{allReports.length}</p>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-primary-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-7 h-7" />
          </div>
        </Link>
        <Link to="/citizen/complaints" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Resolved</p>
            <p className="text-4xl font-bold text-emerald-600 mt-1">{resolvedCount}</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </Link>
        <Link to="/citizen/complaints" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Pending</p>
            <p className="text-4xl font-bold text-slate-900 mt-1">{pendingCount}</p>
          </div>
          <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-3 space-y-8">

          {/* Recent Complaints */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Recent Complaints</h2>
              <Link to="/citizen/complaints" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All &rarr;</Link>
            </div>

            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading complaints...</div>
              ) : recentReports.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No recent complaints found.</div>
              ) : (
                recentReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`mt-1 p-2 rounded-lg ${report.category === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {report.category === 'emergency' ? <ShieldAlert className="w-5 h-5" /> : <FileWarning className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase text-sm tracking-tight">{report.title}</h3>
                          <p className="text-slate-500 text-sm mt-1 line-clamp-1">{report.description}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs font-medium text-slate-400">
                            <span className="flex items-center capitalize"><MapPin className="w-3 h-3 mr-1" /> {report.location || 'Unknown'}</span>
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interactive Incident Map */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 relative">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <MapIcon className="w-5 h-5 mr-2 text-primary-600" />
              Nearby Incident Map
            </h2>
            <div className="w-full h-96 rounded-xl overflow-hidden relative border border-slate-200 shadow-inner">
              <MapContainer
                center={INDORE_CENTER}
                zoom={13}
                minZoom={12}
                maxZoom={18}
                maxBounds={INDORE_BOUNDS}
                maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; Google Maps'
                  url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                />
                {allReports.map((report, idx) => {
                  const coords = getIssueCoordinates(report, idx);
                  const isEmergency = report.category === 'emergency';
                  return (
                    <Marker
                      key={report.id}
                      position={[coords.lat, coords.lng]}
                      icon={isEmergency ? emergencyIcon : civicIcon}
                    >
                      <Popup>
                        <div className="p-1 font-sans">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isEmergency ? 'text-red-600' : 'text-blue-600'}`}>
                            {report.category || 'Civic'} • #{report.ticket_id || report.id}
                          </p>
                          <h4 className="font-bold text-sm text-slate-900 my-1">{report.title}</h4>
                          <p className="text-xs text-slate-500">{report.location}</p>
                          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                            Status: {report.status}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              <div className="absolute bottom-4 left-4 z-[1000]">
                <span className="bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-xl shadow-xl border border-slate-200 flex items-center w-fit uppercase">
                  <Activity className="w-3.5 h-3.5 mr-2 text-green-500 animate-pulse" />
                  Live GPS Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
