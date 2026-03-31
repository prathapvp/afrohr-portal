import { getAuthHeaders } from "./http-auth";

export interface JobPayload {
  id?: number;
  title: string;
  company: string;
  description?: string;
  location: string;
  salary: string;
  logoTone?: string;
  department?: string;
  role?: string;
  experience?: string;
  employmentType?: string;
  industry?: string;
  workMode?: string;
  currency?: string;
  vacancies?: number;
  skills?: string;
  postedBy?: number;
  jobStatus?: string;
}

function parseSalaryRange(salary?: string): { min?: number; max?: number } {
  if (!salary) {
    return {};
  }

  const cleaned = salary.replace(/,/g, "");
  const matches = cleaned.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return {};
  }

  const values = matches.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value) && value > 0);
  if (values.length === 0) {
    return {};
  }

  if (values.length === 1) {
    return { min: values[0], max: values[0] };
  }

  return { min: values[0], max: values[1] };
}

function normalizeSkills(skills?: string | string[]): string[] {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }
  if (!skills) {
    return [];
  }
  return skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function getStoredUserId(): number | undefined {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as { id?: number; userId?: number };
    const id = parsed?.id ?? parsed?.userId;
    return typeof id === "number" && Number.isFinite(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

function normalizeJobStatus(status?: string): string {
  const normalized = (status ?? "ACTIVE").toUpperCase();
  if (normalized === "DRAFT" || normalized === "CLOSED") {
    return normalized;
  }
  return "ACTIVE";
}

function toJobDto(payload: JobPayload) {
  const salary = parseSalaryRange(payload.salary);
  const title = (payload.title || "").trim();
  const jobTitle = title || (payload as unknown as { jobTitle?: string }).jobTitle || "";
  const jobType = (payload.employmentType || "").trim() || (payload as unknown as { jobType?: string }).jobType || "";
  const skillsRequired = normalizeSkills(payload.skills || (payload as unknown as { skillsRequired?: string[] }).skillsRequired);

  return {
    id: payload.id,
    jobTitle,
    department: payload.department?.trim() || "",
    role: payload.role?.trim() || "",
    company: payload.company?.trim() || "",
    location: payload.location?.trim() || "",
    description: payload.description?.trim() || "",
    experience: payload.experience?.trim() || "",
    jobType,
    workMode: payload.workMode?.trim() || "",
    industry: payload.industry?.trim() || "",
    vacancies: payload.vacancies,
    packageOffered: salary.min,
    maxPackageOffered: salary.max,
    skillsRequired,
    postedBy: payload.postedBy ?? getStoredUserId(),
    jobStatus: normalizeJobStatus(payload.jobStatus),
    // Preserve backward-compatible fields currently used by dashboard parsing.
    salary: payload.salary,
    employmentType: payload.employmentType,
    currency: payload.currency,
    logoTone: payload.logoTone,
    skills: payload.skills,
  };
}

export interface ApplicationStatusPayload {
  applicationId: number;
  jobId: number;
  applicantUserId?: number;
  applicationStatus: string;
}

export interface PostImageResponse {
  message: string;
  fileName: string;
  imageUrl: string;
  contentType: string;
  size: number;
}

export async function postJob(payload: JobPayload) {
  const response = await fetch("/api/ahrm/v3/jobs/post", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(toJobDto(payload)),
  });
  if (!response.ok) {
    let message = "Failed to post job";
    try {
      const errorBody = await response.json();
      message = errorBody?.errorMessage || message;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }
  return response.json();
}

export async function postAllJobs(payload: JobPayload[]) {
  const response = await fetch("/api/ahrm/v3/jobs/postAll", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload.map((job) => toJobDto(job))),
  });
  if (!response.ok) {
    let message = "Failed to post jobs";
    try {
      const errorBody = await response.json();
      message = errorBody?.errorMessage || message;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }
  return response.json();
}

export async function getAllJobs() {
  const response = await fetch("/api/ahrm/v3/jobs/getAll");
  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }
  return response.json();
}

export async function getJob(id: number) {
  const response = await fetch(`/api/ahrm/v3/jobs/get/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch job");
  }
  return response.json();
}

export async function deleteJob(id: number) {
  const response = await fetch(`/api/ahrm/v3/jobs/delete/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete job");
  }
  return response.json();
}

export async function applyToJob(
  id: number,
  payload: {
    applicantUserId?: number;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    website?: string;
    resumeUrl?: string;
    coverLetter?: string;
  },
) {
  const response = await fetch(`/api/ahrm/v3/jobs/apply/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to apply to job");
  }
  return response.json();
}

export async function getJobsPostedBy(id: number) {
  const response = await fetch(`/api/ahrm/v3/jobs/postedBy/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch posted jobs");
  }
  return response.json();
}

export async function getJobHistory(id: number, applicationStatus: string) {
  const response = await fetch(`/api/ahrm/v3/jobs/history/${id}/${encodeURIComponent(applicationStatus)}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch job history");
  }
  return response.json();
}

export async function changeApplicationStatus(payload: ApplicationStatusPayload) {
  const response = await fetch("/api/ahrm/v3/jobs/changeAppStatus", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to change application status");
  }
  return response.json();
}

export async function postJobImage(file: File): Promise<PostImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ahrm/v3/jobs/postImage", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return (await response.json()) as PostImageResponse;
}