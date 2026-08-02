import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, Shield, Bell, Settings, LogOut, ChevronRight, Camera, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { currentUser, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('app_preferences');
    const defaults = { compactView: false, animations: true, colorTheme: 'blue' };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const togglePreference = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    localStorage.setItem('app_preferences', JSON.stringify(newPrefs));
  };
  
  const [statsData, setStatsData] = useState({ total: 0, resolved: 0, in_progress: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', phone: '' });
  const [updateMsg, setUpdateMsg] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await api.getProfileStats(token);
          setStatsData(data);
        }
      } catch (err) {
        console.error("Failed to load profile metrics", err);
      }
    };
    fetchStats();
  }, []);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.uploadProfilePicture(file, token);
      updateUser(res.user);
    } catch (err) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditClick = () => {
    setEditForm({
      username: currentUser?.username || '',
      phone: currentUser?.phone || currentUser?.phoneNumber || ''
    });
    setUpdateMsg('');
    setUpdateError('');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUpdateError('');
    setUpdateMsg('');
    try {
        const token = localStorage.getItem('token');
        const res = await api.updateProfile(editForm, token);
        setUpdateMsg(res.msg);
        updateUser(res.user);
        setTimeout(() => setIsEditing(false), 1500);
    } catch (err) {
        setUpdateError(err.message || 'Failed to update profile');
    } finally {
        setSaving(false);
    }
  };

  const stats = [
    { label: 'Total Reports', value: (statsData?.total ?? 0).toString(), icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Resolved', value: (statsData?.resolved ?? 0).toString(), icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'In Progress', value: (statsData?.in_progress ?? 0).toString(), icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Profile Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-md">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-700"></div>
        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-white p-1 shadow-xl">
                  {currentUser?.profile_picture ? (
                    <img src={currentUser.profile_picture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400 group-hover:bg-slate-200 transition-colors">
                      {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleCameraClick}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-2 right-2 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 translate-y-2 group-hover:translate-y-0 duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {currentUser?.username || 'Alex Rodriguez'}
                </h1>
                <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start mt-1">
                  <Mail className="w-4 h-4 mr-2" />
                  {currentUser?.email || 'test@example.com'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleEditClick} className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-sm hover:bg-primary-700 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Stats & Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Stats Grid */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Impact Summary</h3>
            <div className="grid grid-cols-1 gap-4">
              {stats.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-xl ${s.bg} ${s.color} mr-3`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{s.label}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Personal Info</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Phone className="w-4 h-4 text-slate-400 mt-1 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mobile Number</p>
                  <p className="text-slate-900 font-semibold">{currentUser?.phone || currentUser?.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="w-4 h-4 text-slate-400 mt-1 mr-3 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Member Since</p>
                  <p className="text-slate-900 font-semibold">
                    {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Settings Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-3 text-primary-600" />
                Account Settings
              </h3>
              
              <div className="space-y-6">
                {/* Notification Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mr-4">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">Push Notifications</p>
                      <p className="text-slate-500 text-sm">Get real-time updates on your reports</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-primary-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {/* Preference Items */}
                {[
                  { title: 'Security & Privacy', desc: 'Manage your password and data sharing', icon: Shield, onClick: () => setIsSecurityOpen(true) },
                  { title: 'App Preferences', desc: 'Customize your dashboard view', icon: Settings, onClick: () => setIsPreferencesOpen(true) },
                ].map((item, idx) => (
                  <button key={idx} onClick={item.onClick} className="w-full flex items-center justify-between py-2 group text-left">
                    <div className="flex items-center">
                      <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl mr-4 group-hover:bg-slate-100 transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">{item.title}</p>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Section in Settings */}
            <div className="pt-8 border-t border-slate-100">
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out from Account
              </button>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-sm text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2 uppercase tracking-wide opacity-80">Community Hero</h3>
              <p className="text-3xl font-extrabold mb-4 underline decoration-indigo-300 underline-offset-8 decoration-4">Rookie Guard</p>
              <p className="text-indigo-100 max-w-sm">You are 3 reports away from becoming a **Verified Sentinel**! Keep making your community better.</p>
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
              <button type="button" onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              
              {updateError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  {updateError}
                </div>
              )}
              
              {updateMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-start">
                  <Check className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  {updateMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input 
                  type="text" required 
                  value={editForm.username} 
                  onChange={e => setEditForm({...editForm, username: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input 
                  type="tel" required 
                  value={editForm.phone} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-900"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
              <button type="button" onClick={() => setIsSecurityOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setUpdateError('');
              setUpdateMsg('');
              const currentPassword = e.target.current_password.value;
              const newPassword = e.target.new_password.value;
              const confirmPassword = e.target.confirm_password.value;
              if (newPassword !== confirmPassword) {
                 setUpdateError("Passwords do not match");
                 setSaving(false);
                 return;
              }
              try {
                  const token = localStorage.getItem('token');
                  const res = await api.changePassword({current_password: currentPassword, new_password: newPassword}, token);
                  setUpdateMsg(res.msg);
                  setTimeout(() => setIsSecurityOpen(false), 2000);
              } catch (err) {
                  setUpdateError(err.message);
              } finally {
                  setSaving(false);
              }
            }} className="p-6 space-y-5">
              {updateError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  {updateError}
                </div>
              )}
              {updateMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-start">
                  <Check className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  {updateMsg}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                <input type="password" required name="current_password" onChange={() => {setUpdateError(''); setUpdateMsg('');}} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-900"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <input type="password" required name="new_password" onChange={() => {setUpdateError(''); setUpdateMsg('');}} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-900"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" required name="confirm_password" onChange={() => {setUpdateError(''); setUpdateMsg('');}} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-900"/>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSecurityOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">App Preferences</h3>
              <button onClick={() => setIsPreferencesOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Compact Dashboard View</h4>
                  <p className="text-xs text-slate-500 mt-1">Reduces padding to fit more data on screen.</p>
                </div>
                <button 
                  onClick={() => togglePreference('compactView')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${preferences.compactView ? 'bg-primary-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.compactView ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Enable Animations</h4>
                  <p className="text-xs text-slate-500 mt-1">Show smooth transitions between pages.</p>
                </div>
                <button 
                  onClick={() => togglePreference('animations')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${preferences.animations ? 'bg-primary-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.animations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Dashboard Theme Color</h4>
                  <p className="text-xs text-slate-500 mt-1">Select an accent color for your UI.</p>
                </div>
                <div className="flex flex-wrap gap-3 ml-4">
                  {['blue', 'teal', 'green', 'amber', 'rose', 'pink', 'purple', 'indigo'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        const newPrefs = { ...preferences, colorTheme: color };
                        setPreferences(newPrefs);
                        localStorage.setItem('app_preferences', JSON.stringify(newPrefs));
                        document.documentElement.className = color === 'blue' ? '' : `theme-${color}`;
                      }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                      className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm
                        ${preferences.colorTheme === color ? 'border-slate-800 scale-110' : 'border-transparent scale-100'}
                        ${color === 'blue' ? 'bg-sky-500' : ''} 
                        ${color === 'green' ? 'bg-emerald-500' : ''} 
                        ${color === 'purple' ? 'bg-purple-500' : ''} 
                        ${color === 'rose' ? 'bg-rose-500' : ''}
                        ${color === 'amber' ? 'bg-amber-500' : ''}
                        ${color === 'teal' ? 'bg-teal-500' : ''}
                        ${color === 'indigo' ? 'bg-indigo-500' : ''}
                        ${color === 'pink' ? 'bg-pink-500' : ''}
                      `}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
