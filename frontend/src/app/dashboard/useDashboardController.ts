import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { getAdminOverview, type AdminOverview } from "../services/admin-service";
import axiosInstance from "../interceptor/AxiosInterceptor";
import { useAppSelector } from "../store";
import { selectAccountType, selectIsAuthenticated, selectIsEmployer, selectIsEmployerOwner } from "../store/selectors/authSelectors";
import { emptyPayload, getTabFromAccountType, mapApiJobToCandidateJob, mergeDashboardPayload } from "./data";
import type { AudienceId, CandidateJob, CareerItem, DashboardPayload } from "./types";

function isAudienceId(value: string | null): value is AudienceId {
  return value === "candidates" || value === "employers" || value === "students" || value === "admin";
}

export function useDashboardController() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountType = useAppSelector(selectAccountType);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isEmployer = useAppSelector(selectIsEmployer);
  const isEmployerOwner = useAppSelector(selectIsEmployerOwner);
  const roleTab = isAuthenticated ? getTabFromAccountType(accountType) : null;
  const queryTabRaw = searchParams.get("tab");
  const querySection = searchParams.get("section");
  const queryIsEmployerPostJob = queryTabRaw === "employers/postJob";
  const queryTab = queryTabRaw;
  const initialTab = roleTab ?? (queryIsEmployerPostJob ? "employers" : (isAudienceId(queryTabRaw) ? queryTabRaw : null)) ?? "candidates";

  const initialEmployerSection: "overview" | "subscription" | "viewall" | "team" | "search-candidates" =
    querySection === "subscription"
      ? "subscription"
      : querySection === "team" && isEmployerOwner
        ? "team"
      : querySection === "search-candidates"
        ? "search-candidates"
      : querySection === "viewall" || querySection === "postJob"
        ? "viewall"
        : "overview";
  const initialCandidateSection: "overview" | "find-jobs" | "job-history" | "swipe" =
    querySection === "find-jobs"
      ? "find-jobs"
      : querySection === "job-history"
        ? "job-history"
        : querySection === "swipe"
          ? "swipe"
          : "overview";
  const initialAdminSection: "overview" | "subscription-snapshot" | "billing-control" | "subscription-requests" | "profile-completion" =
    querySection === "overview"
      ? "overview"
      : querySection === "subscription-snapshot"
      ? "subscription-snapshot"
      : querySection === "billing-control"
        ? "billing-control"
      : querySection === "subscription-requests"
        ? "subscription-requests"
      : querySection === "profile-completion"
        ? "profile-completion"
        : "subscription-snapshot";

  const [activeTab, setActiveTab] = useState<AudienceId>(initialTab);
  const [candidateSection, setCandidateSection] = useState<"overview" | "find-jobs" | "job-history" | "swipe">(initialCandidateSection);
  const [employerSection, setEmployerSection] = useState<"overview" | "subscription" | "viewall" | "team" | "search-candidates">(initialEmployerSection);
  const [adminSection, setAdminSection] = useState<"overview" | "subscription-snapshot" | "billing-control" | "subscription-requests" | "profile-completion">(initialAdminSection);
  const [payload, setPayload] = useState<DashboardPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<CandidateJob | CareerItem> | null>(null);
  const [searchCandidatesRefreshSeed, setSearchCandidatesRefreshSeed] = useState(0);
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
  const searchRequestIdRef = useRef(0);
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
        try {
          const dashboardResponse = await axiosInstance.get<Partial<DashboardPayload>>("/dashboard");
          if (!cancelled) {
            setPayload(mergeDashboardPayload(dashboardResponse.data));
          }
        } catch {
          // Dashboard payload is optional; if it fails, keep defaults.
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
    if (activeTab === "employers" || activeTab === "admin") {
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSearch();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (activeTab !== "candidates") {
      return;
    }

    setCandidateSection(
      querySection === "find-jobs"
        ? "find-jobs"
        : querySection === "job-history"
          ? "job-history"
          : querySection === "swipe"
            ? "swipe"
            : "overview",
    );
  }, [activeTab, querySection]);

  useEffect(() => {
    if (activeTab !== "employers") {
      return;
    }

    setEmployerSection(
      querySection === "subscription"
        ? "subscription"
        : querySection === "team" && isEmployerOwner
          ? "team"
        : querySection === "viewall" || querySection === "postJob"
          ? "viewall"
          : "overview",
    );
  }, [activeTab, isEmployerOwner, querySection, queryTab]);

  useEffect(() => {
    if (activeTab !== "admin") {
      return;
    }

    setAdminSection(
      querySection === "overview"
        ? "overview"
        : querySection === "subscription-snapshot"
        ? "subscription-snapshot"
        : querySection === "billing-control"
          ? "billing-control"
        : querySection === "subscription-requests"
          ? "subscription-requests"
        : querySection === "profile-completion"
          ? "profile-completion"
          : "subscription-snapshot",
    );
  }, [activeTab, querySection]);

  useEffect(() => {
    if (activeTab !== "employers") {
      return;
    }
    if (employerSection !== "team") {
      return;
    }
    if (isEmployerOwner) {
      return;
    }

    setEmployerSection("overview");
    setSearchParams({ tab: "employers" }, { replace: true });
  }, [activeTab, employerSection, isEmployerOwner, setSearchParams]);

  useEffect(() => {
    if (!isAuthenticated || !roleTab) {
      return;
    }

    if (activeTab !== roleTab) {
      setActiveTab(roleTab);
      return;
    }

    if (queryTab !== roleTab || queryIsEmployerPostJob || querySection === "postJob") {
      if (roleTab === "candidates" && candidateSection === "find-jobs") {
        setSearchParams({ tab: roleTab, section: "find-jobs" }, { replace: true });
      } else if (roleTab === "candidates" && candidateSection === "job-history") {
        setSearchParams({ tab: roleTab, section: "job-history" }, { replace: true });
      } else if (roleTab === "candidates" && candidateSection === "swipe") {
        setSearchParams({ tab: roleTab, section: "swipe" }, { replace: true });
      } else if (roleTab === "employers" && employerSection === "subscription") {
        setSearchParams({ tab: roleTab, section: "subscription" }, { replace: true });
      } else if (roleTab === "employers" && employerSection === "team") {
        setSearchParams({ tab: roleTab, section: "team" }, { replace: true });
      } else if (roleTab === "employers" && employerSection === "viewall") {
        setSearchParams({ tab: roleTab, section: "viewall" }, { replace: true });
      } else if (roleTab === "admin" && adminSection === "subscription-snapshot") {
        setSearchParams({ tab: roleTab, section: "subscription-snapshot" }, { replace: true });
      } else if (roleTab === "admin" && adminSection === "billing-control") {
        setSearchParams({ tab: roleTab, section: "billing-control" }, { replace: true });
      } else if (roleTab === "admin" && adminSection === "subscription-requests") {
        setSearchParams({ tab: roleTab, section: "subscription-requests" }, { replace: true });
      } else if (roleTab === "admin" && adminSection === "overview") {
        setSearchParams({ tab: roleTab, section: "overview" }, { replace: true });
      } else if (roleTab === "admin" && adminSection === "profile-completion") {
        setSearchParams({ tab: roleTab, section: "profile-completion" }, { replace: true });
      } else {
        setSearchParams({ tab: roleTab }, { replace: true });
      }
    } else if (roleTab === "admin" && !querySection) {
      setSearchParams({ tab: roleTab, section: "subscription-snapshot" }, { replace: true });
    }
  }, [activeTab, adminSection, candidateSection, employerSection, isAuthenticated, querySection, queryTab, roleTab, setSearchParams]);

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

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    try {
      setSearchLoading(true);
      setError(null);
      const response = await axiosInstance.get<{ results: Array<CandidateJob | CareerItem> }>("/search", {
        params: {
          audience: activeTab,
          q: searchQuery,
        },
      });
      const data = response.data;
      if (searchRequestIdRef.current === requestId) {
        setSearchResults(data.results);
      }
    } catch (searchError) {
      if (searchRequestIdRef.current === requestId) {
        setError(searchError instanceof Error ? searchError.message : "Search failed");
      }
    } finally {
      if (searchRequestIdRef.current === requestId) {
        setSearchLoading(false);
      }
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
    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/jobs/${job.id}?returnTo=${encodeURIComponent(returnTo)}`);
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
    if (label === "Posted Jobs") {
      if (!isEmployer) {
        navigate("/login", { replace: true });
        return;
      }
      setEmployerSection("viewall");
      setActiveTab("employers");
      setSearchParams({ tab: "employers", section: "viewall" }, { replace: true });
      return;
    }
    if (label === "Team Access") {
      if (!isEmployer || !isEmployerOwner) {
        navigate("/login", { replace: true });
        return;
      }
      setEmployerSection("team");
      setActiveTab("employers");
      setSearchParams({ tab: "employers", section: "team" }, { replace: true });
      return;
    }
    if (label === "Search Candidates") {
      if (!isEmployer) {
        navigate("/login", { replace: true });
        return;
      }
      setSearchCandidatesRefreshSeed((seed) => seed + 1);
      setEmployerSection("search-candidates");
      setActiveTab("employers");
      setSearchParams({ tab: "employers", section: "search-candidates" }, { replace: true });
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
    if (label === "Find Jobs") {
      setCandidateSection("find-jobs");
      setActiveTab("candidates");
      setSearchParams({ tab: "candidates", section: "find-jobs" }, { replace: true });
      return;
    }
    if (label === "Job History") {
      setCandidateSection("job-history");
      setActiveTab("candidates");
      setSearchParams({ tab: "candidates", section: "job-history" }, { replace: true });
      return;
    }
    if (label === "Swipe Mode") {
      setCandidateSection("swipe");
      setActiveTab("candidates");
      setSearchParams({ tab: "candidates", section: "swipe" }, { replace: true });
      return;
    }
    if (label === "Snapshot" || label === "Employer Subscription Snapshot") {
      setAdminSection("subscription-snapshot");
      setActiveTab("admin");
      setSearchParams({ tab: "admin", section: "subscription-snapshot" }, { replace: true });
      return;
    }
    if (label === "Billing Control") {
      setAdminSection("billing-control");
      setActiveTab("admin");
      setSearchParams({ tab: "admin", section: "billing-control" }, { replace: true });
      return;
    }
    if (label === "Requests" || label === "Employer Subscription Requests") {
      setAdminSection("subscription-requests");
      setActiveTab("admin");
      setSearchParams({ tab: "admin", section: "subscription-requests" }, { replace: true });
      return;
    }
    if (label === "Profile Completion") {
      setAdminSection("profile-completion");
      setActiveTab("admin");
      setSearchParams({ tab: "admin", section: "profile-completion" }, { replace: true });
      return;
    }

    if (label === "Career Roadmap") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "roadmap" }, { replace: true });
      return;
    }
    if (label === "Saved Goals") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "saved-goals" }, { replace: true });
      return;
    }
    if (label === "Country Compare") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "country-snapshot" }, { replace: true });
      return;
    }
    if (label === "Action Plan") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "action-plan" }, { replace: true });
      return;
    }
    if (label === "Career Paths") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "career-paths" }, { replace: true });
      return;
    }
    if (label === "AI Advisor") {
      setActiveTab("students");

      const nextParams = new URLSearchParams();
      nextParams.set("tab", "students");
      nextParams.set("section", "advisor");

      // Preserve roadmap deep-link context when present.
      const ri = searchParams.get("ri");
      const rc = searchParams.get("rc");
      const rs = searchParams.get("rs");
      if (ri) nextParams.set("ri", ri);
      if (rc) nextParams.set("rc", rc);
      if (rs) nextParams.set("rs", rs);

      if (!ri || !rs) {
        try {
          const rawWizardState = localStorage.getItem("student-wizard-state");
          if (rawWizardState) {
            const parsed = JSON.parse(rawWizardState) as { interest?: string; career?: string; subfield?: string };
            if (!ri && parsed.interest) {
              nextParams.set("ri", parsed.interest);
            }
            if (!rc && parsed.career) {
              nextParams.set("rc", parsed.career);
            }
            if (!rs && parsed.subfield) {
              nextParams.set("rs", parsed.subfield);
            }
          }
        } catch {
          // Ignore malformed local storage payload and continue.
        }
      }

      window.location.assign(`/dashboard?${nextParams.toString()}`);
      return;
    }
    if (label === "Pathway") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "pathway" }, { replace: true });
      return;
    }
    if (label === "Resources") {
      setActiveTab("students");
      setSearchParams({ tab: "students", section: "resources" }, { replace: true });
      return;
    }
    if (label === "My Profile") {
      navigate("/profile");
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

    if (tab === "candidates") {
      setCandidateSection("overview");
    }

    if (tab === "employers") {
      setEmployerSection("overview");
    }
    if (tab === "admin") {
      setAdminSection("subscription-snapshot");
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
      : activeTab === "candidates" && candidateSection === "find-jobs"
      ? "Find Jobs"
      : activeTab === "candidates" && candidateSection === "job-history"
      ? "Job History"
      : activeTab === "candidates" && candidateSection === "swipe"
      ? "Swipe Mode"
      : activeTab === "employers" && employerSection === "viewall"
      ? "Posted Jobs"
      : activeTab === "employers" && employerSection === "team"
      ? "Team Access"
      : activeTab === "employers" && employerSection === "search-candidates"
      ? "Search Candidates"
      : activeTab === "employers" && employerSection === "subscription"
      ? "Subscription"
      : activeTab === "admin" && adminSection === "subscription-snapshot"
      ? "Snapshot"
      : activeTab === "admin" && adminSection === "billing-control"
      ? "Billing Control"
      : activeTab === "admin" && adminSection === "subscription-requests"
      ? "Requests"
      : activeTab === "admin" && adminSection === "profile-completion"
      ? "Profile Completion"
      : activeTab === "students" && querySection === "roadmap"
      ? "Career Roadmap"
      : activeTab === "students" && querySection === "saved-goals"
      ? "Saved Goals"
      : activeTab === "students" && querySection === "country-snapshot"
      ? "Country Compare"
      : activeTab === "students" && querySection === "action-plan"
      ? "Action Plan"
      : activeTab === "students" && querySection === "career-paths"
      ? "Career Paths"
      : activeTab === "students" && querySection === "advisor"
      ? "AI Advisor"
      : activeTab === "students" && querySection === "pathway"
      ? "Pathway"
      : activeTab === "students" && querySection === "resources"
      ? "Resources"
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
    adminSection,
    candidateSection,
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
    searchCandidatesRefreshSeed,
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