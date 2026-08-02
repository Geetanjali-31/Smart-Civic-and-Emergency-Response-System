import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { normalizeDepartment, issueMatchesDepartment } from '../utils/departmentMatcher';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red emergency marker
const emergencyIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#dc2626;border:3px solid white;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(220,38,38,0.6)"></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

// Custom amber civic marker
const civicIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#f59e0b;border:3px solid white;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(245,158,11,0.6)"></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

// Indore center & bounds
const INDORE_CENTER = [22.7196, 75.8577];
const INDORE_ZOOM = 13;
const INDORE_BOUNDS = L.latLngBounds(
  L.latLng(22.45, 75.60),   // SW
  L.latLng(22.95, 76.15)   // NE
);

function getIssueCoordinates(issue) {
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
  if (locLower.includes('bhanwar') || locLower.includes('bhawarkua')) return { lat: 22.6916, lng: 75.8672 };
  if (locLower.includes('annapurna')) return { lat: 22.6980, lng: 75.8385 };
  if (locLower.includes('khajrana')) return { lat: 22.7305, lng: 75.9080 };
  if (locLower.includes('mhow')) return { lat: 22.5540, lng: 75.7610 };
  if (locLower.includes('rau')) return { lat: 22.6310, lng: 75.8070 };

  const idNum = parseInt(issue.id || '1', 10) || 1;
  const offsetLat = ((idNum * 17) % 50 - 25) * 0.0015;
  const offsetLng = ((idNum * 23) % 50 - 25) * 0.0015;

  return {
    lat: 22.7196 + offsetLat,
    lng: 75.8577 + offsetLng
  };
}

export default function AuthorityMap() {
  const { currentUser } = useAuth();
  const [allIssues, setAllIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const userDeptKey = useMemo(() => {
    if (!currentUser?.department) return 'all';
    return normalizeDepartment(currentUser.department);
  }, [currentUser]);

  useEffect(() => {
    async function fetchMapIssues() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const data = await api.getServices(token);

        const mapped = (data || []).map((issue) => {
          const coords = getIssueCoordinates(issue);
          return {
            ...issue,
            lat: coords.lat,
            lng: coords.lng
          };
        });

        setAllIssues(mapped);
      } catch (err) {
        console.error('Map fetch error:', err);
        setAllIssues([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMapIssues();
  }, []);

  const issues = useMemo(() => {
    return allIssues.filter(issue => {
      if (!issueMatchesDepartment(issue, userDeptKey)) return false;
      const st = (issue.status || '').toLowerCase().trim();
      return !['resolved', 'completed', 'closed', 'feedback_received'].includes(st);
    });
  }, [allIssues, userDeptKey]);

  const emergencies = issues.filter(i => i.category === 'emergency');
  const civic = issues.filter(i => i.category !== 'emergency');

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      {/* Legend card */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
          <h2 className="text-base font-bold text-slate-900 flex items-center mb-2">
            <Navigation className="w-4 h-4 mr-2 text-primary-600 animate-pulse" />
            Indore Incident Map
          </h2>
          <div className="space-y-1.5 text-sm font-medium">
            <div className="flex items-center text-slate-700">
              <span className="w-3 h-3 rounded-full bg-red-600 mr-2 inline-block"></span>
              Emergencies ({emergencies.length})
            </div>
            <div className="flex items-center text-slate-700">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-2 inline-block"></span>
              Civic Issues ({civic.length})
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center mt-2 text-xs text-slate-400">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading live data...
            </div>
          )}
        </div>
      </div>

      {/* Leaflet Map — Previous Google Map View */}
      <MapContainer
        center={INDORE_CENTER}
        zoom={INDORE_ZOOM}
        minZoom={12}
        maxZoom={18}
        maxBounds={INDORE_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        {/* Google Maps tiles */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {/* Issue markers */}
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={issue.category === 'emergency' ? emergencyIcon : civicIcon}
          >
            <Popup maxWidth={260}>
              <div style={{ fontFamily: 'Inter,sans-serif', padding: '4px' }}>
                <div style={{
                  fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: issue.category === 'emergency' ? '#dc2626' : '#d97706',
                  marginBottom: '4px'
                }}>
                  {issue.category === 'emergency' ? '🚨' : '⚠️'} {issue.category} • #{issue.ticket_id || issue.id}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  {issue.title}
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', lineHeight: '1.5' }}>
                  {issue.description}
                </p>
                <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '5px 8px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                  📍 {issue.location}
                </div>
                <span style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: '999px',
                  background: issue.status === 'pending' || issue.status === 'submitted' ? '#fef3c7' : issue.status === 'resolved' ? '#d1fae5' : '#dbeafe',
                  color: issue.status === 'pending' || issue.status === 'submitted' ? '#92400e' : issue.status === 'resolved' ? '#065f46' : '#1e40af',
                  marginBottom: '10px'
                }}>
                  {issue.status}
                </span>
                <a
                  href={`/authority/tasks/${issue.id}`}
                  style={{
                    display: 'block', textAlign: 'center', padding: '7px', borderRadius: '8px',
                    background: issue.category === 'emergency' ? '#dc2626' : '#1d4ed8',
                    color: 'white', fontSize: '12px', fontWeight: '700', textDecoration: 'none'
                  }}
                >
                  ✓ View & Assign Task
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
