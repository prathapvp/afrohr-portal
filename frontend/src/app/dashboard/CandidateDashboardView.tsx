import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useSearchParams } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area as RechartsArea,
  Bar as RechartsBar,
  CartesianGrid as RechartsCartesianGrid,
  ComposedChart as RechartsComposedChart,
  Legend as RechartsLegend,
  Line as RechartsLine,
  LineChart as RechartsLineChart,
  ReferenceLine as RechartsReferenceLine,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from "recharts";
import { Input } from "../components/ui/input";
import axiosInstance from "../interceptor/AxiosInterceptor";
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
  viewedJobIds: Set<number>;
  searchLoading: boolean;
  searchResults: CandidateJob[] | null;
}

type SalaryRange = "3M" | "6M" | "1Y" | "3Y";
type SalaryIndustry = string;
type SalaryLocation = string;
type SalaryExperience = string;

interface SalarySeriesPoint {
  period: string;
  salaryUsd: number;
  salaryLowerUsd: number;
  salaryUpperUsd: number;
  jobs: number;
}

interface TopIndustryPoint {
  industry: string;
  sparklineUsd: number[];
  medianSalaryUsd: number;
  growthPercent: number;
  openRoles: number;
  confidence: string;
}

interface SalaryAnalyticsMetrics {
  medianSalaryUsd: number;
  yoyGrowthPercent: number;
  openRoles: number;
  confidence: string;
  profileEstimateUsd: number;
  sampleSize: number;
}

interface SalaryAnalyticsResponse {
  range: SalaryRange;
  industry: string;
  location: SalaryLocation;
  experience: SalaryExperience;
  generatedAt?: string;
  fxUpdatedAt?: string;
  industryOptions: string[];
  rangeOptions?: SalaryRange[];
  locationOptions?: SalaryLocation[];
  experienceOptions?: SalaryExperience[];
  currencyOptions?: SalaryCurrency[];
  baseCurrency?: string;
  currencyRates?: Partial<Record<SalaryCurrency, number>>;
  series: SalarySeriesPoint[];
  metrics: SalaryAnalyticsMetrics;
  topIndustries: TopIndustryPoint[];
}

const salaryCurrencies = ["USD", "NGN", "EUR", "GBP", "KES", "GHS", "ZAR", "AED", "CAD", "INR"] as const;
type SalaryCurrency = (typeof salaryCurrencies)[number];

function normalizeSalaryCurrency(value: string | null): SalaryCurrency {
  if (!value) return "USD";
  return salaryCurrencies.includes(value as SalaryCurrency) ? (value as SalaryCurrency) : "USD";
}

function toRelativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CandidateDashboardView({
  dashboard,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onViewAllJobs,
  onViewJob,
  viewedJobIds,
  searchLoading,
  searchResults,
}: CandidateDashboardViewProps) {
  const isCompactSalaryMode = useMediaQuery("(max-width: 430px)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [queryParams, setQueryParams] = useSearchParams();
  const jobs = searchResults ?? dashboard.jobs.items;
  const [activeJobFilter, setActiveJobFilter] = useState<"all" | "remote" | "hybrid" | "onsite">("all");
  const [jobsPage, setJobsPage] = useState(1);
  const [salaryAnalytics, setSalaryAnalytics] = useState<SalaryAnalyticsResponse | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryRange, setSalaryRange] = useState<SalaryRange>((queryParams.get("salaryRange") as SalaryRange) || "1Y");
  const [salaryIndustry, setSalaryIndustry] = useState<SalaryIndustry>(queryParams.get("salaryIndustry") || "");
  const [salaryLocation, setSalaryLocation] = useState<SalaryLocation>((queryParams.get("salaryLocation") as SalaryLocation) || "All Regions");
  const [salaryExperience, setSalaryExperience] = useState<SalaryExperience>((queryParams.get("salaryExperience") as SalaryExperience) || "All Levels");
  const [salaryCurrency, setSalaryCurrency] = useState<SalaryCurrency>(normalizeSalaryCurrency(queryParams.get("salaryCurrency")));
  const [compareMode, setCompareMode] = useState(queryParams.get("salaryCompare") === "1");
  const [salaryIndustry2, setSalaryIndustry2] = useState<SalaryIndustry>(queryParams.get("salaryIndustry2") || "");
  const [salaryAnalytics2, setSalaryAnalytics2] = useState<SalaryAnalyticsResponse | null>(null);
  const jobsPerPage = 5;

  useEffect(() => {
    let cancelled = false;

    async function loadSalaryAnalytics() {
      try {
        setSalaryLoading(true);
        const response = await axiosInstance.get("/dashboard/candidates/salary-trends", {
          params: {
            range: salaryRange,
            industry: salaryIndustry,
            location: salaryLocation,
            experience: salaryExperience,
          },
        });

        if (!cancelled) {
          setSalaryAnalytics(response.data as SalaryAnalyticsResponse);
        }
      } catch {
        if (!cancelled) {
          setSalaryAnalytics(null);
        }
      } finally {
        if (!cancelled) {
          setSalaryLoading(false);
        }
      }
    }

    void loadSalaryAnalytics();

    return () => {
      cancelled = true;
    };
  }, [salaryExperience, salaryIndustry, salaryLocation, salaryRange]);

  useEffect(() => {
    setQueryParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("salaryRange", salaryRange);
      next.set("salaryIndustry", salaryIndustry);
      next.set("salaryLocation", salaryLocation);
      next.set("salaryExperience", salaryExperience);
      next.set("salaryCurrency", salaryCurrency);
      if (compareMode) {
        next.set("salaryCompare", "1");
        if (salaryIndustry2) {
          next.set("salaryIndustry2", salaryIndustry2);
        } else {
          next.delete("salaryIndustry2");
        }
      } else {
        next.delete("salaryCompare");
        next.delete("salaryIndustry2");
      }
      return next;
    }, { replace: true });
  }, [compareMode, salaryCurrency, salaryExperience, salaryIndustry, salaryIndustry2, salaryLocation, salaryRange, setQueryParams]);

  useEffect(() => {
    if (!compareMode) {
      setSalaryAnalytics2(null);
      return;
    }
    let cancelled = false;
    async function loadCompareAnalytics() {
      try {
        const response = await axiosInstance.get("/dashboard/candidates/salary-trends", {
          params: {
            range: salaryRange,
            industry: salaryIndustry2,
            location: salaryLocation,
            experience: salaryExperience,
          },
        });
        if (!cancelled) setSalaryAnalytics2(response.data as SalaryAnalyticsResponse);
      } catch {
        if (!cancelled) setSalaryAnalytics2(null);
      }
    }
    void loadCompareAnalytics();
    return () => { cancelled = true; };
  }, [compareMode, salaryExperience, salaryIndustry2, salaryLocation, salaryRange]);

  const industryOptions = useMemo(() => {
    const dynamic = salaryAnalytics?.industryOptions?.filter((industry) => industry.trim().length > 0) ?? [];
    if (dynamic.length > 0) return dynamic;
    return salaryIndustry ? [salaryIndustry] : [];
  }, [salaryAnalytics]);

  const rangeOptions = useMemo(() => {
    const dynamic = salaryAnalytics?.rangeOptions?.filter((range) => range.trim().length > 0) ?? [];
    if (dynamic.length > 0) return dynamic;
    return salaryRange ? [salaryRange] : ["1Y"];
  }, [salaryAnalytics, salaryRange]);

  const locationOptions = useMemo(() => {
    const dynamic = salaryAnalytics?.locationOptions?.filter((location) => location.trim().length > 0) ?? [];
    if (dynamic.length > 0) return dynamic;
    return salaryLocation ? [salaryLocation] : ["All Regions"];
  }, [salaryAnalytics, salaryLocation]);

  const experienceOptions = useMemo(() => {
    const dynamic = salaryAnalytics?.experienceOptions?.filter((experience) => experience.trim().length > 0) ?? [];
    if (dynamic.length > 0) return dynamic;
    return salaryExperience ? [salaryExperience] : ["All Levels"];
  }, [salaryAnalytics, salaryExperience]);

  const currencyOptions = useMemo(() => {
    const dynamic = salaryAnalytics?.currencyOptions?.filter((currency) => currency.trim().length > 0) ?? [];
    if (dynamic.length > 0) return dynamic;
    const fromRates = Object.keys(salaryAnalytics?.currencyRates ?? {}).filter((currency) => currency.trim().length > 0);
    if (fromRates.length > 0) return fromRates as SalaryCurrency[];
    return [salaryCurrency];
  }, [salaryAnalytics, salaryCurrency]);

  useEffect(() => {
    if (salaryIndustry !== "" && !industryOptions.includes(salaryIndustry)) {
      setSalaryIndustry(industryOptions[0] ?? "");
    }
  }, [industryOptions, salaryIndustry]);

  useEffect(() => {
    if (!compareMode) return;
    if (salaryIndustry2 !== "" && !industryOptions.includes(salaryIndustry2)) {
      setSalaryIndustry2(industryOptions.find((ind) => ind !== salaryIndustry) ?? "");
    }
  }, [compareMode, industryOptions, salaryIndustry, salaryIndustry2]);

  useEffect(() => {
    if (!compareMode) return;
    if (salaryIndustry2 !== "" && salaryIndustry2 === salaryIndustry) {
      setSalaryIndustry2(industryOptions.find((ind) => ind !== salaryIndustry) ?? "");
    }
  }, [compareMode, industryOptions, salaryIndustry, salaryIndustry2]);

  const salarySeries = useMemo(() => {
    return salaryAnalytics?.series ?? [];
  }, [salaryAnalytics]);

  const currencyLabel = salaryCurrency;
  const backendCurrencyRates = salaryAnalytics?.currencyRates;
  const usesBackendFxRate = Boolean(backendCurrencyRates && typeof backendCurrencyRates[salaryCurrency] === "number");
  const salaryConversionRate =
    (backendCurrencyRates && typeof backendCurrencyRates[salaryCurrency] === "number"
      ? backendCurrencyRates[salaryCurrency]
      : salaryCurrency === "USD" ? 1 : undefined) ?? 1;

  const chartData = useMemo(() => {
    const base = salarySeries.map((point) => ({
      ...point,
      salary: Math.round(point.salaryUsd * salaryConversionRate),
      salaryLower: Math.round(point.salaryLowerUsd * salaryConversionRate),
      salaryUpper: Math.round(point.salaryUpperUsd * salaryConversionRate),
    }));
    if (compareMode && salaryAnalytics2?.series?.length) {
      const map2 = new Map(salaryAnalytics2.series.map((p) => [p.period, p]));
      return base.map((point) => ({
        ...point,
        salary2: map2.has(point.period)
          ? Math.round(map2.get(point.period)!.salaryUsd * salaryConversionRate)
          : undefined,
      }));
    }
    return base;
  }, [compareMode, salaryAnalytics2, salaryConversionRate, salarySeries]);

  const salaryMetrics = useMemo(() => {
    const metrics = salaryAnalytics?.metrics;
    const growth = metrics?.yoyGrowthPercent ?? 0;
    const median = Math.round((metrics?.medianSalaryUsd ?? 0) * salaryConversionRate);
    const openRoles = metrics?.openRoles ?? 0;
    const confidence = metrics?.confidence ?? "Low";
    const profileEstimate = Math.round((metrics?.profileEstimateUsd ?? 0) * salaryConversionRate);
    return { growth, median, openRoles, confidence, profileEstimate };
  }, [salaryAnalytics, salaryConversionRate]);

  const salaryMeta = useMemo(() => {
    const sampleSize = salaryAnalytics?.metrics?.sampleSize ?? 0;
    const generatedAt = salaryAnalytics?.generatedAt ? new Date(salaryAnalytics.generatedAt) : new Date();
    const fxUpdatedAt = salaryAnalytics?.fxUpdatedAt ? new Date(salaryAnalytics.fxUpdatedAt) : generatedAt;
    const updatedLabel = Number.isNaN(generatedAt.getTime())
      ? "just now"
      : generatedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const fxUpdatedLabel = Number.isNaN(fxUpdatedAt.getTime())
      ? "just now"
      : fxUpdatedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const fxUpdatedRelative = Number.isNaN(fxUpdatedAt.getTime()) ? "just now" : toRelativeTimeLabel(fxUpdatedAt);
    return { sampleSize, updatedLabel, fxUpdatedLabel, fxUpdatedRelative };
  }, [salaryAnalytics]);

  const growthLabel =
    salaryRange === "3M" ? "3M Growth"
    : salaryRange === "6M" ? "6M Growth"
    : salaryRange === "3Y" ? "3Y Growth"
    : "YoY Growth";

  const compactIndustryRows = useMemo(() => {
    return (salaryAnalytics?.topIndustries ?? []).map((item) => ({
      industry: item.industry,
      series: item.sparklineUsd.map((value) => value * salaryConversionRate),
      median: ((item.medianSalaryUsd ?? item.latestSalaryUsd ?? 0) * salaryConversionRate),
      growthPercent: item.growthPercent ?? 0,
      openRoles: item.openRoles ?? item.jobsCount ?? 0,
      confidence: item.confidence ?? "Low",
    }));
  }, [salaryAnalytics, salaryConversionRate]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salaryCurrency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMoneyCompact = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salaryCurrency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercent = (value?: number) => {
    const safeValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
    return `${safeValue >= 0 ? "+" : ""}${safeValue.toFixed(1)}%`;
  };

  const getConfidenceClasses = (confidence: string) => {
    if (confidence === "High") {
      return "border-emerald-300/30 bg-emerald-500/10 text-emerald-200";
    }
    if (confidence === "Medium") {
      return "border-amber-300/30 bg-amber-500/10 text-amber-200";
    }
    return "border-rose-300/30 bg-rose-500/10 text-rose-200";
  };

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

  return (
    <div className="space-y-3 px-2 py-3 sm:space-y-4 sm:px-4 sm:py-5 lg:px-6">

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] via-[#102756] to-[#0b1f4a] px-4 py-5 shadow-[0_24px_72px_rgba(3,8,24,0.55)] sm:rounded-3xl sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
              {dashboard.hero.badge}
            </span>
          </div>
          <h1 className="mb-2 text-xl font-black leading-tight tracking-tight text-white sm:text-3xl">
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition-colors hover:bg-indigo-50 disabled:opacity-60 sm:w-auto"
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
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
                <p className={`text-lg font-black leading-none sm:text-xl ${toneClasses[item.tone].text}`}>{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* â”€â”€ Jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl backdrop-blur-sm sm:rounded-3xl">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-5 pt-5 pb-3">
          <div className="flex items-center justify-between gap-2">
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
              <span className="text-[11px] text-slate-400">Page {safeJobsPage} of {totalJobPages}</span>
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

      {/* Salary Insights */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl backdrop-blur-sm sm:rounded-3xl sm:p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold tracking-tight text-white">{dashboard.salaryInsights.title}</h2>
            </div>
            <p className="text-xs text-slate-400">{dashboard.salaryInsights.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
              Confidence: {salaryMetrics.confidence}
            </div>
            <div className="rounded-xl border border-white/20 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200">
              Sample: {salaryMeta.sampleSize.toLocaleString()}
            </div>
            <div className="rounded-xl border border-white/20 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              Updated: {salaryMeta.updatedLabel}
            </div>
            <div className={`rounded-xl border px-2.5 py-1 text-[11px] font-semibold ${
              usesBackendFxRate
                ? "border-cyan-300/25 bg-cyan-500/10 text-cyan-200"
                : "border-amber-300/25 bg-amber-500/10 text-amber-200"
            }`} title={usesBackendFxRate ? "Using API-provided exchange rates" : "Backend did not provide this FX rate, using local fallback rates"}>
              FX Source: {usesBackendFxRate ? "backend" : "fallback"}
            </div>
            <div className="rounded-xl border border-white/20 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              FX Updated: {salaryMeta.fxUpdatedLabel} ({salaryMeta.fxUpdatedRelative})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-400">
            Industry
            <select
              value={salaryIndustry}
              onChange={(event) => setSalaryIndustry(event.target.value as SalaryIndustry)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-200 outline-none ring-0"
            >
              <option value="">All Industries</option>
              {industryOptions.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Location
            <select
              value={salaryLocation}
              onChange={(event) => setSalaryLocation(event.target.value as SalaryLocation)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-200 outline-none ring-0"
            >
              {locationOptions.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Experience
            <select
              value={salaryExperience}
              onChange={(event) => setSalaryExperience(event.target.value as SalaryExperience)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-200 outline-none ring-0"
            >
              {experienceOptions.map((experience) => (
                <option key={experience}>{experience}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Currency
            <select
              value={salaryCurrency}
              onChange={(event) => setSalaryCurrency(event.target.value as SalaryCurrency)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-200 outline-none ring-0"
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <span className="mt-1 block text-[10px] text-slate-500">
              Rate: 1 USD = {salaryConversionRate.toLocaleString()} {salaryCurrency}
            </span>
            {!usesBackendFxRate && (
              <span className="mt-0.5 block text-[10px] text-amber-300/90">
                Using fallback FX rate for this currency.
              </span>
            )}
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {rangeOptions.map((range) => (
              <button
                key={range}
                onClick={() => setSalaryRange(range)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  salaryRange === range
                    ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                    : "border-white/12 bg-white/[0.04] text-slate-400 hover:text-slate-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (compareMode) {
                setCompareMode(false);
                setSalaryAnalytics2(null);
              } else {
                setCompareMode(true);
                setSalaryIndustry2(industryOptions.find((ind) => ind !== salaryIndustry) ?? "");
              }
            }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              compareMode
                ? "border-violet-400/40 bg-violet-500/20 text-violet-100"
                : "border-white/15 bg-white/[0.04] text-slate-400 hover:text-slate-200"
            }`}
          >
            {compareMode ? "\u2715 Compare" : "+ Compare"}
          </button>
        </div>
        {compareMode && (
          <div className="mt-2">
            <label className="text-xs text-slate-400">
              Compare with Industry
              <select
                value={salaryIndustry2}
                onChange={(event) => setSalaryIndustry2(event.target.value)}
                className="mt-1 w-full rounded-xl border border-violet-500/30 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-200 outline-none ring-0 sm:w-56"
              >
                <option value="">All Industries</option>
                {industryOptions.map((ind) => (
                  <option key={ind} value={ind} disabled={ind === salaryIndustry}>{ind}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-400">Median Salary</p>
            <p className="mt-1 text-lg font-black text-white">{formatMoney(salaryMetrics.median)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-400">{growthLabel}</p>
            <p className={`mt-1 text-lg font-black ${salaryMetrics.growth >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {salaryMetrics.growth >= 0 ? "+" : ""}{salaryMetrics.growth.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-400">Open Roles (sample)</p>
            <p className="mt-1 text-lg font-black text-cyan-200">{salaryMetrics.openRoles.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-[#071125] p-3">
          {salaryLoading ? (
            <div className="h-60 w-full animate-pulse rounded-xl bg-slate-900/50" />
          ) : isCompactSalaryMode ? (
            <div className="space-y-2">
              {compactIndustryRows.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
                  No salary samples yet for selected filters.
                </p>
              )}
              {compactIndustryRows.map((row) => (
                <div key={row.industry} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-200">{row.industry}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getConfidenceClasses(row.confidence)}`}>
                      {row.confidence}
                    </span>
                  </div>
                  <div className="h-10 w-full">
                    <RechartsResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={row.series.map((value, index) => ({ index, value }))}>
                        <RechartsLine type="monotone" dataKey="value" stroke="#5eead4" strokeWidth={2} dot={false} />
                      </RechartsLineChart>
                    </RechartsResponsiveContainer>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                      <p className="text-slate-500">Median</p>
                      <p className="font-semibold text-slate-100">{formatMoneyCompact(Math.round(row.median))}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                      <p className="text-slate-500">Growth</p>
                      <p className={`font-semibold ${row.growthPercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatPercent(row.growthPercent)}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 col-span-2">
                      <p className="text-slate-500">Open Roles</p>
                      <p className="font-semibold text-slate-100">{row.openRoles.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`w-full ${isMobile ? "h-64" : "h-80"}`}>
              <RechartsResponsiveContainer width="100%" height="100%">
                <RechartsComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <RechartsCartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <RechartsXAxis dataKey="period" tick={{ fill: "#a8b3c7", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.22)" }} />
                  <RechartsYAxis
                    yAxisId="salary"
                    tick={{ fill: "#a8b3c7", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(148,163,184,0.22)" }}
                    tickFormatter={(value: number) => formatMoneyCompact(Number(value))}
                  />
                  <RechartsYAxis yAxisId="jobs" orientation="right" tick={{ fill: "#8aa0c5", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.22)" }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0f1b34",
                      border: "1px solid rgba(148,163,184,0.28)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Salary") return [formatMoney(Number(value)), "Salary"];
                      if (name === "Open Roles") return [Number(value).toLocaleString(), "Open Roles"];
                      if (typeof value === "number") return [formatMoney(Number(value)), name];
                      return [value, name];
                    }}
                  />
                  <RechartsLegend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />

                  <RechartsArea yAxisId="salary" dataKey="salaryUpper" stroke="none" fill="rgba(34,211,238,0.07)" legendType="none" />
                  <RechartsArea yAxisId="salary" dataKey="salaryLower" stroke="none" fill="#071125" legendType="none" />

                  <RechartsBar yAxisId="jobs" dataKey="jobs" name="Open Roles" fill="rgba(45,212,191,0.45)" radius={[5, 5, 0, 0]} barSize={16} />
                  <RechartsLine yAxisId="salary" type="monotone" dataKey="salary" name="Salary" stroke="#7dd3fc" strokeWidth={2.5} dot={{ r: 3, fill: "#7dd3fc" }} activeDot={{ r: 5 }} />
                  {compareMode && (
                    <RechartsLine
                      yAxisId="salary"
                      type="monotone"
                      dataKey="salary2"
                      name={`${salaryIndustry2 || "All Industries"} (Compare)`}
                      stroke="#c084fc"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      dot={{ r: 2, fill: "#c084fc" }}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  )}

                  <RechartsReferenceLine
                    yAxisId="salary"
                    y={salaryMetrics.profileEstimate}
                    stroke="rgba(251,191,36,0.9)"
                    strokeDasharray="4 4"
                    label={{ value: "Market baseline (94th pct)", fill: "#fde68a", fontSize: 11, position: "insideTopLeft" }}
                  />
                </RechartsComposedChart>
              </RechartsResponsiveContainer>
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-500">
            Based on {salaryMetrics.openRoles.toLocaleString()} listings from backend in {salaryLocation} across {salaryRange}. Values shown in {currencyLabel}.
          </p>
          {!isCompactSalaryMode && compactIndustryRows.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Top Industries</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {compactIndustryRows.map((row) => (
                  <div key={row.industry} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] font-semibold text-slate-200">{row.industry}</p>
                      <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getConfidenceClasses(row.confidence)}`}>
                        {row.confidence}
                      </span>
                    </div>
                    <div className="h-10 w-full">
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={row.series.map((value, index) => ({ index, value }))}>
                          <RechartsLine type="monotone" dataKey="value" stroke="#5eead4" strokeWidth={2} dot={false} />
                        </RechartsLineChart>
                      </RechartsResponsiveContainer>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                        <p className="text-slate-500">Median</p>
                        <p className="font-semibold text-slate-100">{formatMoneyCompact(Math.round(row.median))}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                        <p className="text-slate-500">Growth</p>
                        <p className={`font-semibold ${row.growthPercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatPercent(row.growthPercent)}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 col-span-2">
                        <p className="text-slate-500">Open Roles</p>
                        <p className="font-semibold text-slate-100">{row.openRoles.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
