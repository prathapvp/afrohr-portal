
  import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { MantineProvider } from "@mantine/core";
import { afroTheme } from "./theme";
import App from "./app/App.tsx";
import Home from "./app/pages/Home.tsx";
import SignUpPage from "./app/pages/SignUpPage.tsx";
import AuthLayout from "./app/features/auth/AuthLayout.tsx";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/index.css";

// Layout + pages (now all under app/)
import LegacyLayout from "./app/components/layout/LegacyLayout.tsx";
import HomePage from "./app/pages/HomePage.tsx";
import FindJobsPage from "./app/pages/FindJobsPage.tsx";
import JobPage from "./app/pages/JobPage.tsx";
import ApplyJobPage from "./app/pages/ApplyJobPage.tsx";
import FindTalentPage from "./app/pages/FindTalentPage.tsx";
import TalentProfilePage from "./app/pages/TalentProfilePage.tsx";
import CompanyPage from "./app/pages/CompanyPage.tsx";
import JobHistoryPage from "./app/pages/JobHistoryPage.tsx";
import PostedJobPage from "./app/pages/PostedJobPage.tsx";
import PostJobPage from "./app/pages/PostJobPage.tsx";
import ProfilePage from "./app/pages/ProfilePage.tsx";
import NotFoundPage from "./app/pages/NotFoundPage.tsx";
import SwipeJobsPage from "./app/pages/SwipeJobsPage.tsx";
import Unauthorized from "./app/pages/UnauthroizedPage.tsx";
import DepartmentPage from "./app/pages/DepartmentPage.tsx";
import ProtectedRoute from "./app/services/protected-route.tsx";
import PublicRoute from "./app/services/public-route.tsx";

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={afroTheme} defaultColorScheme="light">
  <BrowserRouter>
    <Routes>
      {/* Modern routes */}
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<App />} />

      {/* Auth routes – lightweight Mantine + Redux providers, no Header/Footer */}
      <Route element={<AuthLayout />}>
        <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      </Route>

      {/* Legacy portal routes – wrapped with Mantine + Redux providers */}
      <Route element={<LegacyLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/find-jobs" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><FindJobsPage /></ProtectedRoute>} />
        <Route path="/swipe" element={<ProtectedRoute allowedRoles={["APPLICANT"]}><SwipeJobsPage /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><JobPage /></ProtectedRoute>} />
        <Route path="/apply-job/:id" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><ApplyJobPage /></ProtectedRoute>} />
        <Route path="/find-talent" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><FindTalentPage /></ProtectedRoute>} />
        <Route path="/talent-profile/:id" element={<ProtectedRoute allowedRoles={["APPLICANT", "EMPLOYER", "ADMIN"]}><TalentProfilePage /></ProtectedRoute>} />
        <Route path="/company/:name" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><CompanyPage /></ProtectedRoute>} />
        <Route path="/job-history" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN"]}><JobHistoryPage /></ProtectedRoute>} />
        <Route path="/posted-jobs/:id" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><PostedJobPage /></ProtectedRoute>} />
        <Route path="/post-job/:id" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><PostJobPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={["EMPLOYER", "ADMIN"]}><DepartmentPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["APPLICANT", "ADMIN", "EMPLOYER"]}><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
  </MantineProvider>
);
  