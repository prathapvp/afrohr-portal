export interface LoginPayload {
  email: string;
  password: string;
}

export async function authenticate(payload: LoginPayload) {
  const response = await fetch("/api/ahrm/v3/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Authentication failed");
  }

  return response.json();
}