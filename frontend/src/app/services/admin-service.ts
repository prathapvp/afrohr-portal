import axiosInstance from "../interceptor/AxiosInterceptor";

export interface AdminEmployerSummary {
  employerId: number;
  companyName: string;
  contactName: string;
  email: string;
  location: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
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

export type SubscriptionRequestType = "RENEWAL" | "UPGRADE";
export type SubscriptionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SubscriptionRequest {
  id: number;
  employerId: number;
  requestType: SubscriptionRequestType;
  status: SubscriptionRequestStatus;
  note: string | null;
  adminNote: string | null;
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
