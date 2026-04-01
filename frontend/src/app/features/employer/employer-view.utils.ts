import { parseLegacyDetailsFromDescription, type EmployerPostedJob } from "./employer-types";

export function normalizeEmployerJob(item: Record<string, unknown>): EmployerPostedJob {
  const rawStatus = String(item.jobStatus ?? "ACTIVE").toUpperCase();
  const status: "ACTIVE" | "DRAFT" | "CLOSED" = rawStatus === "DRAFT" || rawStatus === "CLOSED" ? rawStatus : "ACTIVE";
  const description = typeof item.description === "string" ? item.description : "";
  const parsedLegacy = parseLegacyDetailsFromDescription(description);
  const vacanciesValue = Number.parseInt(String(item.vacancies ?? ""), 10);
  const postedByValue = Number.parseInt(String(item.postedBy ?? ""), 10);
  const logoTone = String(item.logoTone ?? "blue");
  const packageMin = Number.parseInt(String(item.packageOffered ?? ""), 10);
  const packageMax = Number.parseInt(String(item.maxPackageOffered ?? ""), 10);
  const salaryFromPackage =
    Number.isFinite(packageMin) && packageMin > 0 && Number.isFinite(packageMax) && packageMax > 0
      ? `${packageMin} - ${packageMax}`
      : Number.isFinite(packageMin) && packageMin > 0
        ? String(packageMin)
        : "";
  const skillsRequiredRaw = item.skillsRequired;
  const skillsFromArray = Array.isArray(skillsRequiredRaw)
    ? skillsRequiredRaw.map((skill) => String(skill).trim()).filter(Boolean).join(", ")
    : "";

  return {
    id: Number(item.id ?? 0),
    jobTitle: String(item.jobTitle ?? item.title ?? item.role ?? "Untitled role"),
    company: String(item.company ?? ""),
    role: String(item.role ?? ""),
    location: String(item.location ?? "Remote"),
    salary: String(item.salary ?? salaryFromPackage),
    logoTone: logoTone === "green" || logoTone === "purple" || logoTone === "orange" ? logoTone : "blue",
    department: String(item.department ?? parsedLegacy.department ?? ""),
    experience: String(item.experience ?? parsedLegacy.experience ?? ""),
    employmentType: String(item.employmentType ?? item.jobType ?? parsedLegacy.employmentType ?? ""),
    industry: String(item.industry ?? parsedLegacy.industry ?? ""),
    workMode: String(item.workMode ?? parsedLegacy.workMode ?? ""),
    currency: String(item.currency ?? parsedLegacy.currency ?? ""),
    vacancies: Number.isFinite(vacanciesValue) && vacanciesValue > 0 ? vacanciesValue : parsedLegacy.vacancies,
    skills: String(item.skills ?? skillsFromArray ?? parsedLegacy.skills ?? ""),
    description,
    postedBy: Number.isFinite(postedByValue) ? postedByValue : undefined,
    jobStatus: status,
    postTime: typeof item.postTime === "string" ? item.postTime : undefined,
  };
}
