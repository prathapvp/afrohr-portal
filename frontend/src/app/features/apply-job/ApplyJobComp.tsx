import { Divider } from "@mantine/core";
import { useMemo, useState } from "react";
import { timeAgo } from "../../services/utilities";
import ApplicationForm from "./ApplicationForm";

interface ApplyJobProps {
    id?: number;
    postTime?: string;
    applicants?: unknown[];
    location?: string;
    experience?: string;
    packageOffered?: string | number;
    company?: string;
    jobTitle?: string;
}

const ApplyJobComp = (props: ApplyJobProps) => {
    const [showFallback, setShowFallback] = useState(false);
    const postedTime = props.postTime ? timeAgo(props.postTime) : "Recently posted";
    const safePostedTime = postedTime && !postedTime.toLowerCase().includes("nan") ? postedTime : "Recently posted";
    const applicantsCount = Array.isArray(props.applicants) ? props.applicants.length : 0;
    const location = props.location || "Location details shared by recruiter";
    const experience = props.experience || "Experience requirements shared after review";
    const packageLabel = props.packageOffered || "Compensation details available with recruiter";
    const companyInitials = useMemo(() => {
        const name = String(props.company || "Company").trim();
        const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
        const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("");
        return initials || "CO";
    }, [props.company]);

    return <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[minmax(250px,320px)_1fr]">
            <aside className="premium-enter rounded-3xl border border-white/15 bg-[linear-gradient(170deg,rgba(14,23,44,0.9),rgba(9,14,28,0.92))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl [animation-delay:100ms] sm:p-5 xl:sticky xl:top-24 xl:h-fit">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[.05] p-3 text-lg font-semibold text-slate-100 shadow-inner xs-mx:h-16 xs-mx:w-16">
                        {showFallback ? (
                            <span>{companyInitials}</span>
                        ) : (
                            <img
                                className="h-14 w-14 rounded-md object-contain xs-mx:h-10 xs-mx:w-10"
                                src={`/Icons/${props.company}.png`}
                                alt={`${props.company || "Company"} logo`}
                                onError={() => setShowFallback(true)}
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-xl font-semibold text-white sm:text-2xl">{props.jobTitle || "Job Application"}</div>
                        <div className="mt-1 text-sm text-slate-300">{props.company || "Company"}</div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-100">
                    Guided application journey
                </div>

                <Divider size="xs" my="lg" color="rgba(255,255,255,0.18)" />

                <div className="space-y-3 text-sm">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Posted</div>
                        <div className="mt-1 font-medium text-slate-100">{safePostedTime}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Location</div>
                        <div className="mt-1 font-medium text-slate-100">{location}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Experience</div>
                        <div className="mt-1 font-medium text-slate-100">{experience}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Compensation</div>
                        <div className="mt-1 font-medium text-slate-100">{packageLabel}</div>
                    </div>
                    {applicantsCount > 0 && (
                        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-emerald-100">
                            {applicantsCount} candidates have applied so far.
                        </div>
                    )}
                </div>
            </aside>

            <section className="premium-enter rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-blue-950/60 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl [animation-delay:180ms] sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white sm:text-xl">Candidate Application</h2>
                    <div className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300">3-5 min process</div>
                </div>
                <Divider size="xs" my="lg" color="rgba(255,255,255,0.18)" />
                <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:p-6">
                    <ApplicationForm jobId={props.id} />
                </div>
            </section>
        </div>
    </div>
}
export default ApplyJobComp;