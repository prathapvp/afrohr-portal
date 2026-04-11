import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Briefcase, Eye, MapPin, Pencil, Plus, XCircle } from "lucide-react";
import { useEmployerJobs } from "./useEmployerJobs";
import { postJob } from "../../services/job-service";

export default function EmployerJobsPage() {
  const navigate = useNavigate();
  const [legacyTab, setLegacyTab] = useState<"ACTIVE" | "DRAFT" | "CLOSED">("ACTIVE");
  const [jobActionBusyId, setJobActionBusyId] = useState<number | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  const accountType = (localStorage.getItem("accountType") ?? "").toUpperCase();
  const token = localStorage.getItem("token");
  const isEmployerAuthorized = Boolean(token) && accountType === "EMPLOYER";
  const { legacyJobs, legacyJobsLoading, legacyJobsError, setLegacyJobs } = useEmployerJobs(isEmployerAuthorized);

  const statusCounts = useMemo(
    () => ({
      ACTIVE: legacyJobs.filter((job) => job.jobStatus === "ACTIVE").length,
      DRAFT: legacyJobs.filter((job) => job.jobStatus === "DRAFT").length,
      CLOSED: legacyJobs.filter((job) => job.jobStatus === "CLOSED").length,
    }),
    [legacyJobs],
  );

  const visibleLegacyJobs = useMemo(
    () => legacyJobs.filter((job) => job.jobStatus === legacyTab).sort((a, b) => b.id - a.id),
    [legacyJobs, legacyTab],
  );

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  async function handleJobStatusChange(job: {
    id: number;
    jobTitle: string;
    company: string;
    location: string;
    salary?: string;
    department?: string;
    role?: string;
    experience?: string;
    employmentType?: string;
    industry?: string;
    workMode?: string;
    currency?: string;
    vacancies?: number;
    skills?: string;
    description?: string;
  }, nextStatus: "CLOSED" | "ACTIVE") {
    const actionText = nextStatus === "CLOSED" ? "Close" : "Reopen";
    if (!window.confirm(`${actionText} this job posting?`)) {
      return;
    }

    try {
      setJobActionBusyId(job.id);
      setLocalError(null);
      setLocalSuccess(null);

      await postJob({
        id: job.id,
        title: job.jobTitle,
        company: job.company,
        location: job.location,
        salary: job.salary ?? "",
        department: job.department,
        role: job.role,
        experience: job.experience,
        employmentType: job.employmentType,
        industry: job.industry,
        workMode: job.workMode,
        currency: job.currency,
        vacancies: job.vacancies,
        skills: job.skills,
        description: job.description,
        jobStatus: nextStatus,
      });

      setLegacyJobs((prev) => prev.map((item) => (item.id === job.id ? { ...item, jobStatus: nextStatus } : item)));
      setLegacyTab(nextStatus);
      setLocalSuccess(nextStatus === "CLOSED" ? "Job closed successfully." : "Job reopened successfully.");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : nextStatus === "CLOSED" ? "Failed to close job." : "Failed to reopen job.");
    } finally {
      setJobActionBusyId(null);
    }
  }

  return (
    <Card className={`overflow-hidden border-0 bg-gradient-to-br from-[#0a0f1e]/98 via-[#0f1628]/95 to-[#091220]/98 shadow-2xl ring-1 ring-white/[.10] transition-all duration-500 ${animateIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
      <div className="sticky top-0 z-20 border-b border-white/[.08] bg-[#09111e]/94 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-200/50">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Employer Jobs</CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-400">Manage your active, draft, and closed listings.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-10 gap-1.5 border-white/20 bg-white/[0.03] px-4 text-sm font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.10]"
                onClick={() => void navigate("/dashboard?tab=employers")}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button
                size="sm"
                className="h-10 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-900/50 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-900/60"
                disabled={!isEmployerAuthorized}
                onClick={() => void navigate("/post-job/0")}
              >
                <Plus className="h-3.5 w-3.5" /> New Job
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="flex border-t border-white/[.07]">
          {(["ACTIVE", "DRAFT", "CLOSED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLegacyTab(tab)}
              className={`relative flex min-h-11 flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                legacyTab === tab
                  ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-gradient-to-r after:from-emerald-400 after:to-teal-400"
                  : "text-slate-400 hover:bg-white/[.04] hover:text-slate-200"
              }`}
            >
              {tab === "ACTIVE" ? "Active" : tab === "DRAFT" ? "Drafts" : "Closed"}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                  legacyTab === tab ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[.08] text-slate-400"
                }`}
              >
                {statusCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-6">
        {localSuccess && (
          <div className={`mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 transition-all duration-300 ${animateIn ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}>{localSuccess}</div>
        )}
        {(localError || legacyJobsError) && (
          <div className={`mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition-all duration-300 ${animateIn ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}>{localError ?? legacyJobsError}</div>
        )}

        {legacyJobsLoading && <div className="text-sm text-slate-400">Loading jobs...</div>}

        {!legacyJobsLoading && visibleLegacyJobs.length === 0 && (
          <div className="rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-8 text-center text-sm text-slate-400">
            No {legacyTab.toLowerCase()} jobs yet.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {!legacyJobsLoading &&
            visibleLegacyJobs.map((job) => (
              <div
                key={job.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border-l-4 border-l-blue-400 bg-gradient-to-br from-[#111827]/90 via-[#1a2744]/60 to-[#0d1520]/90 p-6 shadow-xl ring-1 ring-white/[.07] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                style={{ transitionDelay: `${Math.min(job.id % 12, 8) * 35}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-slate-500">#{job.id}</span>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    job.jobStatus === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                      : job.jobStatus === "DRAFT"
                        ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                        : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                  }`}>
                    {job.jobStatus}
                  </span>
                </div>

                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">{job.jobTitle}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3 text-slate-500" />{job.location}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.department && <span className="rounded-md bg-slate-600/30 px-2 py-1 text-[11px] font-medium text-slate-300">{job.department}</span>}
                  {job.workMode && <span className="rounded-md bg-blue-500/15 px-2 py-1 text-[11px] font-medium text-blue-300">{job.workMode}</span>}
                  {job.experience && <span className="rounded-md bg-violet-500/15 px-2 py-1 text-[11px] font-medium text-violet-300">{job.experience}</span>}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  {job.industry && <p><span className="text-slate-500">Industry:</span> {job.industry}</p>}
                  {job.salary && <p><span className="text-slate-500">Salary:</span> <span className="font-semibold text-emerald-300/90">{job.salary}</span></p>}
                  {job.vacancies && <p><span className="text-slate-500">Vacancies:</span> {job.vacancies}</p>}
                </div>

                <div className="mt-auto pt-4">
                  <div className="mb-3 border-t border-white/[.05] pt-3 text-[11px] text-slate-500">{job.postTime ? new Date(job.postTime).toLocaleDateString() : "Recently"}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-white/[.08] bg-white/[.03] text-xs text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[.10] hover:text-white"
                      onClick={() => void navigate(`/posted-jobs/${job.id}`)}
                    >
                      <Eye className="mr-1 h-3 w-3" />View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500/20"
                      onClick={() => void navigate(`/post-job/${job.id}`)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobActionBusyId === job.id}
                      className={`h-8 text-xs transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${
                        job.jobStatus === "CLOSED"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      }`}
                      onClick={() => void handleJobStatusChange(job, job.jobStatus === "CLOSED" ? "ACTIVE" : "CLOSED")}
                    >
                      <XCircle className="mr-1 h-3 w-3" />{job.jobStatus === "CLOSED" ? "Reopen" : "Close"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
