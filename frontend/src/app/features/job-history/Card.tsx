import { Button, Divider, Text } from "@mantine/core";
import { IconBookmark, IconBookmarkFilled, IconCalendarMonth, IconClockHour3 } from "@tabler/icons-react";
import { useRef, type MouseEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { Link, useLocation } from "react-router";
import { timeAgo } from "../../services/utilities";
import { changeProfile } from "../../store/slices/ProfileSlice";
import type { HistoryJobItem } from "./types";

type HistoryCardProps = HistoryJobItem & {
    applied?: boolean;
    interviewing?: boolean;
    offered?: boolean;
    cardIndex?: number;
};

const Card = (props: HistoryCardProps) => {
    const location = useLocation();
    const dispatch = useAppDispatch();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const sheenRef = useRef<HTMLDivElement | null>(null);
    const profile = useAppSelector((state) => state.profile as { savedJobs?: number[] });
    const isSaved = Boolean(profile.savedJobs?.includes(props.id));
    const badgeTone = props.offered
        ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
        : props.interviewing
            ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
            : "border-amber-300/40 bg-amber-400/15 text-amber-100";
    const relativeLabel = props.applied || props.interviewing
        ? "Applied"
        : props.offered
            ? "Interviewed"
            : "Posted";
    const companyInitial = (props.company || "A").charAt(0).toUpperCase();
    const companyPath = props.company ? `/company/${encodeURIComponent(props.company)}` : "/company";
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);

    const handleSaveJob = () => {
        let savedJobs = [...(profile.savedJobs || [])];
        if(savedJobs.includes(props.id)){
            savedJobs=savedJobs.filter((jobId)=>jobId !== props.id);
        }else{ 
            savedJobs.push(props.id);
        }
        let updatedProfile={...profile,savedJobs:savedJobs};
        dispatch(changeProfile(updatedProfile));
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const node = cardRef.current;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        const rotateY = ((px / rect.width) - 0.5) * 6;
        const rotateX = (0.5 - (py / rect.height)) * 5;

        node.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;

        const sheen = sheenRef.current;
        if (sheen) {
            sheen.style.background = `radial-gradient(220px circle at ${px}px ${py}px, rgba(255,255,255,0.18), rgba(34,211,238,0.12) 35%, rgba(255,255,255,0) 70%)`;
        }
    };

    const handleMouseLeave = () => {
        const node = cardRef.current;
        if (!node) return;
        node.style.transform = "";

        const sheen = sheenRef.current;
        if (sheen) {
            sheen.style.background = "";
        }
    };

    return <div
        ref={cardRef}
        data-aos="zoom-out"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="premium-enter group relative w-full max-w-[22rem] overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(15,23,42,0.86),rgba(30,41,59,0.74))] p-4 shadow-[0_18px_45px_rgba(2,8,20,0.45)] transition duration-300 ease-out hover:border-cyan-300/30 hover:shadow-[0_24px_58px_rgba(6,182,212,0.24)] sm:p-5"
        style={{
            animationDelay: `${Math.min((props.cardIndex ?? 0) * 60, 360)}ms`,
            willChange: "transform",
        }}
    >
        <div ref={sheenRef} className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative flex justify-between gap-3">
            <div className="flex gap-3 items-center min-w-0">
                <div className="grid h-11 w-11 shrink-0 place-content-center rounded-xl border border-white/15 bg-white/[0.08] text-sm font-black text-cyan-100">
                    {companyInitial}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="truncate text-[17px] font-bold tracking-tight text-white">{props.jobTitle}</div>
                    <div className="truncate text-xs text-slate-300">
                        <Link className="hover:text-cyan-200" to={companyPath}>{props.company}</Link> &bull; {props.applicants ? props.applicants.length : 0} Applicants
                    </div>
                </div>
            </div>
            {isSaved
                ? <IconBookmarkFilled onClick={handleSaveJob} className="mt-1 cursor-pointer text-amber-300" stroke={1.5} />
                : <IconBookmark onClick={handleSaveJob} className="mt-1 cursor-pointer text-slate-400 hover:text-amber-200" stroke={1.5} />}
        </div>

        <div className="relative mt-3 flex flex-wrap gap-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-cyan-100">{props.experience}</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-cyan-100">{props.jobType}</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-cyan-100">{props.location}</div>
        </div>

        <div className="relative mt-3">
            <Text className="!text-xs !leading-6 !text-justify !text-slate-300" lineClamp={3}>{props.about}
            </Text>
        </div>

        <Divider color="rgba(255,255,255,0.16)" size="xs" className="!my-3" />

        <div className="relative flex items-center justify-between gap-2">
            <div className="text-[15px] font-bold text-white">&#8377;{props.packageOffered} LPA</div>
            <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${badgeTone}`}>
                {props.offered ? "Shortlisted" : props.interviewing ? "In Progress" : "Applied"}
            </div>
        </div>

        <div className="relative mt-2 text-xs flex gap-1.5 items-center text-slate-400">
            <IconClockHour3 className="h-4 w-4" stroke={1.5} /> {relativeLabel} {timeAgo(props.postTime)}
        </div>

        {(props.offered || props.interviewing) && <Divider color="rgba(255,255,255,0.16)" size="xs" className="!my-3" />}

        {props.offered &&
        <div className="relative flex gap-2">
            <Button color="brightSun.4" variant="outline" fullWidth className="!font-semibold">Accept</Button>
            <Button color="brightSun.4" variant="light" fullWidth className="!font-semibold">Reject</Button>
        </div>
        }
        {props.interviewing && <div className="relative mt-2 flex gap-1 text-sm text-slate-200">
            <IconCalendarMonth className="text-cyan-300 w-5 h-5" stroke={1.5} /> Sun, 25 August &bull; <span className="text-slate-400">10 AM - 11 AM</span>
        </div>}

        <Link className="relative mt-3 block" to={`/jobs/${props.id}?returnTo=${returnTo}`}>
            <Button color="brightSun.4" variant="light" fullWidth className="!font-semibold">View Job</Button>
        </Link>
            </div>

}
export default Card;