import { getAuthHeaders } from "./http-auth";

export async function getUnreadNotifications(userId: number) {
  const response = await fetch(`/api/ahrm/v3/notification/get/${userId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

export async function getMyNotifications() {
  const response = await fetch("/api/ahrm/v3/notification/me", {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

export async function markNotificationRead(id: number) {
  const response = await fetch(`/api/ahrm/v3/notification/read/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
  return response.json();
}

export const getNotifications = getUnreadNotifications;
export const readNotification = markNotificationRead;