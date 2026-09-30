import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import "./styles/product.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const PublicStatus = lazy(() => import("./pages/PublicStatus"));
const Register = lazy(() => import("./pages/Register"));
const SiteDetail = lazy(() => import("./pages/SiteDetail"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading)
    return <div className="app-loading">Loading Uptime Sentinel…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading)
    return <div className="app-loading">Loading Uptime Sentinel…</div>;

  return (
    <Suspense
      fallback={<div className="app-loading">Loading Uptime Sentinel…</div>}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <Register />}
        />
        <Route path="/status/:slug" element={<PublicStatus />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites/:id"
          element={
            <ProtectedRoute>
              <SiteDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
