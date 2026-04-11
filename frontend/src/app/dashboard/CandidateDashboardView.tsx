import { useState, type ChangeEvent } from "react";
import {
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  MapPin,
  MessageSquare,
  Play,
  Search,
  Sparkles,
  TrendingUp,
  Send,
  Zap,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { iconMap, toneClasses } from "../shared";
import { normalizeLogoTone } from "./data";
import type { CandidateDashboard, CandidateJob } from "./types";

interface CandidateDashboardViewProps {
  dashboard: CandidateDashboard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onViewAllJobs: () => void;
  onViewJob: (job: CandidateJob) => void;
  onApplyToJob: (job: CandidateJob) => Promise<void>;
  viewedJobIds: Set<number>;
  searchLoading: boolean;
  searchResults: CandidateJob[] | null;
}

export default function CandidateDashboardView({
  dashboard,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onViewAllJobs,
  onViewJob,
  onApplyToJob,
  viewedJobIds,
  searchLoading,
  searchResults,
}: CandidateDashboardViewProps) {
  const jobs = searchResults ?? dashboard.jobs.items;
  const [activeJobFilter, setActiveJobFilter] = useState<"all" | "remote" | "hybrid" | "onsite">("all");
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [jobsPage, setJobsPage] = useState(1);
  const jobsPerPage = 5;

  const filteredJobs = jobs.filter((job) => {
    const location = String(job.location || "").toLowerCase();
    if (activeJobFilter === "remote") return location.includes("remote");
    if (activeJobFilter === "hybrid") return location.includes("hybrid");
    if (activeJobFilter === "onsite") return !location.includes("remote") && !location.includes("hybrid");
    return true;
  });

  const filterCounts = {
    all: jobs.length,
    remote: jobs.filter((job) => String(job.location || "").toLowerCase().includes("remote")).length,
    hybrid: jobs.filter((job) => String(job.location || "").toLowerCase().includes("hybrid")).length,
    onsite: jobs.filter((job) => {
      const location = String(job.location || "").toLowerCase();
      return !location.includes("remote") && !location.includes("hybrid");
    }).length,
  };

  const filterChips: Array<{ key: "all" | "remote" | "hybrid" | "onsite"; label: string }> = [
    { key: "all", label: "All Jobs" },
    { key: "remote", label: "Remote" },
    { key: "hybrid", label: "Hybrid" },
    { key: "onsite", label: "On-site" },
  ];

  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
  const safeJobsPage = Math.min(jobsPage, totalJobPages);
  const pageStart = (safeJobsPage - 1) * jobsPerPage;
  const pagedJobs = filteredJobs.slice(pageStart, pageStart + jobsPerPage);

  async function handleApply(job: CandidateJob) {
    if (!job.id) return;
    setApplyingJobId(job.id);
    try { await onApplyToJob(job); } finally { setApplyingJobId(null); }
  }

  return (
    <div className="space-y-4 px-4 py-5 sm:px-6">

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] via-[#102756] to-[#0b1f4a] px-5 py-6 shadow-[0_24px_72px_rgba(3,8,24,0.55)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
              {dashboard.hero.badge}
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
            {dashboard.hero.title}
          </h1>
          <p className="mb-5 max-w-xl text-sm text-cyan-100/80 sm:text-base">{dashboard.hero.description}</p>
          {/* Search bar */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-4 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.25)]">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchQueryChange(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder={dashboard.hero.searchPlaceholder}
                className="h-auto border-0 p-0 text-sm text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <button
              onClick={onSearch}
              disabled={searchLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition-colors hover:bg-indigo-50 disabled:opacity-60 sm:w-auto"
            >
              {searchLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {searchLoading ? "Searchingâ€¦" : dashboard.hero.actionLabel}
            </button>
          </div>
          {/* Chips */}
          {dashboard.hero.chips && dashboard.hero.chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dashboard.hero.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-xs text-white/80">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dashboard.stats.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.07]`}>
                <Icon className={`h-5 w-5 ${toneClasses[item.tone].text}`} />
              </div>
              <div>
                <p className={`text-xl font-black leading-none ${toneClasses[item.tone].text}`}>{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* â”€â”€ Jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold tracking-tight text-white">{dashboard.jobs.title}</h2>
            </div>
            <button
              onClick={onViewAllJobs}
              className="hidden items-center gap-1 text-xs font-semibold text-slate-300 transition-colors hover:text-white sm:flex"
            >
              {dashboard.jobs.actionLabel ?? "View All"} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {searchResults && (
            <p className="mt-1 text-xs text-slate-400">Showing results for &ldquo;{searchQuery}&rdquo;</p>
          )}
          {/* Filter row */}
          <div className="mt-3 flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => {
                  setActiveJobFilter(chip.key);
                  setJobsPage(1);
                }}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  activeJobFilter === chip.key
                    ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                {chip.label}
                <span className="ml-1 opacity-60">({filterCounts[chip.key]})</span>
              </button>
            ))}
          </div>
        </div>
        {/* Job list */}
        <div className="divide-y divide-white/[0.05]">
          {filteredJobs.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No jobs match the selected filter.</p>
          )}
          {pagedJobs.map((job) => {
            const safeTone = normalizeLogoTone(job.logoTone);
            const hasViewed = Boolean(job.id && viewedJobIds.has(job.id));
            const isApplying = job.id != null && applyingJobId === job.id;
            return (
              <div
                key={job.id ?? `${job.company}-${job.role}`}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow ${toneClasses[safeTone].logo}`}>
                    {job.company[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{job.role}</p>
                    <p className="text-xs text-slate-400">{job.company}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                      {job.salary && (
                        <span className="text-xs font-semibold text-emerald-400">{job.salary}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!job.id}
                    onClick={() => onViewJob(job)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.10] hover:text-white disabled:opacity-40"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {hasViewed ? "Viewed" : "View"}
                  </button>
                  <button
                    disabled={!job.id || isApplying}
                    onClick={() => handleApply(job)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/25 disabled:opacity-40"
                  >
                    {isApplying ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-200" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {isApplying ? "Applyingâ€¦" : "Apply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-white/[0.06] px-5 py-3">
          {filteredJobs.length > 0 && (
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                onClick={() => setJobsPage((prev) => Math.max(1, prev - 1))}
                disabled={safeJobsPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="text-xs text-slate-400">Page {safeJobsPage} of {totalJobPages}</span>
              <button
                onClick={() => setJobsPage((prev) => Math.min(totalJobPages, prev + 1))}
                disabled={safeJobsPage === totalJobPages}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button onClick={onViewAllJobs} className="w-full text-center text-xs font-semibold text-slate-400 transition-colors hover:text-white sm:hidden">
            {dashboard.jobs.actionLabel ?? "View All Jobs"} &rarr;
          </button>
        </div>
      </div>

      {/* â”€â”€ Salary Insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-base font-bold tracking-tight text-white">{dashboard.salaryInsights.title}</h2>
        </div>
        <p className="mb-3 text-xs text-slate-400">{dashboard.salaryInsights.description}</p>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050b19]">
          <img
            src={dashboard.salaryInsights.imageUrl}
            alt="Salary Insights"
            className="h-52 w-full object-cover object-left sm:h-60"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050b19] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#050b19] to-transparent" />
        </div>
      </div>

      {/* â”€â”€ Videos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2">
          <Play className="h-4 w-4 text-cyan-400" />
          <h2 className="text-base font-bold tracking-tight text-white">{dashboard.videos.title}</h2>
        </div>
        {dashboard.videos.description && (
          <p className="mb-3 text-xs text-slate-400">{dashboard.videos.description}</p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {dashboard.videos.items.map((video) => (
            <div key={video.title} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10">
              <img src={video.imageUrl} alt={video.alt ?? video.title} className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                  <Play className="ml-0.5 h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
                <p className="text-xs font-semibold text-white line-clamp-1">{video.title}</p>
                {video.duration && <p className="text-[10px] text-white/70">{video.duration}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Trends â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-bold tracking-tight text-white">{dashboard.trends.title}</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {dashboard.trends.items.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-emerald-400/20 hover:bg-white/[0.05]">
              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 line-clamp-1">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{item.description}</p>
                <p className="mt-1 text-[10px] text-slate-500">{item.age}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Countries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-bold tracking-tight text-white">{dashboard.countries.title}</h2>
        </div>
        {dashboard.countries.description && (
          <p className="mb-3 text-xs text-slate-400">{dashboard.countries.description}</p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {dashboard.countries.items.map((item) => (
            <div key={item.country} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xl leading-none">{item.flag}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.country}</p>
                  <p className="text-xs text-slate-500">{item.jobs} active jobs</p>
                </div>
              </div>
              <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${toneClasses[item.tone].badge}`}>
                {item.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Premium upsell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-400/20 bg-[#0f1a2e] p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-0 h-1 w-full rounded-t-3xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black tracking-tight text-white">{dashboard.premium.title}</h3>
            <p className="mt-1 text-xs text-orange-100/70">{dashboard.premium.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dashboard.premium.chips.map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1 rounded-lg border border-orange-300/25 bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-100">
                  {chip === "CV Builder" && <FileText className="h-3 w-3" />}
                  {chip === "AI Q&A" && <MessageSquare className="h-3 w-3" />}
                  {chip === "Job Matching" && <Sparkles className="h-3 w-3" />}
                  {chip !== "CV Builder" && chip !== "AI Q&A" && chip !== "Job Matching" && <CheckCircle className="h-3 w-3" />}
                  {chip}
                </span>
              ))}
            </div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90">
              <Sparkles className="h-3.5 w-3.5" />
              {dashboard.premium.actionLabel}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
