
  import { lazy, Suspense, useEffect } from "react";
  import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Provider } from "react-redux";
  import AOS from "aos";
import { afroTheme } from "./theme";
import App from "./app/App.tsx";
import Home from "./app/pages/Home.tsx";
import SignUpPage from "./app/pages/SignUpPage.tsx";
import AuthLayout from "./app/features/auth/AuthLayout.tsx";
import Store from "./app/store";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "aos/dist/aos.css";
import "./styles/index.css";

// Layout + pages (now all under app/)
import LegacyLayout from "./app/components/layout/LegacyLayout.tsx";
import JobPage from "./app/pages/JobPage.tsx";
import ApplyJobPage from "./app/pages/ApplyJobPage.tsx";
import FindTalentPage from "./app/pages/FindTalentPage.tsx";
import TalentProfilePage from "./app/pages/TalentProfilePage.tsx";
import CompanyPage from "./app/pages/CompanyPage.tsx";
import PostedJobPage from "./app/pages/PostedJobPage.tsx";
import PostJobPage from "./app/pages/PostJobPage.tsx";
import ProfilePage from "./app/pages/ProfilePage.tsx";
import NotFoundPage from "./app/pages/NotFoundPage.tsx";
import Unauthorized from "./app/pages/UnauthroizedPage.tsx";
import DepartmentPage from "./app/pages/DepartmentPage.tsx";
import ProtectedRoute from "./app/services/protected-route.tsx";
import PublicRoute from "./app/services/public-route.tsx";

const JobHistoryPage = lazy(() => import("./app/pages/JobHistoryPage.tsx"));
const SwipeJobsPage = lazy(() => import("./app/pages/SwipeJobsPage.tsx"));

function AppBootstrap() {
  useEffect(() => {
    AOS.init({ offset: 0, duration: 800, easing: "ease-out" });
    AOS.refresh();
  }, []);

  return (
    <Routes>
      {/* Modern routes */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/dashboard" element={<App />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Navigate to="/dashboard?tab=admin" replace /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Navigate to="/dashboard?tab=admin" replace /></ProtectedRoute>} />

      {/* Auth routes – lightweight shell, no Header/Footer duplication */}
      <Route element={<AuthLayout />}>
        <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      </Route>

      {/* Legacy portal routes */}
      <Route element={<LegacyLayout />}>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/find-jobs" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><Navigate to="/dashboard?tab=candidates&section=job-history" replace /></ProtectedRoute>} />
        <Route path="/swipe" element={<ProtectedRoute allowedRoles={["APPLICANT"]}><Suspense fallback={<div className="p-4 text-sm text-slate-300">Loading swipe...</div>}><SwipeJobsPage /></Suspense></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><JobPage /></ProtectedRoute>} />
        <Route path="/apply-job/:id" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><ApplyJobPage /></ProtectedRoute>} />
        <Route path="/find-talent" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><FindTalentPage /></ProtectedRoute>} />
        <Route path="/talent-profile/:id" element={<ProtectedRoute allowedRoles={["APPLICANT", "EMPLOYER", "ADMIN"]}><TalentProfilePage /></ProtectedRoute>} />
        <Route path="/company" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><Navigate to="/find-jobs" replace /></ProtectedRoute>} />
        <Route path="/company/:name" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><CompanyPage /></ProtectedRoute>} />
        <Route path="/job-history" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><Suspense fallback={<div className="p-4 text-sm text-slate-300">Loading history...</div>}><JobHistoryPage /></Suspense></ProtectedRoute>} />
        <Route path="/posted-jobs/:id" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><PostedJobPage /></ProtectedRoute>} />
        <Route path="/post-job/:id" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><PostJobPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><DepartmentPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["APPLICANT", "STUDENT", "ADMIN", "EMPLOYER"]}><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <Provider store={Store}>
    <MantineProvider theme={afroTheme} defaultColorScheme="light">
      <BrowserRouter>
        <AppBootstrap />
      </BrowserRouter>
    </MantineProvider>
  </Provider>
);
  