import type { HeroSection, IconName, Tone } from "../../shared";

export type { HeroSection, IconName, Tone };

export interface EmployerMetric {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

export interface OptimizerCard {
  label: string;
  value: string;
  tone: Tone;
  icon: IconName;
}

export interface VerificationItem {
  title: string;
  description: string;
  badge: string;
  tone: Tone;
  icon: IconName;
}

export interface EmployerDashboard {
  hero: HeroSection;
  marketInsights: {
    title: string;
    description: string;
    imageUrl: string;
    metrics: EmployerMetric[];
  };
  optimizer: {
    title: string;
    description: string;
    cards: OptimizerCard[];
  };
  verification: {
    title: string;
    items: VerificationItem[];
  };
}

export interface EmployerPostedJob {
  id: number;
  jobTitle: string;
  company: string;
  role?: string;
  location: string;
  salary?: string;
  logoTone?: Tone;
  department?: string;
  experience?: string;
  employmentType?: string;
  industry?: string;
  workMode?: string;
  currency?: string;
  vacancies?: number;
  skills?: string;
  description?: string;
  postedBy?: number;
  jobStatus: "ACTIVE" | "DRAFT" | "CLOSED";
  postTime?: string;
}

export interface EmployerPostForm {
  title: string;
  company: string;
  department: string;
  role: string;
  experience: string;
  employmentType: string;
  industry: string;
  workMode: string;
  currency: string;
  vacancies: string;
  skills: string;
  location: string;
  salary: string;
  description: string;
  logoTone: Tone;
  jobStatus: "ACTIVE" | "DRAFT" | "CLOSED";
}

export const LEGACY_JOB_OPTIONS = {
  departments: [
    "Healthcare & Life Sciences",
    "Research & Development",
    "Procurement & Supply Chain",
    "Teaching & Training",
    "Strategic & Top Management",
  ],
  experiences: ["Entry Level", "Intermediate", "Expert", "0-2yrs", "2-5yrs", "5-10yrs"],
  employmentTypes: [
    "Full Time, Permanent",
    "Full Time, Temporary/Contractual",
    "Part Time, Permanent",
    "Part Time, Freelance/Home-based",
  ],
  industries: ["Technology", "IT Services", "FinTech / Payments", "Education / Training", "Healthcare & Life Sciences"],
  workModes: ["In office", "Hybrid", "Remote"],
  currencies: ["USD", "EUR", "GBP", "INR"],
} as const;

export const DEFAULT_EMPLOYER_POST_FORM: EmployerPostForm = {
  title: "",
  company: "",
  department: "",
  role: "",
  experience: "",
  employmentType: "",
  industry: "",
  workMode: "",
  currency: "USD",
  vacancies: "",
  skills: "",
  location: "",
  salary: "",
  description: "",
  logoTone: "blue",
  jobStatus: "ACTIVE",
};

export const REQUIRED_LEGACY_FIELDS: Array<keyof EmployerPostForm> = ["department", "experience", "employmentType", "industry", "workMode"];

export const LEGACY_FIELD_LABELS: Record<keyof EmployerPostForm, string> = {
  title: "Title",
  company: "Company",
  department: "Department",
  role: "Role",
  experience: "Experience",
  employmentType: "Employment Type",
  industry: "Industry",
  workMode: "Work Mode",
  currency: "Currency",
  vacancies: "Vacancies",
  skills: "Skills",
  location: "Location",
  salary: "Salary",
  description: "About Job",
  logoTone: "Logo Tone",
  jobStatus: "Status",
};

export function parseLegacyDetailsFromDescription(description: string): Partial<EmployerPostedJob> {
  if (!description.includes("Legacy Post Details")) {
    return {};
  }

  const details = description
    .split("Legacy Post Details")
    .at(1)
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!details || details.length === 0) {
    return {};
  }

  const parsed: Partial<EmployerPostedJob> = {};
  for (const line of details) {
    if (line.startsWith("Department:")) parsed.department = line.replace("Department:", "").trim();
    if (line.startsWith("Experience:")) parsed.experience = line.replace("Experience:", "").trim();
    if (line.startsWith("Employment Type:")) parsed.employmentType = line.replace("Employment Type:", "").trim();
    if (line.startsWith("Industry:")) parsed.industry = line.replace("Industry:", "").trim();
    if (line.startsWith("Work Mode:")) parsed.workMode = line.replace("Work Mode:", "").trim();
    if (line.startsWith("Currency:")) parsed.currency = line.replace("Currency:", "").trim();
    if (line.startsWith("Skills:")) parsed.skills = line.replace("Skills:", "").trim();
    if (line.startsWith("Vacancies:")) {
      const value = Number.parseInt(line.replace("Vacancies:", "").trim(), 10);
      if (Number.isFinite(value) && value > 0) {
        parsed.vacancies = value;
      }
    }
  }

  return parsed;
}
