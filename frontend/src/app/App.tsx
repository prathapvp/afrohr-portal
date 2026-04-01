import { Notifications } from "@mantine/notifications";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import PremiumNavbar from "./components/layout/PremiumNavbar";
import PremiumSidebar from "./components/layout/PremiumSidebar";
import { Card, CardContent } from "./components/ui/card";
import AdminDashboardView from "./dashboard/AdminDashboardView";
import CandidateDashboardView from "./dashboard/CandidateDashboardView";
import StudentDashboardView from "./dashboard/StudentDashboardView";
import { useDashboardController } from "./dashboard/useDashboardController";
import type { CandidateJob, CareerItem } from "./dashboard/types";
import Departments from "./features/departments/Departments";
import { EmployerView } from "./features/employer";
import EmployerSubscriptionPage from "./features/employer/EmployerSubscriptionPage";
import EmploymentTypes from "./features/employment-types/EmploymentTypes";
import Industries from "./features/industries/Industries";
import WorkModes from "./features/work-modes/WorkModes";
import { setupResponseInterceptor } from "./interceptor/AxiosInterceptor";
import { useAppDispatch } from "./store";

export default function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setupResponseInterceptor(navigate, dispatch);
  }, [navigate, dispatch]);

  const {
    activeTab,
    adminError,
    adminLoading,
    adminOverview,
    candidateDashboard,
    deptModalOpen,
    empTypeModalOpen,
    employerSection,
    error,
    handleApplyToJob,
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
    setDeptModalOpen,
    setEmpTypeModalOpen,
    setIndModalOpen,
    setSearchQuery,
    setWorkModeModalOpen,
    sidebarActiveLabel,
    viewedJobIds,
    workModeModalOpen,
  } = useDashboardController();

  return (
    <>
      <div className="premium-shell flex h-screen w-full flex-col">
        <Notifications position="top-center" zIndex={2001} />
        <PremiumNavbar />
        <div className="flex min-h-0 flex-1">
          <PremiumSidebar active={sidebarActiveLabel} onNav={handleSidebarNav} />
          <div className="min-w-0 flex-1 overflow-y-auto p-2 sm:p-3">
            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_20px_56px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-4">
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

              {!loading && !error && activeTab === "candidates" && (
                <CandidateDashboardView
                  dashboard={candidateDashboard}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onSearch={handleSearch}
                  onViewAllJobs={handleViewAllJobs}
                  onViewJob={handleViewJob}
                  onApplyToJob={handleApplyToJob}
                  viewedJobIds={viewedJobIds}
                  searchLoading={searchLoading}
                  searchResults={searchResults as CandidateJob[] | null}
                />
              )}

              {!loading && !error && activeTab === "employers" && employerSection === "overview" && <EmployerView dashboard={payload.dashboards.employers} />}

              {!loading && !error && activeTab === "employers" && employerSection === "subscription" && <EmployerSubscriptionPage />}

              {!loading && !error && activeTab === "students" && (
                <StudentDashboardView
                  dashboard={payload.dashboards.students}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onSearch={handleSearch}
                  searchLoading={searchLoading}
                  searchResults={searchResults as CareerItem[] | null}
                />
              )}

              {!loading && !error && activeTab === "admin" && (
                <AdminDashboardView overview={adminOverview} loading={adminLoading} error={adminError} />
              )}
            </div>
          </div>
        </div>
      </div>

      <Departments opened={deptModalOpen} onClose={() => setDeptModalOpen(false)} />
      <Industries opened={indModalOpen} onClose={() => setIndModalOpen(false)} />
      <EmploymentTypes opened={empTypeModalOpen} onClose={() => setEmpTypeModalOpen(false)} />
      <WorkModes opened={workModeModalOpen} onClose={() => setWorkModeModalOpen(false)} />
    </>
  );
}