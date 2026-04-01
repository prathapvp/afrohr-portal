export interface CompanyJob {
  id?: number;
  company?: string;
  about?: string;
  industry?: string;
  location?: string;
  jobStatus?: string;
  skillsRequired?: string[];
  [key: string]: unknown;
}

export interface CompanyEmployee {
  id?: number;
  company?: string;
  location?: string;
  [key: string]: unknown;
}
