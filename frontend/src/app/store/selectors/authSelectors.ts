import type { RootState } from "..";

export type AccountType = "APPLICANT" | "EMPLOYER" | "STUDENT" | "ADMIN" | "CANDIDATE";

type UserWithAccountType = {
  accountType?: string | null;
} | null;

export function selectJwt(state: RootState): string {
  return state.jwt;
}

export function selectIsAuthenticated(state: RootState): boolean {
  return Boolean(state.jwt);
}

export function selectAccountType(state: RootState): string {
  return String((state.user as UserWithAccountType)?.accountType ?? "").toUpperCase();
}

export function selectIsEmployer(state: RootState): boolean {
  return selectAccountType(state) === "EMPLOYER";
}

export function getLandingTabForAccountType(accountType: string): "candidates" | "employers" | "students" | null {
  const normalized = accountType.toUpperCase();
  if (normalized === "EMPLOYER") return "employers";
  if (normalized === "APPLICANT" || normalized === "CANDIDATE") return "candidates";
  if (normalized === "STUDENT") return "students";
  return null;
}