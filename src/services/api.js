import { generateComplaintId } from '../utils/complaintIdGenerator';
import { analyzeAndRouteComplaint } from '../utils/smartRoutingEngine';
import { calculateSlaDueDate, getSlaStatus } from '../utils/slaEngine';
import { findPotentialDuplicates } from '../utils/duplicateDetection';
import { createAuditEntry, appendAuditLog } from '../utils/auditLogger';

const BASE_URL = 'http://127.0.0.1:5000/api';
const STORAGE_KEY = 'innovista_custom_services_v6';
const NOTIF_STORAGE_KEY = 'innovista_notifications_v1';
const REGISTERED_USERS_KEY = 'innovista_registered_users_v2';

// Purge legacy mock data on load
try {
  localStorage.removeItem('innovista_custom_services');
  localStorage.removeItem('innovista_custom_services_v1');
  localStorage.removeItem('innovista_custom_services_v2');
  localStorage.removeItem('innovista_custom_services_v3');
  localStorage.removeItem('innovista_custom_services_v4');
  localStorage.removeItem('innovista_custom_services_v5');
} catch (e) {}

const getStoredServices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return JSON.parse(stored);
  } catch (e) {}
  return [];
};

const saveStoredService = (newService) => {
  try {
    const existing = getStoredServices();
    const updated = [newService, ...existing.filter(i => i.id !== newService.id && i.ticket_id !== newService.ticket_id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {}
};

const getStoredNotifications = () => {
  try {
    const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (stored !== null) return JSON.parse(stored);
  } catch (e) {}
  return [];
};

const saveNotification = (newNotif) => {
  try {
    const existing = getStoredNotifications();
    const updated = [newNotif, ...existing];
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {}
};

const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { msg: text };
  }

  if (!response.ok) {
    throw new Error(data.msg || data.error || 'Request failed');
  }
  return data;
};

const safeFetch = async (url, options = {}, mockFallback = null) => {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {
    if (mockFallback !== null && (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message.includes('Unable to connect'))) {
      console.warn(`[Offline Fallback] Backend server unreachable at ${url}.`);
      return mockFallback;
    }
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Unable to connect to Flask backend server. Please make sure python app.py is running.');
    }
    throw error;
  }
};

export const api = {
  // --- AUTHENTICATION METHODS (Direct MySQL Backend Integration) ---
  userSignup: async (email, password, username, phone) => {
    const payload = { email, password, username, phone };
    return await safeFetch(`${BASE_URL}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  userLogin: async (usernameOrEmail, password) => {
    const data = await safeFetch(`${BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail, password })
    });
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, role: 'citizen' }));
    }
    return { access_token: data.access_token, user: { ...data.user, role: 'citizen' } };
  },

  authoritySignup: async (email, password, username, department, phone) => {
    const payload = { email, password, username, department, phone };
    return await safeFetch(`${BASE_URL}/authority/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  authorityLogin: async (usernameOrEmail, password) => {
    const data = await safeFetch(`${BASE_URL}/authority/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail, password })
    });
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, role: 'authority' }));
    }
    return { access_token: data.access_token, user: { ...data.user, role: 'authority' } };
  },

  // --- SERVICE REQUESTS (Direct MySQL Backend Integration) ---
  getServices: async () => {
    try {
      const response = await fetch(`${BASE_URL}/services`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      console.warn("[Offline Mode] Backend unavailable, returning local cache.");
    }
    return getStoredServices();
  },

  getMyServices: async () => {
    try {
      const response = await fetch(`${BASE_URL}/services/me`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      console.warn("[Offline Mode] Backend unavailable, returning my local cache.");
    }
    return getStoredServices();
  },

  getAssignedTasks: async () => {
    try {
      const response = await fetch(`${BASE_URL}/services/assigned`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      console.warn("[Offline Mode] Backend unavailable, returning assigned tasks.");
    }
    return getStoredServices();
  },

  checkDuplicates: (category, lat, lng) => {
    const list = getStoredServices();
    return findPotentialDuplicates(category, lat, lng, list);
  },

  upvoteService: async (serviceId) => {
    const response = await fetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ upvote_count: 2 })
    });
    return await handleResponse(response);
  },

  createService: async (serviceData) => {
    const category = serviceData.sub_category || serviceData.category || serviceData.title;
    
    // Execute Smart Routing Engine
    const routingAnalysis = analyzeAndRouteComplaint(category, serviceData.title, serviceData.description);
    const slaDueDate = calculateSlaDueDate(new Date().toISOString(), routingAnalysis.priority);

    const initialStatus = routingAnalysis.isFastTracked 
      ? 'assigned' 
      : (routingAnalysis.requiresControllerReview ? 'submitted' : 'verified');

    const payload = {
      title: serviceData.title,
      description: serviceData.description,
      category: category,
      department: routingAnalysis.department,
      priority: routingAnalysis.priority,
      status: initialStatus,
      location: serviceData.location,
      latitude: serviceData.latitude,
      longitude: serviceData.longitude,
      image_url: serviceData.image_url,
      is_category_mismatch: routingAnalysis.isCategoryMismatch,
      suggested_department: routingAnalysis.suggestedDepartment,
      requires_controller_review: routingAnalysis.requiresControllerReview,
      is_fast_tracked: routingAnalysis.isFastTracked
    };

    // Save directly to MySQL database via Flask API
    const response = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await handleResponse(response);

    // Save offline cache & notification
    if (data && data.ticket_id) {
      saveStoredService(data);
      saveNotification({
        id: `notif_${Date.now()}`,
        title: `Complaint Lodged: #${data.ticket_id}`,
        message: `Your complaint "${serviceData.title || category}" has been submitted and saved to database.`,
        type: "update",
        ticket_id: data.ticket_id,
        icon: "FileWarning",
        color: "amber",
        is_unread: true,
        created_at: new Date().toISOString()
      });
    }

    return data;
  },

  updateServiceStatus: async (serviceId, newStatus, comments = '') => {
    return await safeFetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status: newStatus, comments })
    });
  },

  resolveServiceWithProof: async (serviceId, proofUrl, notes) => {
    return await safeFetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        status: 'resolved',
        resolution_proof_url: proofUrl,
        resolution_notes: notes
      })
    });
  },

  submitFeedback: async (serviceId, rating, comments) => {
    return await safeFetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        status: 'closed',
        feedback_rating: rating,
        feedback_comments: comments
      })
    });
  },

  rerouteService: async (serviceId, targetDept, comments = '') => {
    return await safeFetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        department: targetDept,
        requires_controller_review: false,
        is_category_mismatch: false,
        status: 'assigned',
        comments
      })
    });
  },

  getControllerQueue: async () => {
    const services = await api.getServices();
    const pending = services.filter(item => (item.requires_controller_review || item.is_category_mismatch || item.is_fast_tracked) && !item.controller_action);
    const processed = services.filter(item => !!item.controller_action);
    return { pending, processed, total: services.length };
  },

  clearAllServices: async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {}

    try {
      await fetch(`${BASE_URL}/services/clear_all`, { method: 'DELETE' });
    } catch (e) {}
  },

  // --- PROFILE STATS & MANAGEMENT ---
  getProfileStats: async () => {
    return safeFetch(
      `${BASE_URL}/profile/stats`,
      {
        method: 'GET',
        headers: getHeaders()
      },
      { total: 0, resolved: 0, in_progress: 0 }
    );
  },

  updateProfile: async (profileData) => {
    return safeFetch(
      `${BASE_URL}/profile/update`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          username: profileData.username,
          phone: profileData.phone
        })
      }
    );
  },

  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);

    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/profile/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    return await handleResponse(response);
  },

  changePassword: async (data) => {
    return safeFetch(
      `${BASE_URL}/profile/change_password`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password
        })
      }
    );
  },

  // --- NOTIFICATIONS ---
  getNotifications: async () => {
    try {
      const response = await fetch(`${BASE_URL}/notifications`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {}
    return getStoredNotifications();
  },

  markNotificationsRead: async () => {
    try {
      await fetch(`${BASE_URL}/notifications/read`, {
        method: 'PUT',
        headers: getHeaders()
      });
    } catch (e) {}
  }
};
