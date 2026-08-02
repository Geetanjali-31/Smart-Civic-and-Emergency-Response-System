import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Info, ShieldAlert, FileWarning, ArrowRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { normalizeDepartment } from '../utils/departmentMatcher';

const ICONS = { ShieldAlert, FileWarning, CheckCircle2, Info, Bell, AlertTriangle };

export default function Notifications() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isAuthority = location.pathname.startsWith('/authority');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await api.getNotifications(token);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthority]);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.markNotificationsRead(token);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateString) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
    const diff = new Date(dateString) - new Date();
    const ds = Math.round(diff / 1000);
    if (Math.abs(ds) < 60) return "Just now";
    const dm = Math.round(ds / 60);
    const dh = Math.round(dm / 60);
    const dd = Math.round(dh / 24);
    if (Math.abs(dm) < 60) return rtf.format(dm, 'minute');
    if (Math.abs(dh) < 24) return rtf.format(dh, 'hour');
    return rtf.format(dd, 'day');
  };

  const getColorClasses = (color, isUnread) => {
    switch (color) {
      case 'red': 
        return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', textTitle: 'text-red-900', unreadDot: 'bg-red-500' };
      case 'blue': 
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', textTitle: 'text-blue-900', unreadDot: 'bg-blue-500' };
      case 'emerald': 
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', textTitle: 'text-emerald-900', unreadDot: 'bg-emerald-500' };
      case 'amber': 
        return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', textTitle: 'text-amber-900', unreadDot: 'bg-amber-500' };
      default: // default slate
        return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500', textTitle: 'text-slate-900', unreadDot: 'bg-primary-500' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center tracking-tight">
            <Bell className="w-8 h-8 mr-3 text-primary-600" />
            {isAuthority ? "System Alerts" : "Notifications"}
          </h1>
          <p className="text-slate-500">
            {isAuthority 
              ? "Critical system alerts and task assignments." 
              : "Updates on your complaints and emergency requests."}
          </p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="mt-4 sm:mt-0 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Skeleton Loaders
          [1, 2, 3].map((n) => (
             <div key={n} className="bg-white rounded-xl p-5 border border-slate-200 flex items-start space-x-4 animate-pulse">
               <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
               <div className="flex-1 space-y-3">
                 <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                 <div className="h-4 bg-slate-200 rounded w-full"></div>
                 <div className="h-4 bg-slate-200 rounded w-2/3"></div>
               </div>
             </div>
          ))
        ) : (
          // Real Data
          (() => {
            const defaultFallbackNotifs = isAuthority ? [
              {
                id: 'sys_1',
                title: '⚡ System Online & Department Dispatch Active',
                message: 'SevaSetu Command Center is operational. Department-wise complaint routing is active.',
                type: 'system',
                ticket_id: 'SYS-2026-001',
                color: 'emerald',
                icon: 'ShieldAlert',
                is_unread: true,
                created_at: new Date().toISOString()
              },
              {
                id: 'sys_2',
                title: '🔔 Auto-Routing Rule Verified',
                message: 'All incoming civic complaints and emergency requests will be auto-dispatched to department dashboards.',
                type: 'assignment',
                ticket_id: 'SYS-2026-002',
                color: 'blue',
                icon: 'Bell',
                is_unread: true,
                created_at: new Date().toISOString()
              }
            ] : [
              {
                id: 'sys_3',
                title: '👋 Welcome to SevaSetu Citizen Portal',
                message: 'Submit non-emergency civic complaints or request emergency medical, fire, or police assistance anytime.',
                type: 'update',
                ticket_id: 'SYS-2026-003',
                color: 'amber',
                icon: 'FileWarning',
                is_unread: true,
                created_at: new Date().toISOString()
              }
            ];

            const rawList = notifications && notifications.length > 0 ? notifications : defaultFallbackNotifs;
            const userDeptKey = currentUser?.department ? normalizeDepartment(currentUser.department) : 'all';

            const displayedNotifications = rawList.filter(n => {
              const roleMatch = !n.recipient_role || n.recipient_role === 'all' || n.recipient_role === 'system' ||
                (isAuthority ? n.recipient_role === 'authority' : n.recipient_role === 'citizen');
              if (!roleMatch) return false;

              if (isAuthority && userDeptKey !== 'all') {
                const notifDeptKey = n.department ? normalizeDepartment(n.department) : 'all';
                return notifDeptKey === 'all' || notifDeptKey === userDeptKey;
              }
              return true;
            });

            return displayedNotifications.map((notification) => {
              const Icon = ICONS[notification.icon] || Bell;
              const colors = getColorClasses(notification.color, notification.is_unread);
              const dynamicLink = notification.ticket_id 
                ? (isAuthority ? '/authority/tasks' : '/citizen/tracking')
                : null;

            return (
              <div 
                key={notification.id} 
                className={`relative bg-white rounded-xl p-5 sm:p-6 transition-all border outline-none 
                  ${notification.is_unread ? `shadow-sm ${colors.border}` : 'border-slate-100'} 
                  ${dynamicLink ? 'hover:shadow-md cursor-pointer hover:-translate-y-0.5 group' : ''}
                `}
              >
                {dynamicLink && (
                  <Link to={dynamicLink} className="absolute inset-0 z-10">
                    <span className="sr-only">View Details</span>
                  </Link>
                )}

                <div className="flex gap-4 sm:gap-6 relative z-0">
                  {/* Icon */}
                  <div className={`mt-1 shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex justify-center items-center ${notification.is_unread ? colors.bg : 'bg-slate-50'} ${colors.icon}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-1 sm:gap-4">
                      <h3 className={`text-base sm:text-lg font-bold ${notification.is_unread ? colors.textTitle : 'text-slate-700'}`}>
                        {notification.title}
                      </h3>
                      <span className="flex items-center text-xs font-semibold text-slate-400 shrink-0 bg-slate-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3 mr-1" />
                        {timeAgo(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className={`text-sm sm:text-base ${notification.is_unread ? 'text-slate-700' : 'text-slate-500'} leading-relaxed mb-3`}>
                      {notification.message}
                    </p>

                    {notification.ticket_id && (
                      <span className="inline-flex items-center text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                        Ticket: {notification.ticket_id}
                      </span>
                    )}

                    {dynamicLink && (
                      <div className="flex items-center text-sm font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    )}
                  </div>

                  {/* Unread Indicator */}
                  {notification.is_unread && (
                    <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${colors.unreadDot} animate-pulse`}></div>
                  )}
                </div>
              </div>
            );
          });
        })()
        )}
      </div>

    </div>
  );
}
