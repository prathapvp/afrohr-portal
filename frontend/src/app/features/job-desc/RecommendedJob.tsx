import { useEffect, useState } from "react";
import { getAllJobs } from "../../services/job-service";
import { Link } from "react-router";
import { IconArrowRight, IconBuilding, IconMapPin } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import { timeAgo } from "../../services/utilities";

const INITIAL_RECOMMENDED_VISIBLE = 6;

interface RecommendedJobProps {
    currentJobId?: number;
}

interface RecommendedJobItem {
    id?: number;
    jobStatus?: string;
    company?: string;
    jobTitle?: string;
    location?: string;
    postTime?: string;
}

const RecommendedJob = ({ currentJobId }: RecommendedJobProps) => {
    const [jobList, setJobList] = useState<RecommendedJobItem[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        getAllJobs().then((res) => {
            setJobList(Array.isArray(res) ? (res as RecommendedJobItem[]) : []);
        }).catch((err) => console.log(err));
    }, []);

    const recommended = jobList
        .filter((job) => job?.id && job?.id !== currentJobId && job?.jobStatus !== "CLOSED");

    const visibleRecommended = showAll
        ? recommended
        : recommended.slice(0, INITIAL_RECOMMENDED_VISIBLE);

    return <div className="premium-card-hover rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(2,6,23,0.94))] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-white">Recommended Jobs</h3>
            <span className="premium-pill rounded-full px-3 py-1 text-xs text-slate-200">
                {recommended.length} matches
            </span>
        </div>

        <div className="space-y-3">
            {recommended.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-400">
                    No recommendations available right now.
                </p>
            )}

            {visibleRecommended.map((job) => (
                <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="premium-card-hover block rounded-2xl border border-white/10 bg-slate-900/40 p-4 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-slate-900/70"
                >
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                        <IconBuilding size={16} className="text-cyan-300" />
                        <span className="truncate">{job.company ?? "Company"}</span>
                    </div>
                    <div className="line-clamp-1 text-base font-semibold text-white">{job.jobTitle ?? "Role"}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><IconMapPin size={14} /> {job.location ?? "Location"}</span>
                        <span>Posted {timeAgo(job.postTime || "")}</span>
                    </div>
                </Link>
            ))}

            {recommended.length > INITIAL_RECOMMENDED_VISIBLE && (
                <Button
                    variant="subtle"
                    color="gray"
                    onClick={() => setShowAll((prev) => !prev)}
                    fullWidth
                >
                    {showAll
                        ? "Show less"
                        : `Show all ${recommended.length} recommended jobs`}
                </Button>
            )}
        </div>

        <Link className="mt-4 block" to="/find-jobs">
            <Button variant="light" color="brightSun.4" fullWidth rightSection={<IconArrowRight size={16} />}>
                Explore More Jobs
            </Button>
        </Link>
    </div>
}
export default RecommendedJob;