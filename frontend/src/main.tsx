
  import { lazy, Suspense, useEffect } from "react";
  import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
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
import AboutPage from "./app/pages/AboutPage.tsx";
import ContactPage from "./app/pages/ContactPage.tsx";
import TeamPage from "./app/pages/TeamPage.tsx";
import WhatIsAfroHRPage from "./app/pages/WhatIsAfroHRPage.tsx";
import AfroHRForEmployersCandidatesPage from "./app/pages/AfroHRForEmployersCandidatesPage.tsx";
import ProtectedRoute from "./app/services/protected-route.tsx";
import PublicRoute from "./app/services/public-route.tsx";

const JobHistoryPage = lazy(() => import("./app/pages/JobHistoryPage.tsx"));
const SwipeJobsPage = lazy(() => import("./app/pages/SwipeJobsPage.tsx"));

const SEO_META: Array<{ pattern: RegExp; title: string; description: string }> = [
  {
    pattern: /^\/$|^\/home$/,
    title: "AfroHR | Talent Network for Hiring and Careers",
    description: "Discover your next career move with AfroHR. Curated jobs, hiring insights, and employer tools for modern recruitment.",
  },
  {
    pattern: /^\/dashboard/,
    title: "Dashboard | AfroHR",
    description: "Access your AfroHR dashboard for jobs, hiring workflows, student guidance, and admin insights.",
  },
  {
    pattern: /^\/login$/,
    title: "Login | AfroHR",
    description: "Securely sign in to AfroHR to access your dashboard and hiring or career tools.",
  },
  {
    pattern: /^\/signup$/,
    title: "Sign Up | AfroHR",
    description: "Create your AfroHR account to discover jobs, manage applications, and hire top talent.",
  },
  {
    pattern: /^\/find-jobs$/,
    title: "Find Jobs | AfroHR",
    description: "Explore curated job opportunities and discover your next role with AfroHR.",
  },
  {
    pattern: /^\/find-talent$/,
    title: "Find Talent | AfroHR",
    description: "Discover qualified candidates and streamline your recruitment process with AfroHR.",
  },
  {
    pattern: /^\/profile$/,
    title: "Profile | AfroHR",
    description: "Manage your AfroHR profile, skills, and account details.",
  },
  {
    pattern: /^\/about$/,
    title: "About AfroHR | Mission, Trust, and Timeline",
    description: "Learn about AfroHR's mission, trust principles, timeline, and approach to modern hiring and careers.",
  },
  {
    pattern: /^\/contact$/,
    title: "Contact AfroHR | Support and Partnerships",
    description: "Contact AfroHR for support, employer partnerships, and career guidance with clear response expectations.",
  },
  {
    pattern: /^\/team$/,
    title: "Team AfroHR | Leadership and Platform Operations",
    description: "Meet the AfroHR team behind platform strategy, talent advisory, and product operations.",
  },
  {
    pattern: /^\/what-is-afrohr$/,
    title: "What Is AfroHR | Brand and Platform Overview",
    description: "Understand what AfroHR is, who it serves, and how it supports hiring and career outcomes.",
  },
  {
    pattern: /^\/afrohr-for-employers-candidates$/,
    title: "AfroHR for Employers and Candidates",
    description: "Explore how AfroHR helps employers hire faster and helps candidates grow their careers.",
  },
];

function upsertMeta(name: string, content: string, isProperty = false) {
  const selector = isProperty ? `meta[property=\"${name}\"]` : `meta[name=\"${name}\"]`;
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    if (isProperty) {
      element.setAttribute("property", name);
    } else {
      element.setAttribute("name", name);
    }
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let element = document.querySelector("link[rel=\"canonical\"]") as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function normalizeCanonicalPath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  if (pathname === "/home") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isNoIndexRoute(pathname: string) {
  return [
    /^\/login$/,
    /^\/signup$/,
    /^\/unauthorized$/,
    /^\/dashboard/,
    /^\/find-jobs$/,
    /^\/jobs\//,
    /^\/find-talent$/,
    /^\/company(?:\/|$)/,
    /^\/profile$/,
    /^\/swipe$/,
    /^\/job-history$/,
    /^\/apply-job\//,
    /^\/posted-jobs\//,
    /^\/post-job\//,
    /^\/talent-profile\//,
    /^\/departments$/,
  ].some((pattern) => pattern.test(pathname));
}

function SeoRouteMeta() {
  const location = useLocation();

  useEffect(() => {
    const matched = SEO_META.find((entry) => entry.pattern.test(location.pathname));
    const title = matched?.title ?? "AfroHR";
    const description = matched?.description ?? "AfroHR Talent Network helps candidates, employers, students, and admins discover opportunities, hire talent, and manage hiring workflows.";
    const canonical = `https://afrohr.in${normalizeCanonicalPath(location.pathname)}`;
    const robots = isNoIndexRoute(location.pathname) ? "noindex, nofollow" : "index, follow";

    document.title = title;
    upsertMeta("description", description);
    upsertMeta("robots", robots);
    upsertMeta("og:title", title, true);
    upsertMeta("og:description", description, true);
    upsertMeta("og:url", canonical, true);
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertCanonical(canonical);
  }, [location.pathname]);

  return null;
}

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
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/what-is-afrohr" element={<WhatIsAfroHRPage />} />
      <Route path="/afrohr-for-employers-candidates" element={<AfroHRForEmployersCandidatesPage />} />
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
        <SeoRouteMeta />
        <AppBootstrap />
      </BrowserRouter>
    </MantineProvider>
  </Provider>
);
  