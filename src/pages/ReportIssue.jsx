import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send, AlertCircle, FileWarning, Map as MapIcon, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LocationPickerModal, { fetchExactAddress } from '../components/LocationPickerModal';
import { generateComplaintId } from '../utils/complaintIdGenerator';

export default function ReportIssue() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Fetching location...');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const { user } = useAuth();

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

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Geolocation not supported');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);

        try {
          const exactAddr = await fetchExactAddress(latitude, longitude);
          setLocation(exactAddr);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation(`Indore (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
        setLocation('Type address or Pick on Map');
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  React.useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const processSubmission = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const data = await api.createService({
        title: `Civic Issue: ${category}`,
        category: 'civic',
        sub_category: category,
        description,
        location,
        latitude: lat,
        longitude: lng,
        image_url: photo,
      }, token);

      const rawId = data?.id || data?.request?.id || data?.ticket_id;
      const formattedId = data?.ticket_id || generateComplaintId(category, rawId);
      setReportId(formattedId);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit report: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for nearby duplicates before creating a new ticket
    const dupes = api.checkDuplicates(category, lat, lng);
    if (dupes && dupes.length > 0) {
      setPotentialDuplicates(dupes);
      setShowDuplicateModal(true);
      return;
    }

    await processSubmission();
  };

  const handleUpvoteDuplicate = async (dupId) => {
    try {
      await api.upvoteService(dupId);
      alert("Thank you! Your vote has been added to the existing complaint.");
      setSubmitted(true);
      setReportId(dupId);
      setShowDuplicateModal(false);
    } catch (e) {
      alert("Failed to upvote complaint.");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Report Submitted Successfully!</h2>
          <div className="inline-block bg-slate-100 px-4 py-2 rounded-lg mb-6 border border-slate-200">
            <span className="text-slate-500 text-sm font-medium">Complaint ID: </span>
            <span className="text-slate-900 font-mono font-bold text-lg">{reportId}</span>
          </div>
          <p className="text-lg text-slate-600 mb-8">
            Thank you for helping keep our city clean and safe. You can track the status of this issue from your dashboard.
          </p>
          <button
            onClick={() => { setSubmitted(false); setCategory(''); setDescription(''); }}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm transition-colors w-full sm:w-auto"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center mb-2">
          <FileWarning className="w-8 h-8 mr-3 text-primary-600" />
          Report a Civic Issue
        </h1>
        <p className="text-slate-500 text-lg">
          Use this form to report non-emergency issues like potholes, broken streetlights, or illegal dumping.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-3 transition-colors outline-none">
                <option value="">Select a category...</option>
                <option value="pothole">Pothole</option>
                <option value="garbage">Garbage</option>
                <option value="streetlight">Streetlight</option>
                <option value="water">Water</option>
                <option value="other">Other</option>
              </select>
            </div>


            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the issue..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-3 transition-colors outline-none resize-none"
              ></textarea>
            </div>

            {/* Location */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-900">Incident Location</label>
                <span className="text-xs text-slate-500 font-medium">Auto-detected via GPS</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <button
                    type="button"
                    onClick={fetchCurrentLocation}
                    disabled={isFetchingLocation}
                    title="Re-detect My GPS Location"
                    className={`px-3 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center shrink-0 ${isFetchingLocation ? 'animate-pulse text-primary-600' : ''}`}
                  >
                    <Compass className="w-5 h-5 mr-1 text-primary-600" />
                    <span className="text-xs font-extrabold uppercase hidden sm:inline">{isFetchingLocation ? 'Scanning...' : 'GPS Sync'}</span>
                  </button>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Type house no, home address, colony or landmark..."
                    className="flex-1 min-w-0 px-3 py-3 bg-transparent text-slate-900 font-semibold text-sm outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                GPS location acquired. Type address or landmark above to adjust your location.
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Attach Photos (Optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-all relative overflow-hidden ${photo ? 'border-primary-500 bg-primary-50/20' : ''}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />

                {photo ? (
                  <div className="relative w-full h-40 group/photo">
                    <img src={photo} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <p className="text-white font-bold text-xs">Click to Change Photo</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Camera className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <span className="relative rounded-md font-bold text-primary-600 hover:text-primary-500">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                For life-threatening emergencies, please navigate to the <a href="/emergency" className="font-bold underline text-red-600">Emergency Reporting</a> page or call 911 directly.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Report...
                  </span>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Duplicate Complaint Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Similar Complaint Found Nearby</h3>
                <p className="text-xs text-slate-500 font-medium">A similar issue was recently reported in your area.</p>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {potentialDuplicates.map(dup => (
                <div key={dup.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">#{dup.ticket_id || dup.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{dup.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{dup.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpvoteDuplicate(dup.ticket_id || dup.id)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    👍 Join / Upvote Existing Complaint ({dup.upvote_count || 1} Votes)
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDuplicateModal(false); processSubmission(); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Submit New Ticket Anyway
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-5 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
