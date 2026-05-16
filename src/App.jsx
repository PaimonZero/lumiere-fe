/**
 * Lumiere AI — Root App (router-driven)
 * Auth guards: PrivateRoute (any authenticated), AdminRoute (admin only)
 */
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  selectIsAuthenticated,
  selectUser,
  fetchMe,
} from "./store/authSlice.js";
import LoginPage from "./pages/auth/LoginPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import LandingPage from "./pages/landing/LandingPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import TermsPage from "./pages/legal/TermsPage.jsx";
import PresentationListPage from "./pages/presentations/PresentationListPage.jsx";
import PresentationEditorPage from "./pages/presentations/PresentationEditorPage.jsx";
import PricingPage from "./pages/payment/PricingPage.jsx";
import QuizViewerPage from "./pages/quiz/QuizViewerPage.jsx";

/**
 * PrivateRoute — requires valid authentication.
 * On mount, verifies the stored token is still valid by calling /api/auth/me.
 * If the token is expired/invalid, auto-logout and redirect to /login.
 */
function PrivateRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user data and verify token
      dispatch(fetchMe());
    }
  }, [isAuthenticated, dispatch]);

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * AdminRoute — requires authenticated user with role === 'admin'.
 */
function AdminRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public routes */}
      <Route path="/terms" element={<TermsPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected routes — any authenticated user */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Presentation routes — full-screen editor (no MainLayout) */}
      <Route
        path="/presentations"
        element={
          <PrivateRoute>
            <PresentationListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/presentations/:id"
        element={
          <PrivateRoute>
            <PresentationEditorPage />
          </PrivateRoute>
        }
      />

      {/* Pricing / Payment */}
      <Route
        path="/pricing"
        element={
          <PrivateRoute>
            <PricingPage />
          </PrivateRoute>
        }
      />

      {/* Admin-only routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      {/* Fallback: redirect unknown paths to home (which will then go to /login if not authed) */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* Quiz viewer — requires auth */}
      <Route
        path="/quiz/:id"
        element={
          <PrivateRoute>
            <QuizViewerPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
