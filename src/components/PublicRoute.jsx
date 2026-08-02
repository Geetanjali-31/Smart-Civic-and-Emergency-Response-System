import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    // If user is already logged in, redirect them to their respective dashboard
    const dashboardPath = currentUser.role === 'authority' 
      ? '/authority/dashboard' 
      : '/citizen/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}
