import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppLayout from './components/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FounderDashboard from './pages/FounderDashboard';
import FounderProjectsPage from './pages/FounderProjectsPage';
import FounderMatchesPage from './pages/FounderMatchesPage';
import FounderSettingsPage from './pages/FounderSettingsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectWorkspacePage from './pages/ProjectWorkspacePage';
import DeveloperDashboard from './pages/DeveloperDashboard';
import DeveloperProfilePage from './pages/DeveloperProfilePage';
import DeveloperSettingsPage from './pages/DeveloperSettingsPage';
import PaymentsPage from './pages/PaymentsPage';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-500 bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading DevMatch AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes with Top Navbar and Public Footer */}
            <Route
              path="/"
              element={
                <div className="flex flex-col min-h-screen bg-slate-50">
                  <Navbar />
                  <main className="flex-grow">
                    <LandingPage />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/login"
              element={
                <div className="flex flex-col min-h-screen bg-slate-50">
                  <Navbar />
                  <main className="flex-grow">
                    <LoginPage />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/register"
              element={
                <div className="flex flex-col min-h-screen bg-slate-50">
                  <Navbar />
                  <main className="flex-grow">
                    <RegisterPage />
                  </main>
                  <Footer />
                </div>
              }
            />

            {/* Founder Routes with Sidebar Shell */}
            <Route
              path="/founder"
              element={
                <ProtectedRoute allowedRoles={['FOUNDER', 'ADMIN']}>
                  <FounderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/projects"
              element={
                <ProtectedRoute allowedRoles={['FOUNDER', 'ADMIN']}>
                  <FounderProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/matches"
              element={
                <ProtectedRoute allowedRoles={['FOUNDER', 'ADMIN']}>
                  <FounderMatchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder/settings"
              element={
                <ProtectedRoute allowedRoles={['FOUNDER', 'ADMIN']}>
                  <FounderSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-project"
              element={
                <ProtectedRoute allowedRoles={['FOUNDER', 'ADMIN']}>
                  <CreateProjectPage />
                </ProtectedRoute>
              }
            />

            {/* Shared Project Workspace with Escrow & WhatsApp Chat */}
            <Route
              path="/project/:id"
              element={
                <ProtectedRoute>
                  <ProjectWorkspacePage />
                </ProtectedRoute>
              }
            />

            {/* Developer Routes with Sidebar Shell */}
            <Route
              path="/developer"
              element={
                <ProtectedRoute allowedRoles={['DEVELOPER', 'ADMIN']}>
                  <DeveloperDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/profile"
              element={
                <ProtectedRoute allowedRoles={['DEVELOPER', 'ADMIN']}>
                  <DeveloperProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/settings"
              element={
                <ProtectedRoute allowedRoles={['DEVELOPER', 'ADMIN']}>
                  <DeveloperSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Payments & Escrow Ledger */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Console */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
