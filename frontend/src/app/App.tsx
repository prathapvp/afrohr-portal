
import type { HeroSection, Tone } from "./shared";
import type { Department } from "./services/department-service";
import type { Industry } from "./services/industry-service";
import type { WorkMode } from "./services/workmode-service";
import type { EmployerDashboard } from "./features/employer/employer-types";

// Inline Branding type
type Branding = { name: string; subtitle: string };

type AudienceId = "candidates" | "employers" | "students";

export interface CandidateJob {
  id?: number;
  company: string;
  role: string;
  location: string;
  salary?: string;
  logoTone?: Tone;
}

export interface VideoItem {
  title: string;
  imageUrl: string;
  alt?: string;
  duration?: string;
}

export interface CareerItem {
  title: string;
  icon: string;
  salary: string;
  duration: string;
}

export interface PathwayStep {
  title: string;
  description: string;
}

export interface TrendItem {
  title: string;
  description: string;
  age: string;
}

export interface Audience {
  id: string;
  label: string;
  description: string;
  accent: string;
  icon: string;
}

export interface CandidateDashboard {
  hero: HeroSection;
  stats: Array<{
    label: string;
    value: string | number;
    icon: keyof typeof import("./shared").iconMap;
    tone: Tone;
  }>;
  jobs: { title: string; items: CandidateJob[]; actionLabel?: string };
  salaryInsights: { title: string; description: string; imageUrl: string };
  videos: { title: string; description?: string; items: VideoItem[] };
  trends: { title: string; items: TrendItem[] };
  countries: { title: string; description?: string; items: Array<{ country: string; flag: string; jobs: number; tone: Tone; trend: string }> };
  premium: { title: string; description: string; chips: string[]; actionLabel: string };
}

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { iconMap, toneClasses } from "./shared";
import { TrendingUp } from "lucide-react";
// Use only the local AudienceId type
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import PremiumNavbar from "./components/layout/PremiumNavbar";
import PremiumSidebar from "./components/layout/PremiumSidebar";
import { EmployerView } from "./features/employer";
import Departments from "./features/departments/Departments";
import Industries from "./features/industries/Industries";
import EmploymentTypes from "./features/employment-types/EmploymentTypes";
import WorkModes from "./features/work-modes/WorkModes";

import {
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Globe,
  GraduationCap,
  MapPin,
  MessageSquare,
  Play,
  Search,
  Sparkles,
  Target
} from "lucide-react";


// Remove duplicate TrendItem interface

interface CountryItem {
  flag: string;
  // TrendItem already exported above, remove duplicate
}

interface StudentDashboard {
  hero: HeroSection;
  careers: {
    title: string;
    description: string;
    items: CareerItem[];
  };
  advisor: {
    title: string;
    description: string;
    interests: string[];
    actionLabel: string;
  };
  pathway: {
    title: string;
    steps: PathwayStep[];
  };
  resources: {
    title: string;
    description?: string;
    items: VideoItem[];
  };
}

interface DashboardPayload {
  branding: Branding;
  audiences: Audience[];
  dashboards: {
    candidates: CandidateDashboard;
    employers: EmployerDashboard;
    students: StudentDashboard;
  };
}

function getTabFromAccountType(accountType: string): AudienceId | null {
  const normalized = (accountType || "").toUpperCase();
  if (normalized === "EMPLOYER") return "employers";
  if (normalized === "APPLICANT") return "candidates";
  if (normalized === "CANDIDATE") return "candidates";
  if (normalized === "STUDENT") return "students";
  return null;
}

const emptyPayload: DashboardPayload = {
  branding: { name: "AfroHR", subtitle: "Talent Network" },
  audiences: [
    { id: "candidates", label: "Candidate", description: "Find jobs", accent: "blue", icon: "Users" },
    { id: "employers", label: "Employer", description: "Hire talent", accent: "green", icon: "Briefcase" },
    { id: "students", label: "Student", description: "Career guidance", accent: "purple", icon: "GraduationCap" },
  ],
  dashboards: {
    candidates: {
      hero: { badge: "AI-Powered", title: "Loading...", description: "", actionLabel: "Search", chips: [] },
      stats: [],
      jobs: { title: "Trending Jobs", items: [] },
      salaryInsights: { title: "Salary Trends", description: "", imageUrl: "" },
      videos: { title: "Videos", items: [] },
      trends: { title: "Trends", items: [] },
      countries: { title: "Countries", items: [] },
      premium: { title: "Advanced Tools", description: "", chips: [], actionLabel: "Join" },
    },
    employers: {
      hero: { badge: "Smart Hiring", title: "Loading...", description: "", actionLabel: "Post a Job" },
      marketInsights: { title: "Insights", description: "", imageUrl: "", metrics: [] },
      optimizer: { title: "Optimizer", description: "", cards: [] },
      verification: { title: "Verified", items: [] },
    },
    students: {
      hero: { badge: "AI Career Advisor", title: "Loading...", description: "", actionLabel: "Explore" },
      careers: { title: "Careers", description: "", items: [] },
      advisor: { title: "Advisor", description: "", interests: [], actionLabel: "Get Recommendations" },
      pathway: { title: "Pathway", steps: [] },
      resources: { title: "Resources", items: [] },
    },
  },
};

interface ApiJobItem {
  id?: number;
  title?: string;
  role?: string;
  company?: string;
  location?: string;
  salary?: string;
  logoTone?: string;
}

function normalizeLogoTone(tone?: string): Tone {
  const normalized = String(tone || "").toLowerCase();
  if (normalized === "blue") return "blue";
  if (normalized === "green") return "green";
  if (normalized === "purple" || normalized === "violet") return "purple";
  if (normalized === "orange" || normalized === "amber") return "orange";
  return "blue";
}

function mapApiJobToCandidateJob(item: ApiJobItem): CandidateJob {
  return {
    id: typeof item.id === "number" ? item.id : undefined,
    company: item.company || "Unknown Company",
    role: item.role || item.title || "Open Position",
    location: item.location || "Location not specified",
    salary: item.salary || "Salary not specified",
    logoTone: normalizeLogoTone(item.logoTone),
  };
}

function BrandLogo({ branding }: { branding: Branding }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-pink-500/20 blur-sm" />
        <img
          src="/afro-hr-light.png"
          alt={branding.name}
          className="relative h-11 w-auto drop-shadow-md brightness-0 invert"
        />
      </div>
      <div className="hidden h-8 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent sm:block" />
      <span className="hidden bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-[10px] font-bold uppercase tracking-[0.25em] text-transparent sm:block">
        {branding.subtitle}
      </span>
    </div>
  );
}

function CandidateView({
  dashboard,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onApplyToJob,
  applyingJobId,
  appliedJobIds,
  searchLoading,
  searchResults,
}: {
  dashboard: CandidateDashboard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onApplyToJob: (job: CandidateJob) => Promise<void>;
  applyingJobId: number | null;
  appliedJobIds: Set<number>;
  searchLoading: boolean;
  searchResults: CandidateJob[] | null;
}) {
  const jobs = searchResults ?? dashboard.jobs.items;

  return (
    <div className="space-y-6">
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-700 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-4 flex items-start gap-2">
            <Sparkles className="h-6 w-6 text-yellow-300" />
            <Badge className="border border-cyan-300/40 bg-cyan-500/20 text-cyan-100">{dashboard.hero.badge}</Badge>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{dashboard.hero.title}</h1>
          <p className="mb-6 text-base text-cyan-100/90 sm:text-lg">{dashboard.hero.description}</p>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full flex-1 items-center gap-2 rounded-lg border border-white/20 bg-white/95 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchQueryChange(event.target.value)}
                placeholder={dashboard.hero.searchPlaceholder}
                className="h-auto border-0 p-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button size="lg" onClick={onSearch} className="min-h-11 w-full bg-white text-indigo-700 hover:bg-indigo-50 sm:w-auto" disabled={searchLoading}>
              {searchLoading ? "Searching..." : dashboard.hero.actionLabel}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard.hero.chips?.map((chip) => (
              <Badge key={chip} variant="outline" className="border-white/40 bg-white/15 text-white">
                {chip}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {dashboard.stats.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <Card key={item.label} className="border border-white/10 bg-white/[.04] shadow-lg backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${toneClasses[item.tone].text}`}>{item.value}</p>
                    <p className="text-sm text-slate-300">{item.label}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${toneClasses[item.tone].text}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-xl tracking-tight text-white">{dashboard.jobs.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="min-h-11 text-slate-200 hover:bg-white/10 hover:text-white">
              {dashboard.jobs.actionLabel ?? "View All"} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {searchResults && <CardDescription className="text-slate-400">Search results for &quot;{searchQuery}&quot;</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 && <p className="text-sm text-slate-400">No jobs matched your search.</p>}
            {jobs.map((job) => (
              (() => {
                const safeTone = normalizeLogoTone(job.logoTone);
                return (
              <div
                key={job.id ?? `${job.company}-${job.role}`}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[.05] hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white shadow ${toneClasses[safeTone].logo}`}>
                    {job.company[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{job.role}</h4>
                    <p className="text-sm text-slate-300">{job.company}</p>
                    <div className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">{job.salary}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11 w-full rounded-xl border-cyan-300/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20 sm:w-auto"
                  disabled={!job.id || applyingJobId === job.id || (job.id ? appliedJobIds.has(job.id) : false)}
                  onClick={() => {
                    void onApplyToJob(job);
                  }}
                >
                  {applyingJobId === job.id ? "Applying..." : job.id && appliedJobIds.has(job.id) ? "Applied" : "Apply"}
                </Button>
              </div>
                );
              })()
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.salaryInsights.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.salaryInsights.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <img src={dashboard.salaryInsights.imageUrl} alt="Analytics Dashboard" className="h-64 w-full rounded-lg object-cover" />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.videos.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.videos.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.videos.items.map((video) => (
              <div key={video.title} className="group relative overflow-hidden rounded-lg">
                <img src={video.imageUrl} alt={video.alt} className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <Play className="ml-1 h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">{video.title}</p>
                  <p className="text-sm text-white/80">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.trends.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard.trends.items.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border border-transparent bg-white/[.02] p-3 transition-colors hover:border-cyan-300/20 hover:bg-white/[.06]">
                <TrendingUp className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.age}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.countries.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.countries.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.countries.items.map((item) => (
              <div key={item.country} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{item.country}</p>
                    <p className="text-xs text-slate-400">{item.jobs} active jobs</p>
                  </div>
                </div>
                <Badge className={toneClasses[item.tone].badge}>{item.trend}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-orange-400/20 bg-gradient-to-br from-[#2f1f0b] via-[#2a1b08] to-[#3c1620] shadow-xl ring-1 ring-orange-300/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-bold tracking-tight text-white">{dashboard.premium.title}</h3>
              <p className="mb-4 text-sm text-orange-100/80">{dashboard.premium.description}</p>
              <div className="mb-3 flex gap-2">
                {dashboard.premium.chips.map((chip) => (
                  <Badge key={chip} className="border border-orange-300/40 bg-white/10 text-orange-100">
                    {chip === "CV Builder" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {chip === "AI Q&A" && <MessageSquare className="mr-1 h-3 w-3" />}
                    {chip === "Job Matching" && <Sparkles className="mr-1 h-3 w-3" />}
                    {chip}
                  </Badge>
                ))}
              </div>
              <Button className="min-h-11 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600">
                {dashboard.premium.actionLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentView({
  dashboard,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchLoading,
  searchResults,
}: {
  dashboard: StudentDashboard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  searchLoading: boolean;
  searchResults: CareerItem[] | null;
}) {
  const careers = searchResults ?? dashboard.careers.items;

  return (
    <div className="space-y-6">
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-700 via-fuchsia-700 to-indigo-700 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-4 flex items-start gap-2">
            <Brain className="h-6 w-6 text-yellow-300" />
            <Badge className="border border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100">{dashboard.hero.badge}</Badge>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{dashboard.hero.title}</h1>
          <p className="mb-6 text-base text-fuchsia-100/90 sm:text-lg">{dashboard.hero.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full flex-1 items-center gap-2 rounded-lg border border-white/20 bg-white/95 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchQueryChange(event.target.value)}
                placeholder={dashboard.hero.searchPlaceholder}
                className="h-auto border-0 p-0 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button size="lg" onClick={onSearch} className="min-h-11 w-full bg-white text-purple-700 hover:bg-purple-50 sm:w-auto" disabled={searchLoading}>
              {searchLoading ? "Exploring..." : dashboard.hero.actionLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.careers.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.careers.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {careers.length === 0 && <p className="text-sm text-slate-400">No career paths matched your search.</p>}
            {careers.map((career) => (
              <Card key={career.title} className="overflow-hidden border border-white/10 bg-white/[.03] transition-all hover:-translate-y-0.5 hover:border-fuchsia-300/20 hover:bg-white/[.06] hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400/30 to-pink-400/30 text-4xl">{career.icon}</div>
                  <h3 className="mb-2 text-lg font-bold text-white">{career.title}</h3>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p className="flex items-center justify-center gap-1">
                      <DollarSign className="h-4 w-4" /> {career.salary}
                    </p>
                    <p className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" /> {career.duration} education
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.advisor.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.advisor.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10 bg-white/[.03] p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="mb-2 font-semibold text-slate-100">What are you interested in?</p>
                <div className="flex flex-wrap gap-2">
                  {dashboard.advisor.interests.map((interest) => (
                    <Badge key={interest} className="cursor-pointer border border-purple-300/40 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button className="min-h-11 w-full bg-purple-600 hover:bg-purple-700">{dashboard.advisor.actionLabel}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.pathway.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.pathway.steps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[.03] p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                  <span className="font-bold text-fuchsia-200">{index + 1}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{step.title}</p>
                  <p className="text-sm text-slate-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-white/10 bg-[#0f172a]/90 shadow-xl ring-1 ring-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-fuchsia-400" />
            <CardTitle className="text-xl tracking-tight text-white">{dashboard.resources.title}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">{dashboard.resources.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.resources.items.map((resource) => (
              <div key={resource.title} className="group relative overflow-hidden rounded-lg">
                <img src={resource.imageUrl} alt={resource.alt} className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                    <Play className="ml-1 h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">{resource.title}</p>
                  <p className="text-sm text-white/80">{resource.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountType = (localStorage.getItem("accountType") ?? "").toUpperCase();
  const token = localStorage.getItem("token");
  const roleTab = getTabFromAccountType(accountType);
  const queryTab = searchParams.get("tab") as AudienceId | null;
  const initialTab = roleTab ?? queryTab ?? "candidates";
  const isEmployerAuthorized = Boolean(token) && accountType === "EMPLOYER";
  const [activeTab, setActiveTab] = useState<AudienceId>(initialTab);
  const [payload, setPayload] = useState<DashboardPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<CandidateJob | CareerItem> | null>(null);
  const [candidateJobs, setCandidateJobs] = useState<CandidateJob[]>([]);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [employerImageOverride, setEmployerImageOverride] = useState<string | null>(null);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [indModalOpen, setIndModalOpen] = useState(false);
  const [empTypeModalOpen, setEmpTypeModalOpen] = useState(false);
  const [workModeModalOpen, setWorkModeModalOpen] = useState(false);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [industryList, setIndustryList] = useState<Industry[]>([]);
  const [employmentTypeList, setEmploymentTypeList] = useState<import("./services/employment-type-service").EmploymentType[]>([]);
  const [workModeList, setWorkModeList] = useState<WorkMode[]>([]);
  const hasRedirectedUnauthorizedEmployer = useRef(false);
  const unauthorizedEmployerRedirectKey = "afrohr:unauthorized-employer-redirect";

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

        const data: DashboardPayload = {
          ...emptyPayload,
          ...dashboardPayload,
          dashboards: {
            ...emptyPayload.dashboards,
            ...(dashboardPayload.dashboards ?? {}),
            candidates: {
              ...emptyPayload.dashboards.candidates,
              ...(dashboardPayload.dashboards?.candidates ?? {}),
              jobs: {
                ...emptyPayload.dashboards.candidates.jobs,
                ...(dashboardPayload.dashboards?.candidates?.jobs ?? {}),
              },
            },
          },
        };
        if (!cancelled) {
          setPayload(data);
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
        const data = (await response.json()) as ApiJobItem[];
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
    setEmployerImageOverride(null);
  }, [payload.dashboards.employers.marketInsights.imageUrl]);

  useEffect(() => {
    if (!token || !roleTab) {
      return;
    }

    if (activeTab !== roleTab) {
      setActiveTab(roleTab);
      return;
    }

    if (queryTab !== roleTab) {
      setSearchParams({ tab: roleTab }, { replace: true });
    }
  }, [activeTab, queryTab, roleTab, setSearchParams, token]);

  useEffect(() => {
    if (activeTab !== "employers") {
      hasRedirectedUnauthorizedEmployer.current = false;
      sessionStorage.removeItem(unauthorizedEmployerRedirectKey);
      return;
    }

    if (!isEmployerAuthorized) {
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
  }, [activeTab, isEmployerAuthorized, navigate]);

  async function handleSearch() {
    if (activeTab === "employers") {
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

    navigate(`/apply-job/${job.id}`);
  }

  return (
    <>
      <div className="h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
        <PremiumNavbar />
        <div className="flex flex-1 min-h-0">
          <PremiumSidebar
            active={
              deptModalOpen
                ? "Department"
                : indModalOpen
                ? "Industry"
                : empTypeModalOpen
                ? "Employment Type"
                : workModeModalOpen
                ? "Work Mode"
                : activeTab === "candidates"
                ? "Candidate"
                : activeTab === "employers"
                ? "Employer"
                : activeTab === "students"
                ? "Student"
                : ""
            }
            onNav={(label) => {
              // Handle Employer submenu items
              if (label === "Department") {
                setDeptModalOpen(true);
              } else if (label === "Industry") {
                setIndModalOpen(true);
              } else if (label === "Employment Type") {
                setEmpTypeModalOpen(true);
              } else if (label === "Work Mode") {
                setWorkModeModalOpen(true);
              } else {
                // Handle main tab switching
                let tab: AudienceId = "candidates";
                if (label === "Employer") tab = "employers";
                else if (label === "Student") tab = "students";
                else if (label === "Candidate") tab = "candidates";

                if (tab === "employers" && !isEmployerAuthorized) {
                  navigate("/login", { replace: true });
                  return;
                }

                setActiveTab(tab);
                setSearchParams({ tab }, { replace: true });
              }
            }}
          />
          <div className="flex-1 min-w-0 overflow-y-auto p-0">
            <div className="space-y-6">
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
              <CandidateView
                dashboard={{
                  ...payload.dashboards.candidates,
                  jobs: {
                    ...payload.dashboards.candidates.jobs,
                    items: candidateJobs.length > 0 ? candidateJobs : payload.dashboards.candidates.jobs.items,
                  },
                }}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearch={handleSearch}
                onApplyToJob={handleApplyToJob}
                applyingJobId={applyingJobId}
                appliedJobIds={appliedJobIds}
                searchLoading={searchLoading}
                searchResults={searchResults as CandidateJob[] | null}
              />
            )}

            {!loading && !error && activeTab === "employers" && (
              <EmployerView
                dashboard={payload.dashboards.employers}
              />
            )}

            {!loading && !error && activeTab === "students" && (
              <StudentView
                dashboard={payload.dashboards.students}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearch={handleSearch}
                searchLoading={searchLoading}
                searchResults={searchResults as CareerItem[] | null}
              />
            )}
            </div>
          </div>
        </div>
      </div>
      <MantineProvider>
        <Notifications position="top-center" zIndex={2001} />
        <Departments opened={deptModalOpen} onClose={() => setDeptModalOpen(false)} />
        <Industries opened={indModalOpen} onClose={() => setIndModalOpen(false)} />
        <EmploymentTypes opened={empTypeModalOpen} onClose={() => setEmpTypeModalOpen(false)} />
        <WorkModes opened={workModeModalOpen} onClose={() => setWorkModeModalOpen(false)} />
      </MantineProvider>
    </>
  );
}
