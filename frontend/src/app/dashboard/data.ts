import type { Tone } from "../shared";
import type { ApiJobItem, AudienceId, CandidateJob, DashboardPayload } from "./types";

export function getTabFromAccountType(accountType: string): AudienceId | null {
  const normalized = accountType.toUpperCase();
  if (normalized === "ADMIN") return "admin";
  if (normalized === "EMPLOYER") return "employers";
  if (normalized === "APPLICANT" || normalized === "CANDIDATE") return "candidates";
  if (normalized === "STUDENT") return "students";
  return null;
}

export const emptyPayload: DashboardPayload = {
  branding: { name: "AfroHR", subtitle: "Talent Network" },
  audiences: [
    { id: "candidates", label: "Candidate", description: "Find jobs", accent: "blue", icon: "Users" },
    { id: "employers", label: "Employer", description: "Hire talent", accent: "green", icon: "Briefcase" },
    { id: "students", label: "Student", description: "Career guidance", accent: "purple", icon: "GraduationCap" },
    { id: "admin", label: "Admin", description: "Platform analytics", accent: "orange", icon: "Shield" },
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

export function normalizeLogoTone(tone?: string): Tone {
  const normalized = String(tone || "").toLowerCase();
  if (normalized === "blue") return "blue";
  if (normalized === "green") return "green";
  if (normalized === "purple" || normalized === "violet") return "purple";
  if (normalized === "orange" || normalized === "amber") return "orange";
  return "blue";
}

export function mapApiJobToCandidateJob(item: ApiJobItem): CandidateJob {
  return {
    id: typeof item.id === "number" ? item.id : undefined,
    company: item.company || "Unknown Company",
    role: item.role || item.title || "Open Position",
    location: item.location || "Location not specified",
    salary: item.salary || "Salary not specified",
    logoTone: normalizeLogoTone(item.logoTone),
  };
}

export function mergeDashboardPayload(dashboardPayload: Partial<DashboardPayload>): DashboardPayload {
  return {
    ...emptyPayload,
    ...dashboardPayload,
    dashboards: {
      candidates: {
        ...emptyPayload.dashboards.candidates,
        ...(dashboardPayload.dashboards?.candidates ?? {}),
        jobs: {
          ...emptyPayload.dashboards.candidates.jobs,
          ...(dashboardPayload.dashboards?.candidates?.jobs ?? {}),
        },
        salaryInsights: {
          ...emptyPayload.dashboards.candidates.salaryInsights,
          ...(dashboardPayload.dashboards?.candidates?.salaryInsights ?? {}),
        },
        videos: {
          ...emptyPayload.dashboards.candidates.videos,
          ...(dashboardPayload.dashboards?.candidates?.videos ?? {}),
        },
        trends: {
          ...emptyPayload.dashboards.candidates.trends,
          ...(dashboardPayload.dashboards?.candidates?.trends ?? {}),
        },
        countries: {
          ...emptyPayload.dashboards.candidates.countries,
          ...(dashboardPayload.dashboards?.candidates?.countries ?? {}),
        },
        premium: {
          ...emptyPayload.dashboards.candidates.premium,
          ...(dashboardPayload.dashboards?.candidates?.premium ?? {}),
        },
      },
      employers: {
        ...emptyPayload.dashboards.employers,
        ...(dashboardPayload.dashboards?.employers ?? {}),
      },
      students: {
        ...emptyPayload.dashboards.students,
        ...(dashboardPayload.dashboards?.students ?? {}),
        careers: {
          ...emptyPayload.dashboards.students.careers,
          ...(dashboardPayload.dashboards?.students?.careers ?? {}),
        },
        advisor: {
          ...emptyPayload.dashboards.students.advisor,
          ...(dashboardPayload.dashboards?.students?.advisor ?? {}),
        },
        pathway: {
          ...emptyPayload.dashboards.students.pathway,
          ...(dashboardPayload.dashboards?.students?.pathway ?? {}),
        },
        resources: {
          ...emptyPayload.dashboards.students.resources,
          ...(dashboardPayload.dashboards?.students?.resources ?? {}),
        },
      },
    },
  };
}