import axiosInstance from "../interceptor/AxiosInterceptor";

export interface StudentIntakeRequest {
  decisionMode: "determined" | "exploring";
  targetRole?: string;
  primaryInterest: string;
  primaryField: string;
  backgroundLevel?: string;
  timeline?: string;
  skills?: string;
}

export interface StudentIntakeRecommendation {
  summary: string;
  pathwayMode: "focused" | "exploration" | string;
  recommendedRoles: string[];
  roleConfidence?: Record<string, number>;
  roleReasons?: Record<string, string[]>;
  focusAreas: string[];
  nextSteps: string[];
}

export async function getStudentIntakeRecommendation(payload: StudentIntakeRequest) {
  const response = await axiosInstance.post("/dashboard/students/intake-recommendation", payload);
  return response.data as StudentIntakeRecommendation;
}
