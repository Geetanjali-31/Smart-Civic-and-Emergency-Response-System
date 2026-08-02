import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import Landing from './pages/Landing';

// Citizen Pages
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssue from './pages/ReportIssue';
import EmergencyReport from './pages/EmergencyReport';
import IssueTracking from './pages/IssueTracking';
import Notifications from './pages/Notifications';
import IssueDetails from './pages/IssueDetails';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './Signup.jsx';

// Authority Pages
import AuthorityDashboard from './pages/AuthorityDashboard';
import LiveRequests from './pages/LiveRequests';
import AuthorityMap from './pages/AuthorityMap';
import DepartmentDashboard from './pages/DepartmentDashboard';

function App() {
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('app_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.colorTheme && prefs.colorTheme !== 'blue') {
          document.documentElement.className = `theme-${prefs.colorTheme}`;
        }
      }
    } catch (e) {}
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
          {/* Public Routes with Top Navbar / Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Signup />} />

          {/* Citizen Portal Routes with Sidebar */}
          <Route path="/citizen" element={
            <ProtectedRoute role="citizen">
              <DashboardLayout role="citizen" />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="dashboard" element={<CitizenDashboard />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="emergency" element={<EmergencyReport />} />
            {/* Mapping complaints to tracking page for now */}
            <Route path="complaints" element={<IssueTracking />} />
            <Route path="tracking" element={<IssueTracking />} />
            <Route path="tracking/:id" element={<IssueDetails />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Authority Portal Routes with Sidebar */}
          <Route path="/authority" element={
            <ProtectedRoute role="authority">
              <DashboardLayout role="authority" />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/authority/dashboard" replace />} />
            <Route path="dashboard" element={<AuthorityDashboard />} />
            <Route path="requests" element={<LiveRequests />} />
            <Route path="map" element={<AuthorityMap />} />
            <Route path="department/:deptCode" element={<DepartmentDashboard />} />
            <Route path="tasks" element={<IssueTracking />} />
            <Route path="tasks/:id" element={<IssueDetails />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<IssueTracking />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/department/:deptCode" element={<DepartmentDashboard />} />
        </Routes>
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
