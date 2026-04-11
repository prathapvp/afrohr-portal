export type CandidateShortcutKey = "dashboard" | "findJobs" | "jobHistory" | "swipe";

type ShortcutTone = "neutral" | "cyan" | "emerald" | "fuchsia";

export interface CandidateShortcut {
  key: CandidateShortcutKey;
  label: string;
  to: string;
  tone: ShortcutTone;
}

export const CANDIDATE_FLOW_ROUTE = {
  dashboard: "/dashboard?tab=candidates",
  findJobs: "/find-jobs",
  jobHistory: "/job-history",
  swipe: "/swipe",
} as const;

const shortcutMap: Record<CandidateShortcutKey, CandidateShortcut> = {
  dashboard: { key: "dashboard", label: "Dashboard", to: CANDIDATE_FLOW_ROUTE.dashboard, tone: "neutral" },
  findJobs: { key: "findJobs", label: "Find Jobs", to: CANDIDATE_FLOW_ROUTE.findJobs, tone: "cyan" },
  jobHistory: { key: "jobHistory", label: "Job History", to: CANDIDATE_FLOW_ROUTE.jobHistory, tone: "emerald" },
  swipe: { key: "swipe", label: "Swipe Mode", to: CANDIDATE_FLOW_ROUTE.swipe, tone: "fuchsia" },
};

export function getCandidateShortcuts(keys: CandidateShortcutKey[]) {
  return keys.map((key) => shortcutMap[key]);
}

export const CANDIDATE_FLOW_UI = {
  breadcrumbLink: "rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-slate-300 transition hover:bg-white/[0.08] hover:text-white",
  breadcrumbSeparator: "text-slate-500",
  shortcutContainer: "flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs",
  shortcutLabel: "text-slate-400",
} as const;

export function getShortcutToneClass(tone: ShortcutTone) {
  if (tone === "cyan") {
    return "rounded-full border border-cyan-300/30 bg-cyan-500/12 px-3 py-1 font-semibold text-cyan-100 transition hover:bg-cyan-500/20";
  }
  if (tone === "emerald") {
    return "rounded-full border border-emerald-300/30 bg-emerald-500/12 px-3 py-1 font-semibold text-emerald-100 transition hover:bg-emerald-500/20";
  }
  if (tone === "fuchsia") {
    return "rounded-full border border-fuchsia-300/30 bg-fuchsia-500/12 px-3 py-1 font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20";
  }
  return "rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 font-semibold text-slate-200 transition hover:bg-white/[0.12]";
}

export function getActiveBreadcrumbClass(tone: "cyan" | "emerald" | "brightSun") {
  if (tone === "cyan") {
    return "rounded-full border border-cyan-300/35 bg-cyan-500/12 px-3 py-1 font-medium text-cyan-100";
  }
  if (tone === "emerald") {
    return "rounded-full border border-emerald-300/35 bg-emerald-400/12 px-3 py-1 font-medium text-emerald-200";
  }
  return "rounded-full border border-bright-sun-400/35 bg-bright-sun-400/12 px-3 py-1 font-medium text-bright-sun-200";
}
