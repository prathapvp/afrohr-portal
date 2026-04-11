import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import {
  BarChart as RechartBarChart,
  Bar as RechartBar,
  XAxis as RechartXAxis,
  YAxis as RechartYAxis,
  CartesianGrid as RechartCartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer as RechartResponsive,
  PieChart as RechartPieChart,
  Pie as RechartPie,
  Cell as RechartCell,
  Legend as RechartLegend,
} from "recharts";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { deleteJob, getJob, postJob } from "../../services/job-service";
import { getAllDepartments, type Department } from "../../services/department-service";
import { getAllIndustries, type Industry } from "../../services/industry-service";
import employmentTypeService, { type EmploymentType } from "../../services/employment-type-service";
import workModeService, { type WorkMode } from "../../services/workmode-service";
import { getEmployerMembers, type EmployerMember } from "../../services/user-service";
import { iconMap, toneClasses } from "../../shared";
import {
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Globe,
  LineChart,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Zap,
  Activity,
  Radar,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Crown,
  CreditCard,
  Search,
  AlertTriangle,
  BellRing,
} from "lucide-react";
import type {
  EmployerDashboard,
  EmployerPostedJob,
  EmployerPostForm,
} from "./employer-types";
import { useEmployerJobs } from "./useEmployerJobs";
import {
  DEFAULT_EMPLOYER_POST_FORM,
  LEGACY_JOB_OPTIONS,
  LEGACY_FIELD_LABELS,
  REQUIRED_LEGACY_FIELDS,
} from "./employer-types";
import { normalizeEmployerJob } from "./employer-view.utils";
import { useNavigate } from "react-router";
import { getMySubscription } from "../../services/subscription-service";
import type { EmployerSubscription } from "../../services/admin-service";

type SalarySuggestion = {
  min: number;
  max: number;
  currency: string;
  confidence: number;
};

const USD_CONVERSION: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83,
};

function roundToNearest(value: number, step = 1000): number {
  return Math.max(step, Math.round(value / step) * step);
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getProgressPercentage(used: number, limit?: number | null) {
  if (!limit || limit <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

function normalizeOptionKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function withSelectedOption(options: string[], selected: string): string[] {
  const selectedTrimmed = selected.trim();
  if (!selectedTrimmed) {
    return options;
  }

  const selectedKey = normalizeOptionKey(selectedTrimmed);
  const exists = options.some((option) => normalizeOptionKey(option) === selectedKey);
  return exists ? options : [selectedTrimmed, ...options];
}

function stripLegacyDescription(description: string): string {
  const marker = "Legacy Post Details";
  const index = description.indexOf(marker);
  const raw = index >= 0 ? description.slice(0, index) : description;
  return raw.replace(/\r\n/g, "\n").trim();
}

function normalizeDescriptionForEdit(description: string): string {
  return stripLegacyDescription(description)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderDescriptionContent(description: string): ReactNode {
  const lines = stripLegacyDescription(description)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let inSectionList = false;

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-300">
      {lines.map((line, index) => {
        const isHeading = line.endsWith(":");
        const isBullet = /^[-*•]\s+/.test(line);

        if (isHeading) {
          inSectionList = true;
          return (
            <p key={`h-${index}`} className="mt-3 font-semibold text-slate-100 first:mt-0">
              {line}
            </p>
          );
        }

        if (isBullet || inSectionList) {
          const text = isBullet ? line.replace(/^[-*•]\s+/, "") : line;
          return (
            <p key={`b-${index}`} className="pl-4 before:mr-2 before:text-sky-300 before:content-['•']">
              {text}
            </p>
          );
        }

        return <p key={`p-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function estimateSalarySuggestion(input: {
  role?: string;
  experience?: string;
  location?: string;
  industry?: string;
  employmentType?: string;
  workMode?: string;
  skills?: string;
  currency?: string;
}): SalarySuggestion {
  const currency = (input.currency || "USD").toUpperCase();
  const role = (input.role || "").toLowerCase();
  const exp = (input.experience || "").toLowerCase();
  const location = (input.location || "").toLowerCase();
  const industry = (input.industry || "").toLowerCase();
  const employmentType = (input.employmentType || "").toLowerCase();
  const workMode = (input.workMode || "").toLowerCase();
  const skills = (input.skills || "").toLowerCase();

  let baseMin = 65000;
  let baseMax = 90000;

  if (role.includes("engineer") || role.includes("developer")) {
    baseMin += 10000;
    baseMax += 20000;
  }
  if (role.includes("frontend")) {
    baseMin += 7000;
    baseMax += 12000;
  }
  if (role.includes("senior") || role.includes("lead")) {
    baseMin += 18000;
    baseMax += 30000;
  }

  let multiplier = 1;

  if (exp.includes("0-2") || exp.includes("entry")) multiplier *= 0.75;
  else if (exp.includes("2-5") || exp.includes("3-5") || exp.includes("intermediate")) multiplier *= 1.0;
  else if (exp.includes("5-10") || exp.includes("expert")) multiplier *= 1.25;

  if (location.includes("san francisco") || location.includes("new york") || location.includes("london")) multiplier *= 1.35;
  else if (location.includes("lagos") || location.includes("nairobi") || location.includes("accra")) multiplier *= 0.7;
  else if (location.includes("india")) multiplier *= 0.65;

  if (industry.includes("fintech") || industry.includes("payments")) multiplier *= 1.15;
  else if (industry.includes("technology") || industry.includes("it services")) multiplier *= 1.1;
  else if (industry.includes("healthcare")) multiplier *= 1.05;

  if (employmentType.includes("contract") || employmentType.includes("temporary")) multiplier *= 1.1;
  else if (employmentType.includes("part time")) multiplier *= 0.65;

  if (workMode.includes("remote")) multiplier *= 1.05;
  else if (workMode.includes("in office")) multiplier *= 0.98;

  let skillsBoost = 1;
  if (skills.includes("react")) skillsBoost += 0.04;
  if (skills.includes("typescript")) skillsBoost += 0.04;
  if (skills.includes("node") || skills.includes("next")) skillsBoost += 0.03;
  if (skills.includes("tailwind")) skillsBoost += 0.02;
  multiplier *= Math.min(skillsBoost, 1.12);

  const rate = USD_CONVERSION[currency] ?? 1;
  const min = roundToNearest(baseMin * multiplier * rate);
  const max = roundToNearest(baseMax * multiplier * rate);

  let confidence = 35;
  if (role) confidence += 15;
  if (exp) confidence += 10;
  if (location) confidence += 10;
  if (industry) confidence += 10;
  if (employmentType) confidence += 10;
  if (workMode) confidence += 5;
  if (skills) confidence += 10;

  return {
    min,
    max: Math.max(min + roundToNearest(min * 0.15), max),
    currency,
    confidence: Math.min(confidence, 95),
  };
}

export default function EmployerView({ dashboard }: { dashboard: EmployerDashboard; }) {
  const navigate = useNavigate();
  const [legacyTab, setLegacyTab] = useState<"ACTIVE" | "DRAFT" | "CLOSED">("ACTIVE");
  const [isPostJobDialogOpen, setIsPostJobDialogOpen] = useState(false);
  const [isViewJobDialogOpen, setIsViewJobDialogOpen] = useState(false);
  const [postForm, setPostForm] = useState<EmployerPostForm>(DEFAULT_EMPLOYER_POST_FORM);
  const [postJobMode, setPostJobMode] = useState<"create" | "edit">("create");
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editingJobPostedBy, setEditingJobPostedBy] = useState<number | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<EmployerPostedJob | null>(null);
  const [viewJobBusy, setViewJobBusy] = useState(false);
  const [jobActionBusyId, setJobActionBusyId] = useState<number | null>(null);
  const [postJobBusy, setPostJobBusy] = useState(false);
  const [postJobError, setPostJobError] = useState<string | null>(null);
  const [postJobSuccess, setPostJobSuccess] = useState<string | null>(null);
  const [jobsRailScrolled, setJobsRailScrolled] = useState(false);
  const [intelligenceExpanded, setIntelligenceExpanded] = useState(false);
  const [intelligenceTab, setIntelligenceTab] = useState<"skills" | "workforce" | "industry" | "location" | "department">("skills");
  const jobsRailRef = useRef<HTMLDivElement | null>(null);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [industryList, setIndustryList] = useState<Industry[]>([]);
  const [employmentTypeList, setEmploymentTypeList] = useState<EmploymentType[]>([]);
  const [workModeList, setWorkModeList] = useState<WorkMode[]>([]);
  const [subscription, setSubscription] = useState<EmployerSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<EmployerMember[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const accountType = (localStorage.getItem("accountType") ?? "").toUpperCase();
  const token = localStorage.getItem("token");
  const isEmployerAuthorized = Boolean(token) && accountType === "EMPLOYER";
  const authRequiredMessage = "Please sign up or log in as an employer to perform employer operations.";
  const { legacyJobs, legacyJobsLoading, legacyJobsError, setLegacyJobs, setLegacyJobsError } = useEmployerJobs(isEmployerAuthorized);

  function requireEmployerAccess(): boolean {
    if (isEmployerAuthorized) {
      return true;
    }

    setPostJobSuccess(null);
    setPostJobError(authRequiredMessage);
    setLegacyJobsError(authRequiredMessage);
    setIsPostJobDialogOpen(false);
    return false;
  }

  const canPostBySubscription = isEmployerAuthorized && Boolean(subscription?.postingAllowed);

  function getSubscriptionBlockReason(): string {
    if (subscriptionLoading) {
      return "Checking subscription permissions...";
    }
    if (subscriptionError) {
      return subscriptionError;
    }
    if (!subscription) {
      return "No subscription configured. Contact admin to activate your plan.";
    }
    if (subscription.paymentStatus !== "PAID") {
      return "Payment is pending. Complete payment to enable job posting.";
    }
    if (subscription.subscriptionStatus !== "ACTIVE") {
      return `Subscription status is ${subscription.subscriptionStatus}. Please renew or contact admin.`;
    }
    if (subscription.remainingDays <= 0) {
      return "Your subscription has expired. Renew to continue posting jobs.";
    }
    if (subscription.maxActiveJobs > 0 && subscription.activeJobs >= subscription.maxActiveJobs) {
      return `Plan limit reached (${subscription.activeJobs}/${subscription.maxActiveJobs} active jobs). Upgrade or close a job.`;
    }
    return "Posting is currently unavailable for this subscription.";
  }

  function openPostJobDialog() {
    if (!requireEmployerAccess()) {
      return;
    }

    if (!canPostBySubscription) {
      const reason = getSubscriptionBlockReason();
      setPostJobSuccess(null);
      setPostJobError(reason);
      return;
    }

    void navigate("/post-job/0");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSubscription() {
      if (!isEmployerAuthorized) {
        setSubscription(null);
        setSubscriptionError(null);
        setSubscriptionLoading(false);
        return;
      }

      try {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        const data = await getMySubscription();
        if (!cancelled) {
          setSubscription(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load subscription details.";
          setSubscription(null);
          setSubscriptionError(message);
        }
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      }
    }

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [isEmployerAuthorized]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployerMembers() {
      if (!isEmployerAuthorized) {
        setTeamMembers([]);
        setTeamMembersLoading(false);
        return;
      }

      try {
        setTeamMembersLoading(true);
        const data = await getEmployerMembers();
        if (!cancelled) {
          setTeamMembers(data);
        }
      } catch {
        if (!cancelled) {
          setTeamMembers([]);
        }
      } finally {
        if (!cancelled) {
          setTeamMembersLoading(false);
        }
      }
    }

    void loadEmployerMembers();

    return () => {
      cancelled = true;
    };
  }, [isEmployerAuthorized]);

  useEffect(() => {
    const rail = jobsRailRef.current;
    if (!rail) return;

    const scrollHost = rail.closest(".overflow-y-auto") as HTMLElement | null;
    const target: HTMLElement | Window = scrollHost ?? window;

    const updateShadow = () => {
      const scrollTop = target === window ? window.scrollY : (target as HTMLElement).scrollTop;
      setJobsRailScrolled(scrollTop > 8);
    };

    updateShadow();
    target.addEventListener("scroll", updateShadow, { passive: true });
    return () => target.removeEventListener("scroll", updateShadow);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      if (!isEmployerAuthorized) {
        setDepartmentList([]);
        setIndustryList([]);
        setEmploymentTypeList([]);
        setWorkModeList([]);
        return;
      }

      const [departments, industries, employmentTypes, workModes] = await Promise.all([
        getAllDepartments().catch(() => [] as Department[]),
        getAllIndustries().catch(() => [] as Industry[]),
        employmentTypeService.getAllEmploymentTypes().catch(() => [] as EmploymentType[]),
        workModeService.getAllWorkModes().catch(() => [] as WorkMode[]),
      ]);

      if (cancelled) {
        return;
      }

      setDepartmentList(departments);
      setIndustryList(industries);
      setEmploymentTypeList(employmentTypes);
      setWorkModeList(workModes);
    }

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [isEmployerAuthorized]);

  function resetPostForm(clearMessages = true) {
    setPostForm(DEFAULT_EMPLOYER_POST_FORM);
    if (clearMessages) {
      setPostJobError(null);
      setPostJobSuccess(null);
    }
    setEditingJobId(null);
    setEditingJobPostedBy(undefined);
    setPostJobMode("create");
  }

  function validateLegacyPostForm(form: EmployerPostForm): string | null {
    if (!form.title.trim() || !form.company.trim() || !form.location.trim() || !form.salary.trim()) {
      return "Title, company, location, and salary are required.";
    }

    const missingLegacyFields = REQUIRED_LEGACY_FIELDS.filter((field) => !form[field].trim());
    if (missingLegacyFields.length > 0) {
      const missingLabels = missingLegacyFields.map((field) => LEGACY_FIELD_LABELS[field]);
      return `Please fill required metadata fields: ${missingLabels.join(", ")}.`;
    }

    const vacancies = Number.parseInt(form.vacancies.trim(), 10);
    if (!Number.isFinite(vacancies) || vacancies < 1) {
      return "Vacancies must be a numeric value greater than or equal to 1.";
    }

    return null;
  }

  const statusCounts = {
    ACTIVE: legacyJobs.filter((job) => job.jobStatus === "ACTIVE").length,
    DRAFT: legacyJobs.filter((job) => job.jobStatus === "DRAFT").length,
    CLOSED: legacyJobs.filter((job) => job.jobStatus === "CLOSED").length,
  };

  const liveInsights = useMemo(() => {
    const salaryBars: { name: string; salary: number }[] = [];
    const salaries: number[] = [];
    for (const job of legacyJobs) {
      if (!job.salary) continue;
      const str = String(job.salary).replace(/[^0-9.k\-]/gi, "");
      let val = 0;
      const rangeMatch = str.match(/(\d+\.?\d*)k?\s*-\s*(\d+\.?\d*)k?/i);
      if (rangeMatch) {
        let lo = parseFloat(rangeMatch[1]);
        let hi = parseFloat(rangeMatch[2]);
        if (str.toLowerCase().includes("k")) { lo *= 1000; hi *= 1000; }
        val = (lo + hi) / 2;
      } else {
        const single = parseFloat(str);
        if (Number.isFinite(single) && single > 0) {
          val = single < 1000 ? single * 1000 : single;
        }
      }
      if (val > 0) {
        salaries.push(val);
        const label = job.jobTitle || job.role || `Job #${job.id}`;
        salaryBars.push({ name: label.length > 15 ? label.slice(0, 15) + "…" : label, salary: Math.round(val) });
      }
    }
    const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
    const activeJobs = legacyJobs.filter((j) => j.jobStatus === "ACTIVE");
    const totalVacancies = activeJobs.reduce((sum, j) => sum + (j.vacancies ?? 1), 0);
    const oldestActive = activeJobs.reduce((oldest, j) => {
      const t = j.postTime ? new Date(j.postTime).getTime() : Date.now();
      return t < oldest ? t : oldest;
    }, Date.now());
    const avgDaysOpen = activeJobs.length > 0 ? Math.round((Date.now() - oldestActive) / (1000 * 60 * 60 * 24)) : 0;
    // ── Department breakdown ──
    const deptMap = new Map<string, { count: number; totalSalary: number; salaryN: number }>();
    for (const job of legacyJobs) {
      const dept = job.department || "Other";
      const entry = deptMap.get(dept) ?? { count: 0, totalSalary: 0, salaryN: 0 };
      entry.count += 1;
      const sv = salaryBars.find((s) => s.name.startsWith((job.jobTitle || "").slice(0, 12)));
      if (sv) { entry.totalSalary += sv.salary; entry.salaryN += 1; }
      deptMap.set(dept, entry);
    }
    const DEPT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
    const departmentData = [...deptMap.entries()].map(([name, d], i) => ({
      name: name.length > 18 ? name.slice(0, 18) + "…" : name,
      value: d.count,
      avgSalary: d.salaryN > 0 ? Math.round(d.totalSalary / d.salaryN) : 0,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }));

    // ── Work‑mode donut ──
    const wmMap = new Map<string, number>();
    for (const job of legacyJobs) { wmMap.set(job.workMode || "Unknown", (wmMap.get(job.workMode || "Unknown") ?? 0) + 1); }
    const WM_COLORS = ["#6366f1", "#22d3ee", "#f97316", "#a855f7"];
    const workModeData = [...wmMap.entries()].map(([name, value], i) => ({ name, value, fill: WM_COLORS[i % WM_COLORS.length] }));

    // ── Employment type donut ──
    const etMap = new Map<string, number>();
    for (const job of legacyJobs) { etMap.set(job.employmentType || "Unknown", (etMap.get(job.employmentType || "Unknown") ?? 0) + 1); }
    const ET_COLORS = ["#0ea5e9", "#f43f5e", "#a3e635", "#e879f9"];
    const employmentTypeData = [...etMap.entries()].map(([name, value], i) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, value, fill: ET_COLORS[i % ET_COLORS.length] }));

    // ── Experience donut ──
    const expMap = new Map<string, number>();
    for (const job of legacyJobs) { expMap.set(job.experience || "Not specified", (expMap.get(job.experience || "Not specified") ?? 0) + 1); }
    const EXP_COLORS = ["#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];
    const experienceData = [...expMap.entries()].map(([name, value], i) => ({ name, value, fill: EXP_COLORS[i % EXP_COLORS.length] }));

    const timeMap = new Map<string, number>();
    for (const job of legacyJobs) {
      if (job.postTime) {
        const d = new Date(job.postTime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        timeMap.set(key, (timeMap.get(key) ?? 0) + 1);
      }
    }
    const postingTimeline = [...timeMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, jobs]) => ({ month, jobs }));

    const indMap = new Map<string, number>();
    for (const job of legacyJobs) { indMap.set(job.industry || "Other", (indMap.get(job.industry || "Other") ?? 0) + 1); }
    const industryData = [...indMap.entries()].map(([name, jobs]) => ({
      name: name.length > 22 ? name.slice(0, 22) + "…" : name,
      jobs,
    }));

    const skillCounts = new Map<string, number>();
    for (const job of legacyJobs) {
      if (!job.skills) continue;
      for (const s of job.skills.split(",")) {
        const sk = s.trim();
        if (sk) skillCounts.set(sk, (skillCounts.get(sk) ?? 0) + 1);
      }
    }
    // Horizontal bar chart data for top skills
    const barSkillData = [...skillCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, demand: count }));

    const fillRate = legacyJobs.length > 0 ? Math.round((statusCounts.ACTIVE / legacyJobs.length) * 100) : 0;

    const locMap = new Map<string, number>();
    for (const job of legacyJobs) { locMap.set(job.location || "Remote", (locMap.get(job.location || "Remote") ?? 0) + 1); }
    const locationData = [...locMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }));
    const maxLocCount = Math.max(...locationData.map((d) => d.count), 1);

    const skillCoverage = legacyJobs.length > 0 ? Math.round((legacyJobs.filter((j) => j.skills).length / legacyJobs.length) * 100) : 0;
    const salaryCoverage = legacyJobs.length > 0 ? Math.round((salaries.length / legacyJobs.length) * 100) : 0;
    const deptCoverage = Math.min(Math.round((deptMap.size / 10) * 100), 100);
    const progressMetrics = [
      { label: "Active Rate", pct: fillRate, color: "#10b981" },
      { label: "Salary Info", pct: salaryCoverage, color: "#3b82f6" },
      { label: "Skills Tagged", pct: skillCoverage, color: "#8b5cf6" },
      { label: "Dept Spread", pct: deptCoverage, color: "#f59e0b" },
    ];

    // ── AI contextual insights ──
    const aiInsights: string[] = [];
    if (departmentData.length > 0) {
      const topDept = departmentData.reduce((a, b) => (a.value > b.value ? a : b));
      aiInsights.push(`${topDept.name} leads hiring with ${topDept.value} open positions`);
    }
    if (avgSalary > 0) aiInsights.push(`Average offering is $${(avgSalary / 1000).toFixed(0)}k across all listings`);
    if (barSkillData && barSkillData.length > 0) {
      aiInsights.push(`${barSkillData[0].skill} is the most in-demand skill (${barSkillData[0].demand} jobs)`);
    }
    if (workModeData.length > 0) {
      const topWM = workModeData.reduce((a, b) => (a.value > b.value ? a : b));
      aiInsights.push(`${topWM.name} is the dominant work model (${topWM.value} positions)`);
    }
    if (postingTimeline.length > 1) {
      const last = postingTimeline[postingTimeline.length - 1];
      const prev = postingTimeline[postingTimeline.length - 2];
      const delta = last.jobs - prev.jobs;
      aiInsights.push(delta >= 0 ? `Posting volume up by ${delta} jobs in ${last.month}` : `Posting volume down by ${Math.abs(delta)} jobs in ${last.month}`);
    }
    if (fillRate > 70) aiInsights.push("Strong pipeline health \u2014 over 70% of positions are actively listed");
    else if (fillRate < 30 && legacyJobs.length > 0) aiInsights.push("Consider reactivating draft listings \u2014 active rate is below 30%");

    return {
      avgSalary, totalVacancies, activeCount: activeJobs.length, totalCount: legacyJobs.length,
      avgDaysOpen,
      departmentData, workModeData, employmentTypeData, experienceData,
      industryData, barSkillData, fillRate, locationData, maxLocCount,
      progressMetrics, aiInsights,
    };
  }, [legacyJobs, statusCounts]);

  const visibleLegacyJobs = legacyJobs
    .filter((job) => job.jobStatus === legacyTab)
    .sort((a, b) => new Date(b.postTime ?? 0).getTime() - new Date(a.postTime ?? 0).getTime());
  const latestWorkspaceJob = [...legacyJobs].sort((a, b) => new Date(b.postTime ?? 0).getTime() - new Date(a.postTime ?? 0).getTime())[0] ?? null;
  const ownerCount = teamMembers.filter((member) => member.employerRole === "OWNER").length;
  const latestWorkspaceJobTitle = latestWorkspaceJob?.jobTitle ?? "No jobs yet";
  const latestWorkspaceJobDetail = latestWorkspaceJob?.postTime
    ? `Updated on ${new Date(latestWorkspaceJob.postTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} with status ${latestWorkspaceJob.jobStatus.toLowerCase()}.`
    : latestWorkspaceJob
      ? `Current status is ${latestWorkspaceJob.jobStatus.toLowerCase()}.`
      : "Create your first employer posting.";
  const workspaceSummary = [
    {
      key: "team",
      label: "Team Access",
      value: teamMembersLoading ? "Loading..." : `${teamMembers.length}`,
      detail: teamMembers.length === 1 ? "1 member in workspace" : `${teamMembers.length} members in workspace`,
      accentClass: "from-cyan-500/20 to-blue-500/10",
      icon: Users,
    },
    {
      key: "activity",
      label: "Latest Job Activity",
      value: latestWorkspaceJob?.jobTitle ?? "No jobs yet",
      detail: latestWorkspaceJob?.postTime
        ? `Updated ${new Date(latestWorkspaceJob.postTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Create your first employer posting",
      accentClass: "from-violet-500/20 to-fuchsia-500/10",
      icon: Activity,
    },
    {
      key: "renewal",
      label: "Renewal Urgency",
      value: subscription
        ? subscription.remainingDays <= 14
          ? `${Math.max(subscription.remainingDays, 0)}d left`
          : "On track"
        : subscriptionLoading
          ? "Checking..."
          : "No plan",
      detail: subscription
        ? subscription.remainingDays <= 14
          ? "Renew soon to avoid posting disruption"
          : `Plan ${subscription.planName} is healthy`
        : getSubscriptionBlockReason(),
      accentClass: subscription && subscription.remainingDays <= 14 ? "from-amber-500/20 to-orange-500/10" : "from-emerald-500/20 to-teal-500/10",
      icon: Crown,
    },
  ];
  const employerActivityFeed = [
    subscription && subscription.remainingDays <= 14
      ? {
          key: "renewal-alert",
          title: "Renewal window is tightening",
          detail: `${Math.max(subscription.remainingDays, 0)} day${Math.max(subscription.remainingDays, 0) === 1 ? "" : "s"} left on ${subscription.planName}. Renew now to avoid posting interruptions.`,
          toneClass: "border-amber-400/20 bg-amber-500/10 text-amber-100",
          meta: "Subscription",
          actionLabel: "Renew now",
          actionKey: "renewal",
        }
      : null,
    latestWorkspaceJob
      ? {
          key: "latest-job",
          title: `Latest job activity: ${latestWorkspaceJobTitle}`,
          detail: latestWorkspaceJobDetail,
          toneClass: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
          meta: "Hiring activity",
          actionLabel: "View job",
          actionKey: "view-job",
        }
      : null,
    teamMembers.length > 0
      ? {
          key: "team-members",
          title: `Workspace connected to ${teamMembers.length} team member${teamMembers.length === 1 ? "" : "s"}`,
          detail: `${ownerCount || 1} owner-level member${ownerCount === 1 ? "" : "s"} and recruiter access is available for collaboration.`,
          toneClass: "border-violet-400/20 bg-violet-500/10 text-violet-100",
          meta: "Team access",
          actionLabel: "Manage team",
          actionKey: "manage-team",
        }
      : null,
    statusCounts.DRAFT > 0
      ? {
          key: "draft-reminder",
          title: `${statusCounts.DRAFT} draft job${statusCounts.DRAFT === 1 ? "" : "s"} awaiting review`,
          detail: "Publish or refine draft listings to improve candidate reach and keep hiring momentum high.",
          toneClass: "border-sky-400/20 bg-sky-500/10 text-sky-100",
          meta: "Pipeline",
          actionLabel: "Publish drafts",
          actionKey: "publish-drafts",
        }
      : null,
    (!subscription && !subscriptionLoading) || subscriptionError
      ? {
          key: "subscription-missing",
          title: "Subscription access needs attention",
          detail: getSubscriptionBlockReason(),
          toneClass: "border-rose-400/20 bg-rose-500/10 text-rose-100",
          meta: "Billing",
          actionLabel: "Set up billing",
          actionKey: "setup-billing",
        }
      : null,
  ].filter((item): item is { key: string; title: string; detail: string; toneClass: string; meta: string; actionLabel: string; actionKey: string } => item !== null);
  const subscriptionUsage = subscription
    ? [
        {
          label: "Active jobs",
          used: subscription.activeJobs,
          limit: subscription.maxActiveJobs,
          progress: getProgressPercentage(subscription.activeJobs, subscription.maxActiveJobs),
          accentClass: subscription.maxActiveJobs > 0 && subscription.activeJobs >= subscription.maxActiveJobs ? "bg-rose-500" : "bg-cyan-400",
        },
        {
          label: "Resume views",
          used: subscription.monthlyResumeViewsUsed,
          limit: subscription.maxResumeViewsPerMonth,
          progress: getProgressPercentage(subscription.monthlyResumeViewsUsed, subscription.maxResumeViewsPerMonth),
          accentClass: subscription.maxResumeViewsPerMonth > 0 && subscription.monthlyResumeViewsUsed >= subscription.maxResumeViewsPerMonth ? "bg-rose-500" : "bg-emerald-400",
        },
        {
          label: "Downloads",
          used: subscription.monthlyResumeDownloadsUsed,
          limit: subscription.maxResumeDownloadsPerMonth,
          progress: getProgressPercentage(subscription.monthlyResumeDownloadsUsed, subscription.maxResumeDownloadsPerMonth),
          accentClass: subscription.maxResumeDownloadsPerMonth > 0 && subscription.monthlyResumeDownloadsUsed >= subscription.maxResumeDownloadsPerMonth ? "bg-rose-500" : "bg-violet-400",
        },
      ]
    : [];
  const jobsNeedingAttention = [
    subscriptionLoading
      ? { key: "subscription-loading", tone: "cyan", title: "Checking subscription", detail: "Validating current plan permissions and usage counters." }
      : null,
    subscriptionError
      ? { key: "subscription-error", tone: "rose", title: "Subscription issue", detail: subscriptionError }
      : null,
    subscription && subscription.paymentStatus !== "PAID"
      ? { key: "payment", tone: "amber", title: "Payment pending", detail: "Complete the current billing cycle to restore full posting access." }
      : null,
    subscription && subscription.remainingDays > 0 && subscription.remainingDays <= 14
      ? { key: "renewal", tone: "amber", title: "Renewal approaching", detail: `${subscription.remainingDays} day${subscription.remainingDays === 1 ? "" : "s"} left on the current plan.` }
      : null,
    subscription && subscription.maxActiveJobs > 0 && subscription.activeJobs >= subscription.maxActiveJobs
      ? { key: "capacity", tone: "rose", title: "Active job cap reached", detail: `You are using ${subscription.activeJobs}/${subscription.maxActiveJobs} active job slots.` }
      : null,
    statusCounts.DRAFT > 0
      ? { key: "drafts", tone: "violet", title: "Draft jobs waiting", detail: `${statusCounts.DRAFT} draft job${statusCounts.DRAFT === 1 ? "" : "s"} can be published.` }
      : null,
    legacyJobs.filter((job) => !job.skills || job.skills.trim().length === 0).length > 0
      ? {
          key: "skills",
          tone: "sky",
          title: "Jobs missing skills",
          detail: `${legacyJobs.filter((job) => !job.skills || job.skills.trim().length === 0).length} posting${legacyJobs.filter((job) => !job.skills || job.skills.trim().length === 0).length === 1 ? "" : "s"} could be improved with skills tags.`
        }
      : null,
  ].filter((item): item is { key: string; tone: string; title: string; detail: string } => item !== null);

  const postFormSalarySuggestion = useMemo(
    () =>
      estimateSalarySuggestion({
        role: postForm.role,
        experience: postForm.experience,
        location: postForm.location,
        industry: postForm.industry,
        employmentType: postForm.employmentType,
        workMode: postForm.workMode,
        skills: postForm.skills,
        currency: postForm.currency,
      }),
    [
      postForm.role,
      postForm.experience,
      postForm.location,
      postForm.industry,
      postForm.employmentType,
      postForm.workMode,
      postForm.skills,
      postForm.currency,
    ],
  );

  const selectedJobSalarySuggestion = useMemo(() => {
    if (!selectedJob) return null;
    return estimateSalarySuggestion({
      role: selectedJob.role,
      experience: selectedJob.experience,
      location: selectedJob.location,
      industry: selectedJob.industry,
      employmentType: selectedJob.employmentType,
      workMode: selectedJob.workMode,
      skills: selectedJob.skills,
      currency: selectedJob.currency,
    });
  }, [selectedJob]);

  const departmentOptions = useMemo(
    () => withSelectedOption(departmentList.map((dept) => dept.name), postForm.department),
    [departmentList, postForm.department],
  );

  const industryOptions = useMemo(
    () => withSelectedOption(industryList.map((industry) => industry.name), postForm.industry),
    [industryList, postForm.industry],
  );

  const employmentTypeOptions = useMemo(
    () => withSelectedOption(employmentTypeList.map((employmentType) => employmentType.name), postForm.employmentType),
    [employmentTypeList, postForm.employmentType],
  );

  const workModeOptions = useMemo(
    () => withSelectedOption(workModeList.map((workMode) => workMode.name), postForm.workMode),
    [workModeList, postForm.workMode],
  );

  const currencyOptions = useMemo(
    () => withSelectedOption([...LEGACY_JOB_OPTIONS.currencies], postForm.currency),
    [postForm.currency],
  );

  const experienceOptions = useMemo(
    () => withSelectedOption([...LEGACY_JOB_OPTIONS.experiences], postForm.experience),
    [postForm.experience],
  );

  async function handleSubmitPostJob() {
    if (!requireEmployerAccess()) {
      return;
    }

    const status = postForm.jobStatus;
    const validationError = validateLegacyPostForm(postForm);
    if (validationError) {
      setPostJobSuccess(null);
      setPostJobError(validationError);
      return;
    }

    try {
      setPostJobBusy(true);
      setPostJobError(null);
      setPostJobSuccess(null);

      const created = (await postJob({
        id: editingJobId ?? undefined,
        title: postForm.title.trim(),
        company: postForm.company.trim(),
        location: postForm.location.trim(),
        salary: postForm.salary.trim(),
        description: postForm.description.trim(),
        logoTone: postForm.logoTone,
        department: postForm.department.trim(),
        role: postForm.role.trim(),
        experience: postForm.experience.trim(),
        employmentType: postForm.employmentType.trim(),
        industry: postForm.industry.trim(),
        workMode: postForm.workMode.trim(),
        currency: postForm.currency.trim(),
        vacancies: Number.parseInt(postForm.vacancies.trim(), 10),
        skills: postForm.skills.trim(),
        postedBy: editingJobPostedBy,
        jobStatus: status,
      })) as Record<string, unknown>;

      const createdJob = created.job && typeof created.job === "object" ? (created.job as Record<string, unknown>) : created;
      const normalized = normalizeEmployerJob(createdJob);
      setLegacyJobs((prev) => [normalized, ...prev.filter((job) => job.id !== normalized.id)]);
      setLegacyTab(normalized.jobStatus);
      setIsPostJobDialogOpen(false);
      setPostJobSuccess(
        postJobMode === "edit"
          ? status === "ACTIVE"
            ? "Job updated successfully."
            : "Draft updated successfully."
          : status === "ACTIVE"
            ? "Job published successfully."
            : "Job saved as draft successfully.",
      );
      resetPostForm(false);
    } catch (error) {
      setPostJobSuccess(null);
      setPostJobError(error instanceof Error ? error.message : "Failed to post job.");
    } finally {
      setPostJobBusy(false);
    }
  }

  async function handleViewJob(jobId: number) {
    if (!requireEmployerAccess()) {
      return;
    }

    try {
      setViewJobBusy(true);
      setLegacyJobsError(null);
      const data = (await getJob(jobId)) as Record<string, unknown>;
      const normalized = normalizeEmployerJob(data);
      setSelectedJob(normalized);
      setIsViewJobDialogOpen(true);
    } catch (error) {
      setLegacyJobsError(error instanceof Error ? error.message : "Failed to load job details.");
    } finally {
      setViewJobBusy(false);
    }
  }

  async function handleEditJob(jobId: number) {
    if (!requireEmployerAccess()) {
      return;
    }

    void navigate(`/post-job/${jobId}`);
  }

  async function handleDeleteJob(jobId: number) {
    if (!requireEmployerAccess()) {
      return;
    }

    const confirmed = window.confirm(`Delete job #${jobId}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      setJobActionBusyId(jobId);
      setLegacyJobsError(null);
      await deleteJob(jobId);
      setLegacyJobs((prev) => prev.filter((job) => job.id !== jobId));
      const isDeletingSelected = selectedJob?.id === jobId;
      setSelectedJob((prev) => (prev?.id === jobId ? null : prev));
      if (isDeletingSelected) {
        setIsViewJobDialogOpen(false);
      }
      setPostJobSuccess("Job deleted successfully.");
    } catch (error) {
      setLegacyJobsError(error instanceof Error ? error.message : "Failed to delete job.");
    } finally {
      setJobActionBusyId(null);
    }
  }

  return (
    <div
      className="relative w-full overflow-x-hidden bg-[#0a0e1a] bg-gradient-to-br from-[#0a0e1a] via-[#101c2c] to-[#1a2a3a] font-sans text-white"
      style={{
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="animated-mesh-blob blue" />
        <div className="animated-mesh-blob violet" />
      </div>
      <div className="relative z-10 w-full space-y-3 px-0 py-0">
      {/* ── Hero Card ── */}
      <Card id="overview" className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white shadow-2xl glass-card elevated-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        {/* Animated mesh/gradient background */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <svg className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 animate-gradient-mesh" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="mesh1" cx="50%" cy="50%" r="80%" fx="50%" fy="50%" gradientTransform="rotate(20)">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <ellipse cx="300" cy="300" rx="300" ry="300" fill="url(#mesh1)" />
          </svg>
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[.06] animate-float-slow" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/[.04] animate-float-slower" />
          <div className="absolute top-1/2 right-1/4 h-40 w-40 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-2xl animate-pulse" />
        </div>
        <CardContent className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/20 backdrop-blur-sm">
                  <Zap className="h-4 w-4 text-yellow-300" />
                </div>
                <Badge className="relative flex items-center gap-1 overflow-hidden border border-yellow-300/40 bg-yellow-100/20 px-3 py-1 font-semibold text-yellow-50 shadow-lg animate-shimmer-badge">
                  <Crown className="h-4 w-4 text-yellow-300 drop-shadow mr-1 animate-bounce" />
                  <span className="relative z-10">{dashboard.hero.badge}</span>
                  <span className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-yellow-200/30 via-yellow-100/10 to-transparent animate-shimmer" style={{ opacity: 0.7 }} />
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{dashboard.hero.title}</h1>
              <p className="text-base leading-relaxed text-emerald-100/90 sm:text-lg">{dashboard.hero.description}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="min-h-12 gap-2 bg-white px-6 font-semibold text-green-700 shadow-lg shadow-black/10 transition-all hover:bg-green-50 hover:shadow-xl sm:w-auto"
                  disabled={!isEmployerAuthorized}
                  onClick={() => void navigate("/post-job/0")}
                >
                  <Plus className="h-4 w-4" />
                  {dashboard.hero.actionLabel}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 gap-2 border-cyan-300/50 bg-cyan-500/10 px-6 font-semibold text-cyan-100 transition-all hover:bg-cyan-500/20 sm:w-auto"
                  disabled={!isEmployerAuthorized}
                  onClick={() => void navigate("/dashboard?tab=employers&section=subscription")}
                >
                  <Crown className="h-4 w-4" />
                  Manage Subscription
                </Button>
              </div>
            </div>
            {/* Right-side stat cluster */}
            <div className="hidden gap-3 lg:grid lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{liveInsights.activeCount}</p>
                <p className="text-xs text-emerald-200">Active Jobs</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{liveInsights.totalVacancies}</p>
                <p className="text-xs text-emerald-200">Open Positions</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{liveInsights.avgSalary > 0 ? `$${(liveInsights.avgSalary / 1000).toFixed(0)}k` : "--"}</p>
                <p className="text-xs text-emerald-200">Avg. Salary</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{liveInsights.avgDaysOpen > 0 ? `${liveInsights.avgDaysOpen}d` : "--"}</p>
                <p className="text-xs text-emerald-200">Avg. Days Open</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0f172a]/95 via-[#11243b]/92 to-[#151d32]/95 shadow-xl ring-1 ring-white/[0.08] glass-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Subscription Status</p>
                    <h3 className="text-xl font-bold tracking-tight text-white">Plan Control Center</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {subscriptionLoading
                    ? "Loading current subscription details..."
                    : subscription
                      ? `${subscription.planName} plan is ${subscription.subscriptionStatus.toLowerCase()} with ${Math.max(subscription.remainingDays, 0)} day${Math.max(subscription.remainingDays, 0) === 1 ? "" : "s"} remaining.`
                      : getSubscriptionBlockReason()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-300/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => void navigate("/dashboard?tab=employers&section=subscription")}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  disabled={!canPostBySubscription}
                  onClick={openPostJobDialog}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Post Job
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Plan</p>
                <p className="mt-2 text-2xl font-black text-white">{subscription?.planName ?? "Not configured"}</p>
                <p className="mt-1 text-xs text-slate-400">Payment: {subscription?.paymentStatus ?? "Unavailable"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
                <p className="mt-2 text-2xl font-black text-white">{subscription?.subscriptionStatus ?? "Unavailable"}</p>
                <p className="mt-1 text-xs text-slate-400">Posting: {canPostBySubscription ? "Enabled" : "Blocked"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Renewal Window</p>
                <p className="mt-2 text-2xl font-black text-white">{subscription ? `${Math.max(subscription.remainingDays, 0)}d` : "--"}</p>
                <p className="mt-1 text-xs text-slate-400">Active jobs: {subscription ? `${subscription.activeJobs}/${subscription.maxActiveJobs > 0 ? subscription.maxActiveJobs : "∞"}` : "--"}</p>
              </div>
            </div>

            {subscriptionUsage.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {subscriptionUsage.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">{item.label}</p>
                      <span className="text-xs text-slate-400">{item.used}/{item.limit > 0 ? item.limit : "∞"}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${item.accentClass}`} style={{ width: `${item.limit > 0 ? item.progress : 100}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">{item.limit > 0 ? `${item.progress}% used` : "No plan limit configured"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#111827]/95 via-[#171f34]/92 to-[#0d1524]/95 shadow-xl ring-1 ring-white/[0.08] glass-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">Action Queue</p>
                <h3 className="text-xl font-bold tracking-tight text-white">Jobs Needing Attention</h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {jobsNeedingAttention.length > 0 ? jobsNeedingAttention.map((item) => {
                const toneMap: Record<string, string> = {
                  rose: "border-rose-400/25 bg-rose-500/10 text-rose-100",
                  amber: "border-amber-400/25 bg-amber-500/10 text-amber-100",
                  violet: "border-violet-400/25 bg-violet-500/10 text-violet-100",
                  sky: "border-sky-400/25 bg-sky-500/10 text-sky-100",
                  cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
                };
                return (
                  <div key={item.key} className={`rounded-2xl border p-3 ${toneMap[item.tone] ?? toneMap.cyan}`}>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs opacity-90">{item.detail}</p>
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  No urgent action items right now. Your employer workspace looks healthy.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#111827]/95 via-[#171f34]/92 to-[#0d1524]/95 shadow-xl ring-1 ring-white/[0.08] glass-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">Quick Actions</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-white">Employer Workspace Shortcuts</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Button className="min-h-12 justify-start gap-2 bg-white text-slate-900 hover:bg-slate-100" disabled={!canPostBySubscription} onClick={openPostJobDialog}>
                <Plus className="h-4 w-4" />
                Post Job
              </Button>
              <Button variant="outline" className="min-h-12 justify-start gap-2 border-cyan-300/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20" onClick={() => void navigate("/dashboard?tab=employers&section=viewall")}>
                <FileText className="h-4 w-4" />
                Posted Jobs
              </Button>
              <Button variant="outline" className="min-h-12 justify-start gap-2 border-violet-300/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20" onClick={() => void navigate("/dashboard?tab=employers&section=subscription")}>
                <Crown className="h-4 w-4" />
                Subscription
              </Button>
              <Button variant="outline" className="min-h-12 justify-start gap-2 border-emerald-300/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20" onClick={() => void navigate("/find-talent")}>
                <Search className="h-4 w-4" />
                Find Talent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0f172a]/95 via-[#132033]/92 to-[#0d1524]/95 shadow-xl ring-1 ring-white/[0.08] glass-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">Workspace Summary</p>
              <h3 className="text-xl font-bold tracking-tight text-white">Team and Workspace Health</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {workspaceSummary.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.key} className={`rounded-2xl bg-gradient-to-br ${item.accentClass} p-4 ring-1 ring-white/[0.08]`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{item.label}</p>
                      <p className="mt-2 text-xl font-black text-white">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-300">{item.detail}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                      <ItemIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#111827]/95 via-[#181c35]/92 to-[#0d1524]/95 shadow-xl ring-1 ring-white/[0.08] glass-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/20">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/80">Notifications Feed</p>
              <h3 className="text-xl font-bold tracking-tight text-white">Employer Activity and Alerts</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {employerActivityFeed.length > 0 ? employerActivityFeed.map((item) => {
              const handleAction = () => {
                switch (item.actionKey) {
                  case "renewal":
                    navigate("/dashboard?tab=employers&section=subscription");
                    break;
                  case "view-job":
                    if (latestWorkspaceJob?.id) {
                      navigate(`/dashboard?tab=employers&section=job-detail&id=${latestWorkspaceJob.id}`);
                    }
                    break;
                  case "manage-team":
                    navigate("/dashboard?tab=employers&section=team");
                    break;
                  case "publish-drafts":
                    navigate("/dashboard?tab=employers&section=drafts");
                    break;
                  case "setup-billing":
                    navigate("/dashboard?tab=employers&section=subscription");
                    break;
                  default:
                    break;
                }
              };
              return (
                <div key={item.key} className={`rounded-2xl border p-4 ${item.toneClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <span className="rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{item.meta}</span>
                  </div>
                  <p className="mt-2 text-xs opacity-90">{item.detail}</p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 text-xs font-semibold hover:bg-white/20"
                      onClick={handleAction}
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 lg:col-span-2">
                No new workspace alerts right now. Hiring operations and subscription health look stable.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isEmployerAuthorized && (
        <Card className="border border-amber-400/30 bg-amber-500/10 text-amber-100 shadow-lg">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{authRequiredMessage}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-amber-500 text-black hover:bg-amber-400"
                onClick={() => void navigate("/signup")}
              >
                Sign Up as Employer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300/50 text-amber-100 hover:bg-amber-200/10"
                onClick={() => void navigate("/login")}
              >
                Log In
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isViewJobDialogOpen} onOpenChange={setIsViewJobDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-0 bg-[#0f172a] p-0 shadow-2xl shadow-black/40">
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
            {/* Header */}
            <DialogHeader className="relative overflow-hidden border-b border-white/10 px-6 pt-7 pb-5 sm:px-8">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-600/20 via-blue-600/10 to-transparent" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/25">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight text-white">Job Details</DialogTitle>
                  <DialogDescription className="text-sm text-slate-400">Complete overview for this position.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-6 sm:px-8">
              {viewJobBusy && <p className="py-8 text-center text-sm text-slate-400">Loading job details...</p>}
              {!viewJobBusy && !selectedJob && <p className="py-8 text-center text-sm text-slate-500">No job selected.</p>}
              {!viewJobBusy && selectedJob && (
                <div className="space-y-5">
                  {/* Title block */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedJob.jobTitle}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                        <Building2 className="h-3.5 w-3.5" />{selectedJob.company}
                      </p>
                    </div>
                    <span className={`mt-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      selectedJob.jobStatus === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                        : selectedJob.jobStatus === "DRAFT"
                          ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selectedJob.jobStatus === "ACTIVE" ? "bg-emerald-400" : selectedJob.jobStatus === "DRAFT" ? "bg-amber-400" : "bg-rose-400"
                      }`} />
                      {selectedJob.jobStatus || "ACTIVE"}
                    </span>
                  </div>

                  {/* Key details grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: MapPin, label: "Location", value: selectedJob.location },
                      { icon: DollarSign, label: "Salary", value: selectedJob.salary },
                      { icon: Briefcase, label: "Department", value: selectedJob.department },
                      { icon: Users, label: "Role", value: selectedJob.role },
                      { icon: Clock, label: "Experience", value: selectedJob.experience },
                      { icon: FileText, label: "Employment", value: selectedJob.employmentType },
                      { icon: Globe, label: "Industry", value: selectedJob.industry },
                      { icon: Building2, label: "Work Mode", value: selectedJob.workMode },
                      { icon: DollarSign, label: "Currency", value: selectedJob.currency },
                      { icon: Users, label: "Vacancies", value: selectedJob.vacancies },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-start gap-3 rounded-lg border border-white/[.06] bg-white/[.02] p-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-400">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{item.label}</p>
                            <p className="truncate text-sm font-medium text-slate-200">{item.value || "-"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Skills */}
                  {selectedJob.skills && (
                    <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                        <Sparkles className="h-3 w-3" /> Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.skills.split(",").map((skill: string) => (
                          <span key={skill.trim()} className="rounded-md bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedJob.description && (
                    <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-sky-400">
                        <FileText className="h-3 w-3" /> Description
                      </p>
                      {renderDescriptionContent(selectedJob.description)}
                    </div>
                  )}

                  {selectedJobSalarySuggestion && (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
                        <Lightbulb className="h-3 w-3" /> Suggested Salary Range
                      </p>
                      <p className="text-sm font-semibold text-emerald-100">
                        {formatMoney(selectedJobSalarySuggestion.min, selectedJobSalarySuggestion.currency)} - {formatMoney(selectedJobSalarySuggestion.max, selectedJobSalarySuggestion.currency)} / year
                      </p>
                      <p className="mt-1 text-xs text-emerald-200/80">Confidence: {selectedJobSalarySuggestion.confidence}%</p>
                    </div>
                  )}

                  {/* Footer meta */}
                  <div className="flex items-center justify-between border-t border-white/[.06] pt-4 text-xs text-slate-500">
                    <span>Posted {selectedJob.postTime ? new Date(selectedJob.postTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}</span>
                    <span className="font-mono text-slate-600">ID #{selectedJob.id}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div id="intelligence" className="scroll-mt-24 flex items-end justify-between gap-4 px-1 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300/80">Market Intelligence</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Decision Support</h2>
          <p className="mt-1 text-sm text-slate-400">Use performance, salary, skills, and location signals to shape hiring decisions.</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ──       ANALYTICS COMMAND CENTER                        ── */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* ── Dark Command Center: KPIs + Progress Rings + AI Insights ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl ring-1 ring-white/10">
        {/* Animated gradient overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        {/* Header bar */}
        <div className="relative flex items-center justify-between border-b border-white/[.06] px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">Analytics Command Center</h2>
              <p className="text-[11px] text-slate-400">Real-time intelligence from your hiring pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 ring-1 ring-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Live</span>
          </div>
        </div>

        {/* KPI Cards — Glass morphism */}
        <div className="relative grid grid-cols-2 gap-3 p-6 sm:grid-cols-4 sm:px-8">
          {[
            { label: "Avg. Salary", value: liveInsights.avgSalary > 0 ? `$${(liveInsights.avgSalary / 1000).toFixed(0)}k` : "--", delta: liveInsights.avgSalary > 0 ? "+4.2%" : "--", up: true, gradient: "from-emerald-500/20 to-teal-500/10", borderColor: "ring-emerald-500/20", icon: DollarSign, iconBg: "from-emerald-400 to-green-500" },
            { label: "Open Positions", value: liveInsights.totalVacancies, delta: `${liveInsights.activeCount} active`, up: true, gradient: "from-blue-500/20 to-indigo-500/10", borderColor: "ring-blue-500/20", icon: Users, iconBg: "from-blue-400 to-indigo-500" },
            { label: "Active Rate", value: liveInsights.totalCount > 0 ? `${Math.round((liveInsights.activeCount / liveInsights.totalCount) * 100)}%` : "--", delta: liveInsights.fillRate > 50 ? "Healthy" : "Low", up: liveInsights.fillRate > 50, gradient: "from-violet-500/20 to-purple-500/10", borderColor: "ring-violet-500/20", icon: TrendingUp, iconBg: "from-violet-400 to-purple-500" },
            { label: "Days Open", value: liveInsights.avgDaysOpen > 0 ? liveInsights.avgDaysOpen : "--", delta: "avg", up: true, gradient: "from-amber-500/20 to-orange-500/10", borderColor: "ring-amber-500/20", icon: Timer, iconBg: "from-amber-400 to-orange-500" },
          ].map((kpi) => {
            const KIcon = kpi.icon;
            return (
              <div key={kpi.label} className={`group/kpi relative overflow-hidden rounded-xl bg-gradient-to-br ${kpi.gradient} p-4 ring-1 ${kpi.borderColor} transition-all duration-300 hover:scale-[1.02] hover:ring-2`}>
                <div className="flex items-start justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${kpi.iconBg} shadow-lg transition-transform duration-300 group-hover/kpi:scale-110`}>
                    <KIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${kpi.up ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {kpi.up ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    {kpi.delta}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold tracking-tight text-white">{kpi.value}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">{kpi.label}</p>
              </div>
            );
          })}
        </div>

        {/* Progress Rings — compact inline */}
        <div className="relative grid grid-cols-4 gap-2 px-6 pb-3 sm:px-8">
          {liveInsights.progressMetrics.map((m) => {
            const circumference = 2 * Math.PI * 22;
            const offset = circumference - (m.pct / 100) * circumference;
            return (
              <div key={m.label} className="flex items-center gap-3 rounded-lg bg-white/[.04] px-3 py-2.5 ring-1 ring-white/[.08]">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <svg className="h-11 w-11" viewBox="0 0 52 52" aria-hidden="true">
                    <circle cx="26" cy="26" r="22" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-white/[.08]" />
                    <circle cx="26" cy="26" r="22" fill="none" stroke={m.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm ring-1 ring-white/10">
                      {m.pct}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-200">{m.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Coverage metric</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative border-t border-white/[.06] px-6 py-5 sm:px-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/20">
              <LineChart className="h-4 w-4 text-sky-300" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-sky-300/80">Market Pulse</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboard.marketInsights.metrics.map((metric) => {
                const metricGradients: Record<string, string> = {
                  blue: "from-blue-500/15 to-indigo-500/10",
                  green: "from-emerald-500/15 to-teal-500/10",
                  purple: "from-violet-500/15 to-fuchsia-500/10",
                  orange: "from-amber-500/15 to-orange-500/10",
                };
                const metricIconBg: Record<string, string> = {
                  blue: "from-blue-400 to-indigo-500",
                  green: "from-emerald-400 to-teal-500",
                  purple: "from-violet-400 to-fuchsia-500",
                  orange: "from-amber-400 to-orange-500",
                };
                return (
                  <div key={metric.label} className={`rounded-xl bg-gradient-to-br ${metricGradients[metric.tone] ?? metricGradients.blue} p-4 ring-1 ring-white/[.08]`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${metricIconBg[metric.tone] ?? metricIconBg.blue} shadow-lg`}>
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-400">{metric.label}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{metric.value}</p>
                        <p className="mt-1 text-xs text-slate-300">{metric.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-white/[.03] p-4 ring-1 ring-white/[.06]">
              <p className="mb-3 text-xs font-medium text-slate-400">Department distribution</p>
              {liveInsights.departmentData.length > 0 ? (
                <RechartResponsive width="100%" height={220}>
                  <RechartBarChart data={liveInsights.departmentData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <RechartCartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <RechartXAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <RechartYAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                    <RechartTooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                    <RechartBar dataKey="value" radius={[8, 8, 0, 0]}>
                      {liveInsights.departmentData.map((entry, idx) => (
                        <RechartCell key={`compact-cell-${idx}`} fill={entry.fill} />
                      ))}
                    </RechartBar>
                  </RechartBarChart>
                </RechartResponsive>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">No department data</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Contextual Insights */}
        {liveInsights.aiInsights.length > 0 && (
          <div className="relative border-t border-white/[.06] px-6 py-5 sm:px-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">Contextual Insights</span>
              <Badge className="ml-auto border-0 bg-amber-500/10 text-[9px] text-amber-400">AI-Powered</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {liveInsights.aiInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/[.03] p-3 ring-1 ring-white/[.06] transition-colors duration-200 hover:bg-white/[.05]">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                  <p className="text-[11px] leading-relaxed text-slate-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#111827]/95 via-[#171f34]/92 to-[#0d1524]/95 shadow-xl ring-1 ring-white/[.08] glass-card elevated-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 shadow-md shadow-indigo-200/60">
                  <Radar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl tracking-tight text-white">Hiring Intelligence</CardTitle>
                  <CardDescription className="text-xs text-slate-300">One expandable module for drill-down analytics. Repeated salary, status, and pipeline cards have been removed from the main flow.</CardDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-white/[.08] text-[10px] text-white">Expandable Module</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-white/[.10] bg-white/[.04] text-xs text-slate-200 hover:bg-white/[.08]"
                onClick={() => setIntelligenceExpanded((prev) => !prev)}
              >
                {intelligenceExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "skills", label: "Skills", icon: Radar },
              { key: "workforce", label: "Workforce", icon: Globe },
              { key: "industry", label: "Industry", icon: Building2 },
              { key: "location", label: "Location", icon: MapPin },
              { key: "department", label: "Department", icon: DollarSign },
            ].filter((tab) => intelligenceExpanded || tab.key === intelligenceTab).map((tab) => {
              const TabIcon = tab.icon;
              const active = intelligenceTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setIntelligenceTab(tab.key as "skills" | "workforce" | "industry" | "location" | "department")}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                    active
                          ? "bg-slate-100 text-slate-950 shadow-md"
                          : "bg-white/[.04] text-slate-200 ring-1 ring-white/[.08] hover:bg-white/[.08]"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {!intelligenceExpanded && (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 p-5 ring-1 ring-indigo-400/20">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Default View</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">Skills</p>
                  <p className="mt-1 text-sm text-slate-300">The module stays collapsed until needed. Open it to explore workforce, industry, location, and department views.</p>
                </div>
                <div className="rounded-xl bg-white/[.06] px-4 py-3 shadow-sm ring-1 ring-white/[.08]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Top signal</p>
                  <p className="mt-1 text-base font-semibold text-white">{liveInsights.barSkillData[0]?.skill ?? "No skills yet"}</p>
                </div>
              </div>
            </div>
          )}

          {intelligenceExpanded && intelligenceTab === "skills" && (
            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <p className="mb-3 text-xs font-medium text-slate-300">Top requested skills across current openings</p>
                {liveInsights.barSkillData.length >= 1 ? (
                  <RechartResponsive width="100%" height={260}>
                    <RechartBarChart data={liveInsights.barSkillData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                      <RechartCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <RechartXAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartYAxis dataKey="skill" type="category" tick={{ fontSize: 12 }} width={100} axisLine={false} tickLine={false} />
                      <RechartTooltip />
                      <RechartBar dataKey="demand" fill="#4f46e5" radius={[8, 8, 8, 8]} barSize={20} />
                    </RechartBarChart>
                  </RechartResponsive>
                ) : (
                  <div className="flex h-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white/50">
                    <Radar className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No skill data</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 p-5 ring-1 ring-indigo-400/20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">What to do</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-200">
                  <li>Use this view to align sourcing with the most requested capabilities.</li>
                  <li>Prioritize outreach templates for the top two skills to reduce time-to-fill.</li>
                  <li>Refresh weak or missing skill tags on older job posts.</li>
                </ul>
              </div>
            </div>
          )}

          {intelligenceExpanded && intelligenceTab === "workforce" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-fuchsia-600">Work Mode</p>
                {liveInsights.workModeData.length > 0 ? (
                  <RechartResponsive width="100%" height={220}>
                    <RechartPieChart>
                      <RechartPie data={liveInsights.workModeData} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius={68} strokeWidth={0}>
                        {liveInsights.workModeData.map((entry, i) => <RechartCell key={i} fill={entry.fill} />)}
                      </RechartPie>
                      <RechartTooltip />
                      <RechartLegend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    </RechartPieChart>
                  </RechartResponsive>
                ) : <p className="py-10 text-center text-xs text-gray-400">No data</p>}
              </div>
              <div>
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-sky-600">Employment</p>
                {liveInsights.employmentTypeData.length > 0 ? (
                  <RechartResponsive width="100%" height={220}>
                    <RechartPieChart>
                      <RechartPie data={liveInsights.employmentTypeData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={36} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                        {liveInsights.employmentTypeData.map((entry, i) => <RechartCell key={i} fill={entry.fill} />)}
                      </RechartPie>
                      <RechartTooltip />
                      <RechartLegend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    </RechartPieChart>
                  </RechartResponsive>
                ) : <p className="py-10 text-center text-xs text-gray-400">No data</p>}
              </div>
              <div>
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-600">Experience</p>
                {liveInsights.experienceData.length > 0 ? (
                  <RechartResponsive width="100%" height={220}>
                    <RechartPieChart>
                      <RechartPie data={liveInsights.experienceData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={36} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                        {liveInsights.experienceData.map((entry, i) => <RechartCell key={i} fill={entry.fill} />)}
                      </RechartPie>
                      <RechartTooltip />
                      <RechartLegend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    </RechartPieChart>
                  </RechartResponsive>
                ) : <p className="py-10 text-center text-xs text-gray-400">No data</p>}
              </div>
            </div>
          )}

          {intelligenceExpanded && intelligenceTab === "industry" && (
            <div>
              <p className="mb-3 text-xs font-medium text-slate-300">Industry mix across active and stored roles</p>
              {liveInsights.industryData.length > 0 ? (
                <RechartResponsive width="100%" height={280}>
                  <RechartBarChart data={liveInsights.industryData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="intelligenceIndGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#fb923c" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <RechartCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <RechartXAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartYAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                    <RechartTooltip />
                    <RechartBar dataKey="jobs" fill="url(#intelligenceIndGrad)" radius={[0, 6, 6, 0]} />
                  </RechartBarChart>
                </RechartResponsive>
              ) : (
                <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white/50">
                  <Building2 className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No industry data</p>
                </div>
              )}
            </div>
          )}

          {intelligenceExpanded && intelligenceTab === "location" && (
            <div>
              <p className="mb-3 text-xs font-medium text-slate-300">Location concentration for your current openings</p>
              {liveInsights.locationData.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {liveInsights.locationData.map((loc) => {
                    const intensity = loc.count / liveInsights.maxLocCount;
                    const bg = intensity > 0.75 ? "bg-purple-600 text-white" : intensity > 0.5 ? "bg-purple-400 text-white" : intensity > 0.25 ? "bg-purple-200 text-purple-800" : "bg-purple-50 text-purple-700";
                    return (
                      <div key={loc.name} className={`flex min-h-28 flex-col items-center justify-center rounded-xl p-3 text-center transition-all duration-300 hover:scale-[1.02] ${bg}`}>
                        <p className="text-2xl font-extrabold">{loc.count}</p>
                        <p className="mt-1 text-[11px] font-medium leading-tight">{loc.name.length > 20 ? loc.name.slice(0, 20) + "…" : loc.name}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white/50">
                  <MapPin className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No location data</p>
                </div>
              )}
            </div>
          )}

          {intelligenceExpanded && intelligenceTab === "department" && (
            <div>
              <p className="mb-3 text-xs font-medium text-slate-300">Average salary and role count by department</p>
              {liveInsights.departmentData.some((d) => d.avgSalary > 0) ? (
                <RechartResponsive width="100%" height={300}>
                  <RechartBarChart data={liveInsights.departmentData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="deptSalGradCompact" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="deptCountGradCompact" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <RechartCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <RechartXAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <RechartYAxis yAxisId="salary" orientation="left" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <RechartYAxis yAxisId="count" orientation="right" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartTooltip />
                    <RechartLegend wrapperStyle={{ fontSize: 11 }} />
                    <RechartBar yAxisId="salary" dataKey="avgSalary" name="Avg Salary" fill="url(#deptSalGradCompact)" radius={[4, 4, 0, 0]} />
                    <RechartBar yAxisId="count" dataKey="value" name="Job Count" fill="url(#deptCountGradCompact)" radius={[4, 4, 0, 0]} />
                  </RechartBarChart>
                </RechartResponsive>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white/50">
                  <DollarSign className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No department salary data</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="strategy" className="scroll-mt-24 overflow-hidden border-0 bg-gradient-to-br from-[#111827]/95 via-[#171f34]/92 to-[#0d1524]/95 shadow-xl ring-1 ring-white/[.08] glass-card elevated-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200/50">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Quality Signals</p>
                <CardTitle className="mt-1 text-xl tracking-tight text-white">Hiring Quality Hub</CardTitle>
                <CardDescription className="text-xs text-slate-300">Efficiency metrics and verified talent strength are combined into one final decision block.</CardDescription>
              </div>
            </div>
            <Badge className="w-fit border-0 bg-emerald-500/10 text-[10px] text-emerald-300">Merged Block</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-teal-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">{dashboard.optimizer.title}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {dashboard.optimizer.cards.map((card) => {
                  const Icon = iconMap[card.icon];
                  const gradients: Record<string, string> = {
                    blue: "from-blue-500/16 via-blue-500/8 to-indigo-500/12",
                    green: "from-emerald-500/16 via-green-500/8 to-teal-500/12",
                    purple: "from-purple-500/16 via-fuchsia-500/8 to-pink-500/12",
                    orange: "from-orange-500/16 via-amber-500/8 to-yellow-500/12",
                  };
                  const iconBg: Record<string, string> = {
                    blue: "from-blue-500 to-indigo-600 shadow-blue-200/60",
                    green: "from-emerald-500 to-green-600 shadow-emerald-200/60",
                    purple: "from-purple-500 to-fuchsia-600 shadow-purple-200/60",
                    orange: "from-orange-500 to-amber-600 shadow-orange-200/60",
                  };
                  return (
                    <Card key={card.label} className={`group relative overflow-hidden border-0 bg-gradient-to-br ${gradients[card.tone] ?? gradients.blue} shadow-md ring-1 ring-border/60 glass-card elevated-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
                      <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/20" />
                      <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-6 translate-y-6 rounded-full bg-white/15" />
                      <CardContent className="relative p-5 text-center">
                        <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBg[card.tone] ?? iconBg.blue} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <p className={`text-3xl font-extrabold tracking-tight ${toneClasses[card.tone].text}`}>{card.value}</p>
                        <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-300">{card.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{dashboard.verification.title}</p>
              </div>
              <div className="space-y-4">
                {dashboard.verification.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const vGradients: Record<string, string> = {
                    blue: "from-blue-500/16 via-blue-500/8 to-indigo-500/12",
                    green: "from-emerald-500/16 via-green-500/8 to-teal-500/12",
                    purple: "from-purple-500/16 via-fuchsia-500/8 to-pink-500/12",
                    orange: "from-orange-500/16 via-amber-500/8 to-yellow-500/12",
                  };
                  const vIconBg: Record<string, string> = {
                    blue: "from-blue-500 to-indigo-600 shadow-blue-200/60",
                    green: "from-emerald-500 to-green-600 shadow-emerald-200/60",
                    purple: "from-purple-500 to-fuchsia-600 shadow-purple-200/60",
                    orange: "from-orange-500 to-amber-600 shadow-orange-200/60",
                  };
                  return (
                    <div
                      key={item.title}
                      className={`group/vcard relative overflow-hidden rounded-xl bg-gradient-to-br ${vGradients[item.tone] ?? vGradients.blue} p-5 shadow-md ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                    >
                      <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/20" />
                      <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-6 translate-y-6 rounded-full bg-white/15" />
                      <div className="relative flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${vIconBg[item.tone] ?? vIconBg.blue} shadow-lg transition-transform duration-300 group-hover/vcard:scale-110`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-white">{item.title}</p>
                            <Badge className={`border-0 text-[10px] ${item.badge === "Verified" ? "bg-emerald-100 text-emerald-700" : item.badge === "Certified" ? "bg-violet-100 text-violet-700" : "bg-green-100 text-green-700"}`}>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
