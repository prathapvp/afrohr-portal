export interface LoginPayload {
  email: string;
  password: string;
}

import axiosInstance from "../interceptor/AxiosInterceptor";

export async function loginUser(payload: LoginPayload) {
  const response = await axiosInstance.post("/auth/login", payload);
  const responseData = response.data;

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