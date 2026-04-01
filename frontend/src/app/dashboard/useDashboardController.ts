import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getAdminOverview, type AdminOverview } from "../services/admin-service";
import { useAppSelector } from "../store";
import { selectAccountType, selectIsAuthenticated, selectIsEmployer } from "../store/selectors/authSelectors";
import { emptyPayload, getTabFromAccountType, mapApiJobToCandidateJob, mergeDashboardPayload } from "./data";
import type { AudienceId, CandidateJob, CareerItem, DashboardPayload } from "./types";

function isAudienceId(value: string | null): value is AudienceId {
  return value === "candidates" || value === "employers" || value === "students" || value === "admin";
}

export function useDashboardController() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountType = useAppSelector(selectAccountType);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isEmployer = useAppSelector(selectIsEmployer);
    const roleTab = isAuthenticated ? getTabFromAccountType(accountType) : null;
  const queryTab = searchParams.get("tab");
  const querySection = searchParams.get("section");
  const initialTab = roleTab ?? (isAudienceId(queryTab) ? queryTab : null) ?? "candidates";

  const [activeTab, setActiveTab] = useState<AudienceId>(initialTab);
  const [employerSection, setEmployerSection] = useState<"overview" | "subscription">(
    querySection === "subscription" ? "subscription" : "overview"
  );
  const [payload, setPayload] = useState<DashboardPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<CandidateJob | CareerItem> | null>(null);
  const [candidateJobs, setCandidateJobs] = useState<CandidateJob[]>([]);
  const [viewedJobIds, setViewedJobIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem("afrohr:viewed-job-ids");
      if (!raw) return new Set<number>();
      const parsed = JSON.parse(raw) as number[];
      if (!Array.isArray(parsed)) return new Set<number>();
      return new Set<number>(parsed.filter((item) => typeof item === "number"));
    } catch {
      return new Set<number>();
    }
  });
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [indModalOpen, setIndModalOpen] = useState(false);
  const [empTypeModalOpen, setEmpTypeModalOpen] = useState(false);
  const [workModeModalOpen, setWorkModeModalOpen] = useState(false);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const hasRedirectedUnauthorizedEmployer = useRef(false);
  const unauthorizedEmployerRedirectKey = "afrohr:unauthorized-employer-redirect";

  useEffect(() => {
    localStorage.setItem("afrohr:viewed-job-ids", JSON.stringify(Array.from(viewedJobIds)));
  }, [viewedJobIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const dashboardResponse = await fetch("/api/dashboard");
        if (!dashboardResponse.ok) {
          throw new Error("Failed to load dashboard payload");
        }
        const dashboardPayload = (await dashboardResponse.json()) as Partial<DashboardPayload>;
        if (!cancelled) {
          setPayload(mergeDashboardPayload(dashboardPayload));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unexpected error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCandidateJobs() {
      try {
        const response = await fetch("/api/ahrm/v3/jobs/getAll");
        if (!response.ok) {
          throw new Error("Failed to load posted jobs");
        }
        const data = await response.json();
        if (!cancelled) {
          setCandidateJobs(Array.isArray(data) ? data.map(mapApiJobToCandidateJob) : []);
        }
      } catch {
        if (!cancelled) {
          setCandidateJobs([]);
        }
      }
    }

    if (activeTab === "candidates") {
      void loadCandidateJobs();
    }

    const intervalId = window.setInterval(() => {
      if (activeTab === "candidates") {
        void loadCandidateJobs();
      }
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeTab]);

  useEffect(() => {
    setSearchQuery("");
    setSearchResults(null);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "employers") {
      return;
    }

    setEmployerSection(querySection === "subscription" ? "subscription" : "overview");
  }, [activeTab, querySection]);

  useEffect(() => {
    if (!isAuthenticated || !roleTab) {
      return;
    }

    if (activeTab !== roleTab) {
      setActiveTab(roleTab);
      return;
    }

    if (queryTab !== roleTab) {
      if (roleTab === "employers" && employerSection === "subscription") {
        setSearchParams({ tab: roleTab, section: "subscription" }, { replace: true });
      } else {
        setSearchParams({ tab: roleTab }, { replace: true });
      }
    }
  }, [activeTab, employerSection, isAuthenticated, queryTab, roleTab, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminOverview() {
      try {
        setAdminLoading(true);
        setAdminError(null);
        const data = await getAdminOverview();
        if (!cancelled) {
          setAdminOverview(data);
        }
      } catch (overviewError) {
        if (!cancelled) {
          const message = overviewError instanceof Error ? overviewError.message : "Failed to load admin overview";
          setAdminError(message);
        }
      } finally {
        if (!cancelled) {
          setAdminLoading(false);
        }
      }
    }

    if (activeTab === "admin" && isAuthenticated) {
      void loadAdminOverview();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "employers") {
      hasRedirectedUnauthorizedEmployer.current = false;
      sessionStorage.removeItem(unauthorizedEmployerRedirectKey);
      return;
    }

    if (!isEmployer) {
      if (hasRedirectedUnauthorizedEmployer.current) {
        return;
      }
      if (sessionStorage.getItem(unauthorizedEmployerRedirectKey) === "1") {
        return;
      }
      hasRedirectedUnauthorizedEmployer.current = true;
      sessionStorage.setItem(unauthorizedEmployerRedirectKey, "1");
      navigate("/login", { replace: true });
    }
  }, [activeTab, isEmployer, navigate]);

  async function handleSearch() {
    if (activeTab === "employers" || activeTab === "admin") {
      return;
    }
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const response = await fetch(`/api/search?audience=${activeTab}&q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = (await response.json()) as { results: Array<CandidateJob | CareerItem> };
      setSearchResults(data.results);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleApplyToJob(job: CandidateJob) {
    if (!job.id) {
      setError("Unable to apply: missing job id");
      return;
    }
    if (!viewedJobIds.has(job.id)) {
      setError("Please view the job details before applying.");
      return;
    }
    navigate(`/apply-job/${job.id}`);
  }

  function handleViewJob(job: CandidateJob) {
    if (!job.id) {
      return;
    }

    setViewedJobIds((previous) => {
      const next = new Set(previous);
      next.add(job.id as number);
      return next;
    });
    navigate(`/jobs/${job.id}`);
  }

  function handleViewAllJobs() {
    navigate("/find-jobs");
  }

  function handleSidebarNav(label: string) {
    if (label === "Subscription") {
      if (!isEmployer) {
        navigate("/login", { replace: true });
        return;
      }
      setEmployerSection("subscription");
      setActiveTab("employers");
      setSearchParams({ tab: "employers", section: "subscription" }, { replace: true });
      return;
    }

    if (label === "Department") {
      setDeptModalOpen(true);
      return;
    }
    if (label === "Industry") {
      setIndModalOpen(true);
      return;
    }
    if (label === "Employment Type") {
      setEmpTypeModalOpen(true);
      return;
    }
    if (label === "Work Mode") {
      setWorkModeModalOpen(true);
      return;
    }

    let tab: AudienceId = "candidates";
    if (label === "Employer") tab = "employers";
    else if (label === "Student") tab = "students";
    else if (label === "Admin") tab = "admin";

    if (tab === "employers" && !isEmployer) {
      navigate("/login", { replace: true });
      return;
    }

    if (tab === "employers") {
      setEmployerSection("overview");
    }

    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }

  const candidateDashboard = {
    ...payload.dashboards.candidates,
    jobs: {
      ...payload.dashboards.candidates.jobs,
      items: candidateJobs.length > 0 ? candidateJobs : payload.dashboards.candidates.jobs.items,
    },
  };

  const sidebarActiveLabel =
    deptModalOpen
      ? "Department"
      : indModalOpen
      ? "Industry"
      : empTypeModalOpen
      ? "Employment Type"
      : workModeModalOpen
      ? "Work Mode"
      : activeTab === "employers" && employerSection === "subscription"
      ? "Subscription"
      : activeTab === "employers"
      ? "Employer"
      : activeTab === "students"
      ? "Student"
      : activeTab === "admin"
      ? "Admin"
      : "Candidate";

  return {
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
  };
}