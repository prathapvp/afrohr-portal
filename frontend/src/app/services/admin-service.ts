import axiosInstance from "../interceptor/AxiosInterceptor";

export interface AdminEmployerSummary {
  employerId: number;
  companyName: string;
  contactName: string;
  email: string;
  location: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  monthlyResumeViewsUsed: number;
  maxResumeViewsPerMonth: number;
  monthlyResumeDownloadsUsed: number;
  maxResumeDownloadsPerMonth: number;
  usageWindowStartAt: string | null;
}

export interface AdminOverview {
  activeEmployers: number;
  activeCandidates: number;
  activeStudents: number;
  totalUsers: number;
  totalProfiles: number;
  totalJobs: number;
  activeJobs: number;
  employerSubscriptionsConfigured: number;
  employerSubscriptionsPending: number;
  generatedAt: string;
  employers: AdminEmployerSummary[];
}

export type SubscriptionStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "CANCELED" | "PAST_DUE";
export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export interface UpsertEmployerSubscriptionPayload {
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  durationDays: number;
  maxActiveJobs?: number;
  maxResumeViewsPerMonth?: number;
  maxResumeDownloadsPerMonth?: number;
}

export interface EmployerSubscription {
  id: number;
  employerId: number;
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  startAt: string;
  endAt: string;
  maxActiveJobs: number;
  maxResumeViewsPerMonth: number;
  maxResumeDownloadsPerMonth: number;
  monthlyResumeViewsUsed: number;
  monthlyResumeDownloadsUsed: number;
  usageWindowStartAt: string;
  activeJobs: number;
  postingAllowed: boolean;
  remainingDays: number;
}

export async function getAdminOverview() {
  const response = await axiosInstance.get<AdminOverview>("/admin/overview");
  return response.data;
}

export async function upsertEmployerSubscription(employerId: number, payload: UpsertEmployerSubscriptionPayload) {
  const response = await axiosInstance.post<EmployerSubscription>(`/admin/subscriptions/${employerId}`, payload);
  return response.data;
}

export async function getEmployerSubscription(employerId: number) {
  const response = await axiosInstance.get<EmployerSubscription>(`/admin/subscriptions/${employerId}`);
  return response.data;
}

export async function deleteEmployerSubscription(employerId: number) {
  await axiosInstance.delete(`/admin/subscriptions/${employerId}`);
}

export async function resetEmployerSubscriptionUsage(employerId: number) {
  const response = await axiosInstance.post<EmployerSubscription>(`/admin/subscriptions/${employerId}/reset-usage`);
  return response.data;
}

export type SubscriptionRequestType = "NEW" | "RENEWAL" | "UPGRADE";
export type SubscriptionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SubscriptionRequest {
  id: number;
  employerId: number;
  requestType: SubscriptionRequestType;
  status: SubscriptionRequestStatus;
  requestedPlan: string | null;
  note: string | null;
  adminNote: string | null;
  hasPaymentStatement: boolean;
  paymentStatementName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export async function getAllSubscriptionRequests() {
  const response = await axiosInstance.get<SubscriptionRequest[]>("/admin/subscription-requests");
  return response.data;
}

export async function resolveSubscriptionRequest(
  requestId: number,
  resolution: Exclude<SubscriptionRequestStatus, "PENDING">,
  adminNote?: string,
) {
  const response = await axiosInstance.post<SubscriptionRequest>(
    `/admin/subscription-requests/${requestId}/resolve`,
    { resolution, adminNote: adminNote ?? null },
  );
  return response.data;
}

function parseFilenameFromDisposition(disposition?: string): string | null {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const simpleMatch = disposition.match(/filename="?([^";]+)"?/i);
  return simpleMatch?.[1] ?? null;
}

export async function openAdminSubscriptionStatement(requestId: number) {
  const response = await axiosInstance.get(`/admin/subscription-requests/${requestId}/statement`, {
    responseType: "blob",
  });

  const contentType = response.headers["content-type"] ?? "application/octet-stream";
  const disposition = response.headers["content-disposition"] as string | undefined;
  const filename = parseFilenameFromDisposition(disposition) ?? `statement-${requestId}`;

  const blob = new Blob([response.data], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
