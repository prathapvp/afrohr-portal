import axiosInstance from "../interceptor/AxiosInterceptor";
import type { EmployerSubscription, SubscriptionRequest, SubscriptionRequestType } from "./admin-service";

export async function getMySubscription() {
  const response = await axiosInstance.get<EmployerSubscription>("/subscriptions/me");
  return response.data;
}

export async function submitSubscriptionRequest(requestType: SubscriptionRequestType, note?: string) {
  const response = await axiosInstance.post<SubscriptionRequest>("/subscriptions/request", {
    requestType,
    note: note ?? null,
  });
  return response.data;
}

export async function getMySubscriptionRequests() {
  const response = await axiosInstance.get<SubscriptionRequest[]>("/subscriptions/requests/me");
  return response.data;
}
