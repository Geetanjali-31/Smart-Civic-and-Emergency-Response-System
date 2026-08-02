import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Siren, PhoneCall, AlertTriangle, ShieldAlert, Crosshair, MapPin, Activity, Camera, Upload, CheckCircle2, Image, X, Navigation, LocateFixed, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LocationPickerModal, { fetchExactAddress } from '../components/LocationPickerModal';
import { generateComplaintId } from '../utils/complaintIdGenerator';

// Helper for reverse geocoding
async function reverseGeocode(lat, lng, setAddress) {
  try {
    const exact = await fetchExactAddress(lat, lng);
    setAddress(exact);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
}

export default function EmergencyReport() {
  const location = useLocation();
  const { token } = useAuth();
  const [activeType, setActiveType] = useState(location.state?.type || 'medical');

  // Consolidated State
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Standby');
  const [locationAddress, setLocationAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [selectedNature, setSelectedNature] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');

  const emergencyTypeData = [
    {
      id: 'medical',
      label: 'Medical Emergency',
      icon: () => <Activity className="w-8 h-8" />,
      color: 'bg-red-500 hover:bg-red-600',
      text: 'text-red-500',
      ring: 'ring-red-200',
      options: ['Vehicle Collision', 'Pedestrian hit', 'Heart Attack', 'Breathing Issue', 'Unconscious', 'Severe Bleeding', 'Falls', 'Sports Injury']
    },
    {
      id: 'fire',
      label: 'Fire / Rescue',
      icon: () => <AlertTriangle className="w-8 h-8" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      text: 'text-orange-500',
      ring: 'ring-orange-200',
      options: ['Structure Fire', 'Wildfire', 'Gas Leak', 'Vehicle Fire', 'Person Trapped', 'Short Circuit']
    },
    {
      id: 'police',
      label: 'Police Assistance',
      icon: () => <ShieldAlert className="w-8 h-8" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
      ring: 'ring-blue-200',
      options: ['Accident Reporting', 'Crime in Progress', 'Theft / Robbery', 'Violence', 'Suspicious Activity', 'Domestic Issue', 'Hit & Run']
    },
    {
      id: 'hazard',
      label: 'Severe Hazard',
      icon: () => <Siren className="w-8 h-8" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-600',
      ring: 'ring-purple-200',
      options: ['Chemical Leak', 'Downed Power Line', 'Flood / Water Leak', 'Building Collapse', 'Earthquake Damage']
    },
  ];

  const handleLocationDetection = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        console.log("📍 [Location System] GPS Coordinates Acquired:", { latitude, longitude });
        setLocationStatus(`GPS LINKED`);

        try {
          const exact = await fetchExactAddress(latitude, longitude);
          setLocationAddress(exact);
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationAddress(`Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        setLocationStatus('Error: GPS unavailable');
        alert("Permission denied or location unavailable. Please enter address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initial location fetch
  useEffect(() => {
    handleLocationDetection();
  }, []);

  const getActiveData = () => emergencyTypeData.find(t => t.id === activeType);
  const activeData = getActiveData();

  useEffect(() => {
    setSelectedNature('');
  }, [activeType]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDispatch = async () => {
    if (!selectedNature && !description) {
      alert("Please select nature of emergency or provide a description");
      return;
    }
    if (!locationAddress) {
      alert("Please provide location");
      return;
    }
    setIsSubmitting(true);
    try {
      const finalDescription = selectedNature
        ? `${selectedNature}${description ? ' - ' + description : ''}`
        : description;

      const data = await api.createService({
        title: `Emergency: ${activeData.label}`,
        category: 'emergency',
        description: finalDescription,
        location: locationAddress,
        latitude: lat,
        longitude: lng,
        image_url: photo,
      }, token);

      const rawId = data?.id || data?.request?.id;
      const formattedId = data?.ticket_id || generateComplaintId(activeType, rawId);
      setReportId(formattedId);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Failed to dispatch emergency request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 p-8 rounded-2xl border border-red-200">
          <Siren className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-red-900 mb-2">EMERGENCY DISPATCHED</h2>
          <p className="text-red-700 text-lg mb-6 font-medium">Emergency services have been dispatched and are on their way. Please stay at a safe distance and keep your phone available for updates.</p>
          <div className="inline-block bg-white px-4 py-2 rounded-lg border border-red-100 shadow-sm mb-6">
            <span className="text-slate-500 text-sm font-medium">Dispatch ID: </span>
            <span className="text-red-900 font-mono font-bold text-lg">{reportId}</span>
          </div>
          <p className="text-slate-600">Please remain at a safe distance and stay on the line if contacted by authorities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Critical Banner */}
      <div className="bg-red-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between border-4 border-red-200/20">
        <div className="flex items-start mb-4 sm:mb-0">
          <div className="p-3 bg-white/20 rounded-full mr-4 shrink-0 animate-pulse">
            <PhoneCall className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight mb-1">IMMEDIATE THREAT TO LIFE?</h2>
            <p className="text-red-100 font-medium">Do not wait for a web form. Call Emergency Response directly.</p>
          </div>
        </div>
        <a href="tel:112" className="w-full sm:w-auto text-center px-8 py-4 bg-white text-red-700 text-xl font-black rounded-xl shadow-md hover:bg-red-50 hover:scale-105 transition-all">
          CALL 112 NOW
        </a>
      </div>

      {/* Official Government Emergency Helplines (India / MP) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-red-600" />
          <span>Official Emergency Helplines (India / Madhya Pradesh)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="tel:112"
            className="p-3 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition-all flex flex-col items-center text-center group"
          >
            <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider">All Emergencies</span>
            <span className="text-xl font-black text-red-700 font-mono mt-0.5 group-hover:scale-110 transition-transform">112</span>
          </a>
          <a
            href="tel:108"
            className="p-3 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition-all flex flex-col items-center text-center group"
          >
            <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">Ambulance</span>
            <span className="text-xl font-black text-amber-800 font-mono mt-0.5 group-hover:scale-110 transition-transform">108</span>
          </a>
          <a
            href="tel:100"
            className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-all flex flex-col items-center text-center group"
          >
            <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider">Police</span>
            <span className="text-xl font-black text-blue-800 font-mono mt-0.5 group-hover:scale-110 transition-transform">100</span>
          </a>
          <a
            href="tel:101"
            className="p-3 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-100 transition-all flex flex-col items-center text-center group"
          >
            <span className="text-[11px] font-extrabold text-orange-700 uppercase tracking-wider">Fire Brigade</span>
            <span className="text-xl font-black text-orange-800 font-mono mt-0.5 group-hover:scale-110 transition-transform">101</span>
          </a>
        </div>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 mt-4 content-center justify-center flex items-center">
          <Siren className="w-8 h-8 mr-3 text-red-600" />
          Rapid Emergency Dispatch
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Submit critical incidents below. This system directly pages the nearest available first responders.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">

        {/* Step 1: Emergency Type */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm mr-3">1</span>
            Select Emergency Type
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emergencyTypeData.map((type) => {
              const Icon = type.icon;
              const isActive = activeType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setActiveType(type.id)}
                  className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all ${isActive
                      ? `border-transparent ${type.color} text-white shadow-lg shadow-${type.color.split('-')[1]}-500/30 scale-105 z-10`
                      : `border-slate-200 bg-white hover:border-slate-300 ${type.text} hover:bg-slate-50`
                    }`}
                >
                  <div className={`mb-3 ${isActive ? 'text-white' : type.text}`}>
                    <Icon />
                  </div>
                  <span className={`font-semibold text-sm sm:text-base ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {type.label}
                  </span>

                  {isActive && (
                    <div className="absolute top-2 right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Location Details (Dispatch Control UI) */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center">
              <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg mr-4 shadow-xl shadow-slate-200">2</span>
              Dispatch Location Data
            </h3>

            <div className={`flex items-center space-x-3 text-[10px] font-black px-4 py-2 rounded-xl transition-all duration-500 border-2 uppercase tracking-widest ${isLocating
                ? 'bg-primary-50 text-primary-600 border-primary-100 animate-bounce'
                : lat
                  ? 'bg-slate-900 text-emerald-400 border-slate-800'
                  : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
              <Activity className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
              <span>SYSTEM STATUS: {isLocating ? 'Scanning...' : lat ? 'LINKED' : 'Awaiting Input'}</span>
            </div>
          </div>

          <div className="relative isolate group/location">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-rose-500/20 rounded-3xl blur opacity-30 group-focus-within/location:opacity-50 transition-opacity pointer-events-none"></div>

            <div className="relative bg-white rounded-3xl border-2 border-slate-100 p-4 sm:p-6 shadow-xl shadow-slate-200/50">
              <div className="flex flex-col md:flex-row items-stretch gap-3">
                <div className="relative flex-1 group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary-600 transition-transform group-focus-within/input:scale-110">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Type house no, home address or landmark..."
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 text-slate-900 transition-all font-bold text-lg placeholder:text-slate-300 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleLocationDetection}
                    disabled={isLocating}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shrink-0"
                  >
                    <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="tracking-wide uppercase text-sm">{isLocating ? 'Syncing...' : 'Sync GPS'}</span>
                  </button>
                </div>
              </div>

              {lat && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Accuracy GPS Lock Active</span>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-slate-400">
                    GPS COORDS: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Nature & Details */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm mr-3">3</span>
            Nature of Emergency
          </h3>

          <div className="flex flex-wrap gap-3 mb-6">
            {activeData.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedNature(selectedNature === opt ? '' : opt)}
                className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all ${selectedNature === opt
                    ? `${activeData.color} border-transparent text-white shadow-md`
                    : `border-slate-200 bg-white text-slate-600 hover:border-slate-300`
                  }`}
              >
                {selectedNature === opt && <CheckCircle2 className="w-4 h-4 mr-2 inline" />}
                {opt}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Additional Details (Optional if nature selected)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2 cars involved in crash, person trapped inside..."
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-4 transition-colors font-medium text-lg outline-none resize-none shadow-sm"
            ></textarea>
          </div>
        </div>

        {/* Step 4: Photo Evidence */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm mr-3">4</span>
            Photo / Evidence (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!photo ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition-all text-slate-500 group"
                >
                  <Camera className="w-10 h-10 mb-2 group-hover:text-primary-500 transition-colors" />
                  <span className="font-bold text-sm">Take Photo</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition-all text-slate-500 group"
                >
                  <Upload className="w-10 h-10 mb-2 group-hover:text-primary-600 transition-colors" />
                  <span className="font-bold text-sm">Upload Image</span>
                </button>
              </>
            ) : (
              <div className="relative col-span-1 sm:col-span-2 rounded-2xl overflow-hidden border-2 border-primary-100 h-64 shadow-md bg-white p-2">
                <img src={photo} alt="Emergency capture" className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold ring-1 ring-white/20">
                  <Image className="w-4 h-4" />
                  <span>EMERGENCY_EVIDENCE.JPG</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Section */}
        <div className="pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isSubmitting}
            className={`w-full flex justify-center py-5 px-6 border-transparent rounded-xl shadow-xl text-xl font-extrabold text-white transition-all transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 hover:shadow-2xl disabled:opacity-50 disabled:active:scale-100 ${activeData.color} ${activeData.ring}`}
          >
            {isSubmitting ? 'DISPATCHING...' : `DISPATCH ${activeData.label.toUpperCase()} RESPONSE`}
          </button>

          <p className="text-center text-sm text-slate-500 font-medium mt-4">
            By dispatching, you confirm this is a valid emergency requiring immediate first responder action. False reporting is a criminal offense.
          </p>
        </div>

      </div>
    </div>
  );
}
