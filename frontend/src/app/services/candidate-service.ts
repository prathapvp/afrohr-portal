export interface CandidateApplyRequest {
  applicantName: string;
  applicantEmail: string;
  resumeUrl?: string;
}

export interface CandidateApplyResponse {
  message: string;
  application: {
    id: number;
    jobId: number;
    applicantName: string;
    applicantEmail: string;
    resumeUrl?: string;
    status: string;
    appliedAt: string;
  };
}

export async function applyToCandidateJob(jobId: number, payload: CandidateApplyRequest): Promise<CandidateApplyResponse> {
  const response = await fetch(`/api/ahrm/v3/jobs/apply/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to submit application");
  }

  return (await response.json()) as CandidateApplyResponse;
}
