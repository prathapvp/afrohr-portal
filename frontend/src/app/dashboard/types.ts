import type { EmployerDashboard } from "../features/employer/employer-types";
import type { HeroSection, Tone } from "../shared";

export type AudienceId = "candidates" | "employers" | "students" | "admin";

export interface Branding {
  name: string;
  subtitle: string;
}

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

export interface StudentCareerRoadmap {
  career: string;
  subfields: string[];
  collegesIndia: string[];
  collegesGlobal: string[];
  salaryRange: string;
  entryRoles: string[];
  topCountries: string[];
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
    icon: keyof typeof import("../shared").iconMap;
    tone: Tone;
  }>;
  jobs: { title: string; items: CandidateJob[]; actionLabel?: string };
  salaryInsights: { title: string; description: string; imageUrl: string };
  videos: { title: string; description?: string; items: VideoItem[] };
  trends: { title: string; items: TrendItem[] };
  countries: { title: string; description?: string; items: Array<{ country: string; flag: string; jobs: number; tone: Tone; trend: string }> };
  premium: { title: string; description: string; chips: string[]; actionLabel: string };
}

export interface StudentDashboard {
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
  roadmap?: {
    byInterest: Record<string, StudentCareerRoadmap[]>;
  };
}

export interface DashboardPayload {
  branding: Branding;
  audiences: Audience[];
  dashboards: {
    candidates: CandidateDashboard;
    employers: EmployerDashboard;
    students: StudentDashboard;
  };
}

export interface ApiJobItem {
  id?: number;
  title?: string;
  role?: string;
  company?: string;
  location?: string;
  salary?: string;
  logoTone?: string;
}