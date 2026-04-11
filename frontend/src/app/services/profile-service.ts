import axiosInstance from "../interceptor/AxiosInterceptor";

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
  const response = await axiosInstance.get(`/profiles/get/${id}`);
  return response.data;
}

export async function getProfileByUserId(userId: number) {
  const response = await axiosInstance.get(`/profiles/by-user/${userId}`);
  return response.data;
}

export async function getMyProfile() {
	const response = await axiosInstance.get("/profiles/me");
	return response.data;
}

export async function getAllProfiles() {
  const response = await axiosInstance.get("/profiles/getAll");
  return response.data;
}

export async function getProfilesByAccountType(accountType: "APPLICANT" | "STUDENT" | "EMPLOYER") {
  const response = await axiosInstance.get("/profiles/getAll", {
    params: { accountType }
  });
  return response.data;
}

export async function updateProfile(payload: ProfilePayload) {
  const response = await axiosInstance.put("/profiles/update", payload);
  return response.data;
}

export async function updateMyProfile(payload: Omit<ProfilePayload, "id"> | ProfilePayload) {
	const response = await axiosInstance.put("/profiles/me", payload);
	return response.data;
}

export async function patchProfile(profileId: number, changes: unknown) {
  const response = await axiosInstance.patch(`/profiles/${profileId}`, changes);
  return response.data;
}

export async function patchMyProfile(changes: unknown) {
	const response = await axiosInstance.patch("/profiles/me", changes);
	return response.data;
}

export async function uploadResume(profileId: number, fileData: string, fileName: string) {
  const response = await axiosInstance.post(`/profiles/uploadResume`, { profileId, fileData, fileName });
  return response.data;
}

export async function uploadMyResume(fileData: string, fileName: string) {
	const response = await axiosInstance.post("/profiles/me/uploadResume", { fileData, fileName });
	return response.data;
}

export async function parseResume(fileData: string, fileName: string) {
  const response = await axiosInstance.post(`/profiles/parseResume`, { fileData, fileName });
  return response.data;
}

export async function chatWithProfileAssistant(message: string, accountType?: string, profileContext?: string) {
  const response = await axiosInstance.post(`/profiles/chatAssistant`, {
    message,
    accountType,
    profileContext,
  });
  return response.data?.reply;
}

  export async function recordResumeView(profileId: number): Promise<{ resumeViewCount: number }> {
    const response = await axiosInstance.post(`/profiles/${profileId}/resume/view`);
    return response.data;
  }