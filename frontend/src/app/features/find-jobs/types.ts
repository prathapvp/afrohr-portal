export type SortOption = "Most Recent" | "Salary: Low to High" | "Salary: High to Low";

export interface FindJobsFilters {
  "Job Title"?: string[];
  Location?: string[];
  Experience?: string[];
  "Job Type"?: string[];
  salary?: [number, number];
  page?: number;
  [key: string]: unknown;
}

export interface JobListItem {
  id: number;
  jobTitle: string;
  company: string;
  location?: string;
  country?: string;
  experience?: string;
  jobType?: string;
  currency?: string;
  packageOffered?: number;
  maxPackageOffered?: number;
  postTime?: string;
  about?: string;
  jobStatus?: string;
  applicants?: Array<{ applicantId?: number; applicationStatus?: string }>;
  skillsRequired?: string[];
}
