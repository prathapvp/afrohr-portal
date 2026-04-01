import { getAuthHeaders } from "./http-auth";

export interface CandidateApplyPayload {
  applicantName: string;
  applicantEmail: string;
  resumeUrl?: string;
}

export async function getCandidateJobs() {
  const response = await fetch("/api/ahrm/v3/jobs/getAll");
  if (!response.ok) {
    throw new Error("Failed to fetch candidate jobs");
  }
  return response.json();
}

export async function getCandidateJobById(jobId: number) {
  const response = await fetch(`/api/ahrm/v3/jobs/get/${jobId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch candidate job");
  }
  return response.json();
}

export async function applyToCandidateJobByPath(jobId: number, payload: CandidateApplyPayload) {
  const response = await fetch(`/api/ahrm/v3/jobs/apply/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
	  ...getAuthHeaders(),
    },
    body: JSON.stringify({
      applicantName: payload.applicantName,
      applicantEmail: payload.applicantEmail,
      resumeUrl: payload.resumeUrl,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to apply to candidate job");
  }

  return response.json();
}
