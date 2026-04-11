import axiosInstance from "../interceptor/AxiosInterceptor";

export type EmployerRole = "OWNER" | "RECRUITER" | "VIEWER";

export interface EmployerMember {
  id: number;
  name: string;
  email: string;
  accountType?: string;
  profileId?: number;
  employerRole?: EmployerRole;
}

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  accountType?: string;
}

export interface ChangePasswordPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export async function registerUser(payload: RegisterUserPayload) {
  const response = await fetch("/api/ahrm/v3/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Registration failed");
  }
  return response.json();
}

export async function loginUser(payload: { email: string; password: string }) {
  const response = await fetch("/api/ahrm/v3/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Login failed");
  }
  return response.json();
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await fetch("/api/ahrm/v3/users/changePass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Password change failed");
  }
  return response.json();
}

export async function sendOtp(email: string) {
  const response = await fetch(`/api/ahrm/v3/users/sendOtp/${encodeURIComponent(email)}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to send OTP");
  }
  return response.json();
}

export async function verifyOtp(email: string, otp: string) {
  const response = await fetch(`/api/ahrm/v3/users/verifyOtp/${encodeURIComponent(email)}/${encodeURIComponent(otp)}`);
  if (!response.ok) {
    throw new Error("Failed to verify OTP");
  }
  return response.json();
}

export async function resetPassword(email: string, password: string) {
  // Backend currently exposes changePass, not resetPass.
  const response = await fetch("/api/ahrm/v3/users/changePass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Password reset failed");
  }
  return response.json();
}

export async function getEmployerMembers() {
  const response = await axiosInstance.get<EmployerMember[]>("/users/employer/members");
  return response.data;
}

export async function linkEmployerMember(email: string) {
  const response = await axiosInstance.post<EmployerMember>(`/users/employer/link/${encodeURIComponent(email)}`);
  return response.data;
}

export async function sendEmployerInviteOtp(email: string) {
  const response = await axiosInstance.post<{ message?: string }>(`/users/employer/invite-otp/${encodeURIComponent(email)}`);
  return response.data;
}

export async function updateEmployerMemberRole(userId: number, role: EmployerRole) {
  const normalizedRole = role.toUpperCase() as EmployerRole;
  const response = await axiosInstance.post<EmployerMember>(`/users/employer/members/${userId}/role/${normalizedRole}`);
  return response.data;
}