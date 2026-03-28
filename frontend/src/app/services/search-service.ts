export async function searchContent(audience: string, query: string) {
  const url = new URL("/api/search", window.location.origin);
  url.searchParams.set("audience", audience);
  url.searchParams.set("q", query);

  const response = await fetch(url.pathname + url.search);
  if (!response.ok) {
    throw new Error("Failed to search");
  }
  return response.json();
}
