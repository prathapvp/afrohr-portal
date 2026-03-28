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
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to post job");
  }
  return response.json();
}

export async function postAllJobs(payload: JobPayload[]) {
  const response = await fetch("/api/ahrm/v3/jobs/postAll", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to post jobs");
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