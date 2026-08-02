import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Not logged in at all — send to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role — redirect to their correct dashboard
  if (role && currentUser.role !== role) {
    const correctDashboard = currentUser.role === 'authority'
      ? '/authority/dashboard'
      : '/citizen/dashboard';
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
}
