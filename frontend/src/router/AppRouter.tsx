// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Onboarding from '../pages/Onboarding'
import Dashboard from '../pages/Dashboard'
import CalendarPage from '../pages/Calendar'
import Trends from '../pages/Trends'
import ImportPage from '../pages/Import'
import Profile from '../pages/Profile'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import ThemeToggle from '../components/ThemeToggle'
import AppNav from '../components/AppNav';
import ForgotPassword    from '../pages/ForgotPassword'
import ConfirmEmailSent  from '../pages/ConfirmEmailSent'

// A simple protected wrapper
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />
}

export default function AppRouter() {
  const { profile } = useProfile()

  return (
    <BrowserRouter>
      {/* Global header with theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="auth">
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password"       element={<ForgotPassword />} />
          <Route path="confirm-email-sent"   element={<ConfirmEmailSent />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="calendar"
          element={
            <ProtectedRoute>
            <AppNav> 
            <CalendarPage />
            </AppNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="trends"
          element={
            <ProtectedRoute>
              <AppNav >  
              <Trends />
              </AppNav >
            </ProtectedRoute>
          }
        />

        <Route
          path="import"
          element={
            <ProtectedRoute>
            <AppNav> 
              <ImportPage />
            </AppNav>   
            </ProtectedRoute>
          }
        />

        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <AppNav>  
                <Profile />
              </AppNav>
            </ProtectedRoute>
          }
        />
        <Route
          path="onboarding"
          element={
            <ProtectedRoute>
              {profile?.has_completed_onboarding ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Onboarding />
              )}
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}