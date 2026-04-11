import axiosInstance from "../interceptor/AxiosInterceptor";
import type { EmployerSubscription, SubscriptionRequest, SubscriptionRequestType } from "./admin-service";

export async function getMySubscription() {
  const response = await axiosInstance.get<EmployerSubscription>("/subscriptions/me");
  return response.data;
}

export async function submitSubscriptionRequest(
  requestType: SubscriptionRequestType,
  requestedPlan?: string,
  note?: string,
  paymentStatement?: File,
) {
  const formData = new FormData();
  formData.append("requestType", requestType?.toUpperCase());
  if (requestedPlan?.trim()) {
    formData.append("requestedPlan", requestedPlan.trim().toUpperCase());
  }
  if (note?.trim()) {
    formData.append("note", note.trim());
  }
  if (paymentStatement) {
    formData.append("paymentStatement", paymentStatement);
  }
  const response = await axiosInstance.post<SubscriptionRequest>("/subscriptions/request", formData);
  return response.data;
}

export async function updateSubscriptionRequest(
  requestId: number,
  requestType: SubscriptionRequestType,
  requestedPlan?: string,
  note?: string,
  paymentStatement?: File,
) {
  const formData = new FormData();
  formData.append("requestType", requestType?.toUpperCase());
  if (requestedPlan?.trim()) {
    formData.append("requestedPlan", requestedPlan.trim().toUpperCase());
  }
  if (note?.trim()) {
    formData.append("note", note.trim());
  }
  if (paymentStatement) {
    formData.append("paymentStatement", paymentStatement);
  }
  const response = await axiosInstance.put<SubscriptionRequest>(`/subscriptions/requests/${requestId}`, formData);
  return response.data;
}

export async function deleteSubscriptionRequest(requestId: number) {
  await axiosInstance.delete(`/subscriptions/requests/${requestId}`);
}

export async function getMySubscriptionRequests() {
  const response = await axiosInstance.get<SubscriptionRequest[]>("/subscriptions/requests/me");
  return response.data;
}

export function getStatementDownloadUrl(requestId: number) {
  return `/api/ahrm/v3/subscriptions/requests/${requestId}/statement`;
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

export async function openSubscriptionStatement(requestId: number) {
  const response = await axiosInstance.get(`/subscriptions/requests/${requestId}/statement`, {
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
