import axiosInstance from "../interceptor/AxiosInterceptor";

export async function searchContent(audience: string, query: string) {
  const response = await axiosInstance.get("/search", {
    params: {
      audience,
      q: query,
    },
  });
  return response.data;
}
