// Shared TypeScript types for the AfroHR portal

export type UserRole = 'CANDIDATE' | 'EMPLOYER' | 'ADMIN';

export interface AuthUser {
  token: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'CANDIDATE' | 'EMPLOYER';
}

export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD';

export interface JobPosting {
  id: number;
  title: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryRange: string;
  deadline: string;
  status: JobStatus;
  employer: { id: number; name: string; email: string };
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type ProfileVisibility = 'PUBLIC' | 'PRIVATE';

export interface CandidateProfile {
  id: number;
  user: { id: number; name: string; email: string };
  bio: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  skills: string;
  resumeOriginalFilename: string;
  visibility: ProfileVisibility;
}

export interface EmployerProfile {
  id: number;
  user: { id: number; name: string; email: string };
  companyName: string;
  companyDescription: string;
  industry: string;
  website: string;
  location: string;
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'OFFERED';

export interface Application {
  id: number;
  jobPosting: JobPosting;
  candidate: { id: number; name: string; email: string };
  coverLetter: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface MetadataItem {
  id: number;
  category: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
}
