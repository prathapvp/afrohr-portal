import { getAuthHeaders } from "./http-auth";

export interface ProfilePayload {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  accountType?: string;
  phone?: string;
  address?: string;
  summary?: string;
  skills?: string[];
}

export async function getProfile(id: number) {
  const response = await fetch(`/api/ahrm/v3/profiles/get/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  return response.json();
}

export async function getAllProfiles() {
  const response = await fetch("/api/ahrm/v3/profiles/getAll", {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch profiles");
  }
  return response.json();
}

export async function updateProfile(payload: ProfilePayload) {
  const response = await fetch("/api/ahrm/v3/profiles/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  return response.json();
}