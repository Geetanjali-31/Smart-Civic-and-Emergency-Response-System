import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, Check, Locate, Loader2, Navigation, Search, Plus, Minus, Compass } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Default center fallback (Indore center)
const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 };

// High-precision reverse geocoder using Nominatim + BigDataCloud fallback
export const fetchExactAddress = async (lat, lng) => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return 'Location unavailable';
  }

  // 1. Primary Geocoder: OpenStreetMap Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const house = a.building || a.house_number || a.amenity || a.landmark || a.shop || a.office;
        const area = a.residential || a.colony || a.suburb || a.neighbourhood || a.quarter || a.hamlet;
        const road = a.road || a.street || a.pedestrian;
        const city = a.city || a.town || a.village || a.district || a.county;
        const state = a.state;

        const parts = [house, area, road, city, state].filter(Boolean);
        const unique = [];
        parts.forEach(p => {
          if (!unique.some(u => u.toLowerCase() === p.toLowerCase())) {
            unique.push(p);
          }
        });

        if (unique.length > 0) {
          return unique.join(', ');
        }
      }

      if (data && data.display_name) {
        const rawParts = data.display_name.split(',').map(s => s.trim());
        const filtered = rawParts.filter(p => 
          !['India', 'United States'].includes(p) &&
          !/^\d{6}$/.test(p)
        );
        if (filtered.length > 0) {
          return filtered.slice(0, 4).join(', ');
        }
      }
    }
  } catch (err) {
    console.warn("Nominatim geocode warning:", err);
  }

  // 2. Secondary Geocoder: BigDataCloud
  try {
    const res2 = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2) {
        const locality = data2.locality || (data2.localityInfo?.informative && data2.localityInfo.informative[0]?.name);
        const city = data2.city || data2.principalSubdivision;
        if (locality && city) {
          return `${locality}, ${city}`;
        }
        if (locality) return locality;
      }
    }
  } catch (err2) {
    console.warn("BigDataCloud geocode warning:", err2);
  }

  return `Location (${Number(lat).toFixed(4)}° N, ${Number(lng).toFixed(4)}° E)`;
};

// Component to invalidate map size when modal opens & track drag center
function MapController({ position, onMapDragEnd, setMapInstance }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      setMapInstance(map);
      // Ensure Leaflet recalculates tile dimensions when modal opens
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map, setMapInstance]);

  useMapEvents({
    moveend() {
      const center = map.getCenter();
      onMapDragEnd(center.lat, center.lng);
    }
  });

  return null;
}

// Custom Floating Zoom Controls component
function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        title="Zoom In"
        className="p-3 text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center"
      >
        <Plus className="w-5 h-5 font-black" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        className="p-3 text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center"
      >
        <Minus className="w-5 h-5 font-black" />
      </button>
    </div>
  );
}

export default function LocationPickerModal({ isOpen, onClose, initialLat, initialLng, onConfirmLocation }) {
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [address, setAddress] = useState('Detecting pin location...');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapRef = useRef(null);

  // Set map reference callback
  const setMapInstance = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Sync initial position when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      
      let lat = Number(initialLat);
      let lng = Number(initialLng);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        lat = DEFAULT_CENTER.lat;
        lng = DEFAULT_CENTER.lng;
      }

      const validPos = { lat, lng };
      setPosition(validPos);
      
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 17);
        setTimeout(() => mapRef.current?.invalidateSize(), 150);
      }

      setIsGeocoding(true);
      fetchExactAddress(lat, lng)
        .then(addr => setAddress(addr))
        .finally(() => setIsGeocoding(false));
    }
  }, [isOpen, initialLat, initialLng]);

  // Handle map drag end
  const handleMapDragEnd = useCallback(async (newLat, newLng) => {
    setPosition({ lat: newLat, lng: newLng });
    setIsGeocoding(true);
    try {
      const addr = await fetchExactAddress(newLat, newLng);
      setAddress(addr);
    } catch (err) {
      setAddress(`Location (${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E)`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Programmatically move map center
  const moveMapTo = (targetLat, targetLng, zoom = 17) => {
    setPosition({ lat: targetLat, lng: targetLng });
    if (mapRef.current) {
      mapRef.current.flyTo([targetLat, targetLng], zoom, { duration: 1.2 });
    }
  };

  // Search Submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let queryText = searchQuery.trim();

      // Pass 1: Try search query as entered
      let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&limit=5&countrycodes=in`, {
        headers: { 'Accept-Language': 'en' }
      });
      let data = await res.json();

      // Pass 2: Try adding India if not found
      if (!data || data.length === 0) {
        res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText + ', India')}&format=json&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        });
        data = await res.json();
      }

      if (data && data.length > 0) {
        setSearchResults(data);
        handleSelectSearchResult(data[0]);
      } else {
        alert(`Location "${queryText}" not found. Please try searching with landmark, colony, or area name.`);
      }
    } catch (err) {
      console.error(err);
      alert("Search service currently busy. You can drag the map pin directly.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (item) => {
    const targetLat = parseFloat(item.lat);
    const targetLng = parseFloat(item.lon);

    setSearchResults([]);
    moveMapTo(targetLat, targetLng, 18);

    setIsGeocoding(true);
    try {
      const exact = await fetchExactAddress(targetLat, targetLng);
      setAddress(exact);
    } catch (err) {
      setAddress(item.display_name);
    } finally {
      setIsGeocoding(false);
    }
  };

  // GPS Auto Locate
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on your device/browser.");
      return;
    }

    setIsLocating(true);
    setIsGeocoding(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const targetLat = pos.coords.latitude;
        const targetLng = pos.coords.longitude;

        moveMapTo(targetLat, targetLng, 18);

        try {
          const exact = await fetchExactAddress(targetLat, targetLng);
          setAddress(exact);
        } catch (err) {
          setAddress(`GPS Location (${targetLat.toFixed(4)}° N, ${targetLng.toFixed(4)}° E)`);
        } finally {
          setIsGeocoding(false);
          setIsLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setIsGeocoding(false);
        setIsLocating(false);
        alert("GPS Signal Weak or Permission Denied. You can drag the map pin manually to set your location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onConfirmLocation({
      address: address,
      lat: position.lat,
      lng: position.lng
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[90vh] max-h-[720px] border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-600/30 rounded-xl text-primary-400">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">Pick Location on Map</h3>
              <p className="text-xs text-slate-400 font-medium">Drag map to position the center pin on your exact incident location</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Body */}
        <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
          
          {/* Floating Address Search Bar */}
          <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-16 z-[1000] max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative shadow-xl rounded-2xl overflow-hidden">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search house no, colony, street, area..."
                className="w-full pl-10 pr-24 py-3 bg-white/95 backdrop-blur-md text-slate-900 font-semibold text-xs sm:text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-400 shadow-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                Search
              </button>
            </form>

            {/* Dropdown Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full p-3 text-left hover:bg-primary-50 transition-colors flex items-start group"
                  >
                    <MapPin className="w-4 h-4 mr-2.5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-primary-700">
                      {res.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <MapContainer 
            center={[position.lat, position.lng]} 
            zoom={17} 
            minZoom={4}
            maxZoom={19}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            className="w-full h-full"
            zoomControl={false}
          >
            {/* Google Maps tile layer matching dashboard */}
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
            <MapController 
              position={position} 
              onMapDragEnd={handleMapDragEnd}
              setMapInstance={setMapInstance}
            />
            <ZoomControls />
          </MapContainer>

          {/* Center Screen Pin Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none flex flex-col items-center select-none">
            {/* Tooltip Badge */}
            <div className="bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-2xl mb-1 flex items-center gap-1.5 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Position Pin Here</span>
            </div>
            
            {/* Pin Graphic */}
            <div className="relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 border-4 border-white shadow-2xl flex items-center justify-center text-white font-black drop-shadow-2xl">
                <MapPin className="w-6 h-6 fill-white text-primary-600" />
              </div>
              <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-primary-600 -mt-0.5"></div>
            </div>

            {/* Ground Shadow */}
            <div className="w-5 h-2 bg-black/40 rounded-full blur-[1px] mt-0.5 animate-pulse"></div>
          </div>

          {/* GPS Recenter Floating Button */}
          <button
            type="button"
            onClick={handleGPSLocate}
            disabled={isLocating}
            title="Recenter to My GPS Location"
            className="absolute bottom-28 right-4 z-[1000] p-3 bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl shadow-xl border border-slate-200 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
          >
            {isLocating ? (
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            ) : (
              <Locate className="w-6 h-6 text-primary-600" />
            )}
          </button>

        </div>

        {/* Bottom Address Confirmation Bar */}
        <div className="p-5 sm:p-6 bg-white border-t border-slate-100 shrink-0 space-y-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl shrink-0 mt-0.5">
              {isGeocoding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                {isGeocoding ? 'Detecting Address...' : 'Selected Location'}
              </span>
              <p className="text-slate-900 font-extrabold text-sm sm:text-base line-clamp-2 leading-snug">
                {address}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleGPSLocate}
              disabled={isLocating}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-primary-700 font-bold rounded-xl border border-primary-200 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm shrink-0"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              ) : (
                <Compass className="w-4 h-4 text-primary-600" />
              )}
              <span>{isLocating ? 'Locating...' : 'Use My GPS Location'}</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isGeocoding}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 text-xs sm:text-sm"
            >
              <Check className="w-5 h-5" />
              <span>Confirm Pin Location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
