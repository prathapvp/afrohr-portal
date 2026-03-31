import { useCallback, useEffect, useRef, useState } from "react";
import { IconBriefcase, IconClockHour3, IconHeart, IconMapPin, IconSparkles, IconX } from "@tabler/icons-react";
import { Button, Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { getAllJobs } from "../../services/JobService";
import { changeProfile } from "../../store/slices/ProfileSlice";
import { computeMatchScore } from "../../services/match-service";
import { timeAgo } from "../../services/utilities";

const SWIPE_THRESHOLD = 100;
const SEEN_KEY = "swipe-seen-ids";

// ── Single job card rendered inside the stack ─────────────────────────────────
const SwipeCard = ({ job, posX, profile }: { job: any; posX: number; profile: any }) => {
    const match = computeMatchScore(job, profile);
    const showMatch = (profile?.skills?.length ?? 0) + (profile?.itSkills?.length ?? 0) > 0;

    const saveOpacity = Math.max(0, Math.min(1, posX / SWIPE_THRESHOLD));
    const skipOpacity = Math.max(0, Math.min(1, -posX / SWIPE_THRESHOLD));

    return (
        <div className="relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_38%),linear-gradient(180deg,rgba(17,24,39,0.94),rgba(2,6,23,0.97))] p-5 shadow-[0_20px_56px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* SAVE / SKIP overlays */}
            <div
                className="absolute inset-0 rounded-2xl bg-green-500/20 border-4 border-green-400/60 flex items-center justify-center pointer-events-none z-20"
                style={{ opacity: saveOpacity }}
            >
                <div className="flex flex-col items-center gap-2">
                    <IconHeart size={60} className="text-green-400" stroke={2} />
                    <span className="text-green-300 font-black text-2xl tracking-widest uppercase">Save</span>
                </div>
            </div>
            <div
                className="absolute inset-0 rounded-2xl bg-red-500/20 border-4 border-red-400/60 flex items-center justify-center pointer-events-none z-20"
                style={{ opacity: skipOpacity }}
            >
                <div className="flex flex-col items-center gap-2">
                    <IconX size={60} className="text-red-400" stroke={2.5} />
                    <span className="text-red-300 font-black text-2xl tracking-widest uppercase">Skip</span>
                </div>
            </div>

            {/* Header: logo + match badge */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-mine-shaft-800/70 flex items-center justify-center">
                        <img
                            src={`/Icons/${job.company}.png`}
                            alt={job.company}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                    </div>
                    <div>
                        <div className="font-bold text-mine-shaft-100 leading-tight">{job.jobTitle}</div>
                        <div className="text-xs text-mine-shaft-400">{job.company}</div>
                    </div>
                </div>
                {showMatch && match.score > 0 && (
                    <div className={`flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                        match.score >= 70 ? "bg-green-500 text-white" :
                        match.score >= 40 ? "bg-yellow-400 text-black" :
                        "bg-red-500 text-white"
                    }`}>
                        <IconSparkles size={10} stroke={2} />
                        {match.score}%
                    </div>
                )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
                {job.experience && (
                    <span className="flex items-center gap-1 rounded-full border border-bright-sun-400/25 bg-bright-sun-400/10 px-2.5 py-1 text-xs font-medium text-bright-sun-300">
                        <IconBriefcase size={11} />{job.experience}
                    </span>
                )}
                {job.jobType && (
                    <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">{job.jobType}</span>
                )}
                {job.workMode && (
                    <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-400/10 px-2.5 py-1 text-xs font-medium text-fuchsia-200">{job.workMode}</span>
                )}
                {job.location && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                        <IconMapPin size={11} />{job.location}
                    </span>
                )}
            </div>

            {/* Description */}
            <Text className="!text-xs !leading-5 !text-mine-shaft-300 text-justify flex-1" lineClamp={5}>
                {job.about || job.description}
            </Text>

            {/* Skills matched */}
            {showMatch && match.matchedSkills.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                    {match.matchedSkills.slice(0, 4).map((s: string) => (
                        <span key={s} className="px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px]">{s}</span>
                    ))}
                    {match.matchedSkills.length > 4 && (
                        <span className="text-[10px] text-mine-shaft-500">+{match.matchedSkills.length - 4} more</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-sm font-semibold text-bright-sun-200">
                    {job.hideSalary ? "Salary hidden" : `$${job.packageOffered}K${job.maxPackageOffered ? ` – $${job.maxPackageOffered}K` : ""}`}
                </span>
                <span className="flex items-center gap-1 text-mine-shaft-500 text-xs">
                    <IconClockHour3 size={13} />{timeAgo(job.postTime)}
                </span>
            </div>
        </div>
    );
};

// ── Main SwipeJobs component ──────────────────────────────────────────────────
const SwipeJobs = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const profile = useSelector((state: any) => state.profile);

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seenIds, setSeenIds] = useState<number[]>(() =>
        JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")
    );
    const [savedCount, setSavedCount] = useState(0);

    // Drag state
    const [dragging, setDragging] = useState(false);
    const startXRef = useRef(0);
    const [posX, setPosX] = useState(0);

    useEffect(() => {
        getAllJobs()
            .then((all: any[]) => setJobs(all.filter((j: any) => j.jobStatus === "ACTIVE")))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pendingJobs = jobs.filter((j) => !seenIds.includes(j.id));

    const markSeen = useCallback((id: number) => {
        setSeenIds((prev) => {
            const next = [...prev, id];
            localStorage.setItem(SEEN_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const animateAndAdvance = useCallback((direction: "left" | "right") => {
        const dx = direction === "right" ? 700 : -700;
        setPosX(dx);
        setTimeout(() => {
            const job = pendingJobs[0];
            if (job) markSeen(job.id);
            setPosX(0);
            setDragging(false);
        }, 350);
    }, [pendingJobs, markSeen]);

    const doSave = useCallback(() => {
        const job = pendingJobs[0];
        if (!job) return;
        const saved = Array.isArray(profile.savedJobs) ? [...profile.savedJobs] : [];
        if (!saved.includes(job.id)) {
            dispatch(changeProfile({ ...profile, savedJobs: [...saved, job.id] }));
            setSavedCount((n) => n + 1);
        }
        animateAndAdvance("right");
    }, [pendingJobs, profile, dispatch, animateAndAdvance]);

    const doSkip = useCallback(() => {
        if (!pendingJobs[0]) return;
        animateAndAdvance("left");
    }, [pendingJobs, animateAndAdvance]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        startXRef.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging) return;
        setPosX(e.clientX - startXRef.current);
    };

    const handlePointerUp = () => {
        if (!dragging) return;
        if (posX > SWIPE_THRESHOLD) doSave();
        else if (posX < -SWIPE_THRESHOLD) doSkip();
        else { setPosX(0); setDragging(false); }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-mine-shaft-400 text-base animate-pulse">Loading jobs…</div>
            </div>
        );
    }

    // ── Done screen ──────────────────────────────────────────────────────────
    if (pendingJobs.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
                <div className="text-7xl">🎉</div>
                <div className="text-3xl font-bold text-mine-shaft-100">You've seen all jobs!</div>
                <div className="text-mine-shaft-400 max-w-xs">
                    {savedCount > 0
                        ? `You saved ${savedCount} job${savedCount > 1 ? "s" : ""}. Find them in your Profile → Saved Jobs.`
                        : "No jobs saved this round. New listings are added daily."}
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                    <Button
                        variant="default"
                        color="gray"
                        onClick={() => {
                            localStorage.removeItem(SEEN_KEY);
                            setSeenIds([]);
                            setSavedCount(0);
                        }}
                    >
                        Start over
                    </Button>
                    <Button
                        variant="gradient"
                        gradient={{ from: "orange", to: "pink", deg: 135 }}
                        onClick={() => navigate("/find-jobs")}
                    >
                        Browse all jobs
                    </Button>
                </div>
            </div>
        );
    }

    // ── Card stack ───────────────────────────────────────────────────────────
    const stack = pendingJobs.slice(0, 3);
    const progress = ((jobs.length - pendingJobs.length) / Math.max(jobs.length, 1)) * 100;

    return (
        <div className="min-h-screen flex flex-col items-center px-4 pb-12 pt-6 select-none font-['poppins']">
            {/* Header */}
            <div className="mb-3 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                <div className="mb-1 flex items-center justify-between">
                <button
                    onClick={() => navigate("/find-jobs")}
                    className="text-mine-shaft-400 hover:text-mine-shaft-200 text-sm transition-colors"
                >
                    ← Back
                </button>
                <div className="flex items-center gap-1.5 text-bright-sun-400 font-bold text-lg">
                    <IconSparkles size={18} stroke={2} /> Swipe Jobs
                </div>
                <div className="text-mine-shaft-500 text-sm">{pendingJobs.length} left</div>
                </div>
                <div className="text-[11px] text-mine-shaft-400">Save your favorites with right swipe and skip with left swipe.</div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-mine-shaft-800">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-mine-shaft-600 mt-1.5">
                    <span>{Math.round(progress)}% reviewed</span>
                    <span>{savedCount} saved ♡</span>
                </div>
            </div>

            {/* Card stack container */}
            <div className="relative w-full max-w-sm" style={{ height: 480 }}>
                {[...stack].reverse().map((job, reversedIdx) => {
                    const idx = stack.length - 1 - reversedIdx;
                    const isTop = idx === 0;
                    const scale = 1 - idx * 0.04;
                    const offsetY = idx * 16;

                    return (
                        <div
                            key={job.id}
                            className="absolute inset-0"
                            style={{
                                transform: isTop
                                    ? `translateX(${posX}px) rotate(${posX * 0.025}deg)`
                                    : `translateY(${offsetY}px) scale(${scale})`,
                                transition: isTop && dragging ? "none" : "transform 0.35s cubic-bezier(.25,.46,.45,.94)",
                                zIndex: stack.length - idx,
                                cursor: isTop ? "grab" : "default",
                                touchAction: "none",
                            }}
                            onPointerDown={isTop ? handlePointerDown : undefined}
                            onPointerMove={isTop ? handlePointerMove : undefined}
                            onPointerUp={isTop ? handlePointerUp : undefined}
                            onPointerCancel={isTop ? () => { setDragging(false); setPosX(0); } : undefined}
                        >
                            <SwipeCard job={job} posX={isTop ? posX : 0} profile={profile} />
                        </div>
                    );
                })}
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex gap-10 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3">
                <button
                    onClick={doSkip}
                    aria-label="Skip job"
                    className="h-16 w-16 rounded-full border-2 border-red-500/35 bg-red-500/10 flex items-center justify-center shadow-xl transition-all hover:border-red-500 hover:bg-red-500/20 active:scale-95"
                >
                    <IconX size={28} className="text-red-400" stroke={2.5} />
                </button>
                <button
                    onClick={doSave}
                    aria-label="Save job"
                    className="h-16 w-16 rounded-full border-2 border-green-500/35 bg-green-500/10 flex items-center justify-center shadow-xl transition-all hover:border-green-500 hover:bg-green-500/20 active:scale-95"
                >
                    <IconHeart size={28} className="text-green-400" stroke={2} />
                </button>
            </div>

            <p className="text-mine-shaft-700 text-xs mt-5">Drag or tap buttons · Right = Save · Left = Skip</p>
        </div>
    );
};

export default SwipeJobs;
