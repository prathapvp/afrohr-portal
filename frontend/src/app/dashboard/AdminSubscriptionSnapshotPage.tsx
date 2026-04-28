import { Badge, Loader, Pagination, Select, Table, TextInput } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ExternalLink, Sparkles } from "lucide-react";
import {
  type AdminOverview,
  getAllSubscriptionRequests,
  type SubscriptionRequest,
} from "../services/admin-service";
import AdminActiveFilterChips from "./AdminActiveFilterChips";
import AdminBillingSuiteTabs from "./AdminBillingSuiteTabs";

function formatUsagePeriod(value?: string | null) {
  if (!value) return "Current month";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getQuotaHealth(used?: number | null, limit?: number | null) {
  const normalizedUsed = used ?? 0;
  const normalizedLimit = limit ?? 0;
  if (normalizedLimit <= 0) {
    if (normalizedUsed > 0) {
      return {
        labelClass: "text-rose-300",
        badgeClass: "border-rose-400/35 bg-rose-500/10 text-rose-200",
        statusText: "Unconfigured overuse",
        riskRank: 4,
      };
    }
    return {
      labelClass: "text-slate-200",
      badgeClass: "border-slate-400/30 bg-slate-400/10 text-slate-200",
      statusText: "Not set",
      riskRank: 1,
    };
  }

  const ratio = normalizedUsed / normalizedLimit;
  if (ratio >= 1) {
    return {
      labelClass: "text-rose-300",
      badgeClass: "border-rose-400/35 bg-rose-500/10 text-rose-200",
      statusText: "Limit reached",
      riskRank: 3,
    };
  }
  if (ratio >= 0.8) {
    return {
      labelClass: "text-amber-300",
      badgeClass: "border-amber-400/35 bg-amber-500/10 text-amber-200",
      statusText: "Near limit",
      riskRank: 2,
    };
  }

  return {
    labelClass: "text-emerald-300",
    badgeClass: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
    statusText: "Healthy",
    riskRank: 0,
  };
}

function getSubscriptionStatusTone(status?: string | null) {
  const normalizedStatus = String(status ?? "").trim().toUpperCase();
  if (normalizedStatus === "ACTIVE") {
    return { color: "green", label: "ACTIVE" };
  }
  if (normalizedStatus === "PENDING") {
    return { color: "orange", label: "PENDING" };
  }
  if (["EXPIRED", "CANCELED", "CANCELLED", "PAST_DUE", "FAILED"].includes(normalizedStatus)) {
    return { color: "red", label: normalizedStatus || "UNKNOWN" };
  }

  return { color: "gray", label: normalizedStatus || "UNKNOWN" };
}

function displayValue(value?: string | null, fallback = "N/A") {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : fallback;
}

function getOperationalRisk(employer: AdminEmployerSummary) {
  const viewRisk = getQuotaHealth(employer.monthlyResumeViewsUsed, employer.maxResumeViewsPerMonth).riskRank;
  const downloadRisk = getQuotaHealth(employer.monthlyResumeDownloadsUsed, employer.maxResumeDownloadsPerMonth).riskRank;
  const status = String(employer.subscriptionStatus ?? "").trim().toUpperCase();
  const statusRisk = status === "PENDING"
    ? 2
    : ["EXPIRED", "CANCELED", "CANCELLED", "PAST_DUE", "FAILED"].includes(status)
      ? 3
      : 0;
  const riskRank = Math.max(viewRisk, downloadRisk, statusRisk);

  if (riskRank >= 4) {
    return { rank: riskRank, label: "Critical", badgeClass: "border-rose-400/35 bg-rose-500/10 text-rose-200" };
  }
  if (riskRank >= 3) {
    return { rank: riskRank, label: "High", badgeClass: "border-red-400/35 bg-red-500/10 text-red-200" };
  }
  if (riskRank >= 2) {
    return { rank: riskRank, label: "Medium", badgeClass: "border-amber-400/35 bg-amber-500/10 text-amber-200" };
  }
  if (riskRank >= 1) {
    return { rank: riskRank, label: "Low", badgeClass: "border-slate-400/30 bg-slate-400/10 text-slate-200" };
  }
  return { rank: riskRank, label: "Stable", badgeClass: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200" };
}

function usageProgress(used?: number | null, limit?: number | null) {
  const normalizedUsed = Math.max(0, used ?? 0);
  const normalizedLimit = Math.max(0, limit ?? 0);
  if (normalizedLimit <= 0) {
    return normalizedUsed > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((normalizedUsed / normalizedLimit) * 100));
}

export default function AdminSubscriptionSnapshotPage({
  overview,
  loading,
  error,
}: {
  overview: AdminOverview | null;
  loading: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const [employerPlans, setEmployerPlans] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("ALL");
  const [healthFilter, setHealthFilter] = useState<string | null>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"company" | "risk" | "status" | "plan" | "resumeViews" | "downloads">("risk");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const pageSize = 8;

  const activeCount = overview?.employers.filter((employer) => String(employer.subscriptionStatus).toUpperCase() === "ACTIVE").length ?? 0;
  const pendingCount = overview?.employers.filter((employer) => String(employer.subscriptionStatus).toUpperCase() === "PENDING").length ?? 0;
  const configuredCount = overview?.employerSubscriptionsConfigured ?? 0;
  const employersCount = overview?.employers.length ?? 0;
  const filteredEmployers = (overview?.employers ?? []).filter((employer) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      String(employer.employerId).includes(normalizedSearch) ||
      displayValue(employer.companyName, "").toLowerCase().includes(normalizedSearch) ||
      displayValue(employer.email, "").toLowerCase().includes(normalizedSearch) ||
      displayValue(employer.contactName, "").toLowerCase().includes(normalizedSearch);

    const employerStatus = String(employer.subscriptionStatus ?? "").trim().toUpperCase();
    const matchesStatus = !statusFilter || statusFilter === "ALL" || employerStatus === statusFilter;

    const viewHealth = getQuotaHealth(employer.monthlyResumeViewsUsed, employer.maxResumeViewsPerMonth).statusText;
    const downloadHealth = getQuotaHealth(employer.monthlyResumeDownloadsUsed, employer.maxResumeDownloadsPerMonth).statusText;
    const matchesHealth =
      !healthFilter ||
      healthFilter === "ALL" ||
      viewHealth === healthFilter ||
      downloadHealth === healthFilter;

    return matchesSearch && matchesStatus && matchesHealth;
  });
  const sortedEmployers = useMemo(() => {
    const employers = [...filteredEmployers];
    employers.sort((left, right) => {
      let compare = 0;

      if (sortBy === "risk") {
        compare = getOperationalRisk(left).rank - getOperationalRisk(right).rank;
      } else if (sortBy === "status") {
        compare = String(left.subscriptionStatus ?? "").localeCompare(String(right.subscriptionStatus ?? ""));
      } else if (sortBy === "plan") {
        compare = displayValue(employerPlans[left.employerId] ?? left.subscriptionPlan, "No plan configured").localeCompare(
          displayValue(employerPlans[right.employerId] ?? right.subscriptionPlan, "No plan configured"),
        );
      } else if (sortBy === "resumeViews") {
        compare = getQuotaHealth(left.monthlyResumeViewsUsed, left.maxResumeViewsPerMonth).riskRank - getQuotaHealth(right.monthlyResumeViewsUsed, right.maxResumeViewsPerMonth).riskRank;
        if (compare === 0) {
          compare = usageProgress(left.monthlyResumeViewsUsed, left.maxResumeViewsPerMonth) - usageProgress(right.monthlyResumeViewsUsed, right.maxResumeViewsPerMonth);
        }
      } else if (sortBy === "downloads") {
        compare = getQuotaHealth(left.monthlyResumeDownloadsUsed, left.maxResumeDownloadsPerMonth).riskRank - getQuotaHealth(right.monthlyResumeDownloadsUsed, right.maxResumeDownloadsPerMonth).riskRank;
        if (compare === 0) {
          compare = usageProgress(left.monthlyResumeDownloadsUsed, left.maxResumeDownloadsPerMonth) - usageProgress(right.monthlyResumeDownloadsUsed, right.maxResumeDownloadsPerMonth);
        }
      } else {
        compare = displayValue(left.companyName, "Employer").localeCompare(displayValue(right.companyName, "Employer"));
      }

      return sortDir === "asc" ? compare : -compare;
    });
    return employers;
  }, [filteredEmployers, sortBy, sortDir, employerPlans]);
  const totalPages = Math.max(1, Math.ceil(sortedEmployers.length / pageSize));
  const paginatedEmployers = sortedEmployers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterChips = [
    searchTerm.trim().length > 0
      ? {
          key: "search",
          label: "Search",
          value: searchTerm.trim(),
          onClear: () => setSearchTerm(""),
        }
      : null,
    statusFilter && statusFilter !== "ALL"
      ? {
          key: "status",
          label: "Status",
          value: statusFilter,
          onClear: () => setStatusFilter("ALL"),
        }
      : null,
    healthFilter && healthFilter !== "ALL"
      ? {
          key: "health",
          label: "Quota health",
          value: healthFilter,
          onClear: () => setHealthFilter("ALL"),
        }
      : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, healthFilter, sortBy, sortDir]);

  useEffect(() => {
    let active = true;
    getAllSubscriptionRequests()
      .then((requests) => {
        if (active) {
          setSubscriptionRequests(Array.isArray(requests) ? requests : []);
        }
      })
      .catch(() => {
        if (active) {
          setSubscriptionRequests([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const requestCountByEmployer = useMemo(() => {
    const counts: Record<number, number> = {};
    subscriptionRequests.forEach((request) => {
      if (String(request.status).toUpperCase() !== "PENDING") {
        return;
      }
      counts[request.employerId] = (counts[request.employerId] ?? 0) + 1;
    });
    return counts;
  }, [subscriptionRequests]);

  function handleSort(column: "company" | "risk" | "status" | "plan" | "resumeViews" | "downloads") {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDir(column === "risk" || column === "status" || column === "resumeViews" || column === "downloads" ? "desc" : "asc");
  }

  function sortLabel(column: "company" | "risk" | "status" | "plan" | "resumeViews" | "downloads") {
    return sortBy === column ? (sortDir === "asc" ? "ASC" : "DESC") : "-";
  }

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Loader color="orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        No admin overview data available.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.24),transparent_45%),radial-gradient(circle_at_84%_12%,rgba(192,132,252,0.18),transparent_42%),linear-gradient(120deg,#0d172c_0%,#122746_48%,#171738_100%)] p-6 shadow-[0_28px_60px_rgba(14,116,144,0.22)]">
        <div className="absolute -left-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl" />
        <div className="absolute -bottom-16 right-4 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-2xl" />
        <div className="absolute inset-y-0 right-[28%] w-px bg-gradient-to-b from-transparent via-cyan-200/20 to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Admin Billing View</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Employer Subscription Snapshot</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-200/85">
              Review employer plans, limits, status, and open billing controls from a dedicated snapshot page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="light"
              color="orange"
              className="!rounded-full !border !border-orange-300/30 !bg-orange-400/15 !px-3 !py-1 !text-[11px] !font-bold !tracking-[0.08em]"
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Pending: {overview.employerSubscriptionsPending}
              </span>
            </Badge>
            <Badge
              variant="light"
              color="cyan"
              className="!rounded-full !border !border-cyan-300/30 !bg-cyan-400/15 !px-3 !py-1 !text-[11px] !font-bold !tracking-[0.08em]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Live Billing Control
              </span>
            </Badge>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
          <AdminBillingSuiteTabs
            activeSection="subscription-snapshot"
            onSelect={(section) => navigate(`/dashboard?tab=admin&section=${section}`)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-500/20 to-cyan-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/85">Employer Accounts</p>
          <p className="mt-2 text-2xl font-black text-white">{employersCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/20 to-emerald-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/85">Active Plans</p>
          <p className="mt-2 text-2xl font-black text-white">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-orange-300/25 bg-gradient-to-br from-orange-500/20 to-orange-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-100/85">Pending Plans</p>
          <p className="mt-2 text-2xl font-black text-white">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-500/20 to-violet-400/5 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100/85">Configured Subscriptions</p>
          <p className="mt-2 text-2xl font-black text-white">{configuredCount}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/85 via-[#0d203f]/70 to-[#111827]/85 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.45)] backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white sm:text-lg">Employer Billing Matrix</h3>
          <Badge variant="light" color="gray" className="!border !border-white/20 !bg-white/10 !text-slate-100">
            Managed Employers: {sortedEmployers.length}
          </Badge>
        </div>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <TextInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            label="Search employers"
            placeholder="Company, email, contact, or employer ID"
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white placeholder:!text-slate-500",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            label="Plan status"
            data={[
              { value: "ALL", label: "All statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "PENDING", label: "Pending" },
              { value: "EXPIRED", label: "Expired" },
              { value: "PAST_DUE", label: "Past Due" },
              { value: "CANCELED", label: "Canceled" },
            ]}
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white",
              dropdown: "!border-white/10 !bg-[#0f172a] !text-white",
              option: "!text-white",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
            allowDeselect={false}
          />
          <Select
            value={healthFilter}
            onChange={setHealthFilter}
            label="Quota health"
            data={[
              { value: "ALL", label: "All health" },
              { value: "Healthy", label: "Healthy" },
              { value: "Near limit", label: "Near limit" },
              { value: "Limit reached", label: "Limit reached" },
              { value: "Unconfigured overuse", label: "Unconfigured overuse" },
              { value: "Not set", label: "Not set" },
            ]}
            classNames={{
              input: "!border-white/10 !bg-white/5 !text-white",
              dropdown: "!border-white/10 !bg-[#0f172a] !text-white",
              option: "!text-white",
              label: "!mb-1 !text-xs !font-semibold !uppercase !tracking-[0.12em] !text-slate-300",
            }}
            allowDeselect={false}
          />
        </div>
        <AdminActiveFilterChips
          chips={activeFilterChips}
          onClearAll={() => {
            setSearchTerm("");
            setStatusFilter("ALL");
            setHealthFilter("ALL");
          }}
        />
        {isMobile ? (
          <div className="space-y-3">
            {paginatedEmployers.map((employer) => {
              const viewHealth = getQuotaHealth(employer.monthlyResumeViewsUsed, employer.maxResumeViewsPerMonth);
              const downloadHealth = getQuotaHealth(employer.monthlyResumeDownloadsUsed, employer.maxResumeDownloadsPerMonth);
              const subscriptionStatusTone = getSubscriptionStatusTone(employer.subscriptionStatus);
              const operationalRisk = getOperationalRisk(employer);
              return (
                <div key={employer.employerId} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{displayValue(employer.companyName, "Employer")}</p>
                      <p className="text-[11px] text-slate-400">#{employer.employerId} • {displayValue(employer.location, "No location")}</p>
                    </div>
                    <Badge color={subscriptionStatusTone.color} variant="filled" className="!font-bold">{subscriptionStatusTone.label}</Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${operationalRisk.badgeClass}`}>{operationalRisk.label}</span>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-slate-300">
                      {displayValue(employerPlans[employer.employerId] ?? employer.subscriptionPlan, "No plan configured")}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                      <p className="text-slate-400">Resume Views</p>
                      <p className={`font-semibold ${viewHealth.labelClass}`}>{employer.monthlyResumeViewsUsed ?? 0} / {employer.maxResumeViewsPerMonth ?? 0}</p>
                      <p className="text-[11px] text-slate-500">{formatUsagePeriod(employer.usageWindowStartAt)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                      <p className="text-slate-400">Resume Downloads</p>
                      <p className={`font-semibold ${downloadHealth.labelClass}`}>{employer.monthlyResumeDownloadsUsed ?? 0} / {employer.maxResumeDownloadsPerMonth ?? 0}</p>
                      <p className="text-[11px] text-slate-500">{formatUsagePeriod(employer.usageWindowStartAt)}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard?tab=admin&section=subscription-requests&employerId=${employer.employerId}`)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-orange-300/30 bg-orange-600/15 px-3 py-2 text-[11px] font-semibold text-orange-100 transition hover:border-orange-300/60 hover:bg-orange-500/25"
                    >
                      Requests ({requestCountByEmployer[employer.employerId] ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard?tab=admin&section=billing-control&employerId=${employer.employerId}`)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-cyan-300/30 bg-cyan-600/20 px-3 py-2 text-[11px] font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-500/30 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <Table withTableBorder withColumnBorders className="min-w-[760px] text-slate-100">
            <Table.Thead>
              <Table.Tr className="bg-[#0b1328]/95">
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]"><button type="button" onClick={() => handleSort("company")}>Company ({sortLabel("company")})</button></Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Contact</Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Email</Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]">Location</Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]"><button type="button" onClick={() => handleSort("plan")}>Plan ({sortLabel("plan")})</button></Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]"><button type="button" onClick={() => handleSort("status")}>Status ({sortLabel("status")})</button></Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]"><button type="button" onClick={() => handleSort("risk")}>Risk ({sortLabel("risk")})</button></Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]"><button type="button" onClick={() => handleSort("resumeViews")}>Resume Views ({sortLabel("resumeViews")})</button></Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em]"><button type="button" onClick={() => handleSort("downloads")}>Downloads ({sortLabel("downloads")})</button></Table.Th>
                <Table.Th className="!sticky !top-0 !z-10 !bg-[#0b1328]/95 !text-slate-100 !text-[11px] !font-semibold !uppercase !tracking-[0.12em] !text-center">Billing</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedEmployers.map((employer, index) => {
                const viewHealth = getQuotaHealth(employer.monthlyResumeViewsUsed, employer.maxResumeViewsPerMonth);
                const downloadHealth = getQuotaHealth(employer.monthlyResumeDownloadsUsed, employer.maxResumeDownloadsPerMonth);
                const subscriptionStatusTone = getSubscriptionStatusTone(employer.subscriptionStatus);
                const operationalRisk = getOperationalRisk(employer);
                return (
                  <Table.Tr
                    key={employer.employerId}
                    className={index % 2 === 0 ? "bg-white/[0.03] transition-colors hover:bg-cyan-500/10" : "bg-slate-950/40 transition-colors hover:bg-cyan-500/10"}
                  >
                    <Table.Td className="!text-slate-100 !font-semibold">{displayValue(employer.companyName, "Employer")}</Table.Td>
                    <Table.Td className="!text-slate-100">{displayValue(employer.contactName, "No contact on file")}</Table.Td>
                    <Table.Td className="!text-sky-200">{displayValue(employer.email, "No email on file")}</Table.Td>
                    <Table.Td className="!text-slate-200">{displayValue(employer.location, "No location on file")}</Table.Td>
                    <Table.Td className="!text-slate-200">
                      {displayValue(employerPlans[employer.employerId] ?? employer.subscriptionPlan, "No plan configured")}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={subscriptionStatusTone.color} variant="filled" className="!min-w-[88px] !justify-center !font-bold">
                        {subscriptionStatusTone.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="!text-slate-200">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${operationalRisk.badgeClass}`}>
                        {operationalRisk.label}
                      </span>
                    </Table.Td>
                    <Table.Td className="!text-slate-200">
                      <div>
                        <div className={`font-semibold ${viewHealth.labelClass}`}>{employer.monthlyResumeViewsUsed ?? 0} / {employer.maxResumeViewsPerMonth ?? 0}</div>
                        <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${viewHealth.badgeClass}`}>{viewHealth.statusText}</div>
                        <div className="text-[10px] text-slate-400">{formatUsagePeriod(employer.usageWindowStartAt)}</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800/90"><div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${usageProgress(employer.monthlyResumeViewsUsed, employer.maxResumeViewsPerMonth)}%` }} /></div>
                      </div>
                    </Table.Td>
                    <Table.Td className="!text-slate-200">
                      <div>
                        <div className={`font-semibold ${downloadHealth.labelClass}`}>{employer.monthlyResumeDownloadsUsed ?? 0} / {employer.maxResumeDownloadsPerMonth ?? 0}</div>
                        <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${downloadHealth.badgeClass}`}>{downloadHealth.statusText}</div>
                        <div className="text-[10px] text-slate-400">{formatUsagePeriod(employer.usageWindowStartAt)}</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800/90"><div className="h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-pink-400" style={{ width: `${usageProgress(employer.monthlyResumeDownloadsUsed, employer.maxResumeDownloadsPerMonth)}%` }} /></div>
                      </div>
                    </Table.Td>
                    <Table.Td className="!text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard?tab=admin&section=subscription-requests&employerId=${employer.employerId}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300/30 bg-orange-600/15 px-3 py-1.5 text-[11px] font-semibold text-orange-100 transition-all hover:border-orange-300/60 hover:bg-orange-500/25"
                        >
                          Open Requests ({requestCountByEmployer[employer.employerId] ?? 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard?tab=admin&section=billing-control&employerId=${employer.employerId}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-cyan-600/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 shadow-[0_10px_20px_rgba(8,145,178,0.25)] transition-all hover:border-cyan-300/60 hover:bg-cyan-500/30 hover:text-white"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Manage
                        </button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="cyan" />
          </div>
        )}
        {filteredEmployers.length === 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            No employers match the current search and filter combination.
          </div>
        )}
      </div>
    </section>
  );
}
