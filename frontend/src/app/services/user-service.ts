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