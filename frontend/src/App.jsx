import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import PlaceholderPage from "./pages/PlaceholderPage";
import Contacts from "./pages/Contacts";
import QueueMonitor from "./pages/QueueMonitor";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Automations from "./pages/Automations";
import Billing from "./pages/Billing";
import AdminLayout from "./components/layout/AdminLayout";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminBenchmark from "./pages/admin/AdminBenchmark";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />

        {/* Dashboard Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/contacts" element={<PageWrapper><Contacts /></PageWrapper>} />
          <Route path="/templates" element={<PageWrapper><Templates /></PageWrapper>} />
          <Route path="/campaigns" element={<PageWrapper><Campaigns /></PageWrapper>} />
          <Route path="/automations" element={<PageWrapper><Automations /></PageWrapper>} />
          <Route path="/queue-monitor" element={<PageWrapper><QueueMonitor /></PageWrapper>} />
          <Route path="/analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="/billing" element={<PageWrapper><Billing /></PageWrapper>} />
        </Route>
        {/* ================= SUPERADMIN PORTAL ================= */}
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Navigate to="/admin/tenants" replace />} />
  <Route path="tenants" element={<AdminTenants />} />
  <Route path="queue-monitor" element={<PageWrapper><QueueMonitor /></PageWrapper>} />
  <Route path="benchmark" element={<AdminBenchmark />} />
</Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}