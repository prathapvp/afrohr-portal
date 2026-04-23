import { Button, Divider, Text } from "@mantine/core";
import { IconBookmark, IconBookmarkFilled, IconClockHour3, IconSparkles } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";
import { timeAgo } from "../../services/utilities";
import { useAppDispatch, useAppSelector } from "../../store";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { computeMatchScore } from "../../services/match-service";
import type { JobListItem } from "./types";

type ViewMode = "grid" | "list";

type ProfileState = {
    savedJobs?: number[];
    skills?: string[];
    itSkills?: string[];
};

function formatCompensation(value?: number) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        return null;
    }
    if (value >= 1000) {
        return `$${Math.round(value).toLocaleString("en-US")}`;
    }
    return `$${Math.round(value)}K`;
}

function matchBadgeClasses(score: number) {
    if (score >= 70) return "border border-emerald-300/35 bg-emerald-500/20 text-emerald-100";
    if (score >= 40) return "border border-amber-300/35 bg-amber-400/30 text-amber-950";
    return "border border-rose-300/35 bg-rose-500/25 text-rose-100";
}

const JobCard = (props: JobListItem & { viewMode?: ViewMode }) => {
    const { viewMode = "grid" } = props;
    const location = useLocation();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as ProfileState);
    const accountType = localStorage.getItem("accountType")?.toUpperCase();
    const hasProfileSkills = (profile?.skills?.length ?? 0) > 0 || (profile?.itSkills?.length ?? 0) > 0;
    const showMatch = accountType === "APPLICANT" && hasProfileSkills;
    const match = showMatch ? computeMatchScore(props, profile) : null;

    const handleSaveJob = () => {
        let savedJobs = profile.savedJobs ? [...profile.savedJobs] : [];
        if (savedJobs.includes(props.id)) {
            savedJobs = savedJobs.filter((jobId) => jobId !== props.id);
        } else {
            savedJobs.push(props.id);
        }
        dispatch(changeProfile({ ...profile, savedJobs }));
    };

    const skills = props.skillsRequired?.slice(0, 3) ?? [];
    const minCompensation = formatCompensation(props.packageOffered);
    const maxCompensation = formatCompensation(props.maxPackageOffered);
    let salaryDisplay: string | null = null;
    if (minCompensation) {
        salaryDisplay = minCompensation;
        if (maxCompensation && maxCompensation !== minCompensation) {
            salaryDisplay = `${minCompensation} - ${maxCompensation}`;
        }
    }
    const postedTimeLabel = props.postTime ? timeAgo(props.postTime) : "recently";
    const companyPath = props.company ? `/company/${encodeURIComponent(props.company)}` : "/company";
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);

    if (viewMode === "list") {
        return (
            <div
                className="group flex w-full items-center gap-4 rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,8,24,0.94))] px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.32)] transition hover:-translate-y-px hover:border-cyan-300/28 hover:shadow-[0_12px_32px_rgba(0,0,0,0.42)]"
            >
                {/* logo */}
                <div className="shrink-0 rounded-lg border border-white/10 bg-mine-shaft-800/70 p-2 icon-container">
                    <img className="h-8 w-8 img-polished" src={`/Icons/${props.company}.png`} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
                {/* info */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{props.jobTitle}</span>
                        {match && match.score > 0 && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${matchBadgeClasses(match.score)}`}>
                                <IconSparkles size={9} stroke={2} />{match.score}%
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-300/85">
                        <Link className="hover:text-slate-100" to={companyPath}>{props.company}</Link>
                        {" "}&bull; {props.applicants?.length ?? 0} applicants
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {props.experience && <span className="rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2 py-0.5 text-[11px] text-bright-sun-300">{props.experience}</span>}
                        {props.jobType && <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200">{props.jobType}</span>}
                        {props.location && <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[11px] text-violet-100">{props.location}</span>}
                        {skills.map((s) => <span key={s} className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-200/90">{s}</span>)}
                    </div>
                </div>
                {/* right side */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                    {salaryDisplay && <div className="font-bold text-bright-sun-300">{salaryDisplay}</div>}
                    <div className="flex items-center gap-1 text-[11px] text-mine-shaft-400">
                        <IconClockHour3 size={13} stroke={1.5} />
                        {postedTimeLabel}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {profile.savedJobs?.includes(props.id)
                            ? <IconBookmarkFilled onClick={handleSaveJob} size={18} className="cursor-pointer text-cyan-300" stroke={1.5} />
                            : <IconBookmark onClick={handleSaveJob} size={18} className="cursor-pointer hover:text-cyan-300 text-slate-400" stroke={1.5} />
                        }
                        <Link to={`/jobs/${props.id}?returnTo=${returnTo}`}>
                            <Button size="compact-sm" color="brightSun.4" variant="light">View Job</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group relative flex w-full flex-col gap-4 overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,8,24,0.97))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.34)] transition duration-300 ease-in-out hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-[0_22px_52px_rgba(0,0,0,0.46)]"
        >
            {match && match.score > 0 && (
                <div
                    className={`mb-1 inline-flex items-center gap-1 self-start sm:self-end rounded-full px-2 py-0.5 text-[10px] font-bold shadow-md ${matchBadgeClasses(match.score)}`}
                >
                    <IconSparkles size={9} stroke={2} />
                    {match.score}% match
                </div>
            )}
            <div className="flex justify-between gap-3">
                <div className="flex gap-2 items-center">
                    <div className="rounded-lg border border-white/10 bg-mine-shaft-800/70 p-2 icon-container">
                        <img className="h-7 img-polished" src={`/Icons/${props.company}.png`} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="font-semibold text-white leading-tight">{props.jobTitle}</div>
                        <div className="text-xs text-slate-300/85">
                            <Link className="hover:text-slate-100" to={companyPath}>{props.company}</Link>
                            {" "}&bull; {props.applicants ? props.applicants.length : 0} Applicants
                        </div>
                    </div>
                </div>
                {profile.savedJobs?.includes(props.id)
                    ? <IconBookmarkFilled onClick={handleSaveJob} className="cursor-pointer text-cyan-300" stroke={1.5} />
                    : <IconBookmark onClick={handleSaveJob} className="cursor-pointer hover:text-cyan-300 text-slate-400" stroke={1.5} />
                }
            </div>
            <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-1 text-xs font-medium text-bright-sun-300">{props.experience}</div>
                <div className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">{props.jobType}</div>
                <div className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-100">{props.location}</div>
            </div>
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                        <span key={s} className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-200/90">{s}</span>
                    ))}
                    {(props.skillsRequired?.length ?? 0) > 3 && (
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">+{(props.skillsRequired?.length ?? 0) - 3} more</span>
                    )}
                </div>
            )}
            <div>
                <Text className="!text-xs text-justify !leading-5 !text-mine-shaft-300" lineClamp={3}>{props.about}</Text>
            </div>
            <Divider color="mineShaft.7" size="xs" />
            <div className="flex justify-between">
                <div className="font-semibold text-bright-sun-200">{salaryDisplay ?? "—"}</div>
                <div className="text-xs flex gap-1 items-center text-mine-shaft-400">
                    <IconClockHour3 className="h-5 w-5" stroke={1.5} />Posted {postedTimeLabel}
                </div>
            </div>
            <Link to={`/jobs/${props.id}?returnTo=${returnTo}`}>
                <Button fullWidth color="brightSun.4" variant="gradient" gradient={{ from: "brightSun.5", to: "orange.6", deg: 90 }} className="font-semibold text-mine-shaft-950">View Job</Button>
            </Link>
        </div>
    );
};

export default JobCard;