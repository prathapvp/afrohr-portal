export type HistoryTab = "APPLIED" | "SAVED" | "OFFERED" | "INTERVIEWING";

export interface ApplicantEntry {
  applicantId?: number;
  applicationStatus?: string;
}

export interface HistoryJobItem {
  id: number;
  jobTitle?: string;
  company?: string;
  location?: string;
  experience?: string;
  jobType?: string;
  packageOffered?: number;
  postTime?: string;
  about?: string;
  applicants?: ApplicantEntry[];
}

export interface JobHistoryEnvelope {
  job?: HistoryJobItem;
  applicants?: ApplicantEntry[];
}
