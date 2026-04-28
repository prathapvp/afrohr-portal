import { Notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router";
import { Briefcase, ChartBar, Compass, History, LayoutDashboard, Sparkles, Users } from "lucide-react";
import PremiumNavbar from "./components/layout/PremiumNavbar";
import PremiumSidebar from "./components/layout/PremiumSidebar";
import { Card, CardContent } from "./components/ui/card";
import { useDashboardController } from "./dashboard/useDashboardController";
import type { CandidateJob, CareerItem } from "./dashboard/types";
import Departments from "./features/departments/Departments";
import EmploymentTypes from "./features/employment-types/EmploymentTypes";
import Industries from "./features/industries/Industries";
import WorkModes from "./features/work-modes/WorkModes";
import { setupResponseInterceptor } from "./interceptor/AxiosInterceptor";
import { useAppDispatch } from "./store";
import { useAppSelector } from "./store";
import { selectAccountType } from "./store/selectors/authSelectors";

const CandidateDashboardView = lazy(() => import("./dashboard/CandidateDashboardView"));
const StudentDashboardView = lazy(() => import("./dashboard/StudentDashboardView"));
const AdminDashboardView = lazy(() => import("./dashboard/AdminDashboardView"));
const AdminBillingControlPage = lazy(() => import("./dashboard/AdminBillingControlPage"));
const AdminSubscriptionRequestsPage = lazy(() => import("./dashboard/AdminSubscriptionRequestsPage"));
const AdminSubscriptionSnapshotPage = lazy(() => import("./dashboard/AdminSubscriptionSnapshotPage"));
const FindJobsPage = lazy(() => import("./pages/FindJobsPage"));
const JobHistoryPage = lazy(() => import("./pages/JobHistoryPage"));
const SwipeJobsPage = lazy(() => import("./pages/SwipeJobsPage"));
const EmployerSubscriptionPage = lazy(() => import("./features/employer/EmployerSubscriptionPage"));
const EmployerView = lazy(() => import("./features/employer").then((module) => ({ default: module.EmployerView })));
const EmployerJobsPage = lazy(() => import("./features/employer").then((module) => ({ default: module.EmployerJobsPage })));
const SearchCandidatesPage = lazy(() => import("./features/employer").then((module) => ({ default: module.SearchCandidatesPage })));
const EmployerTeamAccessPage = lazy(() => import("./features/employer").then((module) => ({ default: module.EmployerTeamAccessPage })));

export default function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const accountType = useAppSelector(selectAccountType);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    setupResponseInterceptor(navigate, dispatch);
  }, [navigate, dispatch]);

  const {
    activeTab,
    adminError,
    adminLoading,
    adminOverview,
    adminSection,
    candidateSection,
    candidateDashboard,
    deptModalOpen,
    empTypeModalOpen,
    employerSection,
    error,
    handleSearch,
    handleSidebarNav,
    handleViewAllJobs,
    handleViewJob,
    indModalOpen,
    loading,
    payload,
    searchLoading,
    searchQuery,
    searchResults,
    searchCandidatesRefreshSeed,
    setDeptModalOpen,
    setEmpTypeModalOpen,
    setIndModalOpen,
    setSearchQuery,
    setWorkModeModalOpen,
    sidebarActiveLabel,
    viewedJobIds,
    workModeModalOpen,
  } = useDashboardController();

  const mobileActions = activeTab === "candidates"
    ? [
        { label: "Candidate", shortLabel: "Home", icon: LayoutDashboard },
        { label: "Find Jobs", shortLabel: "Jobs", icon: Compass },
        { label: "Job History", shortLabel: "History", icon: History },
        { label: "Swipe Mode", shortLabel: "Swipe", icon: Sparkles },
      ]
    : activeTab === "employers"
      ? [
          { label: "Employer", shortLabel: "Home", icon: LayoutDashboard },
          { label: "Posted Jobs", shortLabel: "Jobs", icon: Briefcase },
          { label: "Search Candidates", shortLabel: "Search", icon: Users },
          { label: "Subscription", shortLabel: "Plan", icon: ChartBar },
        ]
      : activeTab === "students"
        ? [
            { label: "Student", shortLabel: "Home", icon: LayoutDashboard },
            { label: "Career Roadmap", shortLabel: "Roadmap", icon: Compass },
            { label: "AI Advisor", shortLabel: "Advisor", icon: Sparkles },
            { label: "My Profile", shortLabel: "Profile", icon: Users },
          ]
        : [
            { label: "Admin", shortLabel: "Home", icon: LayoutDashboard },
            { label: "Snapshot", shortLabel: "Snapshot", icon: ChartBar },
            { label: "Billing Control", shortLabel: "Billing", icon: Briefcase },
            { label: "Requests", shortLabel: "Requests", icon: Users },
          ];

  const accountTypeTabMap: Record<string, string> = {
    APPLICANT: "candidates",
    CANDIDATE: "candidates",
    EMPLOYER: "employers",
    STUDENT: "students",
    ADMIN: "admin",
  };

  const expectedTab = accountTypeTabMap[accountType];

  return (
    <>
      <div className="premium-shell flex h-screen w-full flex-col">
        <Notifications position="top-center" zIndex={2001} />
        <PremiumNavbar />
        <div className="flex min-h-0 flex-1">
          <PremiumSidebar active={sidebarActiveLabel} onNav={handleSidebarNav} />
          <div className="min-w-0 flex-1 overflow-y-auto p-1 pb-20 sm:p-3 sm:pb-4">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-[0_20px_56px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:space-y-6 sm:rounded-3xl sm:p-4">
              {loading && (
                <Card>
                  <CardContent className="p-6 text-sm text-gray-500 sm:p-8">Loading dashboard data from backend...</CardContent>
                </Card>
              )}

              {!loading && error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6 sm:p-8">
                    <p className="font-semibold text-red-700">Unable to load backend data</p>
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}

              {!loading && !error && activeTab === "candidates" && candidateSection === "overview" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading module...</CardContent></Card>}>
                  <CandidateDashboardView
                    dashboard={candidateDashboard}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={handleSearch}
                    onViewAllJobs={handleViewAllJobs}
                    onViewJob={handleViewJob}
                    viewedJobIds={viewedJobIds}
                    searchLoading={searchLoading}
                    searchResults={searchResults as CandidateJob[] | null}
                  />
                </Suspense>
              )}

              {!loading && !error && activeTab === "candidates" && candidateSection === "find-jobs" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading jobs...</CardContent></Card>}>
                  <FindJobsPage embedded />
                </Suspense>
              )}

              {!loading && !error && activeTab === "candidates" && candidateSection === "job-history" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading history...</CardContent></Card>}>
                  <JobHistoryPage embedded />
                </Suspense>
              )}

              {!loading && !error && activeTab === "candidates" && candidateSection === "swipe" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading swipe view...</CardContent></Card>}>
                  <SwipeJobsPage embedded />
                </Suspense>
              )}

              {!loading && !error && activeTab === "employers" && employerSection === "overview" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading employer dashboard...</CardContent></Card>}>
                  <EmployerView dashboard={payload.dashboards.employers} />
                </Suspense>
              )}

              {!loading && !error && activeTab === "employers" && employerSection === "subscription" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading subscription...</CardContent></Card>}>
                  <EmployerSubscriptionPage />
                </Suspense>
              )}

              {!loading && !error && activeTab === "employers" && employerSection === "viewall" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading posted jobs...</CardContent></Card>}>
                  <EmployerJobsPage />
                </Suspense>
              )}

              {!loading && !error && activeTab === "employers" && employerSection === "search-candidates" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading candidates...</CardContent></Card>}>
                  <SearchCandidatesPage key={`search-candidates-${searchCandidatesRefreshSeed}`} />
                </Suspense>
              )}

              {!loading && !error && activeTab === "employers" && employerSection === "team" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading team access...</CardContent></Card>}>
                  <EmployerTeamAccessPage />
                </Suspense>
              )}

              {!loading && !error && activeTab === "students" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading student dashboard...</CardContent></Card>}>
                  <StudentDashboardView
                    dashboard={payload.dashboards.students}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={handleSearch}
                    searchLoading={searchLoading}
                    searchResults={searchResults as CareerItem[] | null}
                  />
                </Suspense>
              )}

              {!loading && !error && activeTab === "admin" && adminSection === "overview" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading admin overview...</CardContent></Card>}>
                  <AdminDashboardView overview={adminOverview} loading={adminLoading} error={adminError} />
                </Suspense>
              )}

              {!loading && !error && activeTab === "admin" && adminSection === "billing-control" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading billing controls...</CardContent></Card>}>
                  <AdminBillingControlPage overview={adminOverview} loading={adminLoading} error={adminError} />
                </Suspense>
              )}

              {!loading && !error && activeTab === "admin" && adminSection === "subscription-requests" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading requests...</CardContent></Card>}>
                  <AdminSubscriptionRequestsPage />
                </Suspense>
              )}

              {!loading && !error && activeTab === "admin" && adminSection === "subscription-snapshot" && (
                <Suspense fallback={<Card><CardContent className="p-6 text-sm text-gray-400">Loading subscription snapshot...</CardContent></Card>}>
                  <AdminSubscriptionSnapshotPage overview={adminOverview} loading={adminLoading} error={adminError} />
                </Suspense>
              )}
            </div>
          </div>
        </div>

        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a1222]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl">
            <div className="grid grid-cols-4 gap-1">
              {mobileActions.map(({ label, shortLabel, icon: Icon }) => {
                const isActive = sidebarActiveLabel === label || (label.toLowerCase() === activeTab);
                const isDisabledByRole = Boolean(expectedTab && ["Candidate", "Employer", "Student", "Admin"].includes(label) && label.toLowerCase() !== expectedTab);

                return (
                  <button
                    key={label}
                    onClick={() => handleSidebarNav(label)}
                    disabled={isDisabledByRole}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-100"
                        : "text-slate-300 hover:bg-white/10"
                    } ${isDisabledByRole ? "opacity-35" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Departments opened={deptModalOpen} onClose={() => setDeptModalOpen(false)} />
      <Industries opened={indModalOpen} onClose={() => setIndModalOpen(false)} />
      <EmploymentTypes opened={empTypeModalOpen} onClose={() => setEmpTypeModalOpen(false)} />
      <WorkModes opened={workModeModalOpen} onClose={() => setWorkModeModalOpen(false)} />
    </>
  );
}