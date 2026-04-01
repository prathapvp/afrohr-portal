export interface LoginPayload {
  email: string;
  password: string;
}

import axiosInstance from "../interceptor/AxiosInterceptor";

export async function loginUser(payload: LoginPayload) {
  const response = await fetch("/api/ahrm/v3/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message = responseData?.errorMessage || responseData?.message || "Authentication failed";
    throw new Error(message);
  }

  const token = responseData?.jwt || responseData?.token || responseData?.accessToken;
  if (!token) {
    throw new Error("Login response missing token");
  }

  return {
    ...responseData,
    jwt: token,
  };
}

export async function authenticate(payload: LoginPayload) {
  return loginUser(payload);
}

export async function getCurrentUser() {
  const response = await axiosInstance.get("/users/me");
  return response.data;
}