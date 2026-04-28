import axiosInstance from "../interceptor/AxiosInterceptor";

export async function getHealth() {
  const response = await fetch("/actuator/health");
  if (!response.ok) {
    throw new Error("Failed to fetch health");
  }
  return response.json();
}

export async function getAudiences() {
  const response = await axiosInstance.get("/audiences");
  return response.data;
}

export async function getDashboardRoot() {
  const response = await axiosInstance.get("/dashboard");
  return response.data;
}

export async function getDashboardByAudience(audience: string) {
  const response = await axiosInstance.get(`/dashboard/${encodeURIComponent(audience)}`);
  return response.data;
}
