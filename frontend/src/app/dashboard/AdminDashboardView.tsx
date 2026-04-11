import { Badge, Loader } from "@mantine/core";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Briefcase, Building2, CheckCircle2, FileText, GraduationCap, Layers, Users, XCircle } from "lucide-react";
import {
  type AdminOverview,
} from "../services/admin-service";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  subtitle: string;
  accentClass: string;
};

function StatCard({ label, value, icon: Icon, subtitle, accentClass }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111b32]/85 via-[#0f1a2f]/75 to-[#111827]/85 p-4 shadow-[0_14px_40px_rgba(2,8,23,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_20px_50px_rgba(8,145,178,0.22)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className={`h-1.5 w-16 rounded-full ${accentClass}`} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-cyan-200 transition-colors group-hover:border-cyan-300/40 group-hover:bg-cyan-500/10">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboardView({
  overview,
  loading,
  error,
}: {
  overview: AdminOverview | null;
  loading: boolean;
  error: string | null;
}) {
  const [sortBy, setSortBy] = useState<"company" | "usage" | "status">("usage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const usageRows = useMemo(() => {
    if (!overview?.employers?.length) {
      return [];
    }

    const rows = overview.employers.map((employer) => {
      const viewsMax = employer.maxResumeViewsPerMonth > 0 ? employer.maxResumeViewsPerMonth : 0;
      const downloadsMax = employer.maxResumeDownloadsPerMonth > 0 ? employer.maxResumeDownloadsPerMonth : 0;
      const viewsRatio = viewsMax > 0 ? employer.monthlyResumeViewsUsed / viewsMax : 0;
      const downloadsRatio = downloadsMax > 0 ? employer.monthlyResumeDownloadsUsed / downloadsMax : 0;
      const usageScore = viewsRatio * 0.7 + downloadsRatio * 0.3;
      return {
        employer,
        usageScore,
        usagePct: Math.min(999, Math.round(usageScore * 100)),
      };
    });

    rows.sort((left, right) => {
      let compare = 0;
      if (sortBy === "usage") {
        compare = left.usageScore - right.usageScore;
      } else if (sortBy === "status") {
        compare = String(left.employer.subscriptionStatus ?? "").localeCompare(String(right.employer.subscriptionStatus ?? ""));
      } else {
        compare = String(left.employer.companyName ?? "").localeCompare(String(right.employer.companyName ?? ""));
      }
      return sortDir === "asc" ? compare : -compare;
    });

    return rows;
  }, [overview, sortBy, sortDir]);

  const handleSort = (column: "company" | "usage" | "status") => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDir(column === "usage" ? "desc" : "asc");
  };

  const sortLabel = (column: "company" | "usage" | "status") => (sortBy === column ? (sortDir === "asc" ? "ASC" : "DESC") : "-");

  const statusBadgeClass = (status: string | null | undefined) => {
    const normalized = String(status ?? "").toUpperCase();
    if (normalized === "ACTIVE") return "border-emerald-300/25 bg-emerald-400/15 text-emerald-100";
    if (normalized === "PENDING") return "border-amber-300/25 bg-amber-400/15 text-amber-100";
    if (normalized === "PAST_DUE" || normalized === "EXPIRED") return "border-red-300/25 bg-red-400/15 text-red-100";
    return "border-slate-300/20 bg-slate-400/10 text-slate-200";
  };

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
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-[#0f172a] via-[#0b2342] to-[#1f1b3b] p-5 shadow-[0_18px_50px_rgba(14,116,144,0.24)]">
        <div className="absolute -left-14 -top-14 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="absolute -bottom-16 right-4 h-36 w-36 rounded-full bg-fuchsia-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Admin Control Room</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Subscription Intelligence Hub</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-200/85">
              Monitor employer accounts, update subscription access, and drive billing actions from a single premium dashboard.
            </p>
          </div>
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
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Employers" value={overview.activeEmployers} icon={Building2} subtitle="Companies with employer accounts" accentClass="bg-amber-400" />
        <StatCard label="Active Candidates" value={overview.activeCandidates} icon={Users} subtitle="Applicants ready for hiring" accentClass="bg-cyan-400" />
        <StatCard label="Active Students" value={overview.activeStudents} icon={GraduationCap} subtitle="Student talent in pipeline" accentClass="bg-emerald-400" />
        <StatCard label="Active Jobs" value={overview.activeJobs} icon={Briefcase} subtitle="Live openings in marketplace" accentClass="bg-fuchsia-400" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={overview.totalUsers} icon={Users} subtitle="Overall platform users" accentClass="bg-sky-400" />
        <StatCard label="Total Profiles" value={overview.totalProfiles} icon={FileText} subtitle="Profiles across all roles" accentClass="bg-indigo-400" />
        <StatCard label="Total Jobs" value={overview.totalJobs} icon={Briefcase} subtitle="Posted jobs to date" accentClass="bg-pink-400" />
        <StatCard
          label="Subscriptions Configured"
          value={overview.employerSubscriptionsConfigured}
          icon={Layers}
          subtitle="Employers with billing setup"
          accentClass="bg-lime-400"
        />
      </div>

      <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Top Employers by Usage</h3>
            <p className="text-xs text-slate-300">Based on monthly resume views/download limits consumption.</p>
          </div>
          <span className="rounded-full border border-violet-300/30 bg-violet-400/15 px-2.5 py-1 text-[11px] font-semibold text-violet-100">
            {usageRows.length} tracked
          </span>
        </div>

        {usageRows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">No employer usage data available.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] items-center bg-white/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
              <button type="button" onClick={() => handleSort("company")} className="text-left hover:text-white transition-colors">Employer ({sortLabel("company")})</button>
              <button type="button" onClick={() => handleSort("usage")} className="text-left hover:text-white transition-colors">Usage ({sortLabel("usage")})</button>
              <button type="button" onClick={() => handleSort("status")} className="text-right hover:text-white transition-colors">Status ({sortLabel("status")})</button>
            </div>

            {usageRows.map(({ employer, usagePct }) => (
              <div key={employer.employerId} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/10 px-3 py-2 text-xs text-slate-200">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{employer.companyName || "Employer"}</div>
                  <div className="truncate text-[11px] text-slate-400">{employer.email}</div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                    <span>{usagePct}%</span>
                    <span>{employer.monthlyResumeViewsUsed}/{employer.maxResumeViewsPerMonth} views</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800/90">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" style={{ width: `${Math.min(100, usagePct)}%` }} />
                  </div>
                </div>

                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(employer.subscriptionStatus)}`}>
                  {employer.subscriptionStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
