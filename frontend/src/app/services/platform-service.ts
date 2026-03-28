export async function getHealth() {
  const response = await fetch("/actuator/health");
  if (!response.ok) {
    throw new Error("Failed to fetch health");
  }
  return response.json();
}

export async function getAudiences() {
  const response = await fetch("/api/audiences");
  if (!response.ok) {
    throw new Error("Failed to fetch audiences");
  }
  return response.json();
}

export async function getDashboardRoot() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }
  return response.json();
}

export async function getDashboardByAudience(audience: string) {
  const response = await fetch(`/api/dashboard/${encodeURIComponent(audience)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard by audience");
  }
  return response.json();
}
